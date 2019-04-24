var search;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define(["N/search"], runClientscript);

function runClientscript(SEARCH) {
    search = SEARCH;

    //*********** HELPER FUNCTIONS ***********
    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var lineCount = currentRecord.getLineCount({
            sublistId: "item"
        });
        var lineInactive = false;

        var createdFromId = currentRecord.getValue("createdfrom");

        var createdFromType = search.lookupFields({
            type: "transaction",
            id: createdFromId,
            columns: ["recordtype"]
        }).recordtype;

        if(createdFromType != "returnauthorization"){
            return true;
        }

        if (lineCount > 0) {
            for (var i = 0; i < lineCount; i++) {
                var itemId = currentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: i
                });

                var itemType = search.lookupFields({
                    type: "item",
                    id: 6410,
                    columns: ["recordtype"]
                }).recordtype;

                var itemLoc = currentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "location",
                    line: i
                });

                var isLocInactive = search.lookupFields({
                    type: "location",
                    id: itemLoc,
                    columns: ["isinactive"]
                }).isinactive;


                var isItemInactive = search.lookupFields({
                    type: itemType,
                    id: itemId,
                    columns: ["isinactive"]
                }).isinactive;

                if(isItemInactive || isLocInactive){
                    lineInactive = true;
                    break;
                }
            }
        }

        if(lineInactive){
            alert("Please correct the inactive item or location before proceeding.");
            return false;
        } else {
            return true;
        }
    }

    var returnObj = {};
    returnObj.saveRecord = saveRecord;
    return returnObj;
}