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

   helper.init(config.logger_params)

   var responseHandler = zmq.sender(config.mongrel_handler.sink);

   zmq.receiver(config.mongrel_handler.source, config.mongrel_handler.sink, function(msg) {

      var response_obj = helper.processMongrel2Message(msg);

//      var response     = zmq.Response(302, { "Location" : "https://" + msg.headers.host + msg.headers.URI }, "");
      var response     = zmq.Response(zmq.status.OK_200, zmq.header_json, response_obj);

      responseHandler.send(msg.uuid, msg.connId, response );
   });

}

module.exports = swaggerDef