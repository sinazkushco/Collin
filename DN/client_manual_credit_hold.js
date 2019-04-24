/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {

    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var manualCreditHold = currentRecord.getValue({fieldId: 'manualcredithold'});
        if(manualCreditHold == "T") {
            alert("Customer has a manual credit hold.");
            return false;
        }
        return true;
    }

    return {
        saveRecord: saveRecord
    }
});
