# Chrome Timeline Statistics
Compute the statistics from a Chrome timeline

![](/screenshot.png)

## Install
```bash
npm install https://github.com/bluejamesbond/chrome-timeline-statistics
```

## Example
```js
const trace = require('fs').readFileSync('./fixtures/trace.json', 'utf8');
const { getStatistics } = require('chrome-timeline-statistics');

console.log(getStatistics(JSON.parse(trace)));
```

```json
{ "other": 71.35399998165667,
  "rendering": 72.80200000293553,
  "painting": 263.37199999578297,
  "scripting": 320.869000017643,
  "loading": 55.05499999411404,
  "idle": 5503.998000007123,
  "busy": 783.4519999921322 }
```

### Note
Aggregates are not exact at the moment although they are very close to those found in Chrome DevTools.

---

_Code from Chrome Devtools FrontEnd and Lighthouse_