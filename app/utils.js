var fs = require("fs");

var utils = {

    deleteDir: function(path) {
        var self = this;
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file){
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    self.deleteDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    },

    eventHandler: function(request, response, onEndCallback) {
        var rawBody = "";
        request.on("data", function (chunk) {
            rawBody += chunk;
        });
        request.on("end", function () {
            onEndCallback(JSON.parse(rawBody));

            response.writeHead(200);
            response.end();
        });
        request.on("error", function() {
            response.writeHead(500);
            response.end();
        });
    },

    isMasterBranch: function(branchRef, defaultBranch) {
        var branchFetchRegexp = /^refs\/heads\/(.*)$/;

        if (!branchFetchRegexp.test(branchRef)) {
            console.error("Unknown ref: " + branchRef);
            return false;
        }
        var branchName = branchFetchRegexp.exec(branchRef)[1];

        return branchName === defaultBranch;
    }
};

module.exports = utils;
