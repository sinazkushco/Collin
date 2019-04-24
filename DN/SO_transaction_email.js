

/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function prevent_save_multiple_email_with_cc(){
    try {
        var email_list = nlapiGetFieldValue("email");
        var email_list_contains_multiple = email_list.indexOf(",") > -1 ? true : false ;
        var credit_card_payment_method = nlapiGetFieldValue("paymentmethod") == 6 || nlapiGetFieldValue("paymentmethod") == 3 || nlapiGetFieldValue("paymentmethod") == 4 || nlapiGetFieldValue("paymentmethod") == 5 ? true : false;
        if (email_list_contains_multiple && credit_card_payment_method) {
            var first_email = email_list.split(",")[0];
            var removeEmailQuestion = confirm("Credit card payments require we only use one email address. We have detected multiple emails, would you like us change the email field to only " + first_email + "?");
            if(removeEmailQuestion) {
                nlapiSetFieldValue("email", first_email);
            } else {
                return false;
            }
        }

    }
    catch (e) {
        log.debug("error", e);
    }
    return true;
}
