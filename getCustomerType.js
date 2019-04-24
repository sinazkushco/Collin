// Used for setting looking up customer type on customer record and setting on Sales order for use in Pick Ticket form.

function getCustomerType() {
    // var context = nlapiGetContext()
    // var executionContext = context.getExecutionContext()
    // if(executionContext == 'userinterface'){
        try {
            //get customer account number
            var customer = nlapiGetFieldValue('entity');
            // use account number to search customer record and get 'custentity_customer_type'
            var customerType = nlapiLookupField('entity', customer, 'custentity_customer_type', 'text');
            // set field on sales order from data on customer record
            nlapiSetFieldValue('custbody_customer_type', customerType)
        }
        catch (err) {
            if(window && window.console){
                console.log(err);
            }
        }
    // }
}