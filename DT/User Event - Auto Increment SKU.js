// User Event - Auto Increment SKU
// https://system.na2.netsuite.com/app/common/scripting/script.nl?id=496&e=T
//
// After Submit only, Items.

//GLOBAL MAP
var Field = {
    RECORDTYPE: 'recordtype'
    , INTERNALID: 'internalid'
    , CLASS: 'class'
    , SKU: 'custitem_sku'
    , OLD_INCREMENTER: 'custitem_itemid'
};

//To make it easier to debug this code by CTRL+A CTRL+V in console
if (window && window.console){
    afterSubmit_autoIncrementSKU('edit');
}

/** entry point fires immediately after any write operation on a record. you may need to load the record again.
 * it cannot source standard records -- use pageInit for that.
 *  nlapiGet___Record returns a record object in readonly, so you have to use nlapiLoadRecord(nlapiGetRecordType, nlapiGetRecordId) / nlapiSubmitRecord to modify a record
 * @param   type    string      write operation type: {create edit delete *xedit *approve *reject *cancel *pack *ship *dropship *specialorder *orderitems *paybills}
 */
function afterSubmit_autoIncrementSKU(type){
    var context = nlapiGetContext();
    var exec = context.getExecutionContext();

    //To make it easier to debug this code by CTRL+A CTRL+V in console
    if (window && window.console){
        exec = 'csvimport';
        debugger;
    }

    /** @TODO:  Add checkboxes to the custom record "Only CSV Imports" and "Only Created Records".
     *   @TODO:  Update the code to look at this checkboxes before doing all_the_logic_of_this_script, instead of doing the checking on line 1 of the controller
     */

    /**
     * /////////////////////////////////////////////////////// CONTEXT ///////////////////////////////////////////////////////////////////////
     * None of the logic should be here -- this should only be the controller.  It should only control the context in which the script executes.
     */
    // if (exec === 'csvimport') {
    if (type == 'create' || type == 'edit') {
        var itemFieldsToLookup = [Field.RECORDTYPE, Field.CLASS, Field.INTERNALID, Field.SKU, Field.OLD_INCREMENTER];

        try {
            var item = nlapiLookupField('item', nlapiGetRecordId(), itemFieldsToLookup);
            if (item) {
                var error = all_the_logic_of_this_script(item); //on success, the script has done its thing
                if (error) {
                    nlapiLogExecution('ERROR', 'STATUS: INCOMPLETE | Auto Incrementer completed logic but errored: ', error);
                }
            }
        }
        catch (e){
            nlapiLogExecution('ERROR','STATUS: ERROR | Error thrown before hitting any logic for item:'+ nlapiGetRecordId(), e);
        }
    } // if create or edit
    // } // if csv import
}

/**
 * /////////////////////////////////////////////////////// LOGIC ///////////////////////////////////////////////////////////////////////
 * None of the context should be here -- this should only be the model.  It should be the purpose of this script.
 *
 * on success, the script has done its thing and:
 *      -updated the current item with the new sku
 *      -updated the autoincrementer
 *
 * @param   item    {object}            A map of item fields to lookup.
 * @returns         {boolean|string}    Returns false on success.  On error, returns the error message.
 */
function all_the_logic_of_this_script(item){
    var itemClass = item[Field.CLASS];

    if (itemClass > 0 && !item[Field.SKU]) {
        var currentIncrement = getCurrentIncrement();
        if (!currentIncrement){ return "saved search 1132 is broken https://system.na2.netsuite.com/app/common/search/search.nl?cu=T&e=T&id=1132"; }

        var classPrefix = nlapiLookupField('classification', itemClass, 'custrecordcustom_class_code');
        if (!classPrefix){ return itemClass +": this class does not have a class code"; }

        var newIncrement = getNewIncrement(currentIncrement.VALUE);
        var newSKU = classPrefix + '-' + newIncrement;

        // nlapiLogExecution('DEBUG', "currentIncrement | newIncrement | newSKU", currentIncrement.VALUE +' | '+ newIncrement +' | '+ newSKU);
        nlapiSubmitField(item[Field.RECORDTYPE], item[Field.INTERNALID], Field.SKU, newSKU);
        nlapiSubmitField(item[Field.RECORDTYPE], item[Field.INTERNALID], Field.OLD_INCREMENTER, newIncrement);

        var SKU_saved_on_item = newSKU === nlapiLookupField(item[Field.RECORDTYPE], item[Field.INTERNALID], Field.SKU);
        if (SKU_saved_on_item){
            var success = updateIncrement(newIncrement, currentIncrement.ROWID);
            if (success){
                nlapiLogExecution('AUDIT', "STATUS: SUCCESS | Successfully Updated SKU to: "+ newSKU, item[Field.RECORDTYPE] +":"+ item[Field.INTERNALID]);
                return false;
            } else {
                return "could not update customrecord_autoincrement to "+ newIncrement;
            }
        }

    }
}

/**
 * /////////////////////////////////////////////////////// HELPER FUNCTIONS ///////////////////////////////////////////////////////////////////////
 * Keep these functions pure.  Make sure they return consistent data.  Make sure they either RETURN a value or call other functions that return values.
 */
function getCurrentIncrement(){
    var search_result = nlapiSearchRecord('customrecord_autoincrement', 1132); //nlobjSearchResult
    var row = search_result[0];

    if (row !== undefined) {
        return {
            ROWID: row.getId(),
            VALUE: row.getValue('custrecord_increment')
        };
    }
    return false;
}

function getNewIncrement(OLD_VALUE){
    var newIncrement = parseInt(OLD_VALUE, 10)+1;
    return ('0000000'+newIncrement).substr(-7); //format is '000xxxx'
}

function updateIncrement(newIncrement, ROWID){
    nlapiSubmitField('customrecord_autoincrement', ROWID, 'custrecord_increment', newIncrement);
    return newIncrement === nlapiLookupField('customrecord_autoincrement', ROWID, 'custrecord_increment')
}