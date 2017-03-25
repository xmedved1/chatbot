var api = require('./api');

var session = {};
session.userData = {
    city: "Praha 1",
    dateFrom: "2017-03-26",
    dateTo: "2017-03-26"
};

api.getEvents(session).then(function(res) {
    console.log(res);
});
