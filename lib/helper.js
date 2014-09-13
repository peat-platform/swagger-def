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

   if (undefined === file || "" === file || "@*" === file){
      return ""
   }

   try{
      var cloudletJSON = JSON.parse(fs.readFileSync(__dirname +'/swagger_helpers/v1/' + file, 'utf8'));

      if ("/" === cloudletJSON.basePath){
         cloudletJSON.basePath = ""
      }

      cloudletJSON.basePath = "https://" + host + cloudletJSON.basePath

      return cloudletJSON
   }
   catch (e){
      return {"error" : "Incorrect path: " + msg.path }
   }
}



var genSwaggerIndex = function(msg, urlscheme){

   console.log("a")

   var host = msg.headers.host

   var file = msg.path.replace( '/api-spec/v1/', '' );

   if (undefined === file || "" === file || "@*" === file){
      return ""
   }

   var cloudletJSON = JSON.parse(fs.readFileSync(__dirname +'/swagger_helpers/v1/' + file, 'utf8'));

   var apis = cloudletJSON.apis;

   for ( var i = 0; i < apis.length; i++){
      console.log(">> ", apis[i].path)
      var ending = (-1 !== apis[i].path.indexOf("/api/doc/schema/") && urlscheme === "http")? "/" :""
      apis[i].path = urlscheme + "://" + host  + apis[i].path + ending;
   }

   return cloudletJSON
}


var processMongrel2Message = function (msg) {

   //this.logger.logMongrel2Message(msg)

   var resp_msg = null;

   console.log("::", msg.path)


   switch(msg.path){
   case '/api-spec/v1/':
   case '/api-spec/v1':
      msg.path = '/api-spec/v1/index'
   case '/api-spec/v1/api_framework/':
   case '/api-spec/v1/api_framework':
   case '/api-spec/v1/cloudlet/':
   case '/api-spec/v1/cloudlet':
   case '/api-spec/v1/auth_index/':
   case '/api-spec/v1/auth_index':
      console.log("path", msg.path)
      resp_msg = genSwaggerIndex(msg, msg.headers.URL_SCHEME )
      break;
   default:
      resp_msg = genSwaggerObject(msg)
      break;
   }

   //this.logger.log('debug', resp_msg)

   return resp_msg
}

module.exports.init                   = init
module.exports.processMongrel2Message = processMongrel2Message