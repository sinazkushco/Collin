/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/url"], function (require, exports, url) {
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.beforeLoad = function (context) {
        if (context.type != context.UserEventType.VIEW){
            return;
        }

        var suiteletUrl = url.resolveScript({
            scriptId: "customscript_wms_suitelet_str_reprocess",
            deploymentId: "customdeploy_wms_suitelet_str_reprocess",
            returnExternalURL: true
        });

        var json = context.newRecord.getValue({fieldId: "custrecord_wms_json"});
        var direction = context.newRecord.getText({fieldId: "custrecord_wms_direction"});
        var type = context.newRecord.getText({fieldId: "custrecord_wms_record_type"});
        var batchId = context.newRecord.id;
        var form = context.form;

        var label = "Reprocess";
        if(direction == "Inbound"){
            label = "Reprocess";
        } else if (direction == "Outbound"){
            label = "Re-Send XML";
        } else {
            return;
        }

        form.clientScriptModulePath = "./client_str_reprocessing.js";
        form.addButton({
            functionName: "postToReprocess('" + direction + "','" + json + "','" + type + "','" + batchId + "','" + suiteletUrl +"')",
            id: "custpage_str_reprocess",
            label: label
        });

    };
});