/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/record", "N/search"], function (require, exports, log, record, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = function (context) {
        log.debug("type", context.type);
        if (context.type === context.UserEventType.EDIT ||
            context.type === context.UserEventType.CREATE) {
            var newSalesOrder = context.newRecord;
            var oldSalesOrder = context.oldRecord;
            var newProjectId = newSalesOrder.getValue({ fieldId: "job" }) || "";
            var oldProjectId = void 0;
            try {
                oldProjectId = oldSalesOrder.getValue({ fieldId: "job" }) || "";
            }
            catch (e) {
                oldProjectId = "";
            }
            var transactionId = context.newRecord.id;
            var transactionType = context.newRecord.type;
            log.debug("old project id", oldProjectId);
            log.debug("new project id", newProjectId);
            if (oldProjectId !== newProjectId && newProjectId !== "") {
                log.debug("transaction type", transactionType);
                if (transactionType === "salesorder") {
                    // let salesorderField = nlapiLookupField("job", projectId, "custentity_pm_sales_order_record");
                    var salesorderField = search.lookupFields({
                        type: search.Type.JOB,
                        id: newProjectId,
                        columns: ["custentity_pm_sales_order_record"]
                    }).custentity_pm_sales_order_record.value;
                    log.debug("sales order field", salesorderField);
                    if (!salesorderField) {
                        record.submitFields({
                            type: "job",
                            id: newProjectId,
                            values: {
                                custentity_pm_sales_order_record: transactionId
                            }
                        });
                    }
                }
                if (transactionType === "estimate") {
                    var estimateField = search.lookupFields({
                        type: search.Type.JOB,
                        id: newProjectId,
                        columns: ["custentity_pm_estimate_record"]
                    }).custentity_pm_estimate_record.value;
                    if (!estimateField) {
                        record.submitFields({
                            type: "job",
                            id: newProjectId,
                            values: {
                                custentity_pm_estimate_record: transactionId
                            }
                        });
                    }
                }
            }
        }
    };
});
