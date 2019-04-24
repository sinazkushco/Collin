var error, email, runtime, search;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/error", "N/email", "N/runtime", "N/search", "../WMS SCRIPTS/Libraries/global_modules.js"], runUserEvent);

function runUserEvent(ERROR, EMAIL, RUNTIME, SEARCH) {
    error = ERROR;
    email = EMAIL;
    runtime = RUNTIME;
    search = SEARCH;

    var returnObj = {};
    returnObj.beforeSubmit = beforeSubmit;
    return returnObj;
}

function beforeSubmit(context) {
    // var type = context.newRecord.type;
    // var isCreate = context.type == context.UserEventType.CREATE;

    var user = runtime.getCurrentUser();
    var whiteListedUsers = [770]; //Robert Vargas 
    var userRole = user.role;
    // var currLocation = context.newRecord.getValue("location");
    var userId = user.id;
    var whiteListedRoles = [3, 1062, 1082, 1100, 1101, 1102, 1095, 1096, 1097, 1087, 1088, 1098];
    // var scaleWarehouses = gm.get_warehouses_with_wms();

    //3 admin, 1062 kb sales ops, 1082 ksc sales director, 1100 ksc sales ops man, 1101 ksc sales ops director, 1102 ksc sales ops specialist
    //1095 ke ops director, 1096 ke icm, 1097 ke ics
    //1087 ksc icm, 1088 ksc ops director, 1098 celeritas ops director
    var item = context.newRecord.getValue("item");
    var allowedToSubmit = whiteListedRoles.indexOf(userRole) > -1 || whiteListedUsers.indexOf(userId) > -1;

    // var areScaleEnabledWorkOrders = scaleEnabledWorkOrder(context);
    // if (areScaleEnabledWorkOrders) {
    //     blockSubmission(user, item, "You cannot reallocate from a SCALE enabled warehouse.");
    //     return;
    // }

    if (!allowedToSubmit) {
        blockSubmission(user, item, "Reallocation Permission Required");
        return;
    }
}

function scaleEnabledWorkOrder(context) {
    var currentRecord = context.newRecord;

    var lineCount = currentRecord.getLineCount({
        sublistId: "order"
    });

    var foundScaleEnabledWareHouse = false;

    for (var i = 0; i < lineCount; i++) {
        var commit = currentRecord.getSublistValue({
            sublistId: "order",
            fieldId: "commit",
            line: i
        });

        if (!commit) {
            continue;
        }

        var orderId = currentRecord.getSublistValue({
            sublistId: "order",
            fieldId: "orderid",
            line: i
        });

        var workOrderLookUp = search.lookupFields({
            type: "transaction",
            id: orderId,
            columns: ["type", "location", "firmed"]
        });

        var isWorkOrder = workOrderLookUp.type[0].value == "WorkOrd";
        // var firmed

        if (isWorkOrder) {
            var locationId = workOrderLookUp.location[0].value;

            var isScaleEnabled = search.lookupFields({
                type: "location",
                id: locationId,
                columns: ["custrecord_scale_enabled"]
            }).custrecord_scale_enabled;

            if (isScaleEnabled) {
                foundScaleEnabledWareHouse = true;
                break;
            }
        }
    }

    return foundScaleEnabledWareHouse;

}

function blockSubmission(user, item, errorMsg) {
    var userName = user.name;
    var userId = user.id;
    var userRole = user.role;

    email.send({
        author: "512",
        recipients: ["512", "172124", "68840"],
        subject: "Reallocation Item Attempt Notification - Item ID:" + item,
        body: userName + " (ROLE ID: " + userRole + " ID:" + userId + ") attempted to submit an reallocation item record."
    });

    throw error.create({
        "name": "KB_INVALID_PERMISSION",
        "message": errorMsg,
        "notifyOff": true
    });
}