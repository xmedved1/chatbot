var builder = require('botbuilder');
var LUISClient = require("./luis_sdk");

var config = require('./config');


// LUIS client setup
var LUISclient = LUISClient({
	appId: config.luis.appId,
	appKey: config.luis.appKey,
	verbose: true
});


function create(connector) {

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

			askLUIS(session, results.response, function (response) {

				console.log("LUIS response: ", response);

				switch(response.topScoringIntent.intent){
					case "wantCinema":
						bot.beginDialog("/wantCinema");
						break;
					default:
						session.send("Nerozumím, jsem jen stroj.");
				}
			});

		}
	]);


	bot.dialog("/wantCinema", [
		function (session){
			builder.Prompts.text(session, "OK, najdeme ti něco. Kdy chceš jít do kina?");
		},
		function (session, results){

		}
	]);

}

// private

/**
 * Ask LUIS
 * @param session
 * @param question
 * @param onSuccess callback
 */
function askLUIS(session, question, onSuccess){
	if (question) {
		LUISclient.predict(question, {

			//On success of prediction
			onSuccess: onSuccess,

			//On failure of prediction
			onFailure: function (err) {
				console.error(err);
				session.send("Něco se nepovedlo: " + err);
			}
		});
	}
}

module.exports = { create };
