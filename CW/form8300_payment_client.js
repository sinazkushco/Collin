/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["require", "exports", "N/runtime"], function (require, exports, runtime) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var exec = runtime.executionContext;
    exports.validateDelete = function (context) {
        var valid = true;
        confirm_8300_change(valid, 'validate_delete', context);
        return valid;
    };
    exports.saveRecord = function (context) {
        var valid = true;
        confirm_8300_change(valid, 'save_record', context);
        return valid;
    };
    function confirm_8300_change(valid, client_event, context) {
        if (valid) {
            if (exec == runtime.ContextType.USER_INTERFACE) {
                var cash_payment_methods = ['1', '9'];
                var currentRecord = context.currentRecord;
                var payment_method = currentRecord.getValue('paymentmethod');
                if (cash_payment_methods.indexOf(payment_method) != -1) {
                    if (client_event == 'save_record') {
                        valid = confirm('WARNING! If you edit the total amount of this transaction or the amounts applied to invoices, you will prevent the system from making any Form 8300 calculations for the applied Sales Orders. Cash payments for these Sales Orders have to be manually tracked going forward. Are you sure you wish to continue?');
                    }
                    else if (client_event == 'validate_delete') {
                        valid = confirm('WARNING! If you delete this transaction, you will prevent the system from making any Form 8300 calculations for the applied Sales Orders. Cash payments for these Sales Orders have to be manually tracked going forward. Are you sure you wish to continue?');
                    }
                }
            }
        }
        return valid;
    }
});
