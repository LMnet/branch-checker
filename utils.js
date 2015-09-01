var GitHubApi = require("github");
var fs = require("fs");
var randomstring = require("randomstring");

var Utils = function() {
    this.github = new GitHubApi({
        version: "3.0.0",
        debug: true
    });
};

Utils.prototype = {

    constructor: Utils,

    rootTmpDir: null,

    github: null,

    authenticate: function() {
        this.github.authenticate({
            type: "oauth",
            token: this.getToken()
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

    getToken: function() {
        var token;
        try {
            token = fs.readFileSync("token", {encoding: "utf-8"});
        } catch (e) {
            console.error("Create 'token' file with GitHub token");
            process.exit(1);
        }
        return token;
    },

    githubEventHandler: function(request, response) {
        var rawBody = '';
        request.on('data', function (chunk) {
            rawBody += chunk;
        });
        request.on('end', function () {
            var body = JSON.parse(rawBody);

            response.writeHead(200);
            response.end();
        });
    }

};

module.exports = Utils;
