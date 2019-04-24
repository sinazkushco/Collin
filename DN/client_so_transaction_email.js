/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.saveRecord = function (context) {
        try {
            var currentRecord = context.currentRecord;
            var email_list = currentRecord.getValue("email");
            var email_list_contains_multiple = email_list.indexOf(",") > -1 ? true : false ;
            var credit_card_payment_method = currentRecord.getValue("paymentmethod") == 6 || currentRecord.getValue("paymentmethod") == 3 || currentRecord.getValue("paymentmethod") == 4 || currentRecord.getValue("paymentmethod") == 5 ? true : false;
            if (email_list_contains_multiple && credit_card_payment_method) {
                var first_email = email_list.split(",")[0];
                var removeEmailQuestion = confirm("Credit card payments require we only use one email address. We have detected multiple emails, would you like us change the email field to only " + first_email + "?");
                if(removeEmailQuestion) {
                    currentRecord.setValue("email", first_email);
                    return true;
                } else {
                    return false;
                }
            }

        }
        catch (e) {
            log.debug("error", e);
        }
        return true;
    };
});
