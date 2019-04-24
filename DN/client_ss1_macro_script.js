/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function pageInit_controllerName(type){

    if(type === "create"){

        var name = nlapiGetContext().name;
        console.log(name);
        if(name == "Dennis Nguyen"){
            var quantity = nlapiGetFieldValue("quantity");
            nlapiSelectNewLineItem("inventoryassignment");
            nlapiSetCurrentLineItemValue("inventoryassignment", "binnumber", "1002");
            nlapiSetCurrentLineItemValue("inventoryassignment", "quantity", quantity);
            nlapiCommitLineItem("inventoryassignment");
            jQuery("#secondaryok").click();
        }
    }
}