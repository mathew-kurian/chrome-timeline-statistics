/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 * Copyright (C) 2012 Intel Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/timeline/TimelineUIUtils.js

const DevtoolsTimelineModel = require('devtools-timeline-model');
const cleanTrace = require('./cleanTraceEvents');

// events can be either a string of the trace data or the JSON.parse'd equivalent
const categoryCache = new Map();

const categories = {
  scripting: [
    "EventDispatch",
    "TimerInstall",
    "TimerRemove",
    "TimerFire",
    "XHRReadyStateChange",
    "XHRLoad",
    "v8.compile",
    "EvaluateScript",
    "v8.parseOnBackground",
    "MarkLoad",
    "MarkDOMContent",
    "TimeStamp",
    "ConsoleTime",
    "UserTiming",
    "RunMicrotasks",
    "FunctionCall",
    "GCEvent",
    "MajorGC",
    "MinorGC",
    "JSFrame",
    "RequestAnimationFrame",
    "CancelAnimationFrame",
    "FireAnimationFrame",
    "RequestIdleCallback",
    "CancelIdleCallback",
    "FireIdleCallback",
    "WebSocketCreate",
    "WebSocketSendHandshakeRequest",
    "WebSocketReceiveHandshakeResponse",
    "WebSocketDestroy",
    "EmbedderCallback",
    "LatencyInfo",
    "ThreadState::performIdleLazySweep",
    "ThreadState::completeSweep",
    "BlinkGCMarking"
  ],
  other: [
    "Task",
    "Program"
  ],
  rendering: [
    "Animation",
    "RequestMainThreadFrame",
    "BeginFrame",
    "BeginMainThreadFrame",
    "DrawFrame",
    "HitTest",
    "ScheduleStyleRecalculation",
    "RecalculateStyles",
    "UpdateLayoutTree",
    "InvalidateLayout",
    "Layout",
    "UpdateLayerTree",
    "ScrollLayer",
    "firstMeaningfulPaint",
    "firstMeaningfulPaintCandidate"
  ],
  painting: [
    "PaintSetup",
    "PaintImage",
    "UpdateLayer",
    "Paint",
    "RasterTask",
    "CompositeLayers",
    "MarkFirstPaint",
    "Decode Image",
    "Resize Image",
  ],
  gpu: [
    "GPUTask"
  ],
  async: [
    "async"
  ],
  loading: [
    "ParseHTML",
    "ParseAuthorStyleSheet",
    "ResourceSendRequest",
    "ResourceReceiveResponse",
    "ResourceFinish",
    "ResourceReceivedData"
  ]
};

function getCategory(name) {
  if (categoryCache.has(name)) {
    return categoryCache.get(name);
  }

  for (const type in categories) {
    if (categories[type].includes(name)) {
      categoryCache.set(name, type);

      return type;
    }
  }

  categoryCache.set(name, 'other');

  return 'other';
}

let TimelineModel;
const taskProcessed = Symbol('taskProcessed');

function _filterForStats() {
  return event => isTopLevelEvent(event);
}

function isTopLevelEvent(event) {
  return event._event._parsedCategories.has('toplevel') ||
    event._event._parsedCategories.has('disabled-by-default-devtools.timeline') &&
    event.name === 'Program'; // Older timelines may have this instead of toplevel.
}

function _buildRangeStatsCacheIfNeeded(model) {
  const tasks = model.mainThreadTasks();
  const filter = _filterForStats();
  const firstTask = tasks.find(filter);

  if (!firstTask || firstTask[taskProcessed]) {
    return;
  }

  const aggregatedStats = {};
  const ownTimes = [];

  TimelineModel.forEachEvent(model.mainThreadEvents(), onStartEvent, onEndEvent, undefined, undefined, undefined, filter);

  function onStartEvent(e) {
    if (ownTimes.length) {
      ownTimes[ownTimes.length - 1] -= e.duration;
    }

    ownTimes.push(e.duration);
  }

  function onEndEvent(e) {
    const category = getCategory(e.name);

    aggregatedStats[category] = (aggregatedStats[category] || 0) + ownTimes.pop();
  }

  return aggregatedStats;
}


exports.default = exports.getStatistics = function getStatistics(events) {
  events = cleanTrace(events);

  const model = new DevtoolsTimelineModel(events).timelineModel();

  if (TimelineModel == null) {
    TimelineModel = model.constructor;
  }
 
  const startTime = model.minimumRecordTime();
  const endTime = model.maximumRecordTime();
  const aggregatedStats = _buildRangeStatsCacheIfNeeded(model);
  const tasks = model.mainThreadTasks();
  
  if (!tasks.length) {
    return {};
  }

  const aggregatedTotal = Object.values(aggregatedStats).reduce((a, b) => a + b, 0);

  aggregatedStats.idle = Math.max(0, endTime - startTime - aggregatedTotal);
  aggregatedStats.busy = aggregatedTotal;

  return aggregatedStats;
};

exports.traceCategories = [
  "-*",
  "devtools.timeline",
  "v8.execute",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "toplevel",
  "blink.console",
  "latencyInfo",
  "disabled-by-default-devtools.timeline.stack",
  // "disabled-by-default-devtools.screenshot",
  // "disabled-by-default-v8.cpu_profile",
  // "disabled-by-default-v8.cpu_profiler",
  // "disabled-by-default-v8.cpu_profiler.hires"
];

exports.categories = [...Object.keys(categories), 'idle', 'busy'];
