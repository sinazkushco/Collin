/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @appliedtorecord inventoryitem
 */
define(["N/record", "N/log", "N/email", "N/search", "N/runtime"], function (record, log, email, search, runtime) {
    function functionName(context) {
        log.debug("Progress Check: ", "First Condition Passed, Webstore Context");
        log.debug("Progress Check: ", runtime.executionContext);
        log.debug("Progress Check: ", runtime.ContextType.USERINTERFACE);
      
        if (runtime.executionContext === 'USERINTERFACE') {
            //currentRecord is READ only unless beforesubmit
            var currentRecord = context.newRecord;
            var internalId = currentRecord.id;
            var recordType = currentRecord.type;
            var classId = currentRecord.getValue({
                fieldId: 'class'
            });
            if(!classId){
                return;
            }

            var discount_category_value = search.lookupFields({
                type: 'classification',
                id: classId,
                columns: ['custrecord_discount_category']
            })

            if(!discount_category_value.custrecord_discount_category.length){
                return;
            }

            discount_category_value = discount_category_value.custrecord_discount_category[0].value;

            currentRecord.setValue("custitem_discount_category", discount_category_value);

        }
    }

    return {
        beforeSubmit: functionName
    };
});