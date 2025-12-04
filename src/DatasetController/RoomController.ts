import JSZip from "jszip";
import fs from "fs-extra";
import { DatasetController } from "./DatasetController";
import { DataSet } from "../DataSet/DataSet";
import { InsightDataset, InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { RoomDataset } from "../DataSet/RoomDataset";
import { Room } from "../DataSet/Room";
import parse5 from "parse5";
import { GeoResponse } from "./GeoResponse";

export class RoomController implements DatasetController {
	public async addKind(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		inMemoryStore: Map<string, DataSet>
	): Promise<string[]> {
		if (kind !== InsightDatasetKind.Rooms) throw new InsightError("Kind does not matched");
		try {
			const zip = await JSZip.loadAsync(Buffer.from(content, "base64"));
			const indexFile = zip.file("index.htm");
			// console.log(Object.keys(zip.files));
			if (!indexFile) throw new InsightError("No index.htm found in rooms dataset");

			const indexContent = await indexFile.async("string");
			const buildingLinks = this.parseIndexFile(indexContent);

			if (buildingLinks.length === 0) throw new InsightError("No valid building links in index");

			let rooms: Room[] = [];
			const buildingPromises = buildingLinks.map(async (link) => {
				const cleanHref = link.href.startsWith("./") ? link.href.substring(2) : link.href;
				const buildingFile = zip.file(cleanHref);
				if (!buildingFile) return [];

				const buildingContent = await buildingFile.async("string");
				return await this.parseBuildingFile(buildingContent, link);
			});

			const buildingResults = await Promise.all(buildingPromises);
			rooms = buildingResults.flat();

			if (rooms.length === 0) throw new InsightError("No valid rooms found");
			return await this.writeRooms(id, rooms, kind, inMemoryStore);
		} catch (err) {
			throw new InsightError("Failed to parse rooms dataset: " + (err as Error).message);
		}
	}

	private parseIndexFile(content: string): { fullName: string; shortName: string; address: string; href: string }[] {
		const document = parse5.parse(content);
		const tables = this.getAllElementsByTag(document, "table");
		const buildingLinks: { fullName: string; shortName: string; address: string; href: string }[] = [];

		for (const table of tables) {
			const rows = this.getAllElementsByTag(table, "tr");
			for (const row of rows) {
				const cells = this.getAllElementsByTag(row, "td");
				let fullName = "";
				let shortName = "";
				let href = "";
				let address = "";

				for (const cell of cells) {
					const classAttr = this.getAttribute(cell, "class") || "";

					if (classAttr.includes("views-field views-field-title")) {
						const a = this.getAllElementsByTag(cell, "a")[0];
						if (a) {
							fullName = this.getTextContent(a).trim();
							// console.log(fullName);
							href = this.getAttribute(a, "href") || "";
						}
					} else if (classAttr.includes("views-field views-field-field-building-code")) {
						shortName = this.getTextContent(cell).trim();
					} else if (classAttr.includes("views-field views-field-field-building-address")) {
						address = this.getTextContent(cell).trim();
						// console.log(address, "!!!");
					}
				}

				if (fullName && shortName && href && address) {
					buildingLinks.push({ fullName, shortName, href, address });
				}
			}
		}

		return buildingLinks;
	}

	private async parseBuildingFile(
		content: string,
		buildingInfo: { fullName: string; shortName: string; address: string; href: string }
	): Promise<Room[]> {
		const document = parse5.parse(content);
		const tables = this.getAllElementsByTag(document, "table");
		const rooms: Room[] = [];

		const geo = await this.getGeo(buildingInfo.address);
		if (!geo) return rooms;

		for (const table of tables) {
			const rows = this.getAllElementsByTag(table, "tr");

			for (const row of rows) {
				const cells = this.getAllElementsByTag(row, "td");
				const hasRequiredFields = this.hasRoomFields(cells);
				if (!hasRequiredFields) continue;

				const room = this.parseRoomRow(row, buildingInfo, geo);
				if (room) rooms.push(room);
			}
		}
		return rooms;
	}

	private hasRoomFields(cells: any[]): boolean {
		const requiredFields = [
			"views-field views-field-field-room-number",
			"views-field views-field-field-room-capacity",
			"views-field views-field-field-room-furniture",
			"views-field views-field-field-room-type",
		];

		for (const field of requiredFields) {
			if (
				!cells.some((c) => {
					const classAttr = this.getAttribute(c, "class") || "";
					return classAttr.includes(field);
				})
			) {
				return false;
			}
		}
		return true;
	}

	private parseRoomRow(
		row: any,
		buildingInfo: { fullName: string; shortName: string; address: string; href: string },
		geo: { lat: number; lon: number }
	): Room | null {
		const cells = this.getAllElementsByTag(row, "td");
		if (cells.length === 0) return null;

		const roomData = { number: "", seats: 0, type: "", furniture: "", href: "" };

		for (const cell of cells) {
			const cls = this.getAttribute(cell, "class") || "";
			const text = this.getTextContent(cell).trim();
			this.extractRoomData(cls, text, cell, roomData);
		}
		if (!roomData.number || isNaN(roomData.seats) || roomData.seats < 0) {
			return null;
		}

		const name = `${buildingInfo.shortName}_${roomData.number}`;
		console.log(roomData.number);

		return new Room(
			buildingInfo.fullName,
			buildingInfo.shortName,
			roomData.number,
			name,
			buildingInfo.address,
			geo.lat,
			geo.lon,
			roomData.seats,
			roomData.type,
			roomData.furniture,
			roomData.href
		);
	}

	private extractRoomData(
		classAttr: string,
		text: string,
		cell: any,
		roomData: { number: string; seats: number; type: string; furniture: string; href: string }
	): void {
		if (classAttr.includes("views-field views-field-field-room-number")) {
			const aTag = this.getAllElementsByTag(cell, "a")[0];
			if (aTag) {
				roomData.number = this.getTextContent(aTag).trim();
				// console.log(roomData.number);
				roomData.href = this.getAttribute(aTag, "href") || "";
			}
		} else if (classAttr.includes("views-field views-field-field-room-capacity")) {
			const parsed = Number(text);
			roomData.seats = isNaN(parsed) ? 0 : parsed;
		} else if (classAttr.includes("views-field views-field-field-room-furniture")) {
			roomData.furniture = text;
		} else if (classAttr.includes("views-field views-field-field-room-type")) {
			roomData.type = text;
		}
	}

	private async getGeo(address: string): Promise<{ lat: number; lon: number } | null> {
		const encoded = encodeURIComponent(address);
		const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team038/${encoded}`;
		try {
			const response = await fetch(url);
			if (!response.ok) {
				return null;
			}
			const data = (await response.json()) as GeoResponse;
			if (data.error || data.lat === undefined || data.lon === undefined) {
				return null;
			}
			return { lat: data.lat, lon: data.lon };
		} catch {
			return null;
		}
	}

	private async writeRooms(
		id: string,
		rooms: Room[],
		kind: InsightDatasetKind,
		inMemoryStore: Map<string, DataSet>
	): Promise<string[]> {
		const insightDataset: InsightDataset = { id, numRows: rooms.length, kind };
		const dataSet = new RoomDataset(rooms, insightDataset);
		inMemoryStore.set(id, dataSet);
		// console.log("After set in Map:", Array.from(inMemoryStore.entries()));

		const json = {
			insightDataset: dataSet.insightDataset,
			rooms: dataSet.rooms.map((r) => r.toJSON()),
		};

		await fs.ensureDir("data");
		await fs.writeFile(`data/${id}.txt`, JSON.stringify(json));

		return Array.from(inMemoryStore.keys());
	}

	private getAllElementsByTag(node: any, tag: string): any[] {
		let result: any[] = [];
		if (node.tagName === tag) {
			result.push(node);
		}
		if (node.childNodes) {
			for (const child of node.childNodes) {
				result = result.concat(this.getAllElementsByTag(child, tag));
			}
		}
		return result;
	}

	private getTextContent(node: any): string {
		if (node.nodeName === "#text") {
			return node.value || "";
		}
		if (!node.childNodes) {
			return "";
		}
		let text = "";
		for (const child of node.childNodes) {
			text += this.getTextContent(child);
		}
		return text;
	}

	private getAttribute(node: any, attr: string): string | null {
		if (!node.attrs) return null;
		const found = node.attrs.find((a: any) => a.name === attr);
		return found ? found.value : null;
	}

	public async loadKind(rawData: string, inMemoryStore: Map<string, DataSet>): Promise<void> {
		const parsed: { insightDataset: InsightDataset; rooms: any[] } = JSON.parse(rawData);
		const data = parsed.rooms;
		const insightDataset = parsed.insightDataset;
		const rooms: Room[] = data.map((r: any) => {
			const { fullname, shortname, number, name, address, lat, lon, seats, type, furniture, href } = r;
			return new Room(fullname, shortname, number, name, address, lat, lon, seats, type, furniture, href);
		});
		const dataSet: DataSet = new RoomDataset(rooms, insightDataset);
		inMemoryStore.set(insightDataset.id, dataSet);
	}
}
