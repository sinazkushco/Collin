var search;
 
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define(["N/search"], runClientscript);
       
function runClientscript(SEARCH){
    search = SEARCH;
   
    //*********** HELPER FUNCTIONS ***********
    function validateField(context) {
        log.debug("context", context);
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        if(fieldId == "parent"){
            var custValue = currentRecord.getValue("parent");
            var customerRecordType = search.lookupFields({
                type: "customer",
                id: custValue,
                columns: ["internalid"]
            });
            if (!customerRecordType.internalid){
                return false;
            }
        }

        return true; //Return true to continue with the change.
    }
    
    var returnObj = {};
    returnObj.validateField = validateField;
    return returnObj;
}