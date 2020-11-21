const chalk = require("chalk");
const program = require("commander");
const chalkRaw = new chalk.Instance({ raw: ["bold", {}], level: 0 });

type Color = (...text: string[]) => string;

let _bundleProgressBar: any;
let _oraSpinner: any;

let _printNewLineBeforeNextLog = false;

// const output = fs.createWriteStream('./stdout.log');
// const errorOutput = fs.createWriteStream('./stderr.log');
// // Custom simple logger
// const logger = new Console({ stdout: output, stderr: errorOutput });
// // use it like console
// const count = 5;
// logger.log('count: %d', count);
// // In stdout.log: count 5

function _maybePrintNewLine() {
	if (_printNewLineBeforeNextLog) {
		_printNewLineBeforeNextLog = false;
		console.log("");
	}
}

function consoleLog(...args: any[]) {
	_maybePrintNewLine();
	console.log(...args);
}

function consoleWarn(...args: any[]) {
	_maybePrintNewLine();
	console.log(...args);
}

function consoleError(...args: any[]) {
	_maybePrintNewLine();
	console.log(...args);
}

function respectProgressBars(commitLogs: () => void) {
	if (_bundleProgressBar) {
		_bundleProgressBar.terminate();
		_bundleProgressBar.lastDraw = "";
	}
	if (_oraSpinner) {
		_oraSpinner.stop();
	}
	commitLogs();

	if (_bundleProgressBar) {
		_bundleProgressBar.render();
	}
	if (_oraSpinner) {
		_oraSpinner.start();
	}
}

function getPrefix(chalkColor: Color) {
	return chalkColor(`[${new Date().toTimeString().slice(0, 8)}]`);
}

function withPrefixAndTextColor(args: any[], chalkColor: Color = actLogger.chalk.gray) {
	if (program.nonInteractive) {
		return [getPrefix(chalkColor), ...args.map((arg) => arg)];
	} else {
		return args.map((arg) => arg);
	}
}

function withPrefix(args: any[], chalkColor = actLogger.chalk.gray) {
	if (program.nonInteractive) {
		return [getPrefix(chalkColor), ...args];
	} else {
		return args;
	}
}

function adjustRaw() {
	actLogger.chalk = actLogger.config.raw ? chalkRaw : chalk;
}

function actLogger(...args: any[]) {
	adjustRaw();

	respectProgressBars(() => {
		consoleLog(...withPrefix(args));
	});
}

actLogger.nested = (message: any) => {
	respectProgressBars(() => {
		consoleLog(message);
	});
};

actLogger.newLine = function newLine() {
	respectProgressBars(() => {
		consoleLog("");
	});
};

actLogger.printNewLineBeforeNextLog = function printNewLineBeforeNextLog() {
	_printNewLineBeforeNextLog = true;
};

actLogger.error = function error(...args: any[]) {
	adjustRaw();

	respectProgressBars(() => {
		consoleError(...withPrefixAndTextColor(args, actLogger.chalk.red));
	});
};

actLogger.warn = function warn(...args: any[]) {
	adjustRaw();

	respectProgressBars(() => {
		consoleWarn(...withPrefixAndTextColor(args, actLogger.chalk.yellow));
	});
};

actLogger.gray = (...args: any[]) => {
	adjustRaw();

	respectProgressBars(() => {
		consoleLog(...withPrefixAndTextColor(args));
	});
};

actLogger.verbose = (text: string | string[], args?: any) => {
	if (!actLogger.config.verboseEnable) {
		return;
	}

	if (args) {
		actLogger.warn(text);
		Object.keys(args).forEach((key) => {
			actLogger.nested(`  ${key} ${actLogger.chalk.bold(args[key])}`);
		});
	} else {
		actLogger.gray(text);
	}
};

actLogger.chalk = chalk;

actLogger.config = {
	raw: false,
	verboseEnable: false,
	showSplash: false,
};

export interface IAppInfo {
	name: string;
	version: string;
	description: string;
}

const appText = (name: string, version: string, description: string): string[] => {
	return [
		`${actLogger.chalk.bold("AC TOOLS")} - Extensions for VS-Code and NodeJS`,
		"See https://github.com/brodao/workspace/projects/AFPV",
		`${name} [${version}] ${description}`,
	];
};

const banner = (name: string, version: string, description: string): string[] => {
	const b = actLogger.chalk.bold;
	return [
		"/====================v======================================================\\",
		`| ${b("    /////// //////")} | ${b("AC TOOLS")} - Extensions for VS-Code and NodeJS         |`,
		`| ${b("   //   // //     ")} | (C) 2020 Alan Candido (BRODAO) <brodao@gmail.com>    |`,
		`| ${b("  /////// //      ")} |                                                      |`,
		`| ${b(" //   // //       ")} | Support tools for TOTVS developers                   |`,
		`| ${b("//   // //////    ")} | https://github.com/brodao/workspace/projects/AFPV    |`,
		"\\====================^======================================================/",
		`${name} [${version}] ${description}`,
	];
};

actLogger.showBanner = (appInfo: IAppInfo) => {
	adjustRaw();

	const description = appInfo.description;

	if (!actLogger.config.showSplash) {
		appText(appInfo.name, appInfo.version, description).forEach((line: string) => actLogger.gray(line));
	} else {
		banner(appInfo.name, appInfo.version, description).forEach((line: string) => actLogger.gray(line));
	}
};

export default actLogger;
