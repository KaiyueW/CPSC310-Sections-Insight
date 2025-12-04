import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import fs from "fs-extra";
import { SectionController } from "../DatasetController/SectionController";
import { RoomController } from "../DatasetController/RoomController";
import { DataSet } from "../DataSet/DataSet";
import { DatasetController } from "../DatasetController/DatasetController";
import { Section } from "../DataSet/Section";
import { Room } from "../DataSet/Room";
import { QueryParser } from "../Query/Parser/QueryParser";
import { getRoomInfo, getSectionInfo, Query } from "../Query/QueryAST";
import { QueryValidator } from "../Query/QueryValidator";
import { QueryFilter } from "../Query/QueryFilter";
import { QueryTransformer } from "../Query/QueryTransformer";
import { QueryResult } from "../Query/QueryResult";
// import path from "path";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
const MAX_RESULT_NUM = 5000;
export type DatasetEntry = Section | Room;

export default class InsightFacade implements IInsightFacade {
	// public dataId: string[];
	public inMemoryStore: Map<string, DataSet>;

	constructor() {
		// this.dataId = [];
		this.inMemoryStore = new Map<string, DataSet>();
		this.loadDataset().catch((err) => {
			throw new Error("failed to load from disk.");
		});
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		await this.loadDataset();
		if (!id || id.trim() === "" || id.includes("_")) throw new InsightError("id invalid");
		if (this.inMemoryStore.has(id)) throw new InsightError("Dataset id already exists");
		let controller: DatasetController = new SectionController();
		if (kind === InsightDatasetKind.Rooms) controller = new RoomController();

		try {
			return await controller.addKind(id, content, kind, this.inMemoryStore);
		} catch (err) {
			throw new InsightError("Failed to add dataset: " + (err as Error).message);
		}
	}

	public async removeDataset(id: string): Promise<string> {
		if (!id || id.trim() === "" || id.includes("_")) throw new InsightError("id invalid");
		await this.loadDataset();
		if (!this.inMemoryStore.has(id)) throw new NotFoundError("Dataset id does not exists");

		this.inMemoryStore.delete(id);
		const filePath = `data/${id}.txt`;
		try {
			const exists = await fs.pathExists(filePath);
			if (exists) {
				await fs.remove(filePath);
			}
		} catch (err) {
			throw new InsightError("Failed to remove dataset from disk: " + (err as Error).message);
		}

		return id;
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		await this.loadDataset();
		const datasets: InsightDataset[] = [];
		for (const [id, dataSet] of this.inMemoryStore.entries()) {
			datasets.push({
				id: id,
				kind: dataSet.insightDataset.kind,
				numRows: dataSet.insightDataset.numRows,
			});
		}
		return datasets;
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		await this.loadDataset();
		try {
			const queryAST: Query = QueryParser.parseQuery(query);
			QueryValidator.validateQuery(queryAST, this.inMemoryStore);
			const targetDataset: DataSet = this.inMemoryStore.get(queryAST.id)!;
			const originalData: DatasetEntry[] = targetDataset.getEntries();
			const filteredData: DatasetEntry[] = QueryFilter.filterData(queryAST.where, originalData);
			let transData: InsightResult[] = [];
			if (!queryAST.transformations) {
				for (const entry of filteredData) {
					const insightRow: InsightResult = {};
					for (const key of queryAST.options.COLUMNS) {
						let value: string | number;
						if (entry instanceof Section) value = getSectionInfo(key, entry);
						else value = getRoomInfo(key, entry);
						insightRow[key] = value;
					}
					transData.push(insightRow);
				}
			} else {
				transData = QueryTransformer.transformData(queryAST.transformations, filteredData);
			}
			if (transData.length > MAX_RESULT_NUM) {
				throw new ResultTooLargeError("The result is larger than maximum limit.");
			}
			const finalResults: InsightResult[] = QueryResult.resultQuery(transData, queryAST.options);
			return Promise.resolve(finalResults);
		} catch (err) {
			if (err instanceof InsightError || err instanceof ResultTooLargeError) {
				throw err;
			}
			throw new InsightError("An unexpected error occurred during query execution:" + (err as Error).message);
		}
	}

	private async loadDataset(): Promise<void> {
		const dir = "./data";
		if (!(await fs.pathExists(dir))) return;

		const files = await fs.readdir(dir);
		const readPromises = files
			.filter((file) => file.endsWith(".txt"))
			.map(async (file) => {
				try {
					const rawData = await fs.readFile(`${dir}/${file}`, "utf-8");
					const parsed: { insightDataset: InsightDataset; any: any[] } = JSON.parse(rawData);
					const kind = parsed.insightDataset.kind;
					let controller: DatasetController = new SectionController();
					if (kind === InsightDatasetKind.Rooms) controller = new RoomController();
					await controller.loadKind(rawData, this.inMemoryStore);
				} catch (_err) {}
			});

		await Promise.all(readPromises);
	}
}
