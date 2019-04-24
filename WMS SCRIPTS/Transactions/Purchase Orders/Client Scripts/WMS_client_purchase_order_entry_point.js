/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */

define([
    '../../WMS_client_full_lock_order.js',
    './po_client_partial_lock.js'
], function (
    fullLock,
    partialLock
){
    //*********** HELPER FUNCTIONS ***********
    function lineInit(context) {
        // Available contexts:
        // context.currentRecord;
        // context.sublistId;

        partialLock.lineInit(context);
    }

    function pageInit(context) {
        // Available contexts:
        // context.currentRecord;
        // context.mode;

        fullLock.preventEditMode(context);
        partialLock.pageInit(context);
    }

    function postSourcing(context) {
        // Available contexts:
        // context.currentRecord;
        // context.sublistId;
        // context.fieldId;

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

        return (
            partialLock.validateInsert_and_validateLine_and_validateDelete(context)
        ); //Return true if the line deletion is valid.
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

        return (
            partialLock.validateInsert_and_validateLine_and_validateDelete(context)
        ); //Return true if the line insertion is valid.
    }

    function validateLine(context) {
        // Available contexts:
        // context.currentRecord;
        // context.sublistId;

        return (
            partialLock.validateInsert_and_validateLine_and_validateDelete(context)
        ); //Return true if the line is valid.
    }

    function fieldChanged(context) {
        // Available contexts:
        // context.currentRecord;
        // context.sublistId;
        // context.fieldId;
        // context.line;
        // context.column;

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

