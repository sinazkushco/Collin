
// Not Released : "1"
// Pending Release : "2"
// Partially Released : "3"
// Released : "4"
// Completed : "5"


define(['N/runtime', 'N/log', 'N/record', 'N/search', '../WMS SCRIPTS/Libraries/global_modules.js'],
    function (runtime, log, record, search, gm) {
        function afterSubmit(context) {

            //get current record
            var currentRecord = context.newRecord;
            //get value of 'status' field
            var recordStatus = currentRecord.getValue({
                fieldId: 'status'
            });

            // if 'status' is Pending, Partially or both, set to Complete
            if (recordStatus != "Pending Fulfillment" && recordStatus != "Partially Fulfilled" && recordStatus != "Partially Fulfilled/Pending Billing") {
                currentRecord.setValue({
                    fieldId: 'custbody_qwarehouse_status',
                    value: '5' //Complete
                });


                //search returns WMS locations
                var scale_warehouses = gm.get_warehouses_with_wms();
                scale_warehouses = ["location", "anyof"].concat(scale_warehouses);


                //search used to find all item fulfillments for current record.  Pass in scale_warehouse locations
                var itemfulfillmentSearchObj = search.create({
                    type: "itemfulfillment",
                    filters:
                        [
                            ["type", "anyof", "ItemShip"],
                            "AND",
                            ["createdfrom", "anyof", currentRecord.id],
                            "AND",
                            ["cogs", "is", "F"],
                            "AND",
                            ["shipping", "is", "F"], "AND", scale_warehouses
                        ],
                    columns:
                        [
                            "statusref",
                            "item",
                            "quantity"
                        ]
                });
                var itemFulfillments = {};
                var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
                log.debug("itemfulfillmentSearchObj result count", searchResultCount);
                //IF there are no item fulfillment records associated with the order, move to Pending Release.
                if (!searchResultCount) {
                    currentRecord.setValue({
                        fieldId: 'custbody_warehouse_status',
                        value: "2", //"Pending Release"
                    });
                }


                itemfulfillmentSearchObj.run().each(function (result) {
                    log.debug('results', result)
                    // result.getValue('item')
                    return true;
                });

            }

            return;
        }
    })


