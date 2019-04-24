/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["require", "exports", "N/runtime", "N/currentRecord"], function (require, exports, runtime, current_record) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateLine = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            var currentRecord = current_record.get();
            var qty_to_transfer = Number(currentRecord.getCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'adjustqtyby',
            }));
            var qty_on_hand = Number(currentRecord.getCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'quantityonhand',
            }));
            if (currentRecord.type == 'inventorytransfer') {
                if (qty_to_transfer > qty_on_hand) {
                    alert('QTY. TO TRANSFER CANNOT BE GREATER THAN QTY ON HAND');
                    return false;
                }
            }
            else if (currentRecord.type == 'inventoryadjustment') {
                if (qty_to_transfer + qty_on_hand < 0) {
                    alert('ADJUST BY QUANTITY PLUS QTY ON HAND CANNOT BE LESS THAN 0');
                    return false;
                }
            }
        }
        return true;
    };
});
