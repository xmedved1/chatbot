var restify = require('restify');
var builder = require('botbuilder');

var config = require('./config');
var bot = require('./bot');
var api = require('./api');

var serverPort = process.env.OPENSHIFT_NODEJS_PORT || config.port;
var serverIpAddress = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

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
	server.listen(serverPort || process.env.port || process.env.PORT || 3978, serverIpAddress, function () {
		console.log('%s listening to %s', server.name, server.url);
	});
	server.use(restify.queryParser());
	server.post('/api/messages', connector.listen());
}



