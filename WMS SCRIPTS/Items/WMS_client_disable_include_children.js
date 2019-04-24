/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 @NScriptType ClientScript
 */

/**
 * Applied to the following record types:
 * 1. Kit Item
 * 2. Inventory Part
 * 3. Item Group
 */
define([], function (){
    function disableIncludeChildren(context) {
        context.currentRecord
            .getField({ fieldId: 'includechildren' })
            .isDisabled = true;
    }

    return {
        pageInit: disableIncludeChildren
    }
});

