/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define(['N/runtime'], function (runtime) {
    function beforeSubmit(context) {
        // if(runtime.executionContext !== runtime.ContextType.USER_INTERFACE) return;
        var newRecord = context.newRecord,
            type = context.type;

        var recordType = newRecord.type,
            itemId = newRecord.id;

        var msaq = {
            eachTal: newRecord.getValue("custitem_ea_treat_as_loose"),

            innerCartonTal: newRecord.getValue("custitem_ic_treat_as_loose"),
            innerCartonQty: newRecord.getValue("custitem_ic_qty"),

            masterCartonTal: newRecord.getValue("custitem_mc_treat_as_loose"),
            masterCartonQty: newRecord.getValue("custitem_mc_qty")
        }
		log.debug('Setting msaq to ' + typeof getMsaq(msaq), getMsaq(msaq))
        newRecord.setValue('custitem_msaq', getMsaq(msaq));
    }

    function getMsaq(msaq) {
        var minimum = -1;

        if (!msaq.eachTal) {
            minimum = 1
        }

        if (!msaq.innerCartonTal && msaq.innerCartonQty) {
            minimum = msaq.innerCartonQty
        }

        if (!msaq.masterCartonTal && msaq.masterCartonQty) {
            minimum = msaq.masterCartonQty
        }

        return parseInt(minimum);
    }

    return {
        beforeSubmit: beforeSubmit
    };
});

