var GitHubApi = require("github");
var utils = require("./utils.js");

var github = new GitHubApi({
    version: "3.0.0",
    debug: true
});



console.log(utils.getToken());
