import { Section } from "../DataSet/Section";
import { Filter, LOGICCOMPARISON, MCOMPARISON, NEGATION, SCOMPARISON, getSectionInfo, getRoomInfo } from "./QueryAST";
import { InsightError } from "../controller/IInsightFacade";
import { DatasetEntry } from "../controller/InsightFacade";

interface FilterStrategy {
	apply(filter: Filter, element: DatasetEntry): boolean;
}

export class QueryFilter {
	public static filterData(where: Filter, data: DatasetEntry[]): DatasetEntry[] {
		if (Object.keys(where).length === 0) {
			return data;
		}
		const filteredData: any[] = [];
		for (const element of data) {
			if (this.recursion(where, element)) {
				filteredData.push(element);
			}
		}
		return filteredData;
	}

	public static recursion(where: Filter, element: DatasetEntry): boolean {
		const filterKey = Object.keys(where)[0]; // AND, GT
		let strategy: FilterStrategy;

		if (filterKey === "AND" || filterKey === "OR") {
			strategy = new LogicComparison(filterKey);
		} else if (filterKey === "NOT") {
			strategy = new NegationComparison();
		} else if (filterKey === "GT" || filterKey === "LT" || filterKey === "EQ") {
			strategy = new MComparison(filterKey);
		} else if (filterKey === "IS") {
			strategy = new SComparison();
		} else {
			throw new InsightError("Invalid filter operator.");
		}
		return strategy.apply(where, element);
	}
}

// Gemini helps us with the assertions like filterContent as LOGICCOMPARISON.
class LogicComparison implements FilterStrategy {
	constructor(private type: "AND" | "OR") {}

	public apply(where: Filter, element: DatasetEntry): boolean {
		const block = (where as LOGICCOMPARISON)[this.type]!;
		if (this.type === "AND") {
			for (const each of block) {
				if (!QueryFilter.recursion(each as Filter, element)) {
					return false;
				}
			}
			return true;
		} else {
			for (const each of block) {
				if (QueryFilter.recursion(each as Filter, element)) {
					return true;
				}
			}
			return false;
		}
	}
}

class NegationComparison implements FilterStrategy {
	public apply(filter: Filter, element: DatasetEntry): boolean {
		return !QueryFilter.recursion((filter as NEGATION).NOT!, element);
	}
}

class MComparison implements FilterStrategy {
	constructor(private type: "GT" | "LT" | "EQ") {}

	public apply(filter: Filter, element: DatasetEntry): boolean {
		const block = (filter as MCOMPARISON)[this.type]!;
		const key = Object.keys(block)[0]; //sections_avg
		const expectNumber = block[key] as number;
		let realNumber: number;
		if (element instanceof Section) {
			realNumber = getSectionInfo(key, element) as number;
		} else {
			realNumber = getRoomInfo(key, element) as number;
		}

		if (this.type === "GT") {
			return realNumber > expectNumber;
		} else if (this.type === "LT") {
			return realNumber < expectNumber;
		} else if (this.type === "EQ") {
			return realNumber === expectNumber;
		} else {
			throw new InsightError("Invalid MComparison operator.");
		}
	}
}

class SComparison implements FilterStrategy {
	public apply(filter: Filter, element: DatasetEntry): boolean {
		const block = (filter as SCOMPARISON).IS!; //{"sections_dept": cpsc}
		const key = Object.keys(block)[0]; //sections_dept
		const expectString = block[key] as string; //cpsc
		let realString: string;
		if (element instanceof Section) {
			realString = getSectionInfo(key, element) as string;
		} else {
			realString = getRoomInfo(key, element) as string;
		}

		if (expectString.startsWith("*") && expectString.endsWith("*")) {
			const inner = expectString.slice(1, -1);
			return realString.includes(inner); //*ps*
		} else if (expectString.startsWith("*")) {
			const inner = expectString.slice(1);
			return realString.endsWith(inner); //*psc
		} else if (expectString.endsWith("*")) {
			const inner = expectString.slice(0, -1);
			return realString.startsWith(inner); //cps*
		} else {
			return realString === expectString; //cpsc
		}
	}
}
