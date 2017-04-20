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
        // JSON object of air quality data
        var airData;
        // text to speak
        var speechOutput;
        // set context to this
        var context = this;
        
        // TODO make call to air quality API
        var http = require('https');

        //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
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
                
                // TODO make usable output from this data
                // TODO output error message if no results are returned
                speechOutput = airData.results[0].measurements[0].parameter;
                
                // Create speech output
                context.emit(':tell', speechOutput);
            });
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
        this.emit(":tell", "Test");
    }
};