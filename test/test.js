const trace = require('fs').readFileSync('./fixtures/trace.json', 'utf8');
const { getAggregatedStatistics } = require('../');

console.log(getAggregatedStatistics(JSON.parse(trace)));

