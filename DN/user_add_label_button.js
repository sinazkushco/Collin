/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.beforeLoad = function (context) {

        var form = context.form;
        var itemId = context.newRecord.id;
        var itemType = context.newRecord.type;
        
        form.clientScriptModulePath = "./client_call_label_suitelet.js";
        form.addButton({
            functionName: "callLabelSuitelet('" + itemId + "'," + "'" + itemType  +"'" + ")",
            id: "custpage_call_label_suitelet",
            label: "Generate Item Label"
        });

    };
});