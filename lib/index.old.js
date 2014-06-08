var hound = require('hound');
var commandliner = require('commandliner');
var exec = require('child_process').exec;
var Promise = require('node-promise').Promise;
var _ = require('underscore');
var watcher;

var die = function (containerID) {
  if (watcher !== undefined) {
    watcher.clear();
  }
  process.exit(-1);
};

var execW = function (command, callback) {
  exec(command, function (error, stdout, stderr) {
    if (error != null) {
      console.log(error);
      die();
    } else {
      callback(stdout);
    }
  })
};

var buildContainer = function () {
  var command = 'docker build -t hi5 "/Users/magnus stubman/dev/hi5"';

  var promise = new Promise();

  execW(command, function (stdout) {
    promise.resolve(stdout);
  });

  return promise
};

var startContainer = function () {
  var command = 'docker run -d -p 49000:7000 hi5';

  //var promise = new Promise(function (resolve, reject) {
    //execW(command, function (stdout) {
      //var containerID = stdout.replace(/\n$/, '');
      //resolve(containerID);
    //});
  //});

  var promise = new Promise();

  execW(command, function (stdout) {
    var containerID = stdout.replace(/\n$/, '');
    promise.resolve(containerID);
  });

  return promise;
};

var stopContainer = function (containerID) {
  var command = 'docker stop ' + containerID;
  var promise = new Promise();

  execW(command, function (stdout) {
    promise.resolve(stdout);
  });

  return promise;
}

module.exports = {
  app: function (command) {
    var containerID;
    buildContainer().then(function () {
      startContainer().then(function (id) {
        console.log("container started: " + id);
        containerID = id;
      });
    });


    var doIt = function () {
      console.log("Doing it!");
      stopContainer(containerID)
        .then(function () {
          return buildContainer();
        })
        .then(function () {
          return startContainer();
        })
        .then(function (newID) {
          containerID = newID;
          console.log("new id is: " + newID);
        });
    };

    var debounced = _.debounce(doIt, 300);

    var watcher = hound.watch('.');

    watcher.on('create', debounced);
    watcher.on('change', debounced);
    watcher.on('delete', debounced);

    process.on('SIGINT', function() {
      die(containerID);
    });

}



