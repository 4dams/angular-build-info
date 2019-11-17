#! /usr/bin/env node

/**
 * Dependencies
 */
const moment = require("moment");
const signale = require("signale");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs").promises;

/**
 * Information sources
 */
const package = require(`${process.cwd()}/package.json`);
const args = process.argv.slice(2);
const opts = [
    "--help", // Shows manual
    "--init", // Perform initial setup
    "--no-hash", // Don't show commit hash in build info
    "--no-user", // Don't show git user in build info
    "--no-version", // Don't show package version in build info
    "--no-time" // Don't show timestamp in build info
];

/**
 * Get relevant build information
 */
async function getGitUser() {
    const { stdout, stderr } = await exec("git config user.name");
    if (stderr) {
        throw "Error getting git user";
    } else {
        signale.success("Found git user:", stdout.replace("\n", ""));
        return stdout.replace("\n", "");
    }
}

async function getCommitHash() {
    const { stdout, stderr } = await exec("git rev-parse --short HEAD");
    if (stderr) {
        throw "Error getting latest commit hash";
    } else {
        signale.success("Found commit hash:", stdout);
        return stdout;
    }
}

async function buildInfo() {
    signale.start("Collecting build information...");

    // Check provided args if they exist
    args.map(arg => {
        if (!opts.includes(arg)) {
            throw `Error: Unknown arg "${arg}", please re-check arguments before running the tool again!`;
        }
    });

    // Object we store build info in
    let build = {};

    if (!args.includes("--no-hash")) {
        build.hash = await getCommitHash();
    }

    if (!args.includes("--no-user")) {
        build.user = await getGitUser();
    }

    if (!args.includes("--no-version")) {
        build.version = package.version;
    }

    if (!args.includes("--no-time")) {
        build.timestamp = moment().format("MMMM DD, YYYY HH:mm:ss");
    }

    signale.info(build);

    // Write info to file so we can access it within angular
    const exportPath = process.cwd() + "/build.ts";
    await fs.writeFile(
        exportPath,
        `// Angular build information, automatically generated by \`4dams/angular-build-info\`\nexport const buildInfo = ${JSON.stringify(
            build,
            null,
            4
        )}`
    );

    signale.success(`Saved build information to \`${exportPath}\``);
}

async function init() {
    const exportPath = process.cwd() + "/build.ts";

    signale.info("Welcome to `angular-build-info`!");
    signale.info(
        `We will now create a boilerplate \`build.ts\` file in \`${exportPath}\` and fill it with basic information so you can start implementing it in your front-end.`
    );
    signale.info(
        `If you wish for more info on how to implement the provided info in your Angular app, feel free to check out the main repo over at https://github.com/4dams/angular-build-info`
    );

    signale.start("Creating `build.ts` file...");

    const template = {
        user: "Octocat",
        hash: "1e872b5",
        version: "1.0.0",
        timestamp: moment().format("MMMM DD, YYYY HH:mm:ss")
    };

    await fs.writeFile(
        exportPath,
        `// Angular build information, automatically generated by \`4dams/angular-build-info\`\nexport const buildInfo = ${JSON.stringify(
            template,
            null,
            4
        )}`
    );

    signale.success("Successfully created `build.ts` file!");
    signale.info(
        "You should now modify your build/deploy scripts in your `package.json` file to run this script every time before your Angular app is built. An example would be:"
    );
    signale.info(`[...] "build": "build-info && ng build --prod", [...]`);
    signale.info(
        "Again, you can find more info on implementing this tool on the main repo."
    );
}

async function displayManual() {
    signale.info("Welcome to `angular-build-info`!");
    signale.info("");
    signale.info("--help          Displays this message");
    signale.info(
        "--init          Creates template `build.ts` file so you can start implementing it"
    );
    signale.info(
        "--no-hash       Will not add latest commit hash to final `build.ts`"
    );
    signale.info(
        "--no-user       Will not add git username to final `build.ts`"
    );
    signale.info(
        "--no-version    Will not add version from `package.json` to `build.ts`"
    );
    signale.info("--no-time       Will not add timestamp to final `build.ts`");
}

/**
 * Main function we run upon starting the script
 */
function start() {
    if (args.includes("--init")) {
        init();
        return;
    }

    if (args.includes("--help")) {
        displayManual();
        return;
    }

    buildInfo();
}

start();
