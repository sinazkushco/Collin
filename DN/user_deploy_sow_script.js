function beforeLoad(type, form) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface') {
        var subsidiary = nlapiGetFieldValue("subsidiary");
        if (type == "view" && subsidiary == "1") {
            form.setScript('customscript_client_pm_call_sow_suitelet'); //<< SET THIS TO YOUR SCRIPT ID
        }
    }
}