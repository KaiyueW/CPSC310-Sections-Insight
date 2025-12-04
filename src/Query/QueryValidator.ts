import { Filter, LOGICCOMPARISON, MCOMPARISON, Query, SCOMPARISONContent } from "./QueryAST";
import { DataSet } from "../DataSet/DataSet";
import { InsightDatasetKind, InsightError } from "../controller/IInsightFacade";

const SECTIONS_MFIELDS = new Set(["avg", "pass", "fail", "audit", "year"]);
const SECTIONS_SFIELDS = new Set(["dept", "id", "instructor", "title", "uuid"]);
const ROOMS_MFIELDS = new Set(["lat", "lon", "seats"]);
const ROOMS_SFIELDS = new Set(["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"]);

export class QueryValidator {
	public static validateQuery(query: Query, inMemoryStore: Map<string, DataSet>): void {
		if (!inMemoryStore.has(query.id)) {
			throw new InsightError("Dataset is not found in the memory store.");
		}
		const dataset = inMemoryStore.get(query.id)!;
		let kind: InsightDatasetKind;
		if (dataset.kind === "section") {
			kind = InsightDatasetKind.Sections;
		} else {
			kind = InsightDatasetKind.Rooms;
		}
		this.validateTransformations(query, kind);
		this.validateOptions(query, kind);
		this.validateWhereKey(query.where, query.id, kind);
	}

	private static validateTransformations(query: Query, kind: InsightDatasetKind): void {
		if (query.transformations) {
			const transKeys = new Set<string>();
			for (const ele of query.transformations.GROUP) {
				transKeys.add(ele);
				this.validateGeneralKey(ele, query.id, kind);
			}
			for (const ele of query.transformations.APPLY) {
				const applyKey = Object.keys(ele)[0];
				const applyValue = ele[applyKey];
				transKeys.add(applyKey);
				if (applyValue.MAX) {
					this.validateNumberKey(applyValue.MAX, query.id, kind);
				} else if (applyValue.MIN) {
					this.validateNumberKey(applyValue.MIN, query.id, kind);
				} else if (applyValue.AVG) {
					this.validateNumberKey(applyValue.AVG, query.id, kind);
				} else if (applyValue.SUM) {
					this.validateNumberKey(applyValue.SUM, query.id, kind);
				} else if (applyValue.COUNT) {
					this.validateGeneralKey(applyValue.COUNT, query.id, kind);
				}
			}
			for (const ele of query.options.COLUMNS) {
				if (!transKeys.has(ele)) {
					throw new InsightError("all columns must be in group or apply block.");
				}
			}
		}
	}

	private static validateOptions(query: Query, kind: InsightDatasetKind): void {
		for (const key of query.options.COLUMNS) {
			if (query.transformations) {
				if (key.includes("_")) {
					this.validateGeneralKey(key, query.id, kind);
				}
			} else {
				this.validateGeneralKey(key, query.id, kind);
			}
		}

		if (query.options.SORT) {
			if (typeof query.options.SORT === "string") {
				if (!query.options.COLUMNS.includes(query.options.SORT)) {
					throw new InsightError("SORT key must be in COLUMNS.");
				}
				if (!query.transformations) {
					this.validateGeneralKey(query.options.SORT, query.id, kind);
				} else {
					if (query.options.SORT.includes("_")) {
						this.validateGeneralKey(query.options.SORT, query.id, kind);
					}
				}
			} else {
				for (const key of query.options.SORT.keys) {
					if (!query.options.COLUMNS.includes(key)) {
						throw new InsightError("SORT keys must be in columns.");
					}
				}
			}
		}
	}

	//Gemini helps with the defined assertion ("!") and the "as" assertions.
	private static validateWhereKey(where: Filter, queryID: string, kind: InsightDatasetKind): void {
		const filterKeys = Object.keys(where);
		if (filterKeys.length === 0) return;
		const filterKey = filterKeys[0];
		const filterValue = where as Record<string, unknown>; //"GT": {"sections_avg": 97}

		if (filterKey === "AND" || filterKey === "OR") {
			const filterList = (filterValue as LOGICCOMPARISON)[filterKey as keyof LOGICCOMPARISON]!;
			for (const subFilter of filterList) {
				this.validateWhereKey(subFilter, queryID, kind);
			}
		} else if (filterKey === "GT" || filterKey === "LT" || filterKey === "EQ") {
			const mContent = (filterValue as MCOMPARISON)[filterKey as keyof MCOMPARISON]!;
			const mkey = Object.keys(mContent)[0];
			this.validateNumberKey(mkey, queryID, kind);
		} else if (filterKey === "IS") {
			const sContent = (filterValue.IS as SCOMPARISONContent)!;
			const skey = Object.keys(sContent)[0];
			this.validateStringKey(skey, queryID, kind);
		} else if (filterKey === "NOT") {
			const negation = filterValue.NOT as Filter;
			this.validateWhereKey(negation, queryID, kind);
		}
	}

	private static validateGeneralKey(key: string, queryID: string, kind: InsightDatasetKind): void {
		const [id, field] = key.split("_");
		if (id !== queryID) {
			throw new InsightError("Should only perform on one dataset.");
		}
		if (kind === InsightDatasetKind.Sections) {
			if (!SECTIONS_SFIELDS.has(field) && !SECTIONS_MFIELDS.has(field)) {
				throw new InsightError(`${field} should be a sections field.`);
			}
		} else {
			if (!ROOMS_SFIELDS.has(field) && !ROOMS_MFIELDS.has(field)) {
				throw new InsightError(`${field} should be a rooms field.`);
			}
		}
	}

	private static validateStringKey(key: string, queryID: string, kind: InsightDatasetKind): void {
		const [id, field] = key.split("_");
		if (id !== queryID) {
			throw new InsightError("Should only perform on one dataset.");
		}
		if (kind === InsightDatasetKind.Sections) {
			if (!SECTIONS_SFIELDS.has(field)) {
				throw new InsightError(`${field} should be a sections string field.`);
			}
		} else {
			if (!ROOMS_SFIELDS.has(field)) {
				throw new InsightError(`${field} should be a rooms string field.`);
			}
		}
	}

	private static validateNumberKey(key: string, queryID: string, kind: InsightDatasetKind): void {
		const [id, field] = key.split("_");
		if (id !== queryID) {
			throw new InsightError("Should only perform on one dataset.");
		}
		if (kind === InsightDatasetKind.Sections) {
			if (!SECTIONS_MFIELDS.has(field)) {
				throw new InsightError(`${field} should be a sections number field.`);
			}
		} else {
			if (!ROOMS_MFIELDS.has(field)) {
				throw new InsightError(`${field} should be a rooms number field.`);
			}
		}
	}
}
