/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = function (context) {
        var form = context.form;
        var sublist = form.getSublist({ id: "customsublist8" });
        // sublist.addField({
        //     id: 'custpage_productfield',
        //     label: 'product',
        //     type: ui.FieldType.SELECT,
        //     source: "131"
        // });
        // sublist.addRefreshButton();
        sublist.addButton({ id: 'custpage_pm_add_product', label: 'Add Product', functionName: 'customrecord_configurator' });
    };
});
