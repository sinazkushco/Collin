var SEARCHMODULE;
 
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/search"], runUserEvent);
 
function runUserEvent(search) {
    SEARCHMODULE = search;
 
    var returnObj = {};
    returnObj.beforeLoad = beforeLoad;
    return returnObj;
}
 
function beforeLoad(context) {
    //SEARCHMODULE.load(123);
    log.debug("beforeLoad Triggered");
    var currentRecord = context.newRecord;

    currentRecord.setSublistValue({
        sublistId: "item",
        fieldId: "item",
        line: 0,
        value: 9222
    });

    // currentRecord.setSublistValue({
    //     sublistId: "item",
    //     fieldId: "item",
    //     line: 0,
    //     value: 9222
    // });

    currentRecord.setSublistValue({
        sublistId: "item",
        fieldId: "location",
        line: 0,
        value: 56
    });

    // currentRecord.selectLine({
    //     sublistId: 'item',
    //     line: 0
    // });


    // currentRecord.setCurrentSublistValue({
    //     sublistId: "item",
    //     fieldId: "item",
    //     value: 9222
    // });

    var sublistFieldValue = currentRecord.getSublistValue({
        sublistId: "item",
        fieldId: "item",
        line: 0
    });


    
    log.debug("sublist", sublistFieldValue);

    currentRecord.setValue("custbody_internal_notes", "123");
    return;
}
