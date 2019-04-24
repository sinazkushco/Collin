/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/search", "N/record", "N/email", "N/runtime"], function (require, exports, log, search, record, email, runtime) {
    Object.defineProperty(exports, "__esModule", { value: true });
    //import * as redirect from 'N/redirect';
    exports.afterSubmit = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var currentRecord = context.newRecord;
                var current_record_id = currentRecord.id.toString();
                var cash_payment_methods = ['1', '9'];
                var payment_method = currentRecord.getValue({
                    fieldId: 'paymentmethod'
                });
                var form_filed = currentRecord.getValue('custbody_email_8300');
                log.debug('payment method', payment_method);
                if (cash_payment_methods.indexOf(payment_method) != -1 && !form_filed) { //check for cash payments
                    log.debug('payment method is cash', 'CASH');
                    var deposit_id = search.lookupFields({
                        type: 'customerdeposit',
                        id: current_record_id,
                        columns: ['tranid']
                    }).tranid;
                    log.debug('Deposit Id', deposit_id);
                    var payment = currentRecord.getValue({
                        fieldId: 'payment'
                    });
                    var customer_id = currentRecord.getValue('customer');
                    var customer = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: customer_id,
                        columns: ['entityid']
                    }).entityid;
                    log.debug('payment', payment);
                    if (Number(payment) >= 10000) {
                        //send email 
                        log.debug('OVER 9999', 'SENDING EMAIL');
                        var sender_email = void 0;
                        var recipient_email = void 0;
                        if (runtime.envType != runtime.EnvType.SANDBOX) {
                            sender_email = 943918;
                            recipient_email = ['adrien@kushbottles.com', 'pamela.chavez@kushbottles.com'];
                        }
                        else {
                            sender_email = 714588;
                            recipient_email = [714588];
                        }
                        //var timeStamp = new Date().getUTCMilliseconds();
                        email.send({
                            author: sender_email,
                            recipients: recipient_email,
                            subject: 'FORM 8300',
                            body: customer + ' needs to file a 8300 form within the next 15 days for ' + deposit_id
                        });
                        record.submitFields({
                            type: 'customerdeposit',
                            id: current_record_id,
                            values: {
                                custbody_email_8300: true
                            }
                        });
                    }
                }
            }
        } //ends if userinterface
    };
});
