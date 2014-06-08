var conf = require('rc')('dockermon');
var spawn = require('child_process').spawn;
var Promise = require('node-promise').Promise;
var containerID;
var watcher;
var hound = require('hound');
var _ = require('underscore');
var startProcess;

var setUpStreams = function (process) {
  var waitingForOutput = false;
  var output = '';
  var promise = new Promise();

  var lateResponder = _.debounce(function () {
    if (waitingForOutput) {
      promise.resolve(output);
    }
  }, 100);

  var loggingCallback = function (data) {
    //console.log("\t" + data.toString().replace(/\n/g, "\n\t"));
    output += data.toString();
    lateResponder();
  };

  process.stdout.on('data', loggingCallback);
  process.stderr.on('data', loggingCallback);

  process.on('exit', function (code) {
    if (output.length !== 0) {
      promise.resolve(output);
    } else {
      waitingForOutput = true;
    }
  });

  return promise;
};

var execute = function (command) {
  var promise = new Promise();
  var arr = command.split(' ');
  var first = arr.shift();
  var process = spawn(first, arr);

  setUpStreams(process)
  .then(function (stdout) {
    promise.resolve(stdout);
  });

  return {
    process: process,
    promise: promise
  };
};

var build = function () {
  return execute(conf.build).promise;
};

var start = function () {
  var ret = execute(conf.start);

  startProcess = ret.process;
  ret.promise.then(function (stdout) {
    containerID = stdout.replace(/\n/g, '');
  });
  return ret.process;
};

var stop = function () {
  var ret;

  if (containerID === undefined) {
    if (startProcess && (typeof startProcess.kill == 'function')) {
      startProcess.kill('SIGINT');
    }

    var promise = new Promise();
    promise.resolve();

    ret = promise;
  } else {
    ret = execute('docker stop ' + containerID).promise;
  }

  return ret;
};

var stopBuildStart = function () {
  var promise = stop()
  .then(function () {
    return build();
  });

  promise.then(function () {
    start();
  });

  return promise;
};

var app = function () {
  stopBuildStart()
  .then(function () {
    var cycle = _.debounce(stopBuildStart, 1000);
    watcher = hound.watch('lib/');
    watcher.on('create', cycle);
    watcher.on('change', cycle);
    watcher.on('delete', cycle);
  });
};

module.exports = {
  app: app
};

process.on('SIGINT', function () {
  stop();

  if (watcher !== undefined) {
    watcher.clear();
  }

  process.exit(0);
});

