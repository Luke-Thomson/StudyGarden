import "../../chunk-2KG3PWR4.js";

// src/plugins/disallow_pinned_tests.ts
import string from "@poppinss/string";
function disallowPinnedTests(options) {
  const disallow = options?.disallow ?? true;
  const errorMessage = options?.errorMessage ?? 'Pinning tests are disallowed by the "disallowPinnedTests" plugin. Use the "--list-pinned" flag to list pinned tests';
  const pluginFn = async function disallowPinnedTestsPluginFn({ runner, emitter }) {
    if (!disallow) {
      return;
    }
    function disallowPinned(test) {
      if (test.isPinned) {
        test.options.meta.abort(string.interpolate(errorMessage, { test: test.title }));
        process.exitCode = 1;
      }
    }
    emitter.on("runner:start", () => {
      runner.onSuite((suite) => {
        suite.onGroup((group) => {
          group.tap(disallowPinned);
        });
        suite.onTest(disallowPinned);
      });
    });
  };
  return pluginFn;
}
export {
  disallowPinnedTests
};
