//add fields to this function to disable more item sublist fields
function Disable_sublist_fields(exec){
    this.exec = exec;
    this.disable_fields_for_item_sublist =  function (){
        var fields_to_disable = ['custcol_item_sku'];
        var sublistId = 'item';
        this.disable_line_fields_init(sublistId,fields_to_disable);
    };
    this.applied_to_transaction = function(){
        var fields_to_disable = ['sadafwd'];
        var sublistId = 'applied';
        disable_line_fields_init(sublistId,fields_to_disable);
    };
    this.disable_line_fields_init = function(sublist, fields){
        // nlapiLogExecution('DEBUG','EXEC', this.exec);
        if (this.exec == 'userinterface') {
            // nlapiLogExecution('DEBUG','DISABLING', JSON.stringify(fields));
            for (var i = 0; i < fields.length; i++) {
                nlapiDisableLineItemField(sublist, fields[i], true);
            }
        }
    };
}
