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
        // the city contained in the request
        var city = calledEvent.request.intent.slots.CITY.value;
        // split name around spaces
        var splitCity = city.split(" ");
        // capitalize each word
        for(var i = 0; i < splitCity.length; i++) {
            console.log(splitCity[i]);
            splitCity[i] = splitCity[i].substr(0,1).toUpperCase() + splitCity[i].substr(1).toLowerCase();
            console.log(splitCity[i]);
        }
        city = "";
        // rejoin the capitalized words
        for(var i = 0; i < splitCity.length; i++) {
            city += splitCity[i];
            if(i < splitCity.length - 1) {
                city += " ";
            }
        }
        console.log("New city: " + city);
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
                } else {
                    console.warn("No results found");
                    if(city == "" || city == " ") {
                        speechOutput = "I don't think you named a city. I can only answer questions about the air quality in a specific city.";
                    } else {
                        speechOutput = "I was unable to find enough data about " + city + " to provide air quality information. You can try again with a different location.";
                    }
                }
                
                // Create speech output
                context.emit(':tell', speechOutput);
            });
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
        
        // make request to server
        http.request(options, callback).end();
        
        
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
        this.emit(":tell", "An error occured! Make sure to ask about the air quality in a specific city.");
    }
};