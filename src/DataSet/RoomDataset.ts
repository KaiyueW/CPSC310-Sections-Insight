import { InsightDataset } from "../controller/IInsightFacade";
import { Room } from "./Room";
import { DataSet } from "./DataSet";
import { DatasetEntry } from "../controller/InsightFacade";

export class RoomDataset implements DataSet {
	public kind: "room" = "room";
	public insightDataset: InsightDataset;
	public rooms: Room[];

	constructor(rooms: Room[], insightDataset: InsightDataset) {
		this.rooms = rooms;
		this.insightDataset = insightDataset;
	}
	public getEntries(): DatasetEntry[] {
		return this.rooms;
	}
}
