var runtime;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define(["N/runtime"], runClientscript);

function runClientscript(RUNTIME) {
    runtime = RUNTIME;

    function pageInit(context) {
        var role = runtime.getCurrentUser().role;
        var currentRecord = context.currentRecord;
        var recordType = currentRecord.type;
        var approvedRoles = [];
        console.log("function called");
        if (recordType == "invoice") {
            console.log("invoice");
            approvedRoles = [3, 1054, 1048, 1012]; // Administrators, Director of Operations, Senior Accountant, CFO/Controller
        } else if (recordType == "itemfulfillment") {
            console.log("itemfulfillment");
            approvedRoles = [3, 1048, 1012]; // Administrators, Senior Accountant, CFO/Controller
        } else {
            return;
        }

        if (approvedRoles.indexOf(role) == -1) {
            console.log(role);
            console.log("role not found in array");
            jQuery(jQuery(".field_widget_pos")[0]).hide();
            currentRecord.getField("trandate").isDisabled = true;
        }

        return;
    }

    var returnObj = {};
    returnObj.pageInit = pageInit;
    return returnObj;
}