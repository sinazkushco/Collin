

/** fires when the submit button is pressed, but prior to form being submitted
 *      ex1:    shopper submits the order, and a ‘saveRecord' event occurs. This event triggers a script that throws an alert notifying the shopper additional information is needed for the order to be submitted
 *      ex2:    shopper submits the order, and a ‘saveRecord' event occurs. This event triggers a script that shows an alert so the shopper can confirm she wants to submit the order
 * @return  boolean     false to prevent submission
 * */

//Credit card input values: 
// visa: '5'
// amex: '6'
// dc: '3'
// mc: '4'

function saveRecord_ccHasEmail(){
    var context = nlapiGetContext();
    var executionContext = context.getExecutionContext();
    if(executionContext == 'userinterface'){
        //get payment method value
        var paymentMethod = nlapiGetFieldValue('paymentmethod');
        //check if payment method is cc
        if(paymentMethod == '5' || paymentMethod == '6' || paymentMethod == '3' || paymentMethod == '4'){
            //get email value
            var toBeEmailed = nlapiGetFieldValue('email');
            //if no email present
            if(!toBeEmailed){
                alert("All credit card payments are required to have an email address. Please enter a customer email address");
                return false;
            }
        }
    }
    return true;
}