/*
 * object_api
 * openi-ict.eu
 *
 * Copyright (c) 2013 dmccarthy
 * Licensed under the MIT license.
 */

'use strict';

var zmq    = require('m2nodehandler');
var helper = require('./helper.js');

var swaggerDef = function(config){

console.log("asdasdas asd as asd asdsss")
   helper.init(config.logger_params);

   var responseHandler = zmq.sender(config.mongrel_handler.sink);

   zmq.receiver(config.mongrel_handler.source, config.mongrel_handler.sink, function(msg) {
console.log("----", msg)
      var response_obj = helper.processMongrel2Message(msg, function(json){
         console.log("+++", json)
          responseHandler.send(msg.uuid, msg.connId, zmq.status.OK_200, zmq.standard_headers.json, json );
      });

   });

};

module.exports = swaggerDef;
