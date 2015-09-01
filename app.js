var GitHubApi = require("github");
var utils = require("./utils.js");
var http = require("http");

process.stdin.resume();
process.on('exit', utils.cleanup.bind(utils));
process.on('SIGINT', utils.cleanup.bind(utils));
process.on('uncaughtException', utils.cleanup.bind(utils));

utils.createRootTmpDir();

var github = new GitHubApi({
    version: "3.0.0",
    debug: true
});

github.authenticate({
    type: "oauth",
    token: utils.getToken()
});

http.createServer(function(request, response) {
    if (request.method == 'POST') {
        utils.githubEventHandler(request, response)
    }
}).listen(4567);
