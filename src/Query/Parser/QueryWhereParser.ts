import {
	Filter,
	LOGICCOMPARISON,
	MCOMPARISON,
	MCOMPARISONContent,
	NEGATION,
	SCOMPARISON,
	SCOMPARISONContent,
} from "../QueryAST";
import { InsightError } from "../../controller/IInsightFacade";
import { QueryParser } from "./QueryParser";

export class QueryWhereParser {
	public static parseWhere(whereContent: Object): Filter {
		const filterContent = whereContent as Record<string, unknown>;
		const filterKeys = Object.keys(filterContent); //GT

		if (filterKeys.length === 0) {
			return {};
		}

		if (filterKeys.length !== 1) {
			throw new InsightError("WHERE should only contain one operator.");
		}
		const filterKey = filterKeys[0]; //GT
		const filterValue = filterContent[filterKey]; //{ courses_avg: 90 }
		if (filterKey === "AND" || filterKey === "OR") {
			return this.parseLogicComparison(filterKey, filterValue);
		}
		if (filterKey === "GT" || filterKey === "LT" || filterKey === "EQ") {
			return this.parseMComparison(filterKey, filterValue);
		}
		if (filterKey === "IS") {
			return this.parseSComparison(filterValue);
		}
		if (filterKey === "NOT") {
			return this.parseNegation(filterValue);
		}
		throw new InsightError("The 'WHERE' operator is invalid.");
	}

	private static parseLogicComparison(filterKey: string, filterValue: unknown): LOGICCOMPARISON {
		// filterValue: [ { "GT": { "ubc_avg": 90 } }, { "IS": { "ubc_dept": "adhe" } } ]
		// filterKey: "AND"
		if (!Array.isArray(filterValue) || filterValue.length === 0) {
			throw new InsightError("'COLOMNS' content must be a non-empty array for a logic comparison.");
		}
		const subFilters: Filter[] = [];
		for (const subFilterValue of filterValue) {
			// { "GT": { "ubc_avg": 90 } }
			if (subFilterValue === null || typeof subFilterValue !== "object") {
				throw new InsightError("Each element must be a non-null object in logic comparison.");
			}
			subFilters.push(this.parseWhere(subFilterValue));
		}
		return { [filterKey]: subFilters } as LOGICCOMPARISON;
	}

	private static parseSComparison(filterValue: unknown): SCOMPARISON {
		//  filterValue: { "ubc_dept": "adhe" }
		if (typeof filterValue !== "object" || filterValue === null) {
			throw new InsightError(`IS content must be a non-null object.`);
		}

		const Iskeys = Object.keys(filterValue); //ubc_dept

		if (Iskeys.length !== 1) {
			throw new InsightError(`IS content must contain exactly one key.`);
		}

		const Iskey = Iskeys[0]; //ubc_dept
		QueryParser.validateQueryKeyForm(Iskey);

		const IsValue = filterValue as Record<string, unknown>;
		const IsContent = IsValue[Iskey]; //adhe
		if (typeof IsContent !== "string") {
			throw new InsightError("The value of IS must be a string.");
		}

		// wildcard *
		const numAsterisks = IsContent.split("*").length - 1;
		// 	"CPSC", "*PSC", "CPS*", "*PS*"
		if (numAsterisks > 0) {
			if (numAsterisks === 1) {
				if (!IsContent.startsWith("*") && !IsContent.endsWith("*")) {
					throw new InsightError("* must be either at the start or the end.");
				}
			} else if (numAsterisks === 2) {
				if (!(IsContent.startsWith("*") && IsContent.endsWith("*"))) {
					throw new InsightError("* must be both at the start and the end.");
				}
			} else {
				throw new InsightError("SComparison can have at most two '*' wildcards");
			}
		}

		const skeyContent: SCOMPARISONContent = { [Iskey]: IsContent };
		return { IS: skeyContent };
	}

	private static parseMComparison(filterKey: string, filterValue: unknown): MCOMPARISON {
		// GT, { "ubc_avg": 90 }
		if (typeof filterValue !== "object" || filterValue === null) {
			throw new InsightError(`${filterValue} content must be a non-null object.`);
		}
		const Mkeys = Object.keys(filterValue); //["ubc_avg"]

		if (Mkeys.length !== 1) {
			throw new InsightError("MComparison can also have one key.");
		}

		const Mkey = Mkeys[0]; //"ubc_avg"
		QueryParser.validateQueryKeyForm(Mkey);

		const MValue = filterValue as Record<string, unknown>;
		const MContent = MValue[Mkey]; // 90
		if (typeof MContent !== "number") {
			throw new InsightError(`The value of ${Mkey} must be a number.`);
		}
		const mkeyContent: MCOMPARISONContent = { [Mkey]: MContent };
		return { [filterKey]: mkeyContent } as MCOMPARISON;
	}

	private static parseNegation(filterValue: unknown): NEGATION {
		// filterValue: { "GT": { "ubc_avg": 90 } }
		if (typeof filterValue !== "object" || filterValue === null) {
			throw new InsightError("NOT content must be a non-null object.");
		}
		const notKey = Object.keys(filterValue);
		if (notKey.length !== 1) {
			throw new InsightError("NOT must contain a single filter.");
		}
		const notResult = this.parseWhere(filterValue);
		return { NOT: notResult };
	}
}
