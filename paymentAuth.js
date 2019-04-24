/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */

// if this code is edited, also check SR_isAuthorizedAmount.js on SR

function saveRecord_verifyAuthAmount() {
    var context = nlapiGetContext()
    var executionContext = context.getExecutionContext()
    if(executionContext == 'userinterface'){
            var authCode = nlapiGetFieldValue('authcode')
            //get order total
            var orderTotal = nlapiGetFieldValue('total')
            //if auth code exists
            if (authCode) {
                // get array length of line payment events
                var lineCount = nlapiGetLineItemCount('paymentevent');
                //begin loop checking each index for type: Authorization Request and status: Accepted
                for (var i = lineCount; i >= 1; i--) {
                    var eventType = nlapiGetLineItemValue('paymentevent', 'type', i);
                    var status = nlapiGetLineItemValue('paymentevent', 'result', i);
                    if (eventType == 'Authorization Request' && status == 'Accept') {
                        //when a record is found with an Accepted Authorization Request, get the authorized amount
                        var authAmount = nlapiGetLineItemValue('paymentevent', 'amount', i);
                        //get authcode
                        var getAuth = nlapiGetFieldValue('getauth');
                        //check if Get Authorization is checked.  If checked ('T'), then allow user to proceed with save of record
                        if(getAuth == 'T'){
                            return true;
                        }
                        //compare authorized amount with order total
                        if (+orderTotal > +authAmount) {
                            alert('The order total now exceeds the credit card authorization. Please reduce this order to $'+authAmount+ ' or less so that we can use the authorization, or cancel this order and create a new one.')
                            return false;
                        }else{
                            break;
                        }
                    }
                }
            }
        }
    return true;
}



//script is used on Sales Receipt, checks for previous authorized amount and compares to total. If total is greater than previous auth amount, warn user
/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */


// if this code is edited, also check paymentAuth.js on SO
function saveRecord_SR_isAuthorizedAmount(){
    var context = nlapiGetContext()
    var executionContext = context.getExecutionContext()
    //get prevous auth amount by calling function getAuthAmount.  Store in variable
    var authAmount = getAuthAmount();
    //if authAmount is greater than zero (it exists)
    if(executionContext == 'userinterface' && authAmount > 0){
        //get order total
        var orderTotal = nlapiGetFieldValue('total')
        // if order total is greater than auth amount, warn user with confirm dialog and use boolean value to store in variable.
        if(+orderTotal > +authAmount){
            // var confirmed = confirm('The authorized amount $'+authAmount+ ' is less than the total $'+orderTotal+'. Are you sure you want to create this Sales Receipt?')
            var confirmed = confirm('The total of $'+orderTotal+' is greater than the authorized amount of $' +authAmount+'. Are you sure you want to create this Sales Receipt?')

            if(confirmed){
                return true;
            }else{
                return false;
            }
        }
    }
    return true;
}


function getAuthAmount(){
    //total line item count (used for length in loop)
    var lineCount = nlapiGetLineItemCount('paymentevent');
    // start loop in reverse, looking for last approved auth amount
    for (var i = lineCount; i >= 1; i--) {
        var eventType = nlapiGetLineItemValue('paymentevent', 'type', i);
        var status = nlapiGetLineItemValue('paymentevent', 'result', i);
        if (eventType == 'Authorization Request' && status == 'Accept') {
            //when a record is found with an Accepted Authorization Request, get the authorized amount
            var authAmount = nlapiGetLineItemValue('paymentevent', 'amount', i)
            //convert to a number (for later comparison) and return
            return parseFloat(authAmount).toFixed(2)
        }
    }
}



