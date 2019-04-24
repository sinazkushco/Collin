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
    if(context.type == "delete"){
        return;
    }

    var newRecord = context.newRecord;
    var inventoryLineCount = newRecord.getLineCount("inventory");
    var itemDataObj = {};

    // build obj
    for (var i = 0; i < inventoryLineCount; i++) {
        var invDetail = newRecord.getSublistSubrecord({
            sublistId: "inventory",
            fieldId: "inventorydetail",
            line: i
        });

        itemDataObj[i] = {};
        itemDataObj[i]["totalQuantity"] = newRecord.getSublistValue({
            sublistId: "inventory",
            fieldId: "quantity",
            line: i
        });

        var invDetailLineCount = invDetail.getLineCount("inventoryassignment");

        for (var k = 0; k < invDetailLineCount; k++) {
            var fromBin = invDetail.getSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "binnumber",
                line: k
            });

            var toBin = invDetail.getSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "tobinnumber",
                line: k
            });

            var binQuantity = invDetail.getSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "quantity",
                line: k
            });

            itemDataObj[i][k] = {
                fromBin: fromBin,
                toBin: toBin,
                binQuantity: binQuantity
            };


        }

    }
    log.debug("item data obj", itemDataObj);


    // rebuild record
    var reloadedBinTransfer = record.load({
        type: "bintransfer",
        id: newRecord.id,
        isDynamic: true
    });

    for (var key in itemDataObj) {

        reloadedBinTransfer.selectLine({
            sublistId: "inventory",
            line: key
        });

        // sets total quantity
        reloadedBinTransfer.setCurrentSublistValue({
            sublistId: "inventory",
            fieldId: "quantity",
            value: itemDataObj[key].totalQuantity
        });

        var reloadedInvDetail = reloadedBinTransfer.getCurrentSublistSubrecord({
            sublistId: "inventory",
            fieldId: "inventorydetail"
        });

        for (var key2 in itemDataObj[key]) {

            if (key2 != "totalQuantity") {
                reloadedInvDetail.selectLine({
                    sublistId: "inventoryassignment",
                    line: key2
                });

                reloadedInvDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "binnumber",
                    value: ""
                });

                reloadedInvDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "tobinnumber",
                    value: ""
                });

                reloadedInvDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "binnumber",
                    value: itemDataObj[key][key2].fromBin
                });

                reloadedInvDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "tobinnumber",
                    value: itemDataObj[key][key2].toBin
                });


                reloadedInvDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "quantity",
                    value: itemDataObj[key][key2].binQuantity
                });

            }

        }

        reloadedBinTransfer.commitLine({
            sublistId: "inventory"
        });

    }

    reloadedBinTransfer.save();

    return;
}