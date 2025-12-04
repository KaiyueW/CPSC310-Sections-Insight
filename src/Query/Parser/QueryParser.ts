import { InsightError } from "../../controller/IInsightFacade";
import {
	Filter,
	LOGICCOMPARISON,
	MCOMPARISON,
	NEGATION,
	Options,
	Query,
	SCOMPARISON,
	Transformations,
} from "../QueryAST";
import { QueryWhereParser } from "./QueryWhereParser";
import { QueryTransformationsParser } from "./QueryTransformationsParser";
import { QueryOptionsParser } from "./QueryOptionsParser";
const SHORT_KEY_LENGTH = 2;
const LONG_KEY_LENGTH = 3;

// Chatgpt helps us with the structure of the parser.
export class QueryParser {
	public static parseQuery(query: unknown): Query {
		if (typeof query !== "object" || query === null) {
			throw new InsightError("Query should be a non-null object.");
		}

		const keys = Object.keys(query); // ["WHERE", "OPTIONS", "TRANSFORMATIONS]

		this.validateQueryKeys(keys);

		const whereContent = (query as { WHERE: unknown }).WHERE; //{ GT: { courses_avg: 90 } }
		const optionsContent = (query as { OPTIONS: unknown }).OPTIONS; //{ "COLUMNS": ["courses_dept", "courses_avg"], "ORDER": [] }

		if (typeof whereContent !== "object" || whereContent === null) {
			throw new InsightError("'WHERE' content must be a non-null object.");
		}
		if (typeof optionsContent !== "object" || optionsContent === null) {
			throw new InsightError("'OPTIONS' content must be a non-null object.");
		}

		let transformations: Transformations | undefined;
		if (keys.includes("TRANSFORMATIONS")) {
			const transformationsContent = (query as { TRANSFORMATIONS: unknown }).TRANSFORMATIONS;
			// {"GROUP": ["rooms_shortname”], “APPLY": [{"maxSeats": {"MAX": "rooms_seats"}}]}
			if (typeof transformationsContent !== "object" || transformationsContent === null) {
				throw new InsightError("'TRANSFORMATIONS' content must be a non-null object.");
			}
			transformations = QueryTransformationsParser.parseTransformations(transformationsContent);
		} else {
			transformations = undefined;
		}

		const options = QueryOptionsParser.parseOptions(optionsContent, transformations);

		const where = QueryWhereParser.parseWhere(whereContent);

		const id = this.parseID(where, options, transformations);

		return { id, where, options, transformations };
	}

	private static validateQueryKeys(keys: string[]): void {
		if (keys.length !== SHORT_KEY_LENGTH && keys.length !== LONG_KEY_LENGTH) {
			throw new InsightError("Query must have 2 or 3 keys.");
		}

		if (!keys.includes("WHERE") || !keys.includes("OPTIONS")) {
			throw new InsightError("Query must contain 'WHERE' and 'OPTIONS' keys.");
		}

		if (keys.length === LONG_KEY_LENGTH && !keys.includes("TRANSFORMATIONS")) {
			throw new InsightError("Query must contain 'TRANSFORMATIONS' key.");
		}
	}

	// just verify the form of keys
	public static validateQueryKeyForm(key: string): void {
		if (!key.includes("_") || key.endsWith("_") || key.startsWith("_")) {
			throw new InsightError(`Invalid key format ${key}, since keys must be idstring_field.`);
		}
		const keyParts = key.split("_");
		if (keyParts.length !== 2) {
			throw new InsightError("Keys must contain exactly 2 parts and 1 underscore like idstring_field.");
		}
	}

	public static validateOptionsKeyForm(transformations: Transformations | undefined, element: string): void {
		if (!transformations) {
			this.validateQueryKeyForm(element);
		} else {
			if (element.includes("_")) {
				this.validateQueryKeyForm(element);
			} else {
				if (!/^[^_]+$/.test(element)) {
					throw new InsightError(`Invalid element in COLUMNS ${element}`);
				}
			}
		}
	}

	private static parseID(where: Filter, options: Options, transformations: Transformations | undefined): string {
		const queryKeys = new Set<string>();
		this.getWhereQueryKey(where, queryKeys);
		this.getOptionsKey(options, queryKeys);
		this.getTransformationsKey(transformations, queryKeys);

		if (queryKeys.size === 0) {
			throw new InsightError("No keys for the dataset.");
		}
		const ids = new Set<string>();
		for (const key of queryKeys) {
			if (key.includes("_")) {
				this.validateQueryKeyForm(key);
				const id = key.split("_")[0]; //dataset_id
				ids.add(id);
			}
		}
		if (ids.size > 1) {
			throw new InsightError("Cannot perform query on multiple datasets.");
		}
		if (ids.size === 0) {
			throw new InsightError("Cannot get a valid dataset ID from the keys.");
		}
		let datasetID = "";
		for (const id of ids) {
			datasetID = id;
			break;
		}
		return datasetID;
	}

	private static getWhereQueryKey(where: Filter, queryKeys: Set<string>): void {
		const filterKeys = Object.keys(where); //"AND"
		if (filterKeys.length === 0) return;
		const filterKey = filterKeys[0];
		if (filterKey === "AND" || filterKey === "OR") {
			const filterList = (where as LOGICCOMPARISON)[filterKey as keyof LOGICCOMPARISON];
			if (filterList) {
				for (const subFilter of filterList) {
					this.getWhereQueryKey(subFilter, queryKeys);
				}
			}
		} else if (filterKey === "NOT") {
			const notFilter = (where as NEGATION).NOT;
			this.getWhereQueryKey(notFilter, queryKeys);
		} else if (filterKey === "GT" || filterKey === "LT" || filterKey === "EQ") {
			const mContent = (where as MCOMPARISON)[filterKey as keyof MCOMPARISON];
			//{ "sections_avg": 97 }
			if (mContent) {
				const mkey = Object.keys(mContent)[0];
				queryKeys.add(mkey);
			}
		} else if (filterKey === "IS") {
			const sContent = (where as SCOMPARISON).IS; // { "sections_avg": 97 }
			const skey = Object.keys(sContent)[0];
			queryKeys.add(skey);
		} else {
			throw new InsightError("Invalid filter Key.");
		}
	}

	private static getOptionsKey(options: Options, queryKeys: Set<string>): void {
		for (const element of options.COLUMNS) {
			queryKeys.add(element);
		}
		if (options.SORT) {
			if (typeof options.SORT === "string") {
				queryKeys.add(options.SORT);
			} else {
				for (const element of options.SORT.keys) {
					queryKeys.add(element);
				}
			}
		}
	}

	private static getTransformationsKey(transformations: Transformations | undefined, queryKeys: Set<string>): void {
		if (transformations) {
			for (const element of transformations.GROUP) {
				queryKeys.add(element);
			}
			for (const element of transformations.APPLY) {
				const applyKeys = Object.keys(element); // "maxSeats"
				const applyKey = applyKeys[0];
				const applyValue = element[applyKey];
				if (applyValue.AVG) {
					queryKeys.add(applyValue.AVG);
				} else if (applyValue.MIN) {
					queryKeys.add(applyValue.MIN);
				} else if (applyValue.MAX) {
					queryKeys.add(applyValue.MAX);
				} else if (applyValue.SUM) {
					queryKeys.add(applyValue.SUM);
				} else if (applyValue.COUNT) {
					queryKeys.add(applyValue.COUNT);
				}
			}
		}
	}
}
