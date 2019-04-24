/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(["require", "exports", "N/log", "N/search", "N/record", "N/https"], function (require, exports, log, search, record, https) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInputData = function (context) {
        //graph each warehouse that this cycle count will apply to (currently on GG) 
        return search.create({
            type: "location",
            filters: [
                ["custrecord_location_cycle_count", "is", "T"]
            ],
            columns: [
                search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC
                })
            ]
        });
    };
    exports.map = function (context) {
        //create an inventory count for current location location
        log.debug('context.value', context.value);
        var location_id = JSON.parse(context.value).id;
        var itemSearchObj = search.create({
            type: "item",
            filters: [
                ["locationlastinvtcountdate", "on", "today"],
                "OR",
                ["locationnextinvtcountdate", "on", "today"],
                "AND",
                ["inventorylocation.internalidnumber", "equalto", location_id],
                "AND",
                ["type", "anyof", "InvtPart", "Assembly"],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({
                    name: "itemid",
                    sort: search.Sort.ASC
                }),
                "locationnextinvtcountdate",
                "locationinvtclassification",
                "locationlastinvtcountdate",
                "inventorylocation",
                'custitem_sku',
                "quantityonhand",
                "custitem2",
                search.createColumn({
                    name: "usesbins",
                    join: "inventoryLocation",
                    label: "Use Bins"
                })
            ]
        });
        var searchResultCount = itemSearchObj.runPaged().count;
        log.debug("itemSearchObj result count", searchResultCount);
        var item_array = [];
        itemSearchObj.run().each(function (result) {
            var result_values = result.getAllValues();
            var is_custom = result_values.custitem2;
            if (is_custom) { //if custom item
                var on_hand = result_values.quantityonhand;
                if (!on_hand) { //if inventory is 0
                    log.debug('cycle clearing item_id', result.id);
                    var record_type = result.recordType;
                    var request = {
                        url: '',
                        body: {}
                    };
                    request.url = 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c';
                    var payload = {
                        record_type: record_type,
                        item_id: result.id,
                        location_id: location_id
                    };
                    var payload_string = JSON.stringify(payload);
                    request.body = {
                        action: 'clear_cycle_count',
                        payload: payload_string
                    };
                    https.post(request);
                    return true;
                } //zero on hand
            } //is custom
            var item_obj = {
                id: result.id,
                sku: result_values.custitem_sku,
                usebins: result_values["inventoryLocation.usesbins"]
            };
            log.debug('item_obj', item_obj);
            item_array.push(item_obj); // .run().each has a limit of 4,000 results
            return true;
        });
        var inventory_count = record.create({
            type: record.Type.INVENTORY_COUNT,
            isDynamic: true
        });
        inventory_count.setValue('subsidiary', '1');
        inventory_count.setValue('location', location_id);
        for (var i = 0; i < item_array.length; i++) {
            try {
                if (item_array[i].usebins) {
                    var bins = ['1003', '1002']; //current GG
                    for (var j = 0; j < bins.length; j++) {
                        inventory_count.selectNewLine({
                            sublistId: 'item',
                        });
                        inventory_count.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: item_array[i].id
                        });
                        inventory_count.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'binnumber',
                            value: bins[j]
                        });
                        inventory_count.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'memo',
                            value: item_array[i].sku
                        });
                        inventory_count.commitLine('item');
                    }
                }
                else {
                    inventory_count.selectNewLine({
                        sublistId: 'item',
                    });
                    inventory_count.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: item_array[i].id
                    });
                    inventory_count.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'memo',
                        value: item_array[i].sku
                    });
                    inventory_count.commitLine('item');
                }
            }
            catch (e) {
                log.debug('error', e);
                item_array.splice(i, 1);
                i--;
                //log.error('error at adding item', e);
            }
        }
        inventory_count.save();
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
// function get_bin_inventory(item_id, location_id) {
//     var output = {};
//     var bin_inventory_search = search.create({
//         type: "item",
//         filters:
//             [
//                 ["inventorydetail.binnumber", "anyof", "1003", "1002"],
//                 "AND",
//                 ["inventorydetail.location", "anyof", location_id],
//                 "AND",
//                 ["binonhand.binnumber", "anyof", "1003", "1002"],
//                 "AND",
//                 ["internalidnumber", "equalto", item_id]
//             ],
//         columns:
//             [
//                 search.createColumn({
//                     name: "quantityonhand",
//                     join: "binOnHand"
//                 }),
//                 search.createColumn({
//                     name: "binnumber",
//                     join: "binOnHand"
//                 })
//             ]
//     });
//     var bin_inventory = [];
//     var searchResultCount = bin_inventory_search.runPaged().count;
//     if (searchResultCount) {
//         bin_inventory_search.run().each(function (result) {
//             bin_inventory.push(result.getAllValues())
//             return true;
//         });
//         for (var i = 0; i < bin_inventory.length; i++) {
//             var bin_number = bin_inventory[i]['binOnHand.binnumber'][0].value;
//             var quantityonhand = bin_inventory[0]['binOnHand.quantityonhand'];
//             output[bin_number] = quantityonhand;
//         }
//     }
//     return output;
// }
