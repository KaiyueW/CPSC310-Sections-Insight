import { Log } from "@ubccpsc310/project-support";
import Server from "./rest/Server";

Log.info("App - starting");
(async (): Promise<void> => {
	try {
		const port = 4321;
		const server = new Server(port);
		await server.start();
		Log.info(`App - server starts on port: ${port}`);
	} catch (err) {
		Log.error(`App - Error: ${err}`);
		process.exit(1);
	}
})();
