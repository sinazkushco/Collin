/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fieldChanged = function (context) {
        if (context.fieldId === "paymentmethod") {
            var currentPaymentMethod = context.currentRecord.getValue({ fieldId: "paymentmethod" });
            console.log(currentPaymentMethod);
        }
    };
});
