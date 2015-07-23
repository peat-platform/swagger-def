/**
 * Created by dmccarthy on 14/11/2013.
 */


'use strict';

var swaggerDef = require('./main.js');

var config = {
   mongrel_handler : {
      source : { spec:'tcp://127.0.0.1:49907', id:'g', bind:false, type:'pull', isMongrel2:true, error_handle:'tcp://127.0.0.1:49904' },
      sink   : { spec:'tcp://127.0.0.1:49908', id:'h', bind:false, type:'pub',  isMongrel2:true }
   },
   logger_params : {
      'path'     : '/opt/peat/cloudlet_platform/logs/swagger-def',
      'log_level': 'info',
      'as_json'  : true
   }
};


swaggerDef(config);
