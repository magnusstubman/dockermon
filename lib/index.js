var config = require('../dockermon.json');
var Commandliner = require('commandliner');
var spawn = require('child_process').spawn;
var Promise = require('node-promise').Promise;

var setUpStreams = function (process, promise) {
  var loggingCallback = function (data) {
    console.log("\t" + data.toString().replace(/\n/g, "\n\t"));
  };

  process.stdout.on('data', loggingCallback);
  process.stderr.on('data', loggingCallback);

  process.on('exit', function (code) {
    console.log('has exited with code: ' + code);
    promise.resolve();
  });
};

var execute = function (command) {
  var promise = new Promise();
  var arr = command.split(' ');
  var first = arr.shift();
  var process = spawn(first, arr);

  setUpStreams(process, promise);
  return promise;
};

var app = function () {
  console.log(config)

  execute(config.stop)
  .then(function () {
    return execute(config.build);
  })

}


module.exports = {
  app: app
};
