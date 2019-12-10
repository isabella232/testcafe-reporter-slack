const buildReporterPlugin = require("testcafe").embeddingUtils
  .buildReporterPlugin;
const pluginFactory = require("../../lib");
const reporterTestCalls = require("./reporter-test-calls");
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

// This sets the mock adapter on the default instance
const mock = new MockAdapter(axios);

// Mock any GET request to /users
// arguments for reply are (status, data, headers)
mock.onPost().reply(200, {
  slack: "things sent" // don't really care about this, just need to mock status 200
});

module.exports = function createReport(withColors) {
  let outStream = {
    data: "",

    write: function(text) {
      this.data += text;
    }
  };

  let plugin = buildReporterPlugin(pluginFactory, outStream);

  plugin.chalk.enabled = !plugin.noColors && withColors;
  plugin.symbols = { ok: "✓", err: "✖" };

  // NOTE: disable errors coloring if we don't have custom
  // error decorator. Default error colors may be prone to changing.
  if (plugin.chalk.enabled && !pluginFactory().createErrorDecorator) {
    let origFormatError = plugin.formatError;

    plugin.formatError = function() {
      plugin.chalk.enabled = false;

      let result = origFormatError.apply(plugin, arguments);

      plugin.chalk.enabled = true;

      return result;
    };
  }

  reporterTestCalls.forEach(function(call) {
    plugin[call.method].apply(plugin, call.args);
  });

  // NOTE: mock stack entries
  return outStream.data.replace(/\s*?\(.+?:\d+:\d+\)/g, " (some-file:1:1)");
};
