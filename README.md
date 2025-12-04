# CPSC 310 Project Repository

This repository contains starter code for the class project.
Please keep your repository private.

For information about the project, autotest, and the checkpoints, see the course webpage.

## Configuring your environment

To start using this project, you need to get your development environment configured so that you can build and execute the code.
To do this, follow these steps; the specifics of each step will vary based on your operating system:

1. [Install git](https://git-scm.com/downloads) (v2.X). You should be able to execute `git --version` on the command line after installation is complete.

1. [Install Node (Current)](https://nodejs.org/en/download/) (Current: v24.X), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (1.22.X). You should be able to execute `yarn --version`.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub. Note that due to new department changes you can no longer access private git resources using https and a username and password. You will need to use either [an access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) or [SSH](https://help.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files. If it does not build locally, AutoTest will not be able to build it. This will also run formatting. *If you would like to enable linting, remove `.disabled` from the `eslint.config.mjs.disabled` file and run `yarn build:lint` instead!*

1. `yarn test` to run the test suite.
    - To run with coverage, run `yarn cover`

1. `yarn prettier:fix` to format your project code.

1. `yarn lint:check` to see lint errors in your project code. You may be able to fix some of them using the `yarn lint:fix` command.


If you are curious, some of these commands are actually shortcuts defined in [package.json -> scripts](./package.json).

## Running and testing from an IDE

IntelliJ Ultimate should be automatically configured the first time you open the project (IntelliJ Ultimate is a free download through the [JetBrains student program](https://www.jetbrains.com/community/education/#students/)).

## Starting the Application

This application consists of two parts: a backend server and a frontend React application. Both must be running simultaneously for the application to work properly.

### Prerequisites

Before starting the application, ensure you have:
1. Installed all dependencies:
   - **Backend dependencies**: Run `yarn install` in the root directory (`project_team038`)
   - **Frontend dependencies**: Run `npm install` in the `frontend/public/my-app` directory

### Step 1: Start the Backend Server

1. Open a terminal/command prompt
2. Navigate to the project root directory (`project_team038`) if you are not currently in it:
   ```bash
   cd /path/to/project_team038
   ```
3. Start the backend server:
   ```bash
   npm start
   ```

4. You should see output indicating the server has started:
   ```
   App - starting
   Server::init(4321) - Initiate the server
   Server::registerRoutes()
   Server::start() - Server starts on port: 4321
   App - server starts on port: 4321
   ```
   
   The backend server is now running on **port 4321**. Keep this terminal window open.

### Step 2: Start the Frontend Application

1. Open a **new** terminal window (keep the backend server running in the first terminal)
2. Navigate to the frontend directory:
   ```bash
   cd frontend/public/my-app
   ```
3. **If you haven't already**, install frontend dependencies (This only needs to be done once, or when dependencies change):
   ```bash
   npm install
   ```
   
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. You should see output indicating the Vite dev server has started:
   ```
     VITE v7.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ➜  press h + enter to show help
   ```

### Step 3: Access the Application

1. Open your web browser
2. Navigate to the URL shown in the terminal
3. You should see the "Section Insight" application interface
