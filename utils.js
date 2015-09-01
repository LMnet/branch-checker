var GitHubApi = require("github");
var fs = require("fs");
var randomstring = require("randomstring");
var exec = require('child_process').exec;

var Utils = function() {
    this.github = new GitHubApi({
        version: "3.0.0",
        debug: true
    });

    try {
        this.config = JSON.parse(fs.readFileSync("config.json", {encoding: "utf-8"}));
    } catch (e) {
        console.error('You need to create "config.json" file. You can find example config in "config.json.example".');
        process.exit(1);
    }

};

Utils.prototype = {

    constructor: Utils,

    rootTmpDir: null,

    github: null,

    config: null,

    authenticate: function() {
        this.github.authenticate({
            type: "oauth",
            token: this.config.token
        });
    },

    createRootTmpDir: function() {
        var tmpDirName = "/tmp/branch-checker-" + randomstring.generate(5);
        fs.mkdirSync(tmpDirName);
        this.rootTmpDir = tmpDirName;
    },

    _deleteDir: function(path) {
        var self = this;
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file){
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    self._deleteDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    },

    cleanup: function() {
        this._deleteDir(this.rootTmpDir);
        process.exit();
    },

    githubEventHandler: function(request, response) {
        var self = this;
        var rawBody = "";
        request.on("data", function (chunk) {
            rawBody += chunk;
        });
        request.on("end", function () {
            self._checkBranch(JSON.parse(rawBody));

            response.writeHead(200);
            response.end();
        });
        request.on("error", function() {
            response.writeHead(500);
            response.end();
        });
    },

    _checkBranch: function(body) {
        var self = this;
        var branchName = body.pull_request.head.ref;
        var sha = body.pull_request.head.sha;
        var branchTmpDir = this.rootTmpDir + "/" + branchName + "-" + randomstring.generate(5);

        try {
            fs.mkdirSync(branchTmpDir);
            var repoUrl = body.repository.git_url;

            exec("./scripts/check.sh " + branchTmpDir + " " + repoUrl + " " + branchName, function (err, stdout) {
                if (err) {
                    console.error(err);
                }
                self.github.statuses.create({
                    user: "LMnet",
                    repo: "ololo",
                    sha: sha,
                    state: "pending",
                    context: "Branch checker",
                    description: "some descr"
                });
                console.log(stdout);
                self._deleteDir(branchTmpDir);
            });
        } catch (e) {
            self._deleteDir(branchTmpDir);
        }
    }

};

module.exports = Utils;
