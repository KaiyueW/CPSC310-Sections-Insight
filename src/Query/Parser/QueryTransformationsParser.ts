import { ApplyContent, Transformations } from "../QueryAST";
import { InsightError } from "../../controller/IInsightFacade";
import { QueryParser } from "./QueryParser";

export class QueryTransformationsParser {
	public static parseTransformations(transformationsContent: Object): Transformations {
		const transKeys = Object.keys(transformationsContent);
		if (transKeys.length !== 2 || !transKeys.includes("GROUP") || !transKeys.includes("APPLY")) {
			throw new InsightError("TRANSFORMATIONS must contain 'GROUP' and 'APPLY' keys.");
		}
		const groupContent = (transformationsContent as { GROUP: unknown }).GROUP;
		//["rooms_shortname”]
		const applyContent = (transformationsContent as { APPLY: unknown }).APPLY;
		//[{"maxSeats": {"MAX": "rooms_seats"}}]

		// parse GROUP
		if (!Array.isArray(groupContent) || groupContent.length === 0) {
			throw new InsightError("GROUP content must be a non-empty array.");
		}
		const group = this.parseGroup(groupContent);

		// parse APPLY
		if (!Array.isArray(applyContent)) {
			throw new InsightError("APPLY content must be an array.");
		}
		const apply = this.parseApply(applyContent);
		return { GROUP: group, APPLY: apply };
	}

	private static parseGroup(groupContent: Array<string>): string[] {
		for (const g of groupContent) {
			if (typeof g !== "string") {
				throw new InsightError("GROUP must contain strings");
			}
			QueryParser.validateQueryKeyForm(g);
		}
		return groupContent;
	}

	private static parseApply(applyContent: Array<string>): ApplyContent[] {
		const applyKeysContainer: string[] = [];
		const apply: ApplyContent[] = [];
		for (const rule of applyContent) {
			if (typeof rule !== "object" || rule === null) {
				throw new InsightError("APPLY element must be a non-null object.");
			}
			// parse applyKeys
			const applyKeys = Object.keys(rule); //maxSeats
			if (applyKeys.length !== 1) {
				throw new InsightError("APPLYRULE must contain one applyKey.");
			}
			const applyKey = applyKeys[0];
			if (!/^[^_]+$/.test(applyKey)) {
				throw new InsightError(`Invalid applykey format: ${applyKey}`);
			}
			if (applyKeysContainer.includes(applyKey)) {
				throw new InsightError("ApplyKeys must be unique.");
			}
			applyKeysContainer.push(applyKey);

			// parse applyValues: {"MAX": "rooms_seats"}
			const applyValues = (rule as Record<string, unknown>)[applyKey];
			if (typeof applyValues !== "object" || applyValues === null) {
				throw new InsightError("applyValues must be non-null object.");
			}
			const applyTokens = Object.keys(applyValues); //"MAX"
			const applyToken = this.parseApplyTokens(applyTokens);
			const applyTokenKey = (applyValues as Record<string, unknown>)[applyToken]; //"rooms_seats"
			if (typeof applyTokenKey !== "string" || applyTokenKey === "") {
				throw new InsightError("apply Key must be a non-empty single string");
			}
			QueryParser.validateQueryKeyForm(applyTokenKey);
			apply.push({ [applyKey]: { [applyToken]: applyTokenKey } });
		}
		return apply;
	}

	private static parseApplyTokens(applyTokens: string[]): string {
		if (applyTokens.length !== 1) {
			throw new InsightError("applyToken must have one value");
		}
		const applyToken = applyTokens[0]; //"MAX"
		if (
			applyToken !== "MAX" &&
			applyToken !== "MIN" &&
			applyToken !== "AVG" &&
			applyToken !== "SUM" &&
			applyToken !== "COUNT"
		) {
			throw new InsightError("applyToken is invalid.");
		}
		return applyToken;
	}
}
