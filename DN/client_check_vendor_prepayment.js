/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.saveRecord = function (context) {
        var checkPassed = true;
        var currentRec = context.currentRecord;
        var lineCount = currentRec.getLineCount({
            sublistId: 'item'
        });
        for (var i = 0; i < lineCount; i++) {
            var itemId = currentRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
            if (itemId === "9560") {
                var recordTotal = currentRec.getValue("total");
                var prepaymentAmount = currentRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });
                if (parseFloat(prepaymentAmount) > parseFloat(recordTotal)) {
                    checkPassed = false;
                }
            }
        }
        if (checkPassed === false) {
            alert("Prepayment line cannot exceed the value of the PO.");
        }
        return checkPassed;
    };
});
