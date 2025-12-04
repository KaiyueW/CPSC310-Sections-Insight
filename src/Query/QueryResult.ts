import { InsightResult } from "../controller/IInsightFacade";
import { Options } from "./QueryAST";

export class QueryResult {
	public static resultQuery(groupedData: InsightResult[], options: Options): InsightResult[] {
		const selectedData = this.handleColumns(groupedData, options);
		const result = this.handleOrder(selectedData, options);
		return result;
	}

	private static handleColumns(groupedData: InsightResult[], options: Options): InsightResult[] {
		const result: InsightResult[] = [];
		for (const each of groupedData) {
			const newEntry: InsightResult = {};
			for (const realKey of Object.keys(each)) {
				if (options.COLUMNS.includes(realKey)) {
					newEntry[realKey] = each[realKey];
				}
			}
			result.push(newEntry);
		}
		return result;
	}

	// I was confused at first, chatGPT suggests me to use sort and combine two order conditions together.
	private static handleOrder(selectedData: InsightResult[], options: Options): InsightResult[] {
		const orderContent = options.SORT!;
		if (!orderContent) {
			return selectedData;
		}
		let orderKeys: string[];
		let orderDir: "UP" | "DOWN";
		if (typeof orderContent === "string") {
			orderKeys = [orderContent];
			orderDir = "UP";
		} else {
			orderKeys = orderContent.keys;
			orderDir = orderContent.dir;
		}

		function compare(x: InsightResult, y: InsightResult): number {
			let valX: number;
			let valY: number;
			let result: number;
			for (const eachKey of orderKeys) {
				valX = x[eachKey] as number;
				valY = y[eachKey] as number;
				if (valX < valY) result = -1;
				else if (valX > valY) result = 1;
				else result = 0;
				if (result !== 0) {
					if (orderDir === "UP") return result;
					else return -result;
				} // if result = 0, continue to compare the next key.
			}
			return 0;
		}
		selectedData.sort(compare); //chatgpt suggests me to use sort function.
		return selectedData;
	}
}
