import Server from "../src/rest/Server";
// Claude helps me with importing from supertest.
import request from "supertest";
import { InsightDataset, InsightDatasetKind, InsightResult } from "../src/controller/IInsightFacade";
import { expect } from "chai";
import * as fs from "fs-extra";

describe("Server Integration Tests", function () {
	let server: Server;
	let app: any;
	let ubcContentBuffer: Buffer;
	let testContentBuffer: Buffer;

	before(async function () {
		server = new Server(4321);
		await server.start();
		app = request(server.getExpress());
		ubcContentBuffer = await fs.readFile("test/resources/archives/pair.zip");
		testContentBuffer = await fs.readFile("test/resources/archives/test_1.zip");
	});

	beforeEach(async function () {
		const listRes = await app.get("/datasets");
		const deleteDatasetPromises = [];
		if (listRes.status === 200 && listRes.body.result && Array.isArray(listRes.body.result)) {
			for (const ele of listRes.body.result) {
				deleteDatasetPromises.push(app.delete(`/dataset/${ele.id}`));
			}
		}
		await Promise.all(deleteDatasetPromises);
	});

	after(async function () {
		await server.stop();
	});

	it("should successfully add a sections dataset", async function () {
		const response = await app
			.put("/dataset/ubc")
			.send(ubcContentBuffer)
			.set("Content-Type", "application/x-zip-compressed");
		expect(response.status).to.equal(201);
		expect(response.body).to.have.property("result");
		expect(response.body.result).to.have.members(["ubc"]);
	});

	it("should successfully remove a dataset", async function () {
		await app.put("/dataset/ut").send(ubcContentBuffer).set("Content-Type", "application/x-zip-compressed");

		const response = await app.delete("/dataset/ut");
		expect(response.status).to.equal(200);
		expect(response.body).to.have.property("result");
		expect(response.body.result).to.deep.equal("ut");

		const listedRes = await app.get("/datasets");
		expect(listedRes.body.result).to.deep.equal([]);
	});

	it("should successfully list datasets", async function () {
		await app.put("/dataset/ubc").send(ubcContentBuffer).set("Content-Type", "application/x-zip-compressed");
		const response = await app.get("/datasets");
		expect(response.status).to.equal(200);
		expect(response.body).to.have.property("result");
		const expected: InsightDataset[] = [{ id: "ubc", kind: InsightDatasetKind.Sections, numRows: 64612 }];
		expect(response.body.result).to.deep.equal(expected);
	});

	it("should successfully list all the datasets", async function () {
		await app.put("/dataset/ubc").send(ubcContentBuffer).set("Content-Type", "application/x-zip-compressed");
		await app.put("/dataset/test").send(testContentBuffer).set("Content-Type", "application/x-zip-compressed");
		const response = await app.get("/datasets");
		expect(response.status).to.equal(200);
		expect(response.body).to.have.property("result");
		const expected: InsightDataset[] = [
			{ id: "ubc", kind: InsightDatasetKind.Sections, numRows: 64612 },
			{ id: "test", kind: InsightDatasetKind.Sections, numRows: 2 },
		];
		expect(response.body.result).to.deep.equal(expected);
	});

	it("should successfully perform a query on the dataset by bar chart", async function () {
		await app.put("/dataset/sections").send(ubcContentBuffer).set("Content-Type", "application/x-zip-compressed");
		const data = await fs.readFile("test/resources/queries/integration/bar.json", "utf-8");
		const query = JSON.parse(data);
		const response = await app.post("/query").send(query).set("Content-Type", "application/json");
		expect(response.status).to.equal(200);
		expect(response.body).to.have.property("result");
		const expected: InsightResult[] = [
			{ sections_dept: "biol", count: 4 },
			{ sections_dept: "chem", count: 16 },
			{ sections_dept: "cpsc", count: 2 },
			{ sections_dept: "econ", count: 5 },
			{ sections_dept: "math", count: 8 },
			{ sections_dept: "phys", count: 4 },
			{ sections_dept: "psyc", count: 3 },
		];
		expect(response.body.result).to.have.deep.members(expected);
	});

	it("should successfully perform a query on the dataset by pie chart", async function () {
		await app.put("/dataset/sections").send(ubcContentBuffer).set("Content-Type", "application/x-zip-compressed");
		const data = await fs.readFile("test/resources/queries/integration/pie.json", "utf-8");
		const query = JSON.parse(data);
		const response = await app.post("/query").send(query).set("Content-Type", "application/json");
		expect(response.status).to.equal(200);
		expect(response.body).to.have.property("result");
		const expected: InsightResult[] = [{ countfail: 51, countpass: 234 }];
		expect(response.body.result).to.have.deep.members(expected);
	});

	it("should successfully perform a query on the dataset by line chart", async function () {
		await app.put("/dataset/sections").send(ubcContentBuffer).set("Content-Type", "application/x-zip-compressed");
		const data = await fs.readFile("test/resources/queries/integration/line.json", "utf-8");
		const query = JSON.parse(data);
		const response = await app.post("/query").send(query).set("Content-Type", "application/json");
		expect(response.status).to.equal(200);
		expect(response.body).to.have.property("result");
		const expected: InsightResult[] = [
			{ sections_year: 2011, yearAVG: 77.42 },
			{ sections_year: 2012, yearAVG: 76.35 },
			{ sections_year: 2013, yearAVG: 77.54 },
			{ sections_year: 2014, yearAVG: 77.48 },
			{ sections_year: 2015, yearAVG: 78.13 },
			{ sections_year: 2016, yearAVG: 78.37 },
		];
		expect(response.body.result).to.have.deep.members(expected);
	});
});
