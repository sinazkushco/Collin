var record;
 
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/record"], runUserEvent);
 
function runUserEvent(RECORD) {
    record = RECORD;
 
    var returnObj = {};
    returnObj.beforeSubmit = beforeSubmit;
    return returnObj;
}
 
function beforeSubmit(context) {
	 record.submitFields({
        type: "customer",
        id: "259534",
        values: {
            "salesrep": "1179758"
        }
    });
    return;
}