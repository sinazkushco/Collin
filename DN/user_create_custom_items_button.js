function beforeLoad(type, form) {
    if (type == "view") {
        if (nlapiGetContext().getExecutionContext() == 'userinterface' && nlapiGetFieldValue("job")) { //PROJECT EXIST
            form.setScript('customscript_client_pm_create_custom'); //<< SET THIS TO YOUR SCRIPT ID TODO: CHANGE TO PRODUCT SCRIPT
            form.addButton('custpage_create_custom_item_btn', 'Create Custom Items', 'loopThroughTransaction()');
        }
    }
}