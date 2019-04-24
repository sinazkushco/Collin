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
    function pageInit(context) {
        var currentRecord = context.currentRecord;
        var itemId = currentRecord.getValue("item");

        var unitField = currentRecord.getValue("unit");

        if (unitField) {
            return;
        }

        var itemUomField = search.lookupFields({
            type: "inventoryitem",
            id: itemId,
            columns: ["stockunit"]
        }).stockunit || [];

        if (itemUomField.length > 0) {
            var UOM = itemUomField[0].value;
            currentRecord.setValue("unit", UOM);
        }
        return;
    }

    var returnObj = {};
    returnObj.pageInit = pageInit;
    return returnObj;
}