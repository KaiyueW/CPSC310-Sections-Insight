import { InsightDataset } from "../controller/IInsightFacade";
import { DatasetEntry } from "../controller/InsightFacade";

export interface DataSet {
	kind: "section" | "room";
	insightDataset: InsightDataset;
	getEntries(): DatasetEntry[];
}
