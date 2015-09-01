var GitHubApi = require("github");
var utils = require("./utils.js");
var http = require("http");

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
        var rawBody = '';
        request.on('data', function (chunk) {
            rawBody += chunk;
        });
        request.on('end', function () {
            var body = JSON.parse(rawBody);
            console.log(body.zen);
            console.log(body.hook.url);

            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("Hello World");
            response.end();
        });
    }
}).listen(4567);
