var builder = require('botbuilder');


function create(connector) {

	//=========================================================
	// Bot Setup
	//=========================================================

	var bot = new builder.UniversalBot(connector);


	// starting dialog
	bot.dialog("/", function (session){
		session.send("Tak ty bys chtěl do kina, hej?");
	});



}

module.exports = { create };
