var builder = require('botbuilder');
const LUISClient = require("./luis_sdk");

var config = require('./config');


function create(connector) {

	// LUIS client setup
	var LUISclient = LUISClient({
		appId: config.luis.appId,
		appKey: config.luis.appKey,
		verbose: true
	});


	//=========================================================
	// Bot Setup
	//=========================================================

	var bot = new builder.UniversalBot(connector);


	// starting dialog
	bot.dialog("/", [
		function (session){
			builder.Prompts.text(session, "Ahoj, jsem chatbot. Co si přeješ?");
		},
		function (session, results) {
			if (results.response) {
				LUISclient.predict(results.response, {

					//On success of prediction
					onSuccess: function (response) {

						console.log("LUIS response: ", response);

						session.send(".");
					},

					//On failure of prediction
					onFailure: function (err) {
						console.error(err);
						session.send("Něco se nepovedlo: " + err);
					}
				});
			}
		}
	]);


}

module.exports = { create };
