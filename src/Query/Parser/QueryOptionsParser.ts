import { Options, ORDERContent, Transformations } from "../QueryAST";
import { InsightError } from "../../controller/IInsightFacade";
import { QueryParser } from "./QueryParser";

export class QueryOptionsParser {
	public static parseOptions(optionsContent: Object, transformations: Transformations | undefined): Options {
		const optionKeys = Object.keys(optionsContent); //"COLUMNS" and "ORDER"
		if (!optionKeys.includes("COLUMNS") || (optionKeys.length !== 1 && optionKeys.length !== 2)) {
			throw new InsightError("OPTIONS content must contain 'COLUMNS' and optionally 'ORDER' keys.");
		}
		// start parsing columns
		const columnsContent = (optionsContent as { COLUMNS: unknown }).COLUMNS; //should be like ["courses_dept", "courses_avg"]
		if (!Array.isArray(columnsContent) || columnsContent.length === 0) {
			throw new InsightError("'COLUMNS' must be a non-empty array.");
		}
		for (const element of columnsContent) {
			if (typeof element !== "string") {
				throw new InsightError("All elements in 'COLUMNS' must be strings.");
			}
			QueryParser.validateOptionsKeyForm(transformations, element);
		}

		const optionsResult: Options = { COLUMNS: columnsContent as string[] };

		// start parsing order
		if (optionKeys.includes("ORDER")) {
			const orderContent = (optionsContent as { ORDER: unknown }).ORDER; // "sections_dept" or {"dir": "DOWN", "keys": ["maxSeats"]}
			if (typeof orderContent === "string") {
				QueryParser.validateOptionsKeyForm(transformations, orderContent);
				optionsResult.SORT = orderContent;
			} else {
				if (typeof orderContent !== "object" || orderContent === null) {
					throw new InsightError("order should be a non-null object");
				}
				optionsResult.SORT = this.parseOrderContent(orderContent, transformations);
			}
		}
		return optionsResult;
	}

	private static parseOrderContent(orderContent: Object, transformations: Transformations | undefined): ORDERContent {
		const orderKeys = Object.keys(orderContent); // "dir" and "keys"
		if (orderKeys.length !== 2 || !orderKeys.includes("dir") || !orderKeys.includes("keys")) {
			throw new InsightError("Order must have dir and keys");
		}
		const dirContent = (orderContent as { dir: unknown }).dir;
		const keysContent = (orderContent as { keys: unknown }).keys;
		if (dirContent !== "DOWN" && dirContent !== "UP") {
			throw new InsightError("Order dir should be either DOWN or UP.");
		}
		if (!Array.isArray(keysContent) || keysContent.length === 0) {
			throw new InsightError("Order keys should be a non-null array.");
		}
		for (const ele of keysContent) {
			if (typeof ele !== "string") {
				throw new InsightError("Order Keys must all be strings");
			}
			QueryParser.validateOptionsKeyForm(transformations, ele);
		}
		return { dir: dirContent, keys: keysContent } as ORDERContent;
	}
}
