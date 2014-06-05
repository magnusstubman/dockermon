var Docker = require('dockerode');
var url = require('url');


var durl = url.parse(process.env.DOCKER_HOST);

var docker = new Docker({host: 'http://localhost', port: 4243})
//var options = {
  //host: 'http://' + durl.hostname,
  //port: parseInt(durl.port)
//};

//console.log(options);
//var docker = new Docker(options)
console.log(docker);
var container = docker.getContainer('b750fe79269d');
console.log(container)
container.start(function (err, data) {
  console.log('err:');
  console.log(err);
  console.log();
  console.log('data:');
  console.log(data);
});

//docker.listContainers(function (err, containers) {
  //console.log(err);
  //console.log(containers);
  //containers.forEach(function (containerInfo) {
    //console.log(containerInfo);
    ////docker.getContainer(containerInfo.Id).stop(cb);
  //});
//});
