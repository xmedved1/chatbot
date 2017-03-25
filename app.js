var builder = require('botbuilder');

var config = require('./config');
var bot = require('./bot');
var api = require('./api');



// var connector = new builder.ChatConnector({
// 	appId: config.api.pkey,
// 	appPassword: config.api.apiKey
// });
var connector = new builder.ConsoleConnector().listen();

var chatBot = bot.create(connector);



// // Setup Restify Server
// var server = restify.createServer();
// server.listen(config.port || process.env.port || process.env.PORT || 3978, function () {
// 	console.log('%s listening to %s', server.name, server.url);
// });
// server.use(restify.queryParser());
// server.post('/api/messages', connector.listen());
// server.get('/authCallbackServer', authCallbackServer);




