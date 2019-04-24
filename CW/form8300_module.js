/**
 *@NApiVersion 2.x
 */


define(["N/log", "N/email"], function (log, email) {
    function Form8300_methods() {
        this.set_tallys_and_email = function set_tallys_and_email(sales_order, sales_order_id, trans_date, to_apply, customer, sender_email, recipient_email) {
            if (!sales_order.custbody_flagged_8300) {
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
                    //TODO: set email needs to be sent field
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
        };
        this.compare_old_applied_invoices_notify_and_confirm = function compare_old_applied_invoices_notify_and_confirm(oldRecord, newRecord, sender_email, recipient_email, user_name, tran_id, action) {
            //build an object with the invoice number as the key and the amounts as the value
            var old_record_invoice_list = build_apply_to_invoice_object(oldRecord);
            var new_record_invoice_list = build_apply_to_invoice_object(newRecord);
            var customer = newRecord.getText('customer');
            var trans_date = new Date(newRecord.getValue('trandate')) / 1;
            var sales_orders_to_flag = [];
            var warn_accounting = false;
            var sales_order_fields;
            for (var invoice in new_record_invoice_list) {
                var sales_order_id = new_record_invoice_list[invoice].createdfrom;
                if (old_record_invoice_list[invoice]) {
                    var old_amount = old_record_invoice_list[invoice].amount;
                    var new_amount = new_record_invoice_list[invoice].amount;
                    if (!old_amount && new_amount) {
                        sales_order_fields = get_sales_order_fields(sales_order_id);
                        tally_email.set_tallys_and_email(sales_order_fields, sales_order_id, trans_date, new_amount, customer, sender_email, recipient_email);
                        warn_accounting = true;
                    } else if (old_amount != new_amount) {
                        sales_order_fields = get_sales_order_fields(sales_order_id);
                        sales_orders_to_flag.push(sales_order_fields.tranid);
                        record.submitFields({ //TODO: need to create a field for flagging
                            type: record.Type.SALES_ORDER,
                            id: sales_order_id,
                            values: {
                                custbody_flagged_8300: true
                            }
                        });
                        warn_accounting = true;
                    }
                }
            }//end for
            if (warn_accounting) {
                warn_accounting_email(sales_orders_to_flag, user_name, recipient_email, sender_email, action, tran_id);
            }
        };//end compare_old_applied_invoices_notify_and_confirm
        this.build_apply_to_invoice_object = function build_apply_to_invoice_object(record) {
            var line_count = record.getLineCount('apply');
            var apply_to_invoice_object = {
                applied: '',
                amount: '',
                createdfrom: ''
            };
            for (var i = 0; i < line_count; i++) {
                var internal_id = record.getSublistValue({
                    fieldId: 'internalid',
                    sublistId: 'apply',
                    line: i
                });
                var sales_order_id = search.lookupFields({
                    type: search.Type.INVOICE,
                    id: internal_id,
                    columns: ['createdfrom']
                });
                sales_order_id = sales_order_id.createdfrom[0].value;
                var sales_order = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: sales_order_id,
                    columns: ['custbody_flagged_8300']
                });
                var flagged_8300 = sales_order.custbody_flagged_8300;
                if (!flagged_8300) {
                    apply_to_invoice_object[internal_id] = {};
                    var applied = record.getSublistValue({
                        fieldId: 'apply',
                        sublistId: 'apply',
                        line: i
                    });
                    var amount = record.getSublistValue({
                        fieldId: 'amount',
                        sublistId: 'apply',
                        line: i
                    });
                    apply_to_invoice_object[internal_id].applied = applied;
                    apply_to_invoice_object[internal_id].amount = amount;
                    apply_to_invoice_object[internal_id].createdfrom = sales_order_id;
                    //log.debug('apply_to_invoice_object', apply_to_invoice_object);
                }
            }
            return apply_to_invoice_object;
        };//end build_apply_to_invoice_object

        //TODO: still need to move this into object
        this.warn_accounting_email = function warn_accounting_email(sales_orders_to_flag, user_name, recipient_email, sender_email, action, tranid) {
            email.send({
                author: sender_email,
                recipients: recipient_email,
                subject: 'FORM 8300',
                body: user_name + action + tranid + ', cash payments for the following sales orders need to be manually tracked : ' + sales_orders_to_flag.toString()
            });
        };

        this.flag_applied_sales_orders_on_delete = function flag_applied_sales_orders_on_delete(currentRecord, sender_email, recipient_email, user_name, tran_id, action) {
            var line_count = currentRecord.getLineCount('apply');
            var sales_orders_flagged = [];

            for (var i = 0; i < line_count; i++) {
                var apply = currentRecord.getSublistValue({
                    fieldId: 'apply',
                    sublistId: 'apply',
                    line: i
                });//boolean
                if (apply) {
                    var sales_order_id = currentRecord.getSublistValue({
                        fieldId: 'createdfrom',
                        sublistId: 'apply',
                        line: i
                    });
                    record.submitFields({ //TODO: need to create a field for flagging
                        type: record.Type.SALES_ORDER,
                        id: sales_order_id,
                        values: {
                            custbody_flagged_8300: true
                        }
                    });
                    var sales_order = get_sales_order_fields(sales_order_id);
                    sales_orders_flagged.push(sales_order.tranid);
                }
            }
            warn_accounting_email(sales_orders_flagged, user_name, recipient_email, sender_email, action, tran_id);
        };

        this.get_sales_order_fields = function get_sales_order_fields(sales_order_id) {
            return search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: sales_order_id,
                columns: ['custbody_dates_amounts_cash_payment', 'custbody_cash_payment_tally', 'tranid', 'custbody_flagged_8300']
            });
        };

        this.get_email_list = function get_email_list() {
            log.debug('form8300 module method', 'get_email_list');
            var sender_email;
            var recipient_email = [];
            if (runtime.envType != runtime.EnvType.SANDBOX) {
                sender_email = 943918;
                var employee_search = search.lookupFields({
                    type: 'customrecord_kch_field_controller',
                    id: '1',
                    columns: ['custrecord_employee_list']
                }).custrecord_8300_email_ist;
                var employee_array = employee_search.custrecord_8300_email_ist;
                for(var i = 0; i < employee_array.length; i++){
                    recipient_email.push(employee_array[i].value);
                }
            } else {
                sender_email = 714588;
                recipient_email = [714588];
            }
            log.debug('sender_email', sender_email);
            log.debug('recipient_email', recipient_email);
            return {
                sender_email: sender_email,
                recipient_email: recipient_email
            };
        };

        return {
            Form8300_methods: Form8300_methods
        };
    }
});
