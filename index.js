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
        // TODO check if user has a favorite city stored. If not, begin intent to set city
        
        // TODO make call to air quality API
        
        // Create speech output
        
        this.emit(':tell', city);
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