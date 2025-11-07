import {
  debug_default
} from "./chunk-IBOLPYNG.js";

// index.ts
import { CookieClient } from "@adonisjs/core/http";

// src/extend_context.ts
import { TestContext } from "@japa/runner/core";
function extendContext(router, repl) {
  debug_default("extending japa context with adonisjs specific methods");
  function startRepl(context) {
    return new Promise((resolve) => {
      repl.start(context);
      repl.server.on("exit", () => {
        resolve();
      });
    });
  }
  TestContext.macro("route", function(routeIdentifier, params, options) {
    return router.makeUrl(routeIdentifier, params, options);
  });
  TestContext.getter("repl", function() {
    return {
      start: (context) => {
        this.test.resetTimeout();
        return startRepl(context);
      }
    };
  });
}

// src/verify_prompts.ts
function verifyPrompts(ace, runner) {
  runner.onSuite((suite) => {
    suite.onGroup((group) => {
      group.each.teardown(() => {
        ace.prompt.traps.verify();
      });
    });
    suite.onTest((test) => {
      test.teardown(() => {
        ace.prompt.traps.verify();
      });
    });
  });
}

// index.ts
async function canImport(pkg) {
  try {
    await import(pkg);
    return true;
  } catch {
    return false;
  }
}
function pluginAdonisJS(app, options) {
  const pluginFn = async function({ runner }) {
    if (app.container.hasAllBindings(["router", "repl"])) {
      extendContext(await app.container.make("router"), await app.container.make("repl"));
    }
    if (await canImport("@japa/api-client") && app.container.hasBinding("encryption")) {
      const { extendApiClient } = await import("./extend_api_client-PQILTYF5.js");
      extendApiClient(new CookieClient(await app.container.make("encryption")));
    }
    if (await canImport("@japa/browser-client") && await canImport("playwright") && app.container.hasBinding("encryption")) {
      const { extendBrowserClient } = await import("./extend_browser_client-O5HUWAJZ.js");
      extendBrowserClient(
        new CookieClient(await app.container.make("encryption")),
        options?.baseURL
      );
    }
    if (app.container.hasBinding("ace")) {
      const ace = await app.container.make("ace");
      verifyPrompts(ace, runner);
    }
  };
  return pluginFn;
}
export {
  pluginAdonisJS
};
