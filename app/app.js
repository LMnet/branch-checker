var GitHubApi = require("github");
var fs = require("fs");
var randomstring = require("randomstring");
var exec = require("child_process").exec;
var utils = require("./utils.js");

var App = function() {
    try {
        this.config = JSON.parse(fs.readFileSync("./config.json", {encoding: "utf-8"}));
    } catch (e) {
        console.error('You need to create "config.json" file. You can find example in "config.json.example" file.');
        process.exit(1);
    }

    this.github = new GitHubApi({
        version: "3.0.0",
        debug: this.config.githubApiDebug
    });
};

App.prototype = {

    constructor: App,

    rootTmpDir: null,

    github: null,

    config: null,

    authenticate: function() {
        console.log("GitHub authentication");
        this.github.authenticate({
            type: "oauth",
            token: this.config.token
        });
    },

    createRootTmpDir: function() {
        console.log("Creating root temporary directory");
        var tmpDirName = "/tmp/branch-checker-" + randomstring.generate(5);
        fs.mkdirSync(tmpDirName);
        this.rootTmpDir = tmpDirName;
    },

    cleanup: function() {
        console.log("Cleanup before exit");
        utils.deleteDir(this.rootTmpDir);
        process.exit();
    },

    pullRequestEventHandler: function(request, response) {
        var self = this;
        console.log("Handling pull request event");
        utils.eventHandler(request, response, function(body) {
            self._checkBranch({
                branchName: body.pull_request.head.ref,
                baseBranchName: body.pull_request.base.ref,
                branchSha: body.pull_request.head.sha,
                repoUrl: body.repository.ssh_url
            })
        });
    },

    _checkBranch: function(data) {
        var self = this;

        var branchTmpDir = this.rootTmpDir + "/" + data.branchName + "-" + randomstring.generate(5);
        console.log("Checking branch " + data.branchName + " in " + data.repoUrl + " repo in " +
            branchTmpDir + " directory");


        try {
            fs.mkdirSync(branchTmpDir);

            console.log("Checking start...");
            var scriptPath = "./scripts/check.sh "
                + branchTmpDir + " "
                + data.repoUrl + " "
                + data.branchName + " "
                + data.baseBranchName;
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
                console.log("Checking is finished with " + statusRequestPayload.state + " status");
            });
        } catch (e) {
            console.error("Error while branch checking");
            console.error(e.stack);
            utils.deleteDir(branchTmpDir);
        }
    },

    pushEventHandler: function(request, response) {
        console.log("Handling push event");
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
            console.log("Push event skipped, because it is not master push");
            return;
        }
        console.log("Push event from master, need to update open pull requests statuses");

        self.github.pullRequests.getAll({
            user: self.config.repoOwner,
            repo: self.config.repoName,
            state: "open"
        }, function(err, pullRequests) {
            if (err) {
                return console.error(err);
            }

            console.log("Updating " + pullRequests.length + " pull requests...");

            pullRequests.forEach(function(pullRequest) {
                self._checkBranch({
                    branchName: pullRequest.head.ref,
                    baseBranchName: pullRequest.base.ref,
                    branchSha: pullRequest.head.sha,
                    repoUrl: pullRequest.head.repo.ssh_url
                })
            });
        });
    }

};

module.exports = App;
