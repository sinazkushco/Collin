//userevent script
//make button for tax exemption during a sales order
//customscript_create_tax_exemption_button
//calls customscript_set_entityuse_code 
//created by Collin

function beforeload_create_tax_exemption_button(type, form) {
    var context = nlapiGetContext();
    var exec = context.getExecutionContext();
    if (exec === 'userinterface') {
        //add the create customer button to the form
        if (type == 'create' || type == 'edit') {
            form.setScript('customscript_set_entityuse_code');
            form.addButton('custpage_set_entityuse_code_button', 'Tax exemption', 'set_entityuse_code()');
            //defined in https://system.netsuite.com/app/common/media/mediaitem.nl?id=386049
        }
    }
}