import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { Section } from "../../src/DataSet/Section";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Room } from "../../src/DataSet/Room";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let sectionsTest1: string;
	let sectionsTest2: string;
	let sectionsInvalidContent: string;
	let sectionsInvalidRoot: string;
	let section: Section;

	let rooms: string;
	let roomsTest1: string;
	let roomsTest2: string;
	let roomsInvalidContent: string;
	let roomsInvalidIndex: string;
	let roomsInvalidIndex1: string;
	let roomsInvalidRoot: string;
	let room: Room;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		sectionsTest1 = await getContentFromArchives("test_1.zip");
		sectionsTest2 = await getContentFromArchives("test_2.zip");
		sectionsInvalidContent = await getContentFromArchives("invalidContent.zip");
		sectionsInvalidRoot = await getContentFromArchives("invalidRoot.zip");
		section = new Section("uuid", "ubc", "testSection", "prof", "cpsc", 2020, 90, 50, 2, 40);

		rooms = await getContentFromArchives("campus.zip");
		roomsTest1 = await getContentFromArchives("room_1.zip");
		roomsTest2 = await getContentFromArchives("room_2.zip");
		roomsInvalidContent = await getContentFromArchives("invalidRooms.zip");
		roomsInvalidIndex = await getContentFromArchives("invalidIndex.zip");
		roomsInvalidIndex1 = await getContentFromArchives("invalidIndex1.zip");
		roomsInvalidRoot = await getContentFromArchives("invalidRoomRoot.zip");
		room = new Room(
			"Fullname",
			"Shortname",
			"1012",
			"name",
			"address",
			49.2606,
			-123.249,
			120,
			"type",
			"furniture",
			"href"
		);

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	beforeEach(async function () {
		// await clearDisk();
		// facade = new InsightFacade();
	});

	describe("AddDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should add data to the disk when new instance", async function () {
			const result = await facade.addDataset("ubc", sectionsTest1, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
			facade = new InsightFacade();
			const resultTwo = await facade.addDataset("bar", sectionsTest2, InsightDatasetKind.Sections);
			expect(resultTwo).to.have.members(["ubc", "bar"]);
		});
		it("should reject with an empty dataset id", async function () {
			// Read the "Free Mutant Walkthrough" in the spec for tips on how to get started!
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with a whitespace (two)", async function () {
			// Read the "Free Mutant Walkthrough" in the spec for tips on how to get started!
			try {
				await facade.addDataset(" ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an invalid content", async function () {
			try {
				await facade.addDataset("foo", sectionsInvalidContent, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an invalid root", async function () {
			try {
				await facade.addDataset("bar", sectionsInvalidRoot, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should successfully add a dataset (one)", async function () {
			const result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
		});

		it("should successfully add a dataset (two)", async function () {
			//return Promise <string[]>
			const result = await facade.addDataset("ubc", sectionsTest1, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
			const resultTwo = await facade.addDataset("bar", sectionsTest2, InsightDatasetKind.Sections);
			expect(resultTwo).to.have.members(["ubc", "bar"]);
		});

		it("should not add a dataset with the same id of an already added dataset", async function () {
			const result = await facade.addDataset("ubc", sectionsTest1, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
			try {
				await facade.addDataset("ubc", sectionsTest2, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an underscore id", async function () {
			try {
				await facade.addDataset("_ubc", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an invalid kind", async function () {
			try {
				await facade.addDataset("foo", sections, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject with an whitespace id", async function () {
			try {
				await facade.addDataset("	", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should successfully add a valid rooms dataset", async function () {
			const result = await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			expect(result).to.have.members(["campus"]);
		});

		it("ROOM: should successfully add multiple room datasets", async function () {
			const result = await facade.addDataset("campus", roomsTest1, InsightDatasetKind.Rooms);
			expect(result).to.have.members(["campus"]);
			const resultTwo = await facade.addDataset("north", roomsTest2, InsightDatasetKind.Rooms);
			expect(resultTwo).to.have.members(["campus", "north"]);
		});

		it("ROOM: should reject an empty dataset id", async function () {
			try {
				await facade.addDataset("", rooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject a whitespace id", async function () {
			try {
				await facade.addDataset(" ", rooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject an underscore id", async function () {
			try {
				await facade.addDataset("_campus", rooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject invalid room content", async function () {
			try {
				await facade.addDataset("campus", roomsInvalidContent, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject no index file", async function () {
			try {
				await facade.addDataset("campus", roomsInvalidRoot, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject invalid index file", async function () {
			try {
				await facade.addDataset("campus", roomsInvalidIndex, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject invalid index file", async function () {
			try {
				await facade.addDataset("campus", roomsInvalidIndex1, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should not add a dataset with the same id again", async function () {
			const result = await facade.addDataset("campus", roomsTest1, InsightDatasetKind.Rooms);
			expect(result).to.have.members(["campus"]);
			try {
				await facade.addDataset("campus", roomsTest2, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should persist rooms dataset on disk and reload correctly", async function () {
			const result = await facade.addDataset("campus", roomsTest1, InsightDatasetKind.Rooms);
			expect(result).to.have.members(["campus"]);
			facade = new InsightFacade();
			const resultTwo = await facade.addDataset("east", roomsTest2, InsightDatasetKind.Rooms);
			expect(resultTwo).to.have.members(["campus", "east"]);
		});
	});

	describe("RemoveDataset", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});
		it("should successfully remove a dataset", async function () {
			// The promise should fulfill with the id of the dataset that was removed.
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			const removeId = await facade.removeDataset("foo");
			expect(removeId).to.deep.equal("foo");
			const listAll = await facade.listDatasets();
			expect(listAll).to.deep.equal([]);
		});

		it("should remove the data in the disk even when new instance", async function () {
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			facade = new InsightFacade();
			const removeId = await facade.removeDataset("foo");
			expect(removeId).to.deep.equal("foo");
		});

		it("should reject a valid id was not yet added)", async function () {
			// The promise should reject with a NotFoundError (if a valid id was not yet added)
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			try {
				await facade.removeDataset("bar");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should not remove a database twice)", async function () {
			// The promise should reject with a NotFoundError (if a valid id was not yet added)
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			await facade.removeDataset("foo");
			try {
				await facade.removeDataset("foo");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("should reject an invalid id (with underscore)", async function () {
			// The promise should reject with a NotFoundError (if a valid id was not yet added)
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			try {
				await facade.removeDataset("_foo");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject an invalid id (with space)", async function () {
			// The promise should reject with a NotFoundError (if a valid id was not yet added)
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			try {
				await facade.removeDataset("	");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("should reject an invalid id (empty id)", async function () {
			const result = await facade.addDataset("foo", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			try {
				await facade.removeDataset("");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("ROOM: should successfully remove a rooms dataset", async function () {
			const result = await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			expect(result).to.have.members(["campus"]);
			const removed = await facade.removeDataset("campus");
			expect(removed).to.equal("campus");
		});

		it("ROOM: should remove dataset even after reloading instance", async function () {
			await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			facade = new InsightFacade();
			const removed = await facade.removeDataset("campus");
			expect(removed).to.equal("campus");
		});

		it("ROOM: should reject removal of non-existent id", async function () {
			await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			try {
				await facade.removeDataset("north");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("ROOM: should reject invalid id with underscore", async function () {
			await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			try {
				await facade.removeDataset("_campus");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject invalid id with space", async function () {
			await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			try {
				await facade.removeDataset("  ");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should reject empty id", async function () {
			await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			try {
				await facade.removeDataset("");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("ROOM: should not remove dataset twice", async function () {
			await facade.addDataset("campus", rooms, InsightDatasetKind.Rooms);
			await facade.removeDataset("campus");
			try {
				await facade.removeDataset("campus");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});
	});

	describe("listDatasets", function () {
		beforeEach(async function () {
			await clearDisk();
			facade = new InsightFacade();
		});
		//return Promise <InsightDataset[]>, all currently added datasets, their types, and number of rows.
		it("should successfully list empty dataset", async function () {
			const result = await facade.listDatasets();
			expect(result).to.deep.equal([]);
		});

		it("should successfully list one dataset", async function () {
			const result = await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["ubc"]);
			const listAll = await facade.listDatasets();
			const expected: InsightDataset[] = [{ id: "ubc", kind: InsightDatasetKind.Sections, numRows: 64612 }];
			expect(listAll).to.deep.equal(expected);
		});

		it("should successfully list one dataset (second)", async function () {
			const result = await facade.addDataset("foo", sectionsTest1, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			const listAll = await facade.listDatasets();
			const expected: InsightDataset[] = [{ id: "foo", kind: InsightDatasetKind.Sections, numRows: 2 }];
			expect(listAll).to.deep.equal(expected);
		});

		it("should successfully list two datasets", async function () {
			const result = await facade.addDataset("foo", sectionsTest1, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			const resultTwo = await facade.addDataset("bar", sectionsTest2, InsightDatasetKind.Sections);
			expect(resultTwo).to.have.members(["foo", "bar"]);
			const listAll = await facade.listDatasets();
			const myDataset1: InsightDataset = { id: "foo", kind: InsightDatasetKind.Sections, numRows: 2 };
			const myDataset2: InsightDataset = { id: "bar", kind: InsightDatasetKind.Sections, numRows: 2 };
			expect(listAll).to.have.deep.members([myDataset1, myDataset2]);
		});

		it("should not list removed dataset", async function () {
			const result = await facade.addDataset("foo", sectionsTest1, InsightDatasetKind.Sections);
			expect(result).to.have.members(["foo"]);
			const resultTwo = await facade.addDataset("bar", sectionsTest2, InsightDatasetKind.Sections);
			expect(resultTwo).to.have.members(["foo", "bar"]);
			await facade.removeDataset("foo");
			const listAll = await facade.listDatasets();
			const myDataset2: InsightDataset[] = [{ id: "bar", kind: InsightDatasetKind.Sections, numRows: 2 }];
			expect(listAll).to.deep.equal(myDataset2);
		});

		it("ROOM: should list one rooms dataset correctly", async function () {
			await facade.addDataset("campus", roomsTest1, InsightDatasetKind.Rooms);
			const list = await facade.listDatasets();
			const expected: InsightDataset[] = [{ id: "campus", kind: InsightDatasetKind.Rooms, numRows: 6 }];
			expect(list).to.deep.equal(expected);
		});

		it("ROOM: should list multiple room datasets correctly", async function () {
			await facade.addDataset("campus", roomsTest1, InsightDatasetKind.Rooms);
			await facade.addDataset("north", roomsTest2, InsightDatasetKind.Rooms);
			const list = await facade.listDatasets();
			const expected: InsightDataset[] = [
				{ id: "campus", kind: InsightDatasetKind.Rooms, numRows: 6 },
				{ id: "north", kind: InsightDatasetKind.Rooms, numRows: 11 },
			];
			expect(list).to.have.deep.members(expected);
		});

		it("ROOM: should not list removed dataset", async function () {
			await facade.addDataset("campus", roomsTest1, InsightDatasetKind.Rooms);
			await facade.addDataset("north", roomsTest2, InsightDatasetKind.Rooms);
			await facade.removeDataset("campus");
			const list = await facade.listDatasets();
			const expected: InsightDataset[] = [{ id: "north", kind: InsightDatasetKind.Rooms, numRows: 11 }];
			expect(list).to.deep.equal(expected);
		});
	});

	describe("PerformQuery", function () {
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title); //只是确保input expect都在，没valid具体内容
			let result: InsightResult[] = []; // dummy value before being reassigned
			try {
				result = await facade.performQuery(input); //should return Promise<InsightResult[]>
			} catch (err) {
				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				// TODO: replace this failing assertion with your assertions. You will need to reason about the code in this function
				// to determine what to put here :)
				if (expected === "InsightError") {
					expect(err).to.be.instanceOf(InsightError);
				} else if (expected === "ResultTooLargeError") {
					expect(err).to.be.instanceOf(ResultTooLargeError);
				}
				return;
			}
			if (errorExpected) {
				expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
			}
			// TODO: replace this failing assertion with your assertions. You will need to reason about the code in this function
			// to determine what to put here :)
			expect(result).to.have.deep.members(expected);
		}

		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		// Examples demonstrating how to test performQuery using the JSON Test Queries.
		// The relative path to the query file must be given in square brackets.
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		//Valid tests
		it("[valid/complex.json] SELECT dept, id, avg WHERE avg > 90 AND dept = adhe, or avg = 95", checkQuery);
		it("[valid/selectEqual.json] SELECT dept, fail WHERE fail = 97", checkQuery);
		it("[valid/selectLess.json] SELECT dept, avg WHERE avg < 50", checkQuery);
		it("[valid/selectAND.json] SELECT dept, avg including AND", checkQuery);
		it("[valid/selectOR.json] SELECT dept, avg including OR", checkQuery);
		it("[valid/selectNOT.json] SELECT dept, avg including NOT", checkQuery);
		it("[valid/noOrder.json] SELECT dept, avg dont include Order", checkQuery);
		it("[valid/wildcard1.json] SELECT dept, avg WHERE dept is sta*", checkQuery);
		it("[valid/wildcard2.json] SELECT dept, avg WHERE dept is stat", checkQuery);
		it("[valid/wildcard3.json] SELECT dept, avg WHERE dept is *tat", checkQuery);
		it("[valid/wildcard4.json] SELECT dept, avg WHERE dept is *ta*", checkQuery);
		it("[invalid/wildcard5.json] SELECT dept, *", checkQuery);
		//Invalid tests
		it("[invalid/wrongWildcard.json] Query improper *", checkQuery);
		it("[invalid/noColumns.json] Query missing column", checkQuery);
		it("[invalid/wrongOrder.json] Query ORDER not in COLUMNS", checkQuery);
		it("[invalid/noOption.json] Query missing OPTION", checkQuery);
		it("[invalid/invalidColumns.json] Query invalid COLUMNS key", checkQuery);
		it("[invalid/invalidWHERE.json] Query invalid WHERE key", checkQuery);
		it("[invalid/invalidOpWHERE.json] Query invalid WHERE Op", checkQuery);
		it("[invalid/invalidWHEREkey.json] Query invalid WHERE key as string", checkQuery);
		it("[invalid/invalidGT.json] invalid GT", checkQuery);
		it("[invalid/resultTooMuch.json] SELECT dept, avg WHERE avg > 10", checkQuery);
		it("[invalid/resultTooLarge.json] throw error", checkQuery);
		it("[invalid/datasetNotAdded.json] SELECT dept, avg WHERE avg > 98", checkQuery);
		it("[invalid/referManyDataset.json] SELECT dept, avg WHERE avg > 96", checkQuery);
		// C2 test
		it("[valid/simpleSORT.json] sort with dir", checkQuery);
		it("[invalid/wrongDir.json] wrong dir", checkQuery);
		it("[valid/complexSORT.json] sort with multiple keys", checkQuery);
		it("[invalid/wrongKeys.json] sort with wrong keys", checkQuery);
		it("[valid/roomTrans.json] transform", checkQuery);
		it("[valid/roomTrans1.json] transform1", checkQuery);
		it("[valid/roomTrans2.json] transform2", checkQuery);
		it("[valid/roomTrans3.json] transform3", checkQuery);
		it("[valid/roomTrans4.json] transform4", checkQuery);
		it("[valid/roomTrans5.json] transform5", checkQuery);
		it("[valid/roomTrans6.json] transform6", checkQuery);
		it("[valid/1900.json] 1900", checkQuery);
		it("[invalid/roomTrans1.json] invalid transform1", checkQuery);
		it("[invalid/roomTrans2.json] invalid transform2", checkQuery);
		it("[invalid/roomTrans3.json] invalid transform3", checkQuery);
		it("[invalid/roomTrans4.json] invalid transform4", checkQuery);
		it("[invalid/roomTrans5.json] invalid transform5", checkQuery);

		it("[invalid/roomTrans6.json] invalid transform6", checkQuery);
		it("[invalid/roomTrans7.json] invalid transform7", checkQuery);
		it("[invalid/roomTrans8.json] invalid transform8", checkQuery);
		it("[invalid/roomTrans9.json] invalid transform9", checkQuery);
		it("[invalid/roomTrans10.json] invalid transform10", checkQuery);
		it("[invalid/roomTrans11.json] invalid transform11", checkQuery);
		it("[invalid/roomTrans12.json] invalid transform12", checkQuery);
		it("[invalid/roomTrans13.json] invalid transform13", checkQuery);
		it("[invalid/roomTrans14.json] invalid transform14", checkQuery);
		it("[invalid/roomTrans15.json] invalid transform15", checkQuery);

		it("[valid/roomTrans7.json] transform7", checkQuery);
	});

	describe("Section Getter Methods", function () {
		it("should return correct uuid", function () {
			expect(section.getUuid()).to.equal("uuid");
		});

		it("should return correct id", function () {
			expect(section.getId()).to.equal("ubc");
		});

		it("should return correct title", function () {
			expect(section.getTitle()).to.equal("testSection");
		});

		it("should return correct instructor", function () {
			expect(section.getInstructor()).to.equal("prof");
		});

		it("should return correct dept", function () {
			expect(section.getDept()).to.equal("cpsc");
		});

		it("should return correct year", function () {
			expect(section.getYear()).to.equal(2020);
		});

		it("should return correct avg", function () {
			expect(section.getAvg()).to.equal(90);
		});

		it("should return correct pass", function () {
			expect(section.getPass()).to.equal(50);
		});

		it("should return correct fail", function () {
			expect(section.getFail()).to.equal(2);
		});

		it("should return correct audit", function () {
			expect(section.getAudit()).to.equal(40);
		});
	});

	describe("Room Getter Methods", function () {
		it("should return correct fullname", function () {
			expect(room.getFullname()).to.equal("Fullname");
		});

		it("should return correct shortname", function () {
			expect(room.getShortname()).to.equal("Shortname");
		});

		it("should return correct number", function () {
			expect(room.getNumber()).to.equal("1012");
		});

		it("should return correct name", function () {
			expect(room.getName()).to.equal("name");
		});

		it("should return correct address", function () {
			expect(room.getAddress()).to.equal("address");
		});

		it("should return correct latitude", function () {
			expect(room.getLat()).to.equal(49.2606);
		});

		it("should return correct longitude", function () {
			expect(room.getLon()).to.equal(-123.249);
		});

		it("should return correct seats", function () {
			expect(room.getSeats()).to.equal(120);
		});

		it("should return correct type", function () {
			expect(room.getType()).to.equal("type");
		});

		it("should return correct furniture", function () {
			expect(room.getFurniture()).to.equal("furniture");
		});

		it("should return correct href", function () {
			expect(room.getHref()).to.equal("href");
		});
	});
});
