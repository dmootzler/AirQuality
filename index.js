'use strict';
var Alexa = require('alexa-sdk');

var APP_ID = undefined; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var SKILL_NAME = 'Air Quality';

/**
 * Array containing space facts.
 */

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'GetAirQualityIntent': function () {
        // TODO make call to air quality API
        var city = "Test";
        // Create speech output
        var speechOutput = "Here's your city: ";

        this.emit(':tellWithCard', speechOutput, SKILL_NAME, city);
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