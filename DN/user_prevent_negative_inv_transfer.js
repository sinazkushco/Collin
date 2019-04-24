var error, runtime;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/error", "N/email", "N/runtime"], runUserEvent);

function runUserEvent(ERROR, RUNTIME) {
    error = ERROR;
    runtime = RUNTIME;

    var returnObj = {};
    returnObj.beforeSubmit = beforeSubmit;
    return returnObj;
}

function beforeSubmit(context) {
    // var user = runtime.getCurrentUser();
    // var userRole = user.role;
    // var approvedRoles =  [3, 1054];
    // var item = context.newRecord.getValue("item");
    var type = context.type;

    if (type == "delete") {
        return;
    }
    
    if (true) {
        var currentRecord = context.newRecord;
        var currentRecordType = currentRecord.type;
        var sublistLength = currentRecord.getLineCount({
            sublistId: "inventory"
        });

        for (var i = 0; i < sublistLength; i++) {
            var qtyToTransfer = Number(currentRecord.getSublistValue({
                sublistId: "inventory",
                fieldId: "adjustqtyby",
                line: i
            }));

            var qtyOnHand = Number(currentRecord.getSublistValue({
                sublistId: "inventory",
                fieldId: "quantityonhand",
                line: i
            }));

            if(currentRecordType == "inventorytransfer"){
                if (qtyToTransfer > qtyOnHand) {
                    blockSubmission("inventorytransfer");
                }
            } else if (currentRecordType == "inventoryadjustment"){
                if (qtyToTransfer + qtyOnHand < 0) {
                    blockSubmission("inventoryadjustment");
                }
            }

        }
    }

}


function blockSubmission(recordType) {
    var msg = "QTY TO TRANSFER CANNOT BE GREATHER THAN QTY ON HAND";
    
    if(recordType == "inventoryadjustment"){
        msg = "NEW QTY CANNOT BE NEGATIVE";
    }

    throw error.create({
        "name": "KB_INVALID_QTY",
        "message": msg,
        "notifyOff": true
    });
}