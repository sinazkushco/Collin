// 2.0 - Fluent
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @appliedtorecord inventoryitem
 */
define(["N/record", "N/log"], function (record, log) {
    function auto_fill_UOM(context) {

        if (context.type == "edit" || context.type == "create") {
            var newRecord = context.newRecord;
            var internalId = newRecord.id;
            var recordType = newRecord.type;

            var loadedRecord = record.load({
                type: recordType,
                id: internalId,
                isDynamic: false,
                defaultValues: null
            });

            ////////donald version start////////
            //if salesunit is falsy, stop function
            var salesUnit = loadedRecord.getText("saleunit");
            var saveRecord = false;
            if (salesUnit) {
                saveRecord = true;
                salesUnit = salesUnit.replace(/\D/g, '') || 1;
                loadedRecord.setValue("custitem_uom_numeral", salesUnit);
            }
            var stockUnit = loadedRecord.getText("stockunit");
            if(stockUnit){
                saveRecord = true;
                stockUnit = stockUnit.replace(/\D/g, '') || 1;
                loadedRecord.setValue("custitem_stock_unit_numeral", stockUnit);
            }
            var purchaseUnit = loadedRecord.getText("purchaseunit");
            if(purchaseUnit){
                saveRecord = true;
                purchaseUnit = purchaseUnit.replace(/\D/g, '') || 1;
                loadedRecord.setValue("custitem_purchase_unit_numberal", purchaseUnit);
            }
            if(saveRecord){
                loadedRecord.save();
            }
            //strips all non-numeric characters. if empty string or only text, set to 1
          
            ////////donald version end////////

            /*//////dennis version start///////
            //if salesunit is falsy, stop function
            var salesUnit = loadedRecord.getText("saleunit");
            if (!salesUnit) {
                return;
            }

            //checks for eaches
            if (salesUnit === "Eaches") {
                loadedRecord.setValue("custitem_uom_numeral", "1");
                loadedRecord.save();
                return;
            }

            salesUnit = loadedRecord.getText("saleunit").replace(/\D/g, ''); //strips all non-numeric characters
            loadedRecord.setValue("custitem_uom_numeral", salesUnit);
            loadedRecord.save();
            //////dennis version end///////*/
        }
    }

    return {
        afterSubmit: auto_fill_UOM
    };
});