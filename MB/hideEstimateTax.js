//************************************************************************************************
// Script hides 'Calculate Tax' button found on sales order.  This button is not used and was added via 
// Avalara bundle.
//************************************************************************************************

function hideEstimateTaxButton_pageInit() {
    var context = nlapiGetContext();
    var exec = context.executioncontext;

    if (exec == 'userinterface') {
        try {
            jQuery('td > table#tbl_custpage_ava_calculatetax').css('display', 'none');

        } catch (e) {
            console.log(e)
        }

    }

}