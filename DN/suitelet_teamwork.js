var RECORD, LOG, HTTPS;

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(['N/record', 'N/log', 'N/https'], run_suitelet);

//********************** MAIN FUNCTION **********************
function run_suitelet(record, log, https) {
    RECORD = record;
    LOG = log;
    HTTPS = https;

    var return_obj = {};
    return_obj.onRequest = execute;
    return return_obj;
}

function execute(context) {
    function send_response(obj) {
        return context.response.write(JSON.stringify(obj));
    }
    context.response.setHeader('Access-Control-Allow-Origin', '*'); //TODO: Change domain name to production

    if (context.request.method == 'POST') {
        create_log(context);
        find_people_assigned_to_task();
        send_response({status:200});
        return;
    }
}

/* Functions */
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function create_log(context) {
    var requestObj = JSON.parse(context.request.body);
    log.debug("parsed post object from teamwork " + typeof(parsed), requestObj);
    if(requestObj.event){
        var teamwork_log = RECORD.create({
            type: 'customrecord_hybrid_teamwork_log'
        });

        teamwork_log.setValue({fieldId: "custrecord_hybrid_teamwork_json", value: JSON.stringify(requestObj)});
        teamwork_log.setValue({fieldId: "custrecord_hybrid_teamwork_type", value: requestObj.event.split("_")[0].toUpperCase()});
        teamwork_log.setValue({fieldId: "custrecord_hybrid_teamwork_event", value: requestObj.event.split("_")[1].toUpperCase()});
        teamwork_log.save();
    }

}

function find_people_assigned_to_task() {
    var company = "hybridzdca";
    var key = "dHdwX1lGTzgxUDQ5WXFYU3dxNlFOSUxIR2x0V2VKR2s6eHh4";
    var action = "tasks/10763405.json";

    try {
        var response = HTTPS.get({
            url: 'https://' + company + '.teamwork.com/' + action,
            headers: {
                "Authorization": "BASIC " + key
            },
            body: {}
        });
        var response_body = response.body;
        log.debug("Find People assigned to task", response_body);
    } catch (e) {
        log.error('ERROR', JSON.stringify(e));
    }

}