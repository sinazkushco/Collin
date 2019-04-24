// Published by Matt Barnett
// Checks for 'shipphone' field, and if empty or not provided, sets default 'shipphone' to (000) 000-0000

/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function saveRecord_setShipPhone(){
    var shipphone = nlapiGetFieldValue('shipphone');
    debugger;
    if (shipphone === ""){
        var phone_to_set = '(000) 000-0000';//to be set

        var phone_from_SO = nlapiGetFieldValue('phone'); //nlapiGetFieldValue('phone')
        if(phone_from_SO.length > 0){ // sales order phone exists
            console.log('using phone from sales order '+ phone_to_set);
            nlapiLogExecution('DEBUG', 'using phone from sales order '+ phone_to_set);
            phone_to_set = phone_from_SO; // set shipphone to customer phone
        } else {
            //customer phone does not exist - look on customer record
            var customerid = nlapiGetFieldValue('entity'); //get customer id

            if (customerid){
                var phone_from_customer = nlapiLookupField('customer', customerid, 'phone'); // get phone from customer record
            	if (phone_from_customer.length > 0){
                	console.log('using phone from customer '+ phone_to_set);
                    nlapiLogExecution('DEBUG', 'using phone from customer '+ phone_to_set);
                	phone_to_set = phone_from_customer; // set shipphone field with customer record phone
            	} else {
                	console.log('using default phone number '+ phone_to_set);
                    nlapiLogExecution('DEBUG', 'using default phone number '+ phone_to_set);
            	}
            }
        }
        nlapiSetFieldValue('shipphone', phone_to_set);
    }

    return true;
}






