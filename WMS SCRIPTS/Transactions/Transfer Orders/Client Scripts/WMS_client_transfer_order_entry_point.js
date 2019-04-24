/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */

define([
	'../../WMS_client_full_lock_order.js'
], function (
	fullLock
	){
    //*********** HELPER FUNCTIONS ***********
    function lineInit(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;

        var currentRecord = context.currentRecord;
        var sublistId = context.sublistId;

        //prevent people from editing the Units dropdown in the Items sublist
        if (sublistId === "item") {

            var itemexists = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'item'
            });

            if (itemexists) {
                //var lineItemDisabled = disable_units_field(currentRecord);
            }

        }
    }
	
    function pageInit(context) {
			// Available contexts:
			// context.currentRecord;
			// context.mode;

			fullLock.preventEditMode(context);
	}
	
    function postSourcing(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;
			// context.fieldId;

        var currentRecord = context.currentRecord;
        var sublistId = context.sublistId;
        var fieldId = context.fieldId;

        if (sublistId === 'item'){
            var fieldValue = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: fieldId
            });
            console.log('PS- ' + fieldId + ': ' + fieldValue);

            if (fieldId == 'item') {
                //var postSourcingDisabled = disable_units_field(currentRecord);
            }
        }

	}
	
    function saveRecord(context) {
			// Available contexts:
			// context.currentRecord;
			
			//Return true if you want to continue saving the record.
			return (
				fullLock.preventEditMode(context)
			); 
    }
	
    function sublistChanged(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;

    }
	
    function validateDelete(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;

			return true; //Return true if the line deletion is valid.
    }
	
    function validateField(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;
			// context.fieldId;
			// context.line;
			// context.column;

		return true; //Return true to continue with the change.
    }
	
    function validateInsert(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;

		return true; //Return true if the line insertion is valid.
    }
	
    function validateLine(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;

		return true; //Return true if the line is valid.
    }
    
    function fieldChanged(context) {
			// Available contexts:
			// context.currentRecord;
			// context.sublistId;
			// context.fieldId;
			// context.line;
			// context.column;

	}

	function disable_units_field(currentRecord){
        try {
            var currentLine = currentRecord.getCurrentSublistIndex({
                sublistId: 'item'
            });

            //var lines = currentRecord.getLineCount({sublistId: 'item'});
            //if ((currentLine + 1) > lines) return;

            var lineField = currentRecord.getSublistField({
                sublistId: 'item',
                fieldId: 'units',
                line: currentLine
            });
            if (lineField) {
                debugger;
                lineField.isDisabled = true;
            }
        } catch (e) {
            // Do nothing, this is needed because getSublistField is not available when on a new line.
            // console.log('catch', e);
            
            try {
                if (nlapiSetLineItemDisabled){
                    nlapiSetLineItemDisabled('item','units',true)
                } else {
                    console.log(nlapiSetLineItemDisabled);
                }
            } catch (err){
                console.log(window);
            }
        }
    }

    return {
        lineInit: lineInit,
        pageInit: pageInit,
        postSourcing: postSourcing,
        saveRecord: saveRecord,
        sublistChanged: sublistChanged,
        validateDelete: validateDelete,
        validateField: validateField,
        validateInsert: validateInsert,
        validateLine: validateLine,
        fieldChanged: fieldChanged,
    }
});

