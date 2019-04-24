/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(["require", "exports", "N/log", "N/search", "N/record"], function (require, exports, log, search, record) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInputData = function (context) {
        //graph each warehouse that this cycle count will apply to (currently on GG) 
        return search.create({
            type: "customerdeposit",
            filters: [
                ["type", "anyof", "CustDep"],
                "AND",
                ["salesorder.custbody_payment_hold_backorder", "is", "T"]
            ],
            columns: [
                search.createColumn({
                    name: "tranid",
                    join: "salesOrder",
                    summary: "GROUP"
                }),
                search.createColumn({
                    name: "amount",
                    summary: "SUM"
                }),
                search.createColumn({
                    name: "amount",
                    join: "salesOrder",
                    summary: "MAX"
                }),
                search.createColumn({
                    name: "internalid",
                    join: "salesOrder",
                    summary: "GROUP"
                })
            ]
        });
    };
    exports.map = function (context) {
        //log.debug('context', context.value);
        var context_values = JSON.parse(context.value).values;
        var sales_order_ammount = Number(context_values['MAX(amount.salesOrder)']);
        //log.debug('sales_order_ammount type: ' + typeof sales_order_ammount, sales_order_ammount);
        var total_cd_amounts = Number(context_values["SUM(amount)"]);
        //log.debug('total_cd_amounts type: ' + typeof sales_order_ammount, total_cd_amounts);
        var sales_order_id = context_values["GROUP(internalid.salesOrder)"].value;
        //log.debug('sales_order_id', sales_order_id);
        if (sales_order_ammount <= total_cd_amounts) {
            var saved = record.submitFields({
                type: record.Type.SALES_ORDER,
                id: sales_order_id,
                values: {
                    'custbody_payment_hold_backorder': false,
                    'custbody_payment_hold_end_date': ''
                }
            });
            log.audit('payment hold fields cleared ', saved);
        }
    };
    exports.summarize = function (context) {
        log.debug('Summary Time', 'Total Seconds: ' + context.seconds);
        log.debug('Summary Usage', 'Total Usage: ' + context.usage);
        log.debug('Summary Yields', 'Total Yields: ' + context.yields);
        log.debug('Input Summary: ', JSON.stringify(context.inputSummary));
        log.debug('Map Summary: ', JSON.stringify(context.mapSummary));
        log.debug('Reduce Summary: ', JSON.stringify(context.reduceSummary));
        //Grab Map errors
        context.mapSummary.errors.iterator().each(function (key, value) {
            log.error(key, 'ERROR String: ' + value);
            return true;
        });
    };
});
