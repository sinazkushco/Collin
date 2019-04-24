function beforeLoad(type, form) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface') {
        var subsidiary = nlapiGetFieldValue("subsidiary");
        if (type == "edit" && subsidiary == "1") {
            var sublist = form.getSubList("customsublist8");
            sublist.addButton('custpage_pm_add_product','Add Product', "addProductSuitelet");
            form.setScript('customscript_pm_call_product_suitelet'); //<< SET THIS TO YOUR SCRIPT ID
        }
    }
}