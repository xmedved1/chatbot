var request = require('request');
var Promise = require('bluebird');
var crypto = require('crypto');
var rtrim = require('rtrim');


var config = {};

config.api = {};
config.api.pkey = process.env.API_PKEY;
config.api.apiKey = process.env.API_ID;
config.api.url = process.env.API_URL;

function joinObj(obj) {
    var ret = "";
    Object.keys(obj).forEach(function (item) {
        ret += obj[item];
    });

    return ret;
}

function createApiCallUrl(url, params) {
    var signature = crypto.createHmac('sha256', config.api.pkey).update(joinObj(params)).digest('hex');

    var linkParams = "";
    Object.keys(params).forEach(function (paramName) {
        linkParams += paramName + "=" + params[paramName] + "&";
    });
    linkParams += "signature=" + signature;

    url = rtrim(url, '/');

    return url + "/?" + linkParams;
}

function searchVenuesCrossPages(params) {
    return new Promise(function (resolve, reject) {
        var urlParams = {
            api_key: config.api.apiKey,
            page: params.page
        };

        //make request
        request({
            method: 'GET',
            url: createApiCallUrl(config.api.url + "venues", urlParams),
        }, function (error, response, body) {
            if (error) {
                reject(error);
            }
            else if (response.statusCode == 403) {
                reject(new Error('unauthorized'))
            }
            else {
                var data = JSON.parse(body);

                if (typeof data.venues !== "undefined" && data.venues.length > 0) {
                    data.venues.forEach(function (venue) {
                        if (venue.city === params.city) {
                            params.venues[venue.id] = venue;
                        } else {
                            var cityName = venue.city.split(' ');
                            if(cityName.indexOf(params.city) !== -1) {
                                params.venues[venue.id] = venue;
                            }
                        }
                    });

                    params.page++;
                    searchVenuesCrossPages(params).then(function (params) {
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
    return new Promise(function (resolve, reject) {
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
            url: createApiCallUrl(config.api.url + "performances", urlParams),
        }, function (error, response, body) {
            if (error) {
                reject(error);
            }
            else if (response.statusCode == 403) {
                reject(new Error('unauthorized'))
            }
            else {
                var data = JSON.parse(body);

                if (typeof data.performances !== "undefined" && data.performances.length > 0) {

                    data.performances.forEach(function (performance) {
                        if (params.events[performance.title]) {
                            params.events[performance.title].performances[performance.id] = performance;
                        } else {
                            var p = {};
                            p[performance.id] = performance;
                            params.events[performance.title] = {
                                performances: p
                            };
                        }
                    });

                    params.page++;
                    searchPerformancesCrossPages(params).then(function (params) {
                        resolve(params);
                    });
                } else {
                    if (params.venues.length < 1)
                        resolve(params);
                    else {
                        var venue = params.venues.pop();
                        params.venue = venue;
                        params.page = 1;
                        searchPerformancesCrossPages(params).then(function (params) {
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

    /**
     *
     * @param {string} session.userData.city - Performance city
     * @param {string} session.userData.dateFrom - Date format: "YYYY-MM-DD"
     * @param {string} session.userData.dateTo - Date format: "YYYY-MM-DD"
     * @return {Object} session.userData.events - Exmp: {eventId: Object(event), event2Id: Object(event2), ...}
     */
    getEvents: function (session) {
        if (!session || !session.userData.city || !session.userData.dateFrom || !session.userData.dateTo) return Promise.reject(new Error("Bad parameter"));

        return new Promise(function (resolve, reject) {

            //first get venues is given city
            searchVenuesCrossPages({page: 1, city: session.userData.city, venues: {}}).then(function (pVenues) {
                //venues in given city
                session.userData.venues = pVenues.venues;
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

                searchPerformancesCrossPages(params).then(function (pEvents) {
                    session.userData.events = pEvents.events;
                    resolve();
                }, reject);

            }, reject);

        });
    },
    /**
     *
     * @param {Object} session.userData.events - {eventId: event, event2Id: event2, ...}
     * @param {int} session.userData.event - performance Id
     * @return {Object} session.userData.performances - Exmp: {performanceId: Object(performance), performance2Id: Object(performance2), ...}
     */
    getPerformances: function (session) {
        if (!session || !session.userData.events || !session.userData.event) return Promise.reject(new Error("Bad parameter"));

        return new Promise(function (resolve, reject) {

            if (!session.userData.events[session.userData.event]) reject("Wrong event id parameter");

            session.userData.performances = session.userData.events[session.userData.event].performances;
            resolve();

        });

    },
    /**
     *
     * @param {Object} session.userData.performances - {performanceId: Object(performance), performance2Id: Object(performance2), ...
     * @param {int} session.userData.performance - performance Id
     * @return {Object} session.userData.performanceDetail - Exmp:
     *      {
     *           id: 1101808,
     *           event_id: 144411,
     *           created_from_event_id: 119725,
     *           event_url: 'http://www.evald.cz/klient-181/kino-53/stranka-788/film-144411',
     *           title: 'Masaryk',
     *           title_original: 'Masaryk',
     *           tagline: '',
     *           description: 'Prožil život bohéma, miloval ženy, hudbu, velká gesta. V jeho srdci bojovala nespoutanost extravagantního umělce s povinností a morálkou úředníka, diplomata. Velkou část života procestoval, ale nikdy nezapomněl na zemi, z níž pocházel, na republiku, kterou založil jeho otec Tomáš Garrigue.\nSmrt Jana Masaryka je dodnes zahalena tajemstvím. Mnohá tajemství se však skrývají i v jeho životě!\nDramatický příběh, věnovaný osudům velvyslance a pozdějšího československého ministra zahraničí, Jana Masaryka, se vrací do doby těsně před druhou světovou válkou. Ve třicátých letech vrcholí Masarykova diplomatická kariéra, kterou tráví převážně ve Velké Británii, kde se snaží dostat světové mocnosti na stranu Československa.\nMuž, oceňovaný jako brilantní řečník, zábavný společník a milovník života, má však i svou temnou stránku. Masaryk hledá únik před svým jménem, před odpovědností i před sebou samým v hýřivém životě, alkoholu a drogách, ale také v neustálém sebetrýznění. Tehdejší velvyslanec v Londýně se najednou ztrácí z veřejného života. Přerušuje kontakt s politickými kolegy i s přáteli. Na několik měsíců mizí, kamsi do Ameriky...\nNa pozadí historických událostí se odehrává napínavý životní příběh okouzlujícího, ale nevyrovnaného, sebedestruktivního muže a jeho marného boje o budoucnost vlastní země.\nHistorické drama Masaryk natočil podle scénáře Alexe Königsmarka a Petra Kolečka režisér Julius Ševčík (Normal, Restart). Titulní postavu Masaryka bravurně ztvárnil démonický herec mnoha velkých rolí, Karel Roden (Fotograf, Habermannův mlýn). V roli osudové ženy Masarykova života, Marcie Daveportové, se představí Arly Jover (The Lookout, Blade). Doktora Steina, lékaře Masarykovy duše, si zahrál přední německý herec Hanns Zischler (Sils Maria, Mnichov). V dalších rolích se představí přední český herec Oldřich Kaiser, Eva Herzigová, Jiří Vyorálek a v rolích vrcholných zahraničních politiků Milton Welsh (Grandhotel Budapešť), Paul Nicholas a Dermot Crowley (Babel, Luther).',
     *           production_year: 2017,
     *           venue: {id: 53, name: 'Komorní kino Evald'},
     *           room: {id: 74, name: 'Evald'},
     *           date: '2017-03-26',
     *           time: '18:45',
     *           duration: 113,
     *           weekday: 7,
     *           purchase_url: 'https://system.cinemaware.eu/wstep1.php?id=b6e384c32e697421873667077b58420243c7fced1b23806324f86855',
     *           world_premiere_date: null,
     *           local_premiere_date: '2016-12-25',
     *           genres: [{id: 286, name: 'zaner_drama', name_translated: 'Dráma'},
     *               {
     *                   id: 277,
     *                   name: 'zaner_historicky',
     *                   name_translated: 'Historický'
     *               }],
     *           countries: [{iso_code: 'CZE', name: 'Česká republika'},
     *               {iso_code: 'SVK', name: 'Slovensko'}],
     *           age_rating: {
     *               name: 'pristupnost_12',
     *               short_name: '12+',
     *               name_translated: 'Prístupnosť od 12 rokov'
     *           },
     *           version: {
     *               name: 'original',
     *               short_name: 'OR',
     *               name_translated: 'Originálna verzia'
     *           },
     *           screening_type: {name: '2D'},
     *           poster: 'http://storage.cinemaware.eu/katalogy/images/2/a/2a0a6de8-fe5a-11e6-92c8-000c29a578f8.jpg',
     *           poster_thumbnail: 'http://storage.cinemaware.eu/katalogy/images/2/a/nahlad_2a0a6de8-fe5a-11e6-92c8-000c29a578f8.jpg',
     *           image: 'http://storage.cinemaware.eu/katalogy/images/1/b/1b460794-0ce5-11e7-92c8-000c29a578f8.jpg',
     *           image_thumbnail: 'http://storage.cinemaware.eu/katalogy/images/1/b/nahlad_1b460794-0ce5-11e7-92c8-000c29a578f8.jpg',
     *           show_online: true,
     *           purchase_online: true,
     *           reserve_online: false,
     *           place: {
     *               name: 'Komorní kino Evald',
     *               address: 'Národní 28',
     *               address_town_name: 'Praha 1',
     *               zip_code: '111 21'
     *           },
     *           base_price: 0,
     *           base_price_currency: 'Kč'
     *       }
     */
    getPerformanceDetail: function (session) {
        if (!session || !session.userData.performances || !session.userData.performance) return Promise.reject(new Error("Bad parameter"));

        return new Promise(function (resolve, reject) {

            if (!session.userData.performances[session.userData.performance]) reject("Wrong performance id parameter");

            session.userData.performanceDetail = session.userData.performances[session.userData.performance];
            resolve();

        });
    }

};

