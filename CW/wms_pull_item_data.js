/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(["require", "exports", "N/log", "N/search"], function (require, exports, log, search) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var columns = [];
    var item_info = [];
    exports.getInputData = function (context) {
        //graph each warehouse that this cycle count will apply to (currently on GG) 
        return search.create({
            type: "item",
            filters: [
                ["type", "anyof", "InvtPart", "Assembly"],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns: [
                "subsidiary",
                "department",
                "salesdescription",
                "custitem_sku",
                "itemid",
                "category",
                "custitem_uom_numeral",
                "averagecost",
                "shipindividually",
                "custitem_no_re_packaging",
                "isinactive",
                "custitem_hazmat_item",
                "class"
            ]
        });
    };
    exports.map = function (context) {
        //create an inventory count for current location location
        log.debug('context', JSON.stringify(context));
        log.debug('context.value', context.value);
        //var context_obj = JSON.parse(context.value);
        //var item_id = context_obj.id;
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
