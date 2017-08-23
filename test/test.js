const assert = require("assert");
const trace = require("fs").readFileSync("./fixtures/trace.json", "utf8");
const { getStatistics } = require("../");

assert.deepEqual(getStatistics(JSON.parse(trace)), {
  other: 71.35399998165667,
  rendering: 72.80200000293553,
  painting: 263.37199999578297,
  scripting: 320.869000017643,
  loading: 55.05499999411404,
  idle: 5503.998000007123,
  busy: 783.4519999921322,
  gpu: 487.29599999450147,
  async: 242.6090000011027
});
