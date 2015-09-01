var fs = require("fs");
var randomstring = require("randomstring");

var utils = {

    rootTmpDir: null,

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
    },


};

module.exports = utils;
