var record, log;
 
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(["N/record", "N/log"], runSuitelet);
 
//********************** MAIN FUNCTION **********************
function runSuitelet(RECORD, LOG){

    record = RECORD;
    log = LOG;
    
    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}
 
function execute(context){
    if (context.request.method == "POST") {
        log.debug("params",  context.request.body);
        var params = JSON.parse(context.request.body);
        var loadToApplyTax = record.load({
            type: params.type,
            id: params.id
        });

        //charges credit card
        if(params.type == "cashsale"){
            loadToApplyTax.setValue({
                fieldId: "chargeit",
                value: true
            });
        }

        loadToApplyTax.save();
        context.response.write("Record Reloaded"); //Example writing HTML string
        return;
    }
}
