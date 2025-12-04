import JSZip from "jszip";
import fs from "fs-extra";
import { InsightDataset, InsightDatasetKind, InsightError } from "../controller/IInsightFacade";
import { Section } from "../DataSet/Section";
import { DatasetController } from "./DatasetController";
import { DataSet } from "../DataSet/DataSet";
import { SectionDataset } from "../DataSet/SectionDataset";

export class SectionController implements DatasetController {
	public async addKind(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		inMemoryStore: Map<string, DataSet>
	): Promise<string[]> {
		if (kind !== InsightDatasetKind.Sections) throw new InsightError("Kind does not matched");
		try {
			const zip = await JSZip.loadAsync(Buffer.from(content, "base64"));
			const courseFolder = zip.folder("courses");
			if (!courseFolder) throw new InsightError("No 'courses' folder found");

			let sections: Section[] = [];
			const promises: Promise<string>[] = [];

			for (const file of Object.values(courseFolder.files)) {
				if (file.name.startsWith("courses/") && !file.dir) {
					if (!file.name.includes("__MACOSX")) {
						promises.push(file.async("string"));
					}
				}
			}

			try {
				const fileStrings = await Promise.all(promises);
				for (const fileString of fileStrings) {
					const fileContent = JSON.parse(fileString);
					sections = this.parseSection(fileContent, sections);
				}
				if (sections.length === 0) throw new InsightError("No valid sections found");
				// console.log("Adding dataset, this:", this);
				// console.log("Before set in Map:", Array.from(inMemoryStore.entries()));
				return await this.writeSection(id, sections, kind, inMemoryStore);
			} catch (err) {
				throw new InsightError("Error parsing course files: " + err);
			}
		} catch (err) {
			throw new InsightError("Failed to parse section dataset: " + (err as Error).message);
		}
	}

	public parseSection(fileContent: any, sections: Section[]): Section[] {
		try {
			if (!fileContent?.result || !Array.isArray(fileContent.result)) {
				throw new InsightError("Invalid JSON structure");
			}
			if (fileContent.result.length === 0) {
				return sections;
			}
			for (const sec of fileContent.result) {
				if (this.checkInvalid(sec)) {
					continue;
				}
				const OVERALL_YEAR = 1900;
				const yearValue = sec.Section === "overall" ? OVERALL_YEAR : Number(sec.Year);
				const section = new Section(
					sec.id,
					sec.Course,
					sec.Title,
					sec.Professor,
					sec.Subject,
					yearValue,
					sec.Avg,
					sec.Pass,
					sec.Fail,
					sec.Audit
				);
				sections.push(section);
			}
			return sections;
		} catch (err) {
			throw new InsightError("Invalid course file: " + (err as Error).message);
		}
	}
	public checkInvalid(sec: any): boolean {
		return (
			sec.id === undefined ||
			sec.Course === undefined ||
			sec.Title === undefined ||
			sec.Professor === undefined ||
			sec.Subject === undefined ||
			sec.Year === undefined ||
			sec.Avg === undefined ||
			sec.Pass === undefined ||
			sec.Fail === undefined ||
			sec.Audit === undefined
		);
	}

	public async writeSection(
		id: string,
		sections: Section[],
		kind: InsightDatasetKind,
		inMemoryStore: Map<string, DataSet>
	): Promise<string[]> {
		const insightDataset = { id: id, numRows: sections.length, kind: kind } as InsightDataset;
		const dataSet = new SectionDataset(sections, insightDataset);
		inMemoryStore.set(id, dataSet);
		// console.log("After set in Map:", Array.from(inMemoryStore.entries()));
		const json = {
			insightDataset: dataSet.insightDataset,
			sections: dataSet.sections.map((s) => s.toJSON()),
		};
		await fs.ensureDir("data");
		await fs.writeFile("data/" + id + ".txt", JSON.stringify(json));
		return Array.from(inMemoryStore.keys());
	}

	public async loadKind(rawData: string, inMemoryStore: Map<string, DataSet>): Promise<void> {
		const parsed: { insightDataset: InsightDataset; sections: any[] } = JSON.parse(rawData);
		const data = parsed.sections;
		const insightDataset = parsed.insightDataset;
		const sections: Section[] = data.map((s: any) => {
			const { uuid, id, title, instructor, dept, year, avg, pass, fail, audit } = s;
			return new Section(uuid, id, title, instructor, dept, year, avg, pass, fail, audit);
		});
		const dataSet: DataSet = new SectionDataset(sections, insightDataset);
		inMemoryStore.set(insightDataset.id, dataSet);
	}
}
