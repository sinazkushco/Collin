function filterPaymentMethods() {
    var context = nlapiGetContext()
    var executionContext = context.getExecutionContext()
    if(executionContext == 'userinterface'){
        try {
            //list of payments that WILL be displayed
            var whitelist = {
                " ": true,
                "American Express": true,
                "Discover": true,
                "Master Card": true,
                "Payment On Delivery": true,
                "VISA": true,
            }
            
            jQuery('#paymentmethod_fs').on('click', function () {  // click handler for Location Field
                //get all tooltip content and put in array
                var paymentMethods = jQuery('.uir-tooltip-content .dropdownDiv').children()
                //loop through location array and remove any matches to exclusion array
                var filteredMethods = paymentMethods.filter(function (index, method) {
                    // if(method.innerText === ' ') { return true }
                    return whitelist[method.innerText]
                })

                //remove current content provided by NS
                jQuery('.uir-tooltip-content .dropdownDiv div').remove();
                //append array with exclusions removed
                jQuery('.uir-tooltip-content .dropdownDiv').append(filteredMethods);
            });
        }
        catch (err) {
            if(window && window.console){
                console.log(err);
            }
        }
    }
}