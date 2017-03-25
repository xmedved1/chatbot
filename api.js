var request = require('request');
var Promise = require('bluebird');
var config = require('./config');
var crypto = require('crypto');
var rtrim = require('rtrim');

function joinObj(obj) {
    var ret = "";
    Object.keys(obj).forEach(function(item) {
        ret += obj[item];
    });

    return ret;
}

function createApiCallUrl(url, params, signature) {
    var linkParams = "";
    Object.keys(params).forEach(function(paramName) {
        linkParams += paramName+"="+params[paramName]+"&";
    });
    linkParams += "signature="+signature;

    url = rtrim(url, '/');

    return url+"/?"+linkParams;
}

// api calls
module.exports = {

    apiTest: function(session)
    {
        //if (!session) return Promise.reject(new Error("Bad parameter"))

        return new Promise(function(resolve, reject) {

            var params = {
                api_key: config.api.apiKey,
                page: 10
            };
            var signature = crypto.createHmac('sha256', config.api.pkey).update(joinObj(params)).digest('hex');
            var callUrl = createApiCallUrl(config.api.url+"events", params, signature);

            console.log(callUrl);

            //make request
            request({
                method: 'GET',
                url: callUrl,
            }, function (error, response, body) {
                if(error)
                {
                    reject(error);
                }
                else if(response.statusCode==403)
                {
                    session.userData.accounts = {};
                    reject(new Error('unauthorized'))
                }
                else
                {
                    //session.userData.accounts = JSON.parse(body);
                    console.log(JSON.parse(body));
                    resolve();
                }
            });
        });

    }

};

