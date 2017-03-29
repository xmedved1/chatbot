var builder = require('botbuilder');
var LUISClient = require("./luis_sdk");
var dateFormat = require('dateformat');
var api = require('./api');

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

	var emptyString = "Čo tu skúšaš? Nič si nenapísal, skús ešte raz kááámo.";


	// starting dialog
	bot.dialog("/", [
		function (session, args, next){
	        session.userData = {};
            builder.Prompts.text(session, 'Nazdar brácho! Čo si jak? Čo by si rád?');
		},
		function (session, results) {

			askLUIS(session, results.response, function (response) {

				//console.log("LUIS response: ", response);

				switch(response.topScoringIntent.intent){
					case "dialog_start":
						session.beginDialog("/wantCinema");
						break;
					default:
						session.send("Nerozumím, jsem jen stroj.");
				}
			});
		}
	]);

    bot.dialog('/profile', [
        function (session) {
            builder.Prompts.text(session, 'Ahoj! Ako sa voláš?');
        },
        function (session, results) {
            session.userData.name = results.response;
            session.endDialog();
        }
    ]);

	bot.dialog("/wantCinema", [
		function (session){
			builder.Prompts.text(session, "Si zabil! Pome ti niečo násť! Berieš cipušku dnes alebo zajtra?");
		},
		function (session, results) {
            var date = dateFormat(new Date(), "yyyy-mm-dd");

            if(results.response != "dnes" && results.response != "Dnes") {
                var nextDay = new Date();
                nextDay.setDate(nextDay.getDate() + 1);
                date = dateFormat(nextDay, "yyyy-mm-dd");
			}

			session.userData.dateFrom = date;
			session.userData.dateTo = date;

			if(!session.userData.city) {
                session.beginDialog("/getCity");
			} else {
				api.getEvents(session).then(function() {
                    session.beginDialog("/chooseEvent");
				});
			}

		}
	]);

    bot.dialog("/getCity", [
        function (session){
            builder.Prompts.text(session, "Čaaaavo a Mesto?");
        },
        function (session, results) {
        	if(results.response.length < 1) {
                builder.Prompts.text(session, EmptyString);
                session.endDialog();
                session.beginDialog("/getCity");
			} else {
                session.userData.city = results.response;

                api.getEvents(session).then(function () {
                    session.beginDialog("/chooseEvent");
                });
            }
        }
    ]);

    bot.dialog("/chooseEvent", [
        function (session){
    		var str = "";
    		var i = 1;
            Object.keys(session.userData.events).forEach(function (name) {
                str += i+") "+name+" \n";
                i++;
            });
            builder.Prompts.text(session, "A čo filmík? Romantika?: \n"+str);
        },
        function (session, results) {
            if(results.response.length < 1) {
                builder.Prompts.text(session, emptyString);
                session.endDialog();
                session.beginDialog("/chooseEvent");
            } else {
                session.userData.event = results.response;

                api.getPerformances(session).then(function () {
                    session.beginDialog("/choosePerformance");
                });
            }

        }
    ]);

    bot.dialog("/choosePerformance", [
        function (session){
            var str = "";
            var i = 1;
            Object.keys(session.userData.performances).forEach(function (name) {
                str += i+") "+name+" \n";
                i++;
            });
            builder.Prompts.text(session, "Už len čas a môžeš vyraziť: \n"+str);
        },
        function (session, results) {
            if(results.response.length < 1) {
                builder.Prompts.text(session, emptyString);
                session.endDialog();
                session.beginDialog("/chooseEvent");
            } else {
                session.userData.performance = results.response;
                api.getPerformanceDetail(session).then(function () {
                    var resp = "Hotofka, si zadelil!. Lískty na filmík " + session.userData.performanceDetail.title + " kúp tu: " + session.userData.performanceDetail.purchase_url;
                    resp += "\n \n Pro tip: Kúp babenke aj popcorn bráácho ;)";
                    builder.Prompts.text(session, resp);
                });
            }
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
