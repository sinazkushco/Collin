function beforeLoad(type, form) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface') {
        var subsidiary = nlapiGetFieldValue("subsidiary");
        if (subsidiary == "1"){
            form.setScript('customscript_client_pm_hide_fields_view');//<< TODO: SET THIS TO YOUR SCRIPT ID
        }
        
    }
}