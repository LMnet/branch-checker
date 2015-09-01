var Utils = require("./utils.js");
var http = require("http");

var utils = new Utils();

process.stdin.resume();
process.on('exit', utils.cleanup.bind(utils));
process.on('SIGINT', utils.cleanup.bind(utils));
process.on('uncaughtException', function(err) {
    console.error(err.stack);
    utils.cleanup();
});

utils.createRootTmpDir();
utils.authenticate();

http.createServer(function(request, response) {
    if (request.method == 'POST') {
        if (request.headers["x-github-event"] === "pull_request") {
            console.log("Receive GitHub pull request event");
            utils.githubEventHandler(request, response);
        }
    }
}).listen(4567);
