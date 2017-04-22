'use strict';
var Alexa = require('alexa-sdk');

var APP_ID = "amzn1.ask.skill.2d3b5f27-f479-4455-b710-7cb7c6da69e8";
var SKILL_NAME = 'Air Quality';

var calledEvent;

exports.handler = function(event, context, callback) {
    calledEvent = event;
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'GetAirQualityIntent': function () {
        // check that a city has been defined
        if(calledEvent.request.intent.slots.CITY.value) {
            // the city contained in the request
            var city = fixCity(calledEvent.request.intent.slots.CITY.value);
            console.log("New city: " + city);
            function fixCity(str) {
                // split name around spaces
                var splitCity = str.split(" ");
                // capitalize each word
                for(var i = 0; i < splitCity.length; i++) {
                    console.log(splitCity[i]);
                    splitCity[i] = splitCity[i].substr(0,1).toUpperCase() + splitCity[i].substr(1).toLowerCase();
                    console.log(splitCity[i]);
                }
                str = "";
                // rejoin the capitalized words
                for(var i = 0; i < splitCity.length; i++) {
                    str += splitCity[i];
                    if(i < splitCity.length - 1) {
                        str += " ";
                    }
                }
                return str;
            }
            
            // JSON object of air quality data
            var airData;
            // text to speak
            var speechOutput;
            // set context to this
            var context = this;
            // warnings about air quality
            var warnings = [];

            // make call to air quality API
            var http = require('https');

            // build request
            var options = {
                host: "api.openaq.org",
                path: '/v1/latest?city=' + encodeURIComponent(city)
            };
            
            // function to create warnings
            function buildWarnings() {
                // check pm25
                if(getParam("pm25") >= 60) {
                    warnings.push("There is a dangerous concentration of microscopic airborne particles.");
                } else if(getParam("pm25") >= 35) {
                    warnings.push("There is a potentially unhealthy concentration of microscopic airborne particles.");
                }
                // check so2
                if(getParam("so2") >= 200) {
                    warnings.push("There is a potentially irritating concentration of sulfur dioxide in the air. This is only a concern if you have severe allergies, asthma, or some other respiratory condition.");
                }
                // check pm10
                if(getParam("pm10") >= 420) {
                    warnings.push("There is a highly dangerous concentration of macroscopic airborne particles.");
                } else if(getParam("pm10") >= 150) {
                    warnings.push("There is a potentially irritating concentration of macroscopic airborne particles.");
                } else if(getParam("pm10") >= 100) {
                    warnings.push("There is an above-average concentration of macroscopic airborne particles, which may be irritating for people with allergies or asthma.");
                }
                // check no2
                if(getParam("no2") >= 250) {
                    warnings.push("There is a highly dangerous concentration of nitrogen dioxide. You should not go outside without protection.");
                } else if(getParam("no2") >= 150) {
                    warnings.push("There is a high and potentially dangerous concentration of nitrogen dioxide. Try to limit your exposure to the outdoors.");
                } else if(getParam("no2") >= 75) {
                    warnings.push("There is an abnormal concentration of nitrogen dioxide. Limit your exposure to the outdoors if you have a lung condition like asthma.");
                } else if(getParam("no2") >= 45) {
                    warnings.push("There is an above-average concentration of nitrogen dioxide. It will only affect people with severe asthma.");
                }

                // create speech output from warnings
                if(warnings.length == 0) {
                    speechOutput = "According to my data, the air quality is great! Go out and enjoy the day.";
                } else {
                    speechOutput = "According to my data, the air quality isn't perfect right now. ";
                    for(var i = 0; i < warnings.length; i++) {
                        speechOutput += warnings[i] + " ";
                    }
                }
                return speechOutput;
            }

            // callback function to deal with air data
            function callback(response) {
                var str = '';

                // another chunk of data has been recieved, so append it to `str`
                response.on('data', function (chunk) {
                    // raw string data from API
                    str += chunk;
                });

                // the whole response has been recieved, so we just print it out here
                response.on('end', function () {
                    console.log(str);
                    // parse string returned by API
                    airData = JSON.parse(str);

                    // output error message if no result is returned
                    if(airData.results.length > 0) {
                        console.log("Results found: " + airData.results);
                        // create useful information from data
                        speechOutput = buildWarnings();
                        
                        context.emit(":tell", speechOutput);
                    } else {
                        console.warn("No results found");
                        if(city == "" || city == " ") {
                            console.warn("Empty city");
                            // ask for a specific city
                            context.emit(":ask", "I don't think you named a city. I can only answer questions about the air quality in a specific city.", "What city would you like me to search for?");
                        } else {
                            // get latitude and longitude from Google and check that
                            tryNewCity(city);
                            console.warn("Insufficient city found");
                            // ask for different location
                            context.emit(":ask", "I couldn't find any data about " + city + ". If you want to try a different location, just say, what is the air quality in New York, for example. Remember that bigger cities are more likely to be in my database.", "What city would you like to search?");
                        }
                    }
                });
            }
            
            // make request to server
            http.request(options, callback).end();
        } else {
            console.warn("Undefined city");
            // ask for a specific city
            this.emit(":ask", "I don't think you named a city. I can only answer questions about the air quality in a specific city.", "What city would you like me to search for?");
        }
        
        // get value of a certain parameter
        function getParam(name) {
            var res = airData.results[0].measurements;
            for(var i = 0; i < res.length; i++) {
                if(res[i].parameter == name) {
                    return res[i].value;
                }
            }
            return null;
        }
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can ask me about the air quality in a city, or, you can say exit... What can I help you with?";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Goodbye!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Goodbye!');
    },
    "Unhandled": function() {
        this.emit(":ask", "An error occured! Make sure to ask about the air quality in a specific city.", "You can say things like, Alexa, ask My Air Quality Monitor what the pollution levels are in Los Angeles.");
    }
};