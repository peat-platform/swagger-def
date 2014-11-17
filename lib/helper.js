/*
 * openi_data_api
 * openi-ict.eu
 *
 * Copyright (c) 2013 dmccarthy
 * Licensed under the MIT license.
 */

'use strict';

var openiLogger  = require('openi-logger');
var os           = require('os');
var fs           = require('fs');
var https        = require('https');
var cache        = {};
var loglet      = require('loglet');
loglet = loglet.child({component: 'swagger'});

var init = function(logger_params){
   this.logger = openiLogger(logger_params);
};


var genSwaggerObject = function(msg){

   var host = msg.headers.host;

   var file = msg.path.replace( '/api-spec/v1/', '' );

   if (undefined === file || "" === file || "@*" === file){
      return "";
   }

   try{
      var cloudletJSON = JSON.parse(fs.readFileSync(__dirname +'/swagger_helpers/v1/' + file, 'utf8'));

      if ("/" === cloudletJSON.basePath){
         cloudletJSON.basePath = "";
      }

      cloudletJSON.basePath = "https://" + host + cloudletJSON.basePath;

      return cloudletJSON;
   }
   catch (e){
      loglet.error(e);
      return {"error" : "Incorrect path: " + msg.path };
   }
};



var genSwaggerIndex = function(msg, urlscheme){

   var host = msg.headers.host;

   var file = msg.path.replace( '/api-spec/v1/', '' );

   if (undefined === file || "" === file || "@*" === file){
      return "";
   }

   var cloudletJSON = JSON.parse(fs.readFileSync(__dirname +'/swagger_helpers/v1/' + file, 'utf8'));

   var apis = cloudletJSON.apis;

   for ( var i = 0; i < apis.length; i++){
      var ending = (-1 !== apis[i].path.indexOf("/api/doc/schema/") && urlscheme === "http")? "/" :"";
      apis[i].path = urlscheme + "://" + host  + apis[i].path + ending;
   }

   return cloudletJSON;
};


var getApiFrameworkIndex = function(msg, callback){

   var index = {
      apiVersion: '1.0.0',
      swaggerVersion: '1.2',
      apis: [ ],
      info: {
         title: 'OPENi API Framework Platform REST APIs',
         description: '',
         termsOfServiceUrl: '/terms/',
         contact: 'help@openi-ict.eu',
         license: 'Apache 2.0',
         licenseUrl: 'http://www.apache.org/licenses/LICENSE-2.0.html'
      }
   };

   https.get('/api/doc/resources/', function(res) {
      var data = "";

      res.on('data', function(d) {
         data += d;
      });

      res.on('end', function() {
         try{
            var originalIndex = JSON.parse(data);
            for ( var i = 0; i < originalIndex.apis.length; i++ ){
               var originalEndpoint = originalIndex.apis[i];
               index.apis[i] = { "path": msg.headers.URL_SCHEME + '://' + msg.headers.host + '/api-spec/apis/v1' + originalEndpoint.path };
            }
            callback(index);
         }
         catch (e){
            loglet.error(e);
            callback({"error":"Problem retrieving Swagger data " + e});
         }
      });

   }).on('error', function(e) {
      loglet.error(e);
      console.error(e);
   });
};

var camelCase = function(input) {
   return input.toLowerCase().replace(/_(.)/g, function(match, group1) {
      return group1.toUpperCase();
   });
};

var transformAPiEndpoint = function(msg, callback){

   var endpoint = msg.path.replace("/api-spec/apis/v1/", "").replace("/", "");

   if (undefined !== cache[endpoint]){
      callback(cache[endpoint]);
      return;
   }

   var url      = "/api/doc/schema/" + endpoint + "/";

   var index = {
      apiVersion     : '1.0.0',
      swaggerVersion : '1.2',
      resourcePath   : "/" + endpoint,
      basePath       : msg.headers.URL_SCHEME + '://' + msg.headers.host + "/v.04",
      produces : [
         "application/json"
      ],
      consumes : [
         "application/json"
      ],
      apis   : [],
      models : {}
   };

   https.get(url, function(res) {

      var data = "";

      res.on('data', function(d) {
         data += d;
      });

      res.on('end', function() {

         var originalIndex = null

         try{
            originalIndex = JSON.parse(data);
         }
         catch(e){
            callback({});
            return;
         }
         for ( var i = 0; i < originalIndex.apis.length; i++ ){
            var originalEndpoint = originalIndex.apis[i];
            index.apis[i]= originalEndpoint;
            for ( var j = 0; j < index.apis[i].operations.length; j++){
               var operation = index.apis[i].operations[j];
               for (var k = 0; k < operation.parameters.length; k++){
                  var parameter = operation.parameters[k];

                  index.apis[i].operations[j].parameters[k].type = index.apis[i].operations[j].parameters[k].dataType;
                  delete index.apis[i].operations[j].parameters[k].dataType;
               }

               index.apis[i].operations[j].parameters.push({
                  "name"        : "Authorization",
                  "description" : "OPENi Auth Token",
                  "required"    : false,
                  "type"        : "string",
                  "paramType"   : "header"
               });

               index.apis[i].operations[j].type   = index.apis[i].operations[j].responseClass;
               index.apis[i].operations[j].method = index.apis[i].operations[j].httpMethod;

               index.apis[i].operations[j].nickname = camelCase(index.apis[i].operations[j].nickname);

               delete index.apis[i].operations[j].httpMethod;
            }
            index.apis[i].path = index.apis[i].path.replace('/v.04', '');
         }

         for ( var m in originalIndex.models ){
            if (originalIndex.models.hasOwnProperty(m)) {
               index.models[m]= originalIndex.models[m];
            }
         }

         cache[endpoint] = index;

         callback(index);
      });

   }).on('error', function(e) {
      loglet.error(e);
      callback({"error" : e});
   });
};


var processMongrel2Message = function (msg, callback) {

   var resp_msg = null;

   if ( 0 === msg.path.indexOf("/api-spec/apis/v1/")){
      transformAPiEndpoint(msg, callback);
      return;
   }

   switch(msg.path){
      case '/api-spec/v1/api_framework/':
      case '/api-spec/v1/api_framework':
         getApiFrameworkIndex(msg, callback);
         return;
      case '/api-spec/v1/':
      case '/api-spec/v1':
         msg.path = '/api-spec/v1/index';
      case '/api-spec/v1/cloudlet/':
      case '/api-spec/v1/cloudlet':
      case '/api-spec/v1/security_index/':
      case '/api-spec/v1/security_index':
         resp_msg = genSwaggerIndex(msg, msg.headers.URL_SCHEME );
         break;
      default:
         resp_msg = genSwaggerObject(msg);
         break;
   }

   callback(resp_msg);
};

module.exports.init                   = init;
module.exports.processMongrel2Message = processMongrel2Message;