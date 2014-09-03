/*
 * openi_data_api
 * openi-ict.eu
 *
 * Copyright (c) 2013 dmccarthy
 * Licensed under the MIT license.
 */

'use strict';

var openiLogger  = require('openi-logger')
var os           = require('os');
var fs           = require('fs');


var init = function(logger_params){
   this.logger = openiLogger(logger_params);
}


var genSwaggerObject = function(msg){

   var host = msg.headers.host

   var file = msg.path.replace( '/api-spec/v1/', '' );

   var cloudletJSON = JSON.parse(fs.readFileSync(__dirname +'/swagger_helpers/v1/' + file, 'utf8'));

   cloudletJSON.basePath = "http://" + host + cloudletJSON.basePath

   return cloudletJSON
}



var genSwaggerIndex = function(msg){

   var host = msg.headers.host

   var file = msg.path.replace( '/api-spec/v1/', '' );

   var cloudletJSON = JSON.parse(fs.readFileSync(__dirname +'/swagger_helpers/v1/' + file, 'utf8'));

   var apis = cloudletJSON.apis;

   for ( var i = 0; i < apis.length; i++){
      apis[i].path = "http://" + host + apis[i].path;
   }

   return cloudletJSON
}


var processMongrel2Message = function (msg) {

   this.logger.logMongrel2Message(msg)

   var resp_msg = null;

   switch(msg.path){
   case '/api-spec/v1/':
   case '/api-spec/v1':
      msg.path = '/api-spec/v1/index'
   case '/api-spec/v1/api_framework/':
   case '/api-spec/v1/api_framework':
   case '/api-spec/v1/cloudlet/':
   case '/api-spec/v1/cloudlet':
      resp_msg = genSwaggerIndex(msg)
      break;
   default:
      resp_msg = genSwaggerObject(msg)
      break;
   }

   this.logger.log('debug', resp_msg)

   return resp_msg
}

module.exports.init                   = init
module.exports.processMongrel2Message = processMongrel2Message