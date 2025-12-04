import { InsightResult } from "../controller/IInsightFacade";
import { DatasetEntry } from "../controller/InsightFacade";
import { getRoomInfo, getSectionInfo, Transformations } from "./QueryAST";
import { Section } from "../DataSet/Section";
import Decimal from "decimal.js";

export class QueryTransformer {
	// Chatgpt suggests me to join all the groupkeys to identify each group.
	public static transformData(transformations: Transformations, fData: DatasetEntry[]): InsightResult[] {
		if (fData.length === 0) {
			return [];
		}

		const result: InsightResult[] = []; //Record<string, string | number>
		const groups = this.group(transformations, fData);
		for (const [groupKey, groupValue] of groups) {
			const attrKeys = transformations.GROUP; // attrKey: "rooms_name"
			const keyValues = groupKey.split("+++"); //"333", "bob"
			const resultRow: InsightResult = {};
			for (let i = 0; i < attrKeys.length; i++) {
				const attrKey = attrKeys[i]; // attrKey: "rooms_name", "rooms_lat"
				const attrValue = keyValues[i]; // "333", "bob"
				let attrFinal: number | string;
				if (this.isStringField(attrKey)) {
					attrFinal = attrValue; // string
				} else {
					attrFinal = Number(attrValue); // number
				}
				resultRow[attrKey] = attrFinal;
			}
			for (const apply of transformations.APPLY) {
				const applyKey = Object.keys(apply)[0]; //"maxSeat"
				const applyValue = apply[applyKey];
				const applyToken = Object.keys(applyValue)[0]; //"MAX"
				const applyValueRecord = applyValue as Record<string, string>;
				const applyTokenTo = applyValueRecord[applyToken]; //"rooms_setas"
				const applyResult = this.calculate(applyToken, applyTokenTo, groupValue);
				resultRow[applyKey] = applyResult;
			}
			result.push(resultRow);
		}
		return result;
	}

	// chatGPT helps me with this function and I have understood this.
	private static group(transformations: Transformations, fData: DatasetEntry[]): Map<string, DatasetEntry[]> {
		const groups = new Map<string, DatasetEntry[]>();
		for (const entry of fData) {
			const realKeys: string[] = []; // all the group attributes of this entry
			let realKey: string | number;
			for (const attr of transformations.GROUP) {
				if (entry instanceof Section) {
					realKey = getSectionInfo(attr, entry);
				} else {
					realKey = getRoomInfo(attr, entry);
				}
				if (typeof realKey === "number") {
					realKey.toString();
				}
				realKeys.push(<string>realKey);
			}
			const realGroupKey = realKeys.join("+++"); // new group key
			if (!groups.has(realGroupKey)) {
				groups.set(realGroupKey, []);
			}
			groups.get(realGroupKey)!.push(entry); // push this entry to the corresponding group
		}
		return groups;
	}

	private static calculate(token: string, tokenTo: string, groupValue: DatasetEntry[]): number {
		// token:"MAX", tokenTo: "rooms_seat", value: Section[]
		const entryValues = []; //!!!
		for (const each of groupValue) {
			let entryValue: string | number;
			if (each instanceof Section) {
				entryValue = getSectionInfo(tokenTo, each);
			} else {
				entryValue = getRoomInfo(tokenTo, each);
			}
			entryValues.push(entryValue);
		}
		return this.handleToken(token, entryValues);
	}

	private static handleToken(token: string, entryValues: any[]): number {
		let result: number = 0;
		if (token === "MAX") {
			result = Math.max(...(entryValues as number[]));
		} else if (token === "MIN") {
			result = Math.min(...(entryValues as number[]));
		} else if (token === "COUNT") {
			const uniqueValues = new Set(entryValues);
			result = uniqueValues.size; //unique
		} else if (token === "SUM") {
			let total = new Decimal(0);
			for (const each of entryValues as number[]) {
				const deci = new Decimal(each);
				total = total.add(deci);
			}
			result = Number(total.toFixed(2));
		} else if (token === "AVG") {
			let total = new Decimal(0);
			for (const each of entryValues as number[]) {
				const deci = new Decimal(each);
				total = total.add(deci);
			}
			const numRows = entryValues.length;
			const avg = total.toNumber() / numRows;
			result = Number(avg.toFixed(2));
		}
		return result;
	}

	private static isStringField(key: string): boolean {
		return (
			key.includes("_id") ||
			key.includes("_dept") ||
			key.includes("_instructor") ||
			key.includes("_uuid") ||
			key.includes("_title") ||
			key.includes("_number") ||
			key.includes("_name") ||
			key.includes("_address") ||
			key.includes("_fullname") ||
			key.includes("_shortname") ||
			key.includes("_type") ||
			key.includes("_furniture") ||
			key.includes("_href")
		);
	}
}
