import { InsightDatasetKind } from "../controller/IInsightFacade";
import { DataSet } from "../DataSet/DataSet";
export interface DatasetController {
	addKind(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		inMemoryStore: Map<string, DataSet>
	): Promise<string[]>;
	loadKind(rawData: string, inMemoryStore: Map<string, DataSet>): Promise<void>;
}
