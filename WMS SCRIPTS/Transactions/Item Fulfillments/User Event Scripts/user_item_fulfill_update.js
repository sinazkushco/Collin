var search, gm;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/search", "../../../Libraries/global_modules.js"], runUserEvent);

function runUserEvent(SEARCH, GM) {
    search = SEARCH;
    gm = GM;

    var returnObj = {};
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}

function afterSubmit(context) {
    try {
        var id;

        try {
            id = context.newRecord.getValue("createdfrom");
        } catch (e) {
            id = context.oldRecord.getValue("createdfrom");
        }

        var type = search.lookupFields({
            type: "transaction",
            id: id,
            columns: ["recordtype"]
        }).recordtype;

        gm.updateWarehouseStatus(type, id);
    } catch (e) {

    }

    return;
}