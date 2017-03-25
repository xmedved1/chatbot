var api = require('./api');

var session = {};
session.userData = {
    city: "Praha",
    dateFrom: "2017-03-26",
    dateTo: "2017-03-26"
};

api.getEvents(session).then(function() {
    console.log(session.userData.events);

    session.userData.event = "Masaryk";

    api.getPerformances(session).then(function() {
        console.log("Performances ..... ");
        console.log(session.userData.performances);

        session.userData.performance = 1101808;

        api.getPerformanceDetail(session).then(function() {
            console.log("PERFORMANCE DETAIL .............................. ");
            console.log(session.userData.performanceDetail);
        });
    });

});
