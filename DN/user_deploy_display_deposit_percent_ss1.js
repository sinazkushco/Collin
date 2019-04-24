function beforeLoad(type, form) {
    if(type == "view" || type == "edit"){
        if (nlapiGetContext().getExecutionContext() == 'userinterface') {
            form.setScript('customscript_client_display_cd_od');//<< SET THIS TO YOUR SCRIPT ID
        }
    }
}