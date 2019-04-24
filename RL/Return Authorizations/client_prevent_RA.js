/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */

define([], function () {
    function pageInit(context) {
        var createdFrom = context.currentRecord.getValue('createdfrom');
        if(!createdFrom){
            alert('Unable to create Return Authorization from this page.\n');
        }
    }

    function saveRecord(context) {
        var createdFrom = context.currentRecord.getValue('createdfrom');
        if(!createdFrom){
          	log.debug('Created from is empty')
            alert('Unable to create Return Authorization from this page.\n');
            // Return false to prevent saving the record
            return false;
        } else {
            return true;
        }
    }

    // Return object
    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});

