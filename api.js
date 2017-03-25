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

function createApiCallUrl(url, params) {
    var signature = crypto.createHmac('sha256', config.api.pkey).update(joinObj(params)).digest('hex');

    var linkParams = "";
    Object.keys(params).forEach(function(paramName) {
        linkParams += paramName+"="+params[paramName]+"&";
    });
    linkParams += "signature="+signature;

    url = rtrim(url, '/');

    return url+"/?"+linkParams;
}

function searchVenuesCrossPages(params) {
    return new Promise(function(resolve, reject) {
        var urlParams = {
            api_key: config.api.apiKey,
            page: params.page
        };

        //make request
        request({
            method: 'GET',
            url: createApiCallUrl(config.api.url+"venues", urlParams),
        }, function (error, response, body) {
            if(error)
            {
                reject(error);
            }
            else if(response.statusCode==403)
            {
                reject(new Error('unauthorized'))
            }
            else {
                var data = JSON.parse(body);

                if(typeof data.venues !== "undefined" && data.venues.length > 0) {
                    data.venues.forEach(function (venue) {
                        if (venue.city === params.city) {
                            params.venues[venue.id] = venue;
                        }
                    });

                    params.page++;
                    searchVenuesCrossPages(params).then(function(params) {
                        resolve(params);
                    });
                } else {
                    resolve(params);
                }
            }
        });
    });
}

function searchPerformancesCrossPages(params) {
    return new Promise(function(resolve, reject) {
        var urlParams = {
            api_key: config.api.apiKey,
            page: params.page,
            date_from: params.dateFrom,
            date_to: params.dateTo,
            venue_id: params.venue
        };

        //make request
        request({
            method: 'GET',
            url: createApiCallUrl(config.api.url+"performances", urlParams),
        }, function (error, response, body) {
            if(error)
            {
                reject(error);
            }
            else if(response.statusCode==403)
            {
                reject(new Error('unauthorized'))
            }
            else {
                var data = JSON.parse(body);

                console.log(data.performances.length);
                console.log("cinema: "+params.venue+" page: "+params.page);

                if(typeof data.performances !== "undefined" && data.performances.length > 0) {

                    data.performances.forEach(function (performance) {
                            params.events[performance.event_id] = {id: performance.event_id, title: performance.title};
                    });

                    params.page++;
                    searchPerformancesCrossPages(params).then(function(params) {
                        resolve(params);
                    });
                } else {
                    if(params.venues.length < 1)
                        resolve(params);
                    else {
                        var venue = params.venues.pop();
                        params.venue = venue;
                        params.page = 1;
                        searchPerformancesCrossPages(params).then(function(params) {
                            resolve(params);
                        });
                    }
                }
            }
        });
    });
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

            //make request
            request({
                method: 'GET',
                url: createApiCallUrl(config.api.url+"events", params),
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

    },
    getEvents: function(session) {
        if (!session) return Promise.reject(new Error("Bad parameter"));

        return new Promise(function(resolve, reject) {

            //first get venues is given city
            searchVenuesCrossPages({page: 1, city: session.userData.city, venues: {} }).then(function(pVenues) {
                console.log(pVenues.venues);
                var venuesIds = Object.keys(pVenues.venues);
                var venue = venuesIds.pop();

                var params = {
                    page: 1,
                    dateFrom: session.userData.dateFrom,
                    dateTo: session.userData.dateTo,
                    venues: venuesIds,
                    venue: venue,
                    events: {}
                };

                searchPerformancesCrossPages(params).then(function(pEvents) {
                    resolve(pEvents.events);
                }, reject);

            }, reject);

        });
    }

};

