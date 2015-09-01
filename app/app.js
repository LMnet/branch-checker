var GitHubApi = require("github");
var fs = require("fs");
var randomstring = require("randomstring");
var exec = require("child_process").exec;
var utils = require("./utils.js");

var App = function() {
    this.github = new GitHubApi({
        version: "3.0.0",
        debug: true
    });

    try {
        this.config = JSON.parse(fs.readFileSync("./../config.json", {encoding: "utf-8"}));
    } catch (e) {
        console.error('You need to create "config.json" file. You can find example in "config.json.example" file.');
        process.exit(1);
    }

};

App.prototype = {

    constructor: App,

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

    cleanup: function() {
        utils.deleteDir(this.rootTmpDir);
        process.exit();
    },

    pullRequestEventHandler: function(request, response) {
        var self = this;
        utils.eventHandler(request, response, function(body) {
            self._checkBranch({
                branchName: body.pull_request.head.ref,
                branchSha: body.pull_request.head.sha,
                repoGitUrl: body.repository.git_url
            })
        });
    },

    _checkBranch: function(data) {
        var self = this;
        var branchTmpDir = this.rootTmpDir + "/" + data.branchName + "-" + randomstring.generate(5);

        try {
            fs.mkdirSync(branchTmpDir);
            var scriptPath = "./../scripts/check.sh " + branchTmpDir + " " + data.repoGitUrl + " " + data.branchName;

            exec(scriptPath, function (err, stdout, stderr) {
                console.log(stdout);

                var statusRequestPayload = {
                    user: self.config.repoOwner,
                    repo: self.config.repoName,
                    sha: data.branchSha,
                    context: "Branch checker"
                };

                if (err) {
                    console.error(stderr);
                    statusRequestPayload.state = "failure";
                    statusRequestPayload.description = stderr;
                } else {
                    statusRequestPayload.state = "success";
                    statusRequestPayload.description = "All checks have passed successfully";
                }

                self.github.statuses.create(statusRequestPayload);
                utils.deleteDir(branchTmpDir);
            });
        } catch (e) {
            utils.deleteDir(branchTmpDir);
        }
    },

    pushEventHandler: function(request, response) {
        utils.eventHandler(request, response, this._updatePullRequests.bind(this));
    },

    /**
     * We need to update pull requests status if master is updated
     *
     * @param body Push event body
     * @private
     */
    _updatePullRequests: function(body) {
        var self = this;

        if (!utils.isMasterBranch(body.ref, body.repository.default_branch)) {
            return;
        }

        self.github.pullRequests.getAll({
            user: self.config.repoOwner,
            repo: self.config.repoName,
            state: "open"
        }, function(err, pullRequests) {
            if (err) {
                return console.error(err);
            }

            pullRequests.forEach(function(pullRequest) {
                self._checkBranch({
                    branchName: pullRequest.head.ref,
                    branchSha: pullRequest.head.sha,
                    repoGitUrl: pullRequest.head.git_url
                })
            });
        });
    }

};

module.exports = App;
