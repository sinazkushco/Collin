var LOG, RECORD;
var airGasVendorId = "827153";
var additionalAirGasItems = {
    srcFuelCharge: "12045",
    hazMatFee: "12044",
    deliveryFee: "12043"
};

var additionalItemIds = [additionalAirGasItems.srcFuelCharge, additionalAirGasItems.hazMatFee, additionalAirGasItems.deliveryFee];
//var additionalItemDescription = ["SRC Fuel Charge", "Hazardous Materials Fee", "Delivery Fee"];

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record'], runUserEvent);

function runUserEvent(log, record) {
    LOG = log;
    RECORD = record;
    var returnObj = {};
    // returnObj.beforeLoad = beforeLoad;
    returnObj.afterSubmit = afterSubmit;
    // returnObj.beforeSubmit = beforeSubmit;
    return returnObj;
}

function afterSubmit(context) {
    if (context.type == "create") {
        var currentVendor = context.newRecord.getValue({
            fieldId: "entity"
        });

        if (currentVendor == airGasVendorId) {
            // var recordId = context.newRecord.getValue({
            //     fieldId: "id"
            // });
            var recordId = context.newRecord.id;
            var recordType = context.newRecord.type;
            var currentRecord = RECORD.load({
                type: recordType,
                id: recordId,
                isDynamic: true
            });

            addAirGasItems(currentRecord);
        }
    }
    return;
}

function addAirGasItems(currentRecord) {

    for (var i = 0; i < additionalItemIds.length; i++) {
        currentRecord.selectNewLine({
            sublistId: "item"
        });
        currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: additionalItemIds[i]
        });
        // currentRecord.setCurrentSublistValue({
        //     sublistId: "item",
        //     fieldId: "description",
        //     value: additionalItemDescription[i]
        // });
        currentRecord.commitLine({
            sublistId: "item"
        });
    }

    currentRecord.save();

}