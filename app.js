var restify = require('restify');
var builder = require('botbuilder');
var cluster = require('cluster');

var config = require('./config');
var bot = require('./bot');
var api = require('./api');

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', function(worker, code, signal) {
        cluster.fork();
    });
}

if (cluster.isWorker) {

    var connector;
    if (config.consoleMode) {
        connector = new builder.ConsoleConnector().listen();
    } else {
        connector = new builder.ChatConnector({
            appId: process.env.MICROSOFT_APP_ID,
            appPassword: process.env.MICROSOFT_APP_PASSWORD

        });
    }


    var chatBot = bot.create(connector);


    if (!config.consoleMode) {
        // Setup Restify Server
        var server = restify.createServer();
        server.listen(config.port || process.env.port || process.env.PORT || 3978, function () {
            console.log('%s listening to %s', server.name, server.url);
        });
        server.use(restify.queryParser());
        server.post('/api/messages', connector.listen());
    }

}


