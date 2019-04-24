 /**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/log', 'N/record', 'N/http'],
function (search, log, record, http) {

    function getInputData() {
        return search.create({
            type: "salesorder",
            filters:
            [
               ["type","anyof","SalesOrd"], 
               "AND", 
               ["shippingcost","greaterthan","0.00"], 
               "AND", 
               ["item.type","anyof","Assembly","InvtPart"],
               "AND", 
               ["trandate","within","fivedaysago"]
            ],
            columns:
            [
               "tranid",
               "item",
               "custcol_item_sku",
               "location",
               "shipzip",
               "shippingcost"
            ]
        });
    }

    function reduce(context) {
        log.debug('context',JSON.stringify(context));
    }

 
    return {
        getInputData: getInputData,
        reduce: reduce
    };
});