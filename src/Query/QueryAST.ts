import { Section } from "../DataSet/Section";
import { Room } from "../DataSet/Room";
import { InsightError } from "../controller/IInsightFacade";

// We use gemini to help build the interface and some assertions in the implementation.
export interface Query {
	id: string;
	where: Filter;
	options: Options;
	transformations: Transformations | undefined;
}

// where
export type Filter = LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION | {};

export interface LOGICCOMPARISON {
	AND?: Filter[];
	OR?: Filter[];
}

export interface MCOMPARISON {
	GT?: MCOMPARISONContent;
	LT?: MCOMPARISONContent;
	EQ?: MCOMPARISONContent;
}

export interface MCOMPARISONContent {
	[MKey: string]: number; //"sections_avg": 97
}

export interface SCOMPARISON {
	IS: SCOMPARISONContent;
}

export interface SCOMPARISONContent {
	[SKey: string]: string; //"sections_dept": cpsc
}

export interface NEGATION {
	NOT: Filter;
}

// options
export interface Options {
	COLUMNS: string[];
	SORT?: string | ORDERContent;
}

export interface ORDERContent {
	dir: "UP" | "DOWN";
	keys: string[];
}

// Transformations
export interface Transformations {
	GROUP: string[];
	APPLY: ApplyContent[];
}

//{"maxSeats": {
// "MAX": "rooms_seats"
// }
export interface ApplyContent {
	[applyKey: string]: ApplyValue;
}

//"MAX": "rooms_seats"
export interface ApplyValue {
	MAX?: string;
	MIN?: string;
	AVG?: string;
	SUM?: string;
	COUNT?: string;
}

export function getSectionInfo(key: string, section: Section): string | number {
	const field = key.split("_")[1]; // key is sections_dept
	if (field === "uuid") {
		return section.getUuid();
	} else if (field === "id") {
		return section.getId();
	} else if (field === "title") {
		return section.getTitle();
	} else if (field === "instructor") {
		return section.getInstructor();
	} else if (field === "dept") {
		return section.getDept();
	} else if (field === "year") {
		return section.getYear();
	} else if (field === "avg") {
		return section.getAvg();
	} else if (field === "pass") {
		return section.getPass();
	} else if (field === "fail") {
		return section.getFail();
	} else if (field === "audit") {
		return section.getAudit();
	} else {
		throw new InsightError(`Unknown sections field: ${field}`);
	}
}

export function getRoomInfo(key: string, room: Room): string | number {
	const field = key.split("_")[1]; // key is rooms_seats
	if (field === "fullname") {
		return room.getFullname();
	} else if (field === "shortname") {
		return room.getShortname();
	} else if (field === "number") {
		return room.getNumber();
	} else if (field === "name") {
		return room.getName();
	} else if (field === "address") {
		return room.getAddress();
	} else if (field === "type") {
		return room.getType();
	} else if (field === "furniture") {
		return room.getFurniture();
	} else if (field === "href") {
		return room.getHref();
	} else if (field === "lat") {
		return room.getLat();
	} else if (field === "lon") {
		return room.getLon();
	} else if (field === "seats") {
		return room.getSeats();
	} else {
		throw new InsightError(`Unknown rooms field: ${field}`);
	}
}
