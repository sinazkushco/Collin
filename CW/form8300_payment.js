/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/search", "N/record", "N/email", "N/runtime", "/SuiteScripts/CW/form8300_module.js"], function (require, exports, log, search, record, email, runtime, form8300_methods) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            var currentRecord = context.newRecord;
            var action = void 0;
            var current_record_id = currentRecord.id.toString();
            var cash_payment_methods = ['1', '9'];
            var user_name = runtime.getCurrentUser().name;
            log.debug('user_name line 20', user_name);
            var email_list = form8300_methods.get_email_list();
            var sender_email = email_list.sender_email;
            var recipient_email = email_list.recipient_email;
            var payment_method = currentRecord.getValue({
                fieldId: 'paymentmethod'
            });
            var payment_id = search.lookupFields({
                type: "customerpayment",
                id: current_record_id,
                columns: ['tranid']
            }).tranid;
            log.debug('Payment Id line 32', payment_id);
            var oldRecord = context.oldRecord;
            if (cash_payment_methods.indexOf(payment_method) != -1) { //check for cash payments
                if (context.type == context.UserEventType.CREATE) {
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
                        //var timeStamp = new Date().getUTCMilliseconds();
                        email.send({
                            author: sender_email,
                            recipients: recipient_email,
                            subject: 'FORM 8300',
                            body: customer + ' needs to file a 8300 form within the next 15 days for ' + payment_id
                        });
                        record.submitFields({
                            type: 'customerpayment',
                            id: current_record_id,
                            values: {
                                custbody_email_8300: true
                            }
                        });
                    }
                    else {
                        var line_count = currentRecord.getLineCount('apply');
                        var trans_date = new Date(currentRecord.getValue('trandate')) / 1;
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
                                var sales_order = form8300_methods.get_sales_order_fields(sales_order_id);
                                if (sales_order) {
                                    form8300_methods.set_tallys_and_email(sales_order, sales_order_id, trans_date, to_apply, customer, sender_email, recipient_email);
                                }
                            }
                        }
                    }
                } //end if create
                else if (context.type == context.UserEventType.EDIT) {
                    action = 'edited';
                    form8300_methods.compare_old_applied_invoices_notify_and_confirm(oldRecord, currentRecord, sender_email, recipient_email, user_name, payment_id, action);
                } //end if edit
                else if (context.type == context.UserEventType.DELETE) {
                    action = 'deleted';
                    form8300_methods.flag_applied_sales_orders_on_delete(currentRecord, sender_email, recipient_email, user_name, payment_id, action);
                }
            } //end if cash
        } //ends if userinterface
    };
});
// function compare_old_applied_invoices_notify_and_confirm(oldRecord, newRecord, sender_email, recipient_email, user_name, tran_id, action) {
//     //build an object with the invoice number as the key and the amounts as the value
//     var old_record_invoice_list = build_apply_to_invoice_object(oldRecord);
//     var new_record_invoice_list = build_apply_to_invoice_object(newRecord);
//     var customer = newRecord.getText('customer') as string;
//     var trans_date = new Date(newRecord.getValue('trandate')) / 1 as number;
//     var sales_orders_to_flag = [];
//     var warn_accounting = false;
//     for (var invoice in new_record_invoice_list) {
//         var sales_order_id = new_record_invoice_list[invoice].createdfrom;
//         if (old_record_invoice_list[invoice]) {
//             var old_amount = old_record_invoice_list[invoice].amount
//             var new_amount = new_record_invoice_list[invoice].amount
//             if (!old_amount && new_amount) {
//                 var sales_order_fields = get_sales_order_fields(sales_order_id)
//                 tally_email.set_tallys_and_email(sales_order_fields, sales_order_id, trans_date, new_amount, customer, sender_email, recipient_email);
//                 warn_accounting = true;
//             } else if (old_amount != new_amount) {
//                 var sales_order_fields = get_sales_order_fields(sales_order_id)
//                 sales_orders_to_flag.push(sales_order_fields.tranid);
//                 record.submitFields({ //TODO: need to create a field for flagging
//                     type: record.Type.SALES_ORDER,
//                     id: sales_order_id,
//                     values: {
//                         custbody_flagged_8300: true
//                     }
//                 })
//                 warn_accounting = true;
//             }
//         }
//     }//end for
//     if (warn_accounting) {
//         warn_accounting_email(sales_orders_to_flag, user_name, recipient_email, sender_email, action, tran_id);
//     }
// }
// function build_apply_to_invoice_object(record) {
//     var line_count = record.getLineCount('apply');
//     var apply_to_invoice_object = {};
//     for (let i = 0; i < line_count; i++) {
//         let internal_id = record.getSublistValue({
//             fieldId: 'internalid',
//             sublistId: 'apply',
//             line: i
//         })
//         let sales_order_id = search.lookupFields({
//             type: search.Type.INVOICE,
//             id: internal_id,
//             columns: ['createdfrom']
//         })
//         sales_order_id = sales_order_id.createdfrom[0].value;
//         let sales_order = search.lookupFields({
//             type: search.Type.SALES_ORDER,
//             id: sales_order_id,
//             columns: ['custbody_flagged_8300']
//         })
//         var flagged_8300 = sales_order.custbody_flagged_8300;
//         if (!flagged_8300) {
//             apply_to_invoice_object[internal_id] = {};
//             let applied = record.getSublistValue({
//                 fieldId: 'apply',
//                 sublistId: 'apply',
//                 line: i
//             })
//             let amount = record.getSublistValue({
//                 fieldId: 'amount',
//                 sublistId: 'apply',
//                 line: i
//             })
//             apply_to_invoice_object[internal_id]['applied'] = applied;
//             apply_to_invoice_object[internal_id]['amount'] = amount;
//             apply_to_invoice_object[internal_id]['createdfrom'] = sales_order_id;
//             //log.debug('apply_to_invoice_object', apply_to_invoice_object);
//         }
//     }
//     return apply_to_invoice_object;
// }
// //TODO: still need to move this into object
// function warn_accounting_email(sales_orders_to_flag, user_name, recipient_email, sender_email, action, tranid) {
//     email.send({
//         author: sender_email,
//         recipients: recipient_email,
//         subject: 'FORM 8300',
//         body: user_name + action + tranid + ', cash payments for the following sales orders need to be manually tracked : ' + sales_orders_to_flag.toString()
//     });
// }
// function flag_applied_sales_orders_on_delete(currentRecord, sender_email, recipient_email, user_name, tran_id, action) {
//     let line_count = currentRecord.getLineCount('apply');
//     let sales_orders_flagged = [];
//     for (let i = 0; i < line_count; i++) {
//         let apply = currentRecord.getSublistValue({
//             fieldId: 'apply',
//             sublistId: 'apply',
//             line: i
//         }) as boolean
//         if (apply) {
//             let sales_order_id = currentRecord.getSublistValue({
//                 fieldId: 'createdfrom',
//                 sublistId: 'apply',
//                 line: i
//             }) as string
//             record.submitFields({ //TODO: need to create a field for flagging
//                 type: record.Type.SALES_ORDER,
//                 id: sales_order_id,
//                 values: {
//                     custbody_flagged_8300: true
//                 }
//             })
//             var sales_order = get_sales_order_fields(sales_order_id);
//             sales_orders_flagged.push(sales_order.tranid);
//         }
//     }
//     warn_accounting_email(sales_orders_flagged, user_name, recipient_email, sender_email, action, tran_id);
// }
// function get_sales_order_fields(sales_order_id) {
//     return search.lookupFields({
//         type: search.Type.SALES_ORDER,
//         id: sales_order_id,
//         columns: ['custbody_dates_amounts_cash_payment', 'custbody_cash_payment_tally', 'tranid', 'custbody_flagged_8300']
//     })
// }
