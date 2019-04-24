/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/record", "N/search"], function (require, exports, record, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = function (context) {
        var pricingReviewed = context.newRecord.getValue("custitem_pricing_reviewed");
        var recordType = context.newRecord.type;
        var recordId = context.newRecord.getValue("id");
        var averageCost = search.lookupFields({
            type: recordType,
            id: recordId,
            columns: ['averagecost']
        });
        if (pricingReviewed) {
            record.submitFields({
                type: recordType,
                id: recordId,
                values: {
                    custitem_price_review_unit_cost: averageCost.averagecost,
                    custitem_price_last_reviewed: new Date(),
                    custitem_pricing_reviewed: false
                }
            });
            return;
        }
    };
});
