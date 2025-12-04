import { InsightDataset } from "../controller/IInsightFacade";
import { Section } from "./Section";
import { DataSet } from "./DataSet";
import { DatasetEntry } from "../controller/InsightFacade";

export class SectionDataset implements DataSet {
	public kind: "section" = "section";
	public insightDataset: InsightDataset;
	public sections: Section[];

	constructor(sections: Section[], insightDataset: InsightDataset) {
		this.sections = sections;
		this.insightDataset = insightDataset;
	}

	public getEntries(): DatasetEntry[] {
		return this.sections;
	}
}
