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
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}

function afterSubmit(context) {
    var type = context.type;
    // Added a check for XEDIT as if a user is in XEDIT, newRecord.getValues will return an empty string.
    if(type == "delete" || context.type == context.UserEventType.XEDIT){
        return;
    }

    var currentRecord = context.newRecord;
    var customerType = currentRecord.getValue("custentity_customer_type");

    if (customerType) {
        return;
    }

    var salesRep = currentRecord.getValue("salesrep");
    var accountOriginatior = currentRecord.getValue("custentity3");
    var custTypeValue = "3"; // Enterprise

    // Medepen , MidnightToke, RUB, TerpsOnTerps
    if (accountOriginatior == "87797" || accountOriginatior == "30375" || accountOriginatior == "30373" || accountOriginatior == "30374") {
        // Consumer
        custTypeValue = "4";
    } else if (salesRep == "1179758") { // Customer Support Team
        // Commerical
        custTypeValue = "1";
    }

    record.submitFields({
        type: "customer",
        id: currentRecord.id,
        values: {
            "custentity_customer_type": custTypeValue
        }
    });

    return;
}