/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/search", "N/email", "N/runtime"], function (require, exports, log, search, email, runtime) {
    Object.defineProperty(exports, "__esModule", { value: true });
    //import * as redirect from 'N/redirect';
    exports.afterSubmit = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            var currentRecord = context.newRecord;
            var cash_payment_methods = ['1', '9'];
            var payment_method = currentRecord.getValue({
                fieldId: 'paymentmethod'
            });
            log.debug('payment method', payment_method);
            if (cash_payment_methods.indexOf(payment_method) != -1) { //check for cash payments
                log.debug('payment method is cash', 'CASH');
                var total = currentRecord.getValue({
                    fieldId: 'total'
                });
                log.debug('payment', total);
                if (Number(total) >= 10000) {
                    log.debug('OVER 9999', 'SENDING EMAIL');
                    var customer = currentRecord.getText('entity');
                    var sales_order_id = currentRecord.getValue('createdfrom');
                    var sales_order = search.lookupFields({
                        type: search.Type.SALES_ORDER,
                        id: sales_order_id,
                        columns: ['tranid']
                    }).tranid;
                    //send email 
                    var sender_email = void 0;
                    var recipient_email = void 0;
                    if (runtime.envType == runtime.EnvType.SANDBOX) {
                        sender_email = 714588;
                        recipient_email = [714588];
                    }
                    else {
                        sender_email = 943918;
                        recipient_email = ['adrien@kushbottles.com', 'pamela.chavez@kushbottles.com'];
                    }
                    //var timeStamp = new Date().getUTCMilliseconds();
                    email.send({
                        author: sender_email,
                        recipients: recipient_email,
                        subject: 'FORM 8300',
                        body: customer + ' needs to file a 8300 form within the next 15 days for ' + sales_order
                    });
                }
            }
        }
    };
});
