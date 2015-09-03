var App = require("./app/app.js");
var http = require("http");

console.log("Branch-checker is starting...");

var app = new App();

process.stdin.resume();
process.on('exit', app.cleanup.bind(app));
process.on('SIGINT', app.cleanup.bind(app));
process.on('uncaughtException', function(err) {
    console.error(err.stack);
    app.cleanup();
});

app.createRootTmpDir();
app.authenticate();

http.createServer(function(request, response) {
    if (request.method == 'POST') {
        if (request.headers["x-github-event"] === "pull_request") {
            console.log("\nReceive GitHub pull request event");
            return app.pullRequestEventHandler(request, response);
        } else if (request.headers["x-github-event"] === "push") {
            console.log("\nReceive GitHub push event");
            return app.pushEventHandler(request, response);
        }
    }
    console.log("Receive unknown message");
}).listen(app.config.port);

console.log("Branch-checker is started");
