//this suitlet is an access point for our restlets, 
//written by Collin Wong
// sandbox = 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c';
// prod = 'https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274&h=60378349ea77b5405c25';

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */

var HTTPSMODULE, RUNTIMEMODULE, LOGMODULE, CRED, RECORDMODULE;

define(['N/runtime', 'N/https', 'N/log', '/SuiteScripts/CW/credentials2.0.js', 'N/record'], access_suitelet);

function access_suitelet(runtime, https, log, cred, record) {
    HTTPSMODULE = https;
    RUNTIMEMODULE = runtime;
    LOGMODULE = log;
    RECORDMODULE = record;
    CRED = cred;
    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}

function execute(context) {
    context.response.setHeader('Access-Control-Allow-Origin', '*'); //TODO: Change domain name to production
    // LOGMODULE.debug('in access suitlet');
    try{
        var req_action = context.request.parameters['action'];
        var req_payload = context.request.parameters['payload'] || '';
        var request_obj = {
            access: true,
            payload: req_payload
        };
        var url;
        var response;
        var environment = RUNTIMEMODULE.envType;
        var is_sandbox = environment == 'SANDBOX';
        if (is_sandbox) {
            CRED.account += '_SB1';
        }
        var my_request = {};
        my_request.headers = {};
        my_request.action = req_action;
        my_request.headers.Authorization = 'NLAuth nlauth_account=' + CRED.account + ',nlauth_email=' + CRED.email + ',nlauth_signature=' + CRED.signature + ',nlauth_role=' + CRED.role;
        my_request.headers["content-type"] = 'application/json';
        my_request.body = JSON.stringify(request_obj);
        LOGMODULE.debug('my_request', JSON.stringify(my_request));
       LOGMODULE.debug('request body', my_request.body);
        switch (req_action) {
            case 'get_shipping_rates':
                if (is_sandbox) {
                    url = "https://4516274-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=566&deploy=1"; //Production RESTlet URL
                }else{
                    url = 'https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=566&deploy=1';
                }
                break;
            case 'get_event_data':
                url = 'https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=563&deploy=1';
                break;
            case 'set_entityuse_code':
                if(is_sandbox){
                    url = 'https://4516274-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=567&deploy=1';                
                }else{
                    url = 'https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=568&deploy=1';
                }
                break;
            case 'print_picking_ticket':
                if(is_sandbox){
                    url = 'https://4516274-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=668&deploy=1';
                }else{ //NEED TO CHANGE LATER
                    url = 'https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=721&deploy=1';
                }
                break;
            case 'clear_cycle_count':
                if(is_sandbox){
                    url = 'https://4516274-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=950&deploy=1';
                }else{
                    url = 'https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=920&deploy=1';                  
                }
                break;
            case 'create_nps_entry':
                url = 'https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=956&deploy=1'; 
                break;               
            default:
                context.response.write('invalid action');
        }
        my_request.url = url;
        if (context.request.method == 'GET') {
            response = HTTPSMODULE.get(my_request);
        } else if (context.request.method == 'POST') {
            response = HTTPSMODULE.post(my_request);
        }
        LOGMODULE.debug('suitelet response', response);
        var body_as_object = response.body;
        if (body_as_object.success == false) {
            context.response.write('could not return data');
        } else {
            LOGMODULE.audit('body_as_object: ' + typeof body_as_object, body_as_object);
            context.response.write(body_as_object); //will change var to response_object
        }
    }catch(e){
        try{
            var error_object = {};
            error_object.error = e;
            error_object.my_request = my_request;
            error_object.req_action = req_action;
            error_object.response = response
            LOGMODULE.error('error_object', JSON.stringify(error_object));
            var error_record = RECORDMODULE.create({
                type: 'customrecord_master_suitelet_error_logs',
            });
            error_record.setValue({
                fieldId: custrecord_master_suitelet_error_log, 
                value: JSON.stringify(error_object)
            });
        }catch(e){
            LOGMODULE.error('error', e);
        }
    }
}


