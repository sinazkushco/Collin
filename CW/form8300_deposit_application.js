/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/record", "N/runtime", "N/email", "N/search"], function (require, exports, log, record, runtime, email, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    //import * as redirect from 'N/redirect';
    exports.afterSubmit = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            if (context.type == context.UserEventType.CREATE) {
                var currentRecord = context.newRecord;
                var cash_payment_methods = ['1', '9'];
                var customer_deposit_id = currentRecord.getValue('deposit');
                var customer_deposit = search.lookupFields({
                    type: search.Type.CUSTOMER_DEPOSIT,
                    id: customer_deposit_id,
                    columns: ['custbody_email_8300', 'paymentmethod']
                });
                var form_sent = customer_deposit.custbody_email_8300; //check if form has already been filed
                log.debug('form_sent', form_sent);
                if (!form_sent) {
                    var payment_method = customer_deposit.paymentmethod[0].value;
                    log.debug('payment_method', payment_method);
                    if (cash_payment_methods.indexOf(payment_method) != -1) { //check for cash payments
                        //need to grab the invoice id from the apply lines
                        //look up field for sales order id from the invoice
                        //submit field for both tallys into that sales order
                        var customer_id = currentRecord.getValue('customer');
                        var customer = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: customer_id,
                            columns: ['entityid']
                        }).entityid;
                        log.debug('customer', customer);
                        var trans_date = new Date(currentRecord.getValue('trandate')) / 1;
                        log.debug('trans_date', trans_date);
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
                        log.debug('sender_email', sender_email);
                        log.debug('recipient_email', recipient_email);
                        var line_count = currentRecord.getLineCount('apply');
                        for (var i = 0; i < line_count; i++) {
                            var apply = currentRecord.getSublistValue({
                                fieldId: 'apply',
                                sublistId: 'apply',
                                line: i
                            });
                            if (apply) {
                                var to_apply = currentRecord.getSublistValue({
                                    fieldId: 'amount',
                                    sublistId: 'apply',
                                    line: i
                                });
                                log.debug('to_apply', to_apply);
                                var sales_order_id = currentRecord.getSublistValue({
                                    fieldId: 'createdfrom',
                                    sublistId: 'apply',
                                    line: i
                                });
                                log.debug('sales_order_id', sales_order_id);
                                var sales_order = search.lookupFields({
                                    type: search.Type.SALES_ORDER,
                                    id: sales_order_id,
                                    columns: ['custbody_dates_amounts_cash_payment', 'custbody_cash_payment_tally', 'tranid']
                                });
                                if (sales_order) {
                                    set_tallys_and_email(sales_order, sales_order_id, trans_date, to_apply, customer, sender_email, recipient_email);
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    function set_tallys_and_email(sales_order, sales_order_id, trans_date, to_apply, customer, sender_email, recipient_email) {
        var cash_payment_string = sales_order.custbody_dates_amounts_cash_payment || '{}';
        log.debug('cash_payment_object', cash_payment_string);
        var cash_tally = Number(sales_order.custbody_cash_payment_tally);
        log.debug('cash_tally', cash_tally);
        var cash_payment_object = JSON.parse(cash_payment_string);
        //RECORD PAYMENTS IN OBJECT DATE / AMOUNT
        if (Object.keys(cash_payment_object).length == 0) { //if there is no tally
            cash_payment_object[trans_date] = to_apply;
            cash_tally = to_apply;
        }
        else {
            log.debug('PARSING CASH PAYMENT OBJECT', cash_payment_object);
            var current_time = new Date() / 1;
            log.debug('current_time', current_time);
            for (var date in cash_payment_object) {
                var payment_date = new Date(date) / 1;
                var over_a_year = (current_time - payment_date) / (1000 * 3600 * 24 * 365) > 1;
                log.debug('over_a_year', over_a_year);
                if (over_a_year) {
                    cash_tally = cash_tally - cash_payment_object[date];
                    log.debug('over a year cash tally', cash_tally);
                    delete cash_payment_object[date];
                    log.debug('over a year cash payment object', JSON.stringify(cash_payment_object));
                }
            }
            if (cash_payment_object[trans_date]) {
                cash_payment_object[trans_date] = Number(cash_payment_object[trans_date]) + Number(to_apply);
            }
            else {
                cash_payment_object[trans_date] = to_apply;
            }
            cash_tally = cash_tally + to_apply;
        }
        if (cash_tally >= 10000) {
            log.debug('OVER 9999', 'SENDING EMAIL');
            var document_number = sales_order.tranid;
            log.debug('document_number', document_number);
            email.send({
                author: sender_email,
                recipients: recipient_email,
                subject: 'FORM 8300',
                body: customer + ' needs to file a 8300 form within the next 15 days for sales order ' + document_number
            });
            cash_tally = 0;
            cash_payment_object = {};
        }
        cash_payment_string = JSON.stringify(cash_payment_object);
        log.debug('cash_payment_string', cash_payment_string);
        log.debug('cash_tally', cash_tally);
        var saved = record.submitFields({
            type: record.Type.SALES_ORDER,
            id: sales_order_id,
            values: {
                custbody_dates_amounts_cash_payment: cash_payment_string,
                custbody_cash_payment_tally: cash_tally
            }
        });
        log.debug('RECORD SAVED', saved);
    }
});
