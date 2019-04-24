function beforeLoad(type, form) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface') {
        var is_payment_hold = nlapiGetFieldValue('custbody_payment_hold_backorder');
        if(is_payment_hold == 'T'){
            //'update_payment_hold_status'
            form.setScript('customscript_update_payment_hold_status');//<< SET THIS TO YOUR SCRIPT ID
            form.addButton('custpage_update_ph_status','Check Customer Deposits Payment Hold', "update_payment_hold_status()");
        }
    }
}