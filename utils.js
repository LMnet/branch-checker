var fs = require("fs");

var utils = {
    getToken: function() {
        var token;
        try {
            token = fs.readFileSync("token", {encoding: "utf-8"});
        } catch (e) {
            console.error("Create 'token' file with GitHub token");
            process.exit(1);
        }
        return token;
    }
};

module.exports = utils;
