// modules/core/main.ts
import {
  Emitter,
  Refiner,
  Test as BaseTest,
  Suite as BaseSuite,
  Group as BaseGroup,
  Runner as BaseRunner,
  TestContext as BaseTestContext
} from "@japa/core";
import { inspect } from "util";
import { AssertionError } from "assert";

// modules/core/reporters/base.ts
import ms from "ms";
import { ErrorsPrinter } from "@japa/errors-printer";

// src/helpers.ts
import string from "@poppinss/string";
import useColors from "@poppinss/colors";
import { fileURLToPath } from "url";
import supportsColor from "supports-color";
import { parse } from "error-stack-parser-es";
var colors = supportsColor.stdout ? useColors.ansi() : useColors.silent();
var icons = process.platform === "win32" && !process.env.WT_SESSION ? {
  tick: "\u221A",
  cross: "\xD7",
  bullet: "*",
  nodejs: "\u2666",
  pointer: ">",
  info: "i",
  warning: "\u203C",
  branch: " -",
  squareSmallFilled: "[\u2588]"
} : {
  tick: "\u2714",
  cross: "\u2716",
  bullet: "\u25CF",
  nodejs: "\u2B22",
  pointer: "\u276F",
  info: "\u2139",
  warning: "\u26A0",
  branch: "\u2514\u2500\u2500",
  squareSmallFilled: "\u25FC"
};
function formatPinnedTest(test) {
  let fileName = "";
  let line = 0;
  let column = 0;
  try {
    test.options.meta.abort("Finding pinned test location");
  } catch (error) {
    const frame = parse(error).find(
      (f) => f.fileName && f.lineNumber !== void 0 && f.columnNumber !== void 0 && !f.fileName.includes("node:") && !f.fileName.includes("ext:") && !f.fileName.includes("node_modules/")
    );
    if (frame) {
      fileName = frame.fileName.startsWith("file:") ? string.toUnixSlash(fileURLToPath(frame.fileName)) : string.toUnixSlash(frame.fileName);
      line = frame.lineNumber;
      column = frame.columnNumber;
    }
  }
  return `${colors.yellow(` \u2043 ${test.title}`)}
${colors.dim(`   ${fileName}:${line}:${column}`)}`;
}
function printPinnedTests(runner) {
  let pinnedTests = [];
  runner.suites.forEach((suite) => {
    suite.stack.forEach((testOrGroup) => {
      if (testOrGroup instanceof Group) {
        testOrGroup.tests.forEach(($test) => {
          if ($test.isPinned) {
            pinnedTests.push(formatPinnedTest($test));
          }
        });
      } else if (testOrGroup.isPinned) {
        pinnedTests.push(formatPinnedTest(testOrGroup));
      }
    });
  });
  if (pinnedTests.length) {
    console.log(colors.bgYellow().black(` ${pinnedTests.length} pinned test(s) found `));
    pinnedTests.forEach((row) => console.log(row));
  } else {
    console.log(colors.bgYellow().black(` No pinned tests found `));
  }
}

// modules/core/reporters/base.ts
var BaseReporter = class {
  runner;
  /**
   * Path to the file for which the tests are getting executed
   */
  currentFileName;
  /**
   * Suite for which the tests are getting executed
   */
  currentSuiteName;
  /**
   * Group for which the tests are getting executed
   */
  currentGroupName;
  options;
  constructor(options = {}) {
    this.options = Object.assign({ stackLinesCount: 2 }, options);
  }
  /**
   * Pretty prints the aggregates
   */
  printAggregates(summary) {
    const tests = [];
    if (summary.aggregates.passed) {
      tests.push(colors.green(`${summary.aggregates.passed} passed`));
    }
    if (summary.aggregates.failed) {
      tests.push(colors.red(`${summary.aggregates.failed} failed`));
    }
    if (summary.aggregates.todo) {
      tests.push(colors.cyan(`${summary.aggregates.todo} todo`));
    }
    if (summary.aggregates.skipped) {
      tests.push(colors.yellow(`${summary.aggregates.skipped} skipped`));
    }
    if (summary.aggregates.regression) {
      tests.push(colors.magenta(`${summary.aggregates.regression} regression`));
    }
    this.runner.summaryBuilder.use(() => {
      return [
        {
          key: colors.dim("Tests"),
          value: `${tests.join(", ")} ${colors.dim(`(${summary.aggregates.total})`)}`
        },
        {
          key: colors.dim("Time"),
          value: colors.dim(ms(summary.duration))
        }
      ];
    });
    console.log(this.runner.summaryBuilder.build().join("\n"));
  }
  /**
   * Aggregates errors tree to a flat array
   */
  aggregateErrors(summary) {
    const errorsList = [];
    summary.failureTree.forEach((suite) => {
      suite.errors.forEach((error) => errorsList.push({ title: suite.name, ...error }));
      suite.children.forEach((testOrGroup) => {
        if (testOrGroup.type === "test") {
          testOrGroup.errors.forEach((error) => {
            errorsList.push({ title: `${suite.name} / ${testOrGroup.title}`, ...error });
          });
          return;
        }
        testOrGroup.errors.forEach((error) => {
          errorsList.push({ title: testOrGroup.name, ...error });
        });
        testOrGroup.children.forEach((test) => {
          test.errors.forEach((error) => {
            errorsList.push({ title: `${testOrGroup.name} / ${test.title}`, ...error });
          });
        });
      });
    });
    return errorsList;
  }
  /**
   * Pretty print errors
   */
  async printErrors(summary) {
    if (!summary.failureTree.length) {
      return;
    }
    const errorPrinter = new ErrorsPrinter({
      framesMaxLimit: this.options.framesMaxLimit
    });
    errorPrinter.printSectionHeader("ERRORS");
    await errorPrinter.printErrors(this.aggregateErrors(summary));
  }
  /**
   * Handlers to capture events
   */
  onTestStart(_) {
  }
  onTestEnd(_) {
  }
  onGroupStart(_) {
  }
  onGroupEnd(_) {
  }
  onSuiteStart(_) {
  }
  onSuiteEnd(_) {
  }
  async start(_) {
  }
  async end(_) {
  }
  /**
   * Print tests summary
   */
  async printSummary(summary) {
    await this.printErrors(summary);
    console.log("");
    if (summary.aggregates.total === 0 && !summary.hasError) {
      console.log(colors.bgYellow().black(" NO TESTS EXECUTED "));
      return;
    }
    if (summary.hasError) {
      console.log(colors.bgRed().black(" FAILED "));
    } else {
      console.log(colors.bgGreen().black(" PASSED "));
    }
    console.log("");
    this.printAggregates(summary);
  }
  /**
   * Invoked by the tests runner when tests are about to start
   */
  boot(runner, emitter) {
    this.runner = runner;
    emitter.on("test:start", (payload) => {
      this.currentFileName = payload.meta.fileName;
      this.onTestStart(payload);
    });
    emitter.on("test:end", (payload) => {
      this.onTestEnd(payload);
    });
    emitter.on("group:start", (payload) => {
      this.currentGroupName = payload.title;
      this.currentFileName = payload.meta.fileName;
      this.onGroupStart(payload);
    });
    emitter.on("group:end", (payload) => {
      this.currentGroupName = void 0;
      this.onGroupEnd(payload);
    });
    emitter.on("suite:start", (payload) => {
      this.currentSuiteName = payload.name;
      this.onSuiteStart(payload);
    });
    emitter.on("suite:end", (payload) => {
      this.currentSuiteName = void 0;
      this.onSuiteEnd(payload);
    });
    emitter.on("runner:start", async (payload) => {
      await this.start(payload);
    });
    emitter.on("runner:end", async (payload) => {
      await this.end(payload);
    });
  }
};

// modules/core/main.ts
var TestContext = class extends BaseTestContext {
  constructor(test) {
    super();
    this.test = test;
    this.cleanup = (cleanupCallback) => {
      test.cleanup(cleanupCallback);
    };
  }
};
var Test2 = class extends BaseTest {
  /**
   * @inheritdoc
   */
  static executedCallbacks = [];
  /**
   * @inheritdoc
   */
  static executingCallbacks = [];
  /**
   * Assert the test throws an exception with a certain error message
   * and optionally is an instance of a given Error class.
   */
  throws(message, errorConstructor) {
    const errorInPoint = new AssertionError({});
    const existingExecutor = this.options.executor;
    if (!existingExecutor) {
      throw new Error('Cannot use "test.throws" method without a test callback');
    }
    this.options.executor = async (...args) => {
      let raisedException;
      try {
        await existingExecutor(...args);
      } catch (error) {
        raisedException = error;
      }
      if (!raisedException) {
        errorInPoint.message = "Expected test to throw an exception";
        throw errorInPoint;
      }
      if (errorConstructor && !(raisedException instanceof errorConstructor)) {
        errorInPoint.message = `Expected test to throw "${inspect(errorConstructor)}"`;
        throw errorInPoint;
      }
      const exceptionMessage = raisedException.message;
      if (!exceptionMessage || typeof exceptionMessage !== "string") {
        errorInPoint.message = "Expected test to throw an exception with message property";
        throw errorInPoint;
      }
      if (typeof message === "string") {
        if (exceptionMessage !== message) {
          errorInPoint.message = `Expected test to throw "${message}". Instead received "${raisedException.message}"`;
          errorInPoint.actual = raisedException.message;
          errorInPoint.expected = message;
          throw errorInPoint;
        }
        return;
      }
      if (!message.test(exceptionMessage)) {
        errorInPoint.message = `Expected test error to match "${message}" regular expression`;
        throw errorInPoint;
      }
    };
    return this;
  }
};
var Group = class extends BaseGroup {
};
var Suite = class extends BaseSuite {
};
var Runner2 = class extends BaseRunner {
};

export {
  BaseReporter,
  Emitter,
  Refiner,
  TestContext,
  Test2 as Test,
  Group,
  Suite,
  Runner2 as Runner,
  colors,
  icons,
  printPinnedTests
};
