/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime'], function (record, search, log, runtime) {
    function afterSubmit(context) {

        log.debug("type", context.type);
        if (context.type === "delete") {
            return;
        }

        if (context.type === "create" || context.type === "edit" || context.type === 'xedit') {
            var currentRecord = context.newRecord;
            var internalId = currentRecord.id;
            var recordType = currentRecord.type;

            var itemRecord = record.load({
                type: recordType,
                id: internalId,
                isDynamic: false,
                defaultValues: null
            });

            var stock_hazmatItem = currentRecord.getValue("ishazmatitem");
            var custom_hazmatItem = currentRecord.getValue("custitem_hazmat_item");
            log.debug("default hazmat value", stock_hazmatItem);
            log.debug("custom hazmat value", custom_hazmatItem);

            //if values are the same exit function
            if (stock_hazmatItem === custom_hazmatItem) {
                return;
            }

            //if create/edit - take out the box hazmat and update custom hazmat
            if (context.type === "create" || context.type === "edit") {
                itemRecord.setValue({
                    fieldId: "custitem_hazmat_item",
                    value: stock_hazmatItem
                });
            }

            //if inline edit - take the cust hazmat field and update the out of the box hazmat
            if (context.type === "xedit") {
                itemRecord.setValue({
                    fieldId: "ishazmatitem",
                    value: custom_hazmatItem
                });
            }

            itemRecord.save();

        }

        return;
    }

    return {
        afterSubmit: afterSubmit
    };
})