/*
 Copyright (c) Microsoft. All rights reserved.
 Licensed under the MIT license.

 Microsoft Cognitive Services (formerly Project Oxford): https://www.microsoft.com/cognitive-services


 Microsoft Cognitive Services (formerly Project Oxford) GitHub:
 https://github.com/Microsoft/ProjectOxford-ClientSDK


 Copyright (c) Microsoft Corporation
 All rights reserved.

 MIT License:
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict";

const LUISClient = require("./luis_sdk");

const APPID = "acb70500-57cc-4561-97ea-7c8129eca002";
const APPKEY = "92899c7c14374016a53b280bc94acde5";

var LUISclient = LUISClient({
  appId: APPID,
  appKey: APPKEY,
  verbose: true
});

LUISclient.predict("Chcem ísť na český film.", {

  //On success of prediction
  onSuccess: function (response) {
    printOnSuccess(response);
  },

  //On failure of prediction
  onFailure: function (err) {
    console.error(err);
  }
});

var printOnSuccess = function (response) {
  console.log(response);
  console.log("Query: " + response.query);
  console.log("Top Intent: " + response.topScoringIntent.intent);
  console.log("Entities:");
  for (var i = 1; i <= response.entities.length; i++) {
    console.log(i + "- " + response.entities[i-1].entity);
  }
  if (typeof response.dialog !== "undefined" && response.dialog !== null) {
    console.log("Dialog Status: " + response.dialog.status);
    if(!response.dialog.isFinished()) {
      console.log("Dialog Parameter Name: " + response.dialog.parameterName);
      console.log("Dialog Prompt: " + response.dialog.prompt);
    }
  }
};

/*
var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', function (session) {
    session.send("Hello World");
});*/
