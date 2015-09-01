var Utils = require("./utils.js");
var http = require("http");

var utils = new Utils();

process.stdin.resume();
process.on('exit', utils.cleanup.bind(utils));
process.on('SIGINT', utils.cleanup.bind(utils));
process.on('uncaughtException', utils.cleanup.bind(utils));

utils.createRootTmpDir();
utils.authenticate();

http.createServer(function(request, response) {
    if (request.method == 'POST') {
        utils.githubEventHandler(request, response)
    }
}).listen(4567);
