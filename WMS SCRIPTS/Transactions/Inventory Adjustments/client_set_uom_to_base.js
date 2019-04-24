/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define(["../../../UOM Base Unit/UOM_base_unit.js"], runClientscript);

function runClientscript(uomBaseUnit) {


    function pageInit(context) {
        context.currentRecord.setValue("memo", "Fixing Decimal Variance 4/1");
        context.currentRecord.setValue("account", "246");
        context.currentRecord.setValue("adjlocation", "66");

    }

    function postSourcing(context) {
        if (context.currentRecord.type == "inventoryadjustment") {
            setUnitsToBase(context, "inventory");
        }
        return;
    }

    function setUnitsToBase(context, sublistId) {
        if (context.sublistId == "inventory" && context.fieldId == "item") {
            var uomType = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "custcol_units_type"
            });

            context.currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "units",
                value: uomBaseUnit.uomJson[uomType] || "",
                ignoreFieldChange: true
            });

            context.currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "units_display",
                value: 1,
                ignoreFieldChange: true
            });

            // var locationId = context.currentRecord.getValue({
            //     fieldId: "adjlocation"
            // });
            
            context.currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: "units_display",
                value: 1,
                ignoreFieldChange: true
            });


            // context.currentRecord.setCurrentSublistValue({
            //     sublistId: sublistId,
            //     fieldId: "location",
            //     value: locationId
            // });


        }
        // if (context.sublistId == "inventory" && context.fieldId == "location") {
        //     var qtyOnHand = context.currentRecord.getCurrentSublistValue({
        //         sublistId: "inventory",
        //         fieldId: "quantityonhand"
        //     }).toString();

        //     var qtyOnHandArray = qtyOnHand.split(".");
        //     if(qtyOnHandArray.length < 2) {
        //         return;
        //     }
        //     var adjustByQty;

        //     if(qtyOnHandArray[1][0] == "9"){
        //         adjustByQty = 1 - Number("0." + qtyOnHandArray[1]);
        //     } else {
        //         adjustByQty = "-0." + qtyOnHandArray[1];
        //     }

        //     context.currentRecord.setCurrentSublistValue({
        //         sublistId: sublistId,
        //         fieldId: "adjustqtyby",
        //         value: adjustByQty
        //     });

        // }
        return;
    }

    var returnObj = {};
    //returnObj.pageInit = pageInit;
    returnObj.postSourcing = postSourcing;
    return returnObj;
}