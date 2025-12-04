//Claude helped me with the structure of this server file.
//Copilot helped me with the start() implementation.
import InsightFacade from "../controller/InsightFacade";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import { Log } from "@ubccpsc310/project-support";
import { InsightDatasetKind, InsightError, NotFoundError } from "../controller/IInsightFacade";

const OK = 200;
const created = 201;
const badRequest = 400;
const internalServerError = 500;
const notFound = 404;

export default class Server {
	private facade: InsightFacade;
	private port: number;
	private readonly express: Application;
	private server: any;

	constructor(port: number) {
		Log.info(`Server::init(${port}) - Initiate the server`);
		this.facade = new InsightFacade();
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();
	}

	public getExpress(): Application {
		return this.express;
	}

	public async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server = this.express
				.listen(this.port, () => {
					Log.info(`Server::start() - Server starts on port: ${this.port}`);
					resolve();
				})
				.on("error", (err) => {
					Log.error(`Server::start() - Server fails to start.`);
					reject(err);
				});
		});
	}

	public async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.server) {
				this.server.close(() => {
					Log.info("Server::stop() - Stop the server");
					resolve();
				});
			} else {
				reject(new Error("Server not started"));
			}
		});
	}

	private registerMiddleware(): void {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({ type: "application/*", limit: "10mb" }));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	private registerRoutes(): void {
		Log.info(`Server::registerRoutes()`);
		this.express.get("/echo/:msg", Server.echo); // for server testing, claude helps me to write this.
		this.express.put("/dataset/:id", this.addDatasetHandler.bind(this)); //dataset(id, kind)
		this.express.delete("/dataset/:id", this.removeDatasetHandler.bind(this));
		this.express.get("/datasets", this.listDatasetHandler.bind(this));
		this.express.post("/query", this.performQueryHandler.bind(this));
	}

	private static echo(req: Request, res: Response): void {
		try {
			Log.trace(`Server::echo(..) - Testing the server`);
			const response = { input: req.params.msg };
			res.status(OK).json(response);
		} catch (err) {
			res.status(badRequest).json({ error: err });
		}
	}

	private async addDatasetHandler(req: Request, res: Response): Promise<void> {
		try {
			const id = req.params.id;
			const content = Buffer.from(req.body).toString("base64");
			Log.trace(`Server::addDatasetHandler( ${id} ) - try to add dataset.`);
			const allAddedIDs = await this.facade.addDataset(id, content, InsightDatasetKind.Sections);
			res.status(created).json({ result: allAddedIDs });
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(badRequest).json({ error: err.message });
			} else {
				res.status(internalServerError).json({ error: "Unknown server error occurred." });
			}
		}
	}

	private async removeDatasetHandler(req: Request, res: Response): Promise<void> {
		try {
			const id = req.params.id;
			Log.trace(`Server::removeDatasetHandler( ${id} ) - try to remove dataset.`);
			const removeId = await this.facade.removeDataset(id);
			res.status(OK).json({ result: removeId });
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(notFound).json({ error: err.message });
			} else if (err instanceof InsightError) {
				res.status(badRequest).json({ err: err.message });
			} else {
				res.status(internalServerError).json({ error: "Unknown server error occurred." });
			}
		}
	}

	private async listDatasetHandler(req: Request, res: Response): Promise<void> {
		try {
			Log.trace(`Server::listDatasetHandler() - try to list datasets.`);
			const listed = await this.facade.listDatasets();
			res.status(OK).json({ result: listed });
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(badRequest).json({ error: err.message });
			} else {
				res.status(internalServerError).json({ error: "Unknown server error occurred." });
			}
		}
	}

	private async performQueryHandler(req: Request, res: Response): Promise<void> {
		try {
			Log.trace(`Server::performQueryHandler() - try to perform query on the dataset.`);
			const inputQuery = req.body;
			const resultTable = await this.facade.performQuery(inputQuery);
			res.status(OK).json({ result: resultTable });
		} catch (err) {
			if (err instanceof InsightError) {
				res.status(badRequest).json({ error: err.message });
			} else {
				res.status(internalServerError).json({ error: "Unknown server error occurred." });
			}
		}
	}
}
