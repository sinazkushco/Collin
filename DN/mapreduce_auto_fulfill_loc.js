/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record'],
    function(search, record)
    {
        function getInputData(){
            return search.create({
                type: "salesorder",
                filters: [
                    ["type", "anyof", "SalesOrd"],
                    "AND", ["status","anyof","SalesOrd:D","SalesOrd:E","SalesOrd:B"], 
                    "AND", ["custbody_natural_products_fulfilled", "is", "F"],
                    "AND", ["mainline", "is", "F"],
                    "AND", ["location", "anyof", "34"]
                ],
                columns:    [
                    "internalid"
                ],
            });
        }

        function map(context)
        {
            var searchResult = JSON.parse(context.value);

            var salesOrderId = searchResult.id;
            
            try {
                log.debug("process", "create item fulfillment");
                createItemFulfillment(salesOrderId);

            }catch(e){
                // 
                log.debug("error", e);
            }
        }

        function createItemFulfillment(salesOrderId){
            var changesMade = false;

            var newItemFulfillment = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: salesOrderId,
                toType: record.Type.ITEM_FULFILLMENT,
                isDynamic: true
            });
            
            log.debug("process", "item fulfillment transformed");
            var itemCount = newItemFulfillment.getLineCount("item");
            log.debug("item count", itemCount);
            for (var i = 0; i < itemCount; i++) {
                var itemLocation = newItemFulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: i
                });
                log.debug("item location", itemLocation);
                
                if (itemLocation == "34") {
                    changesMade = true;
                    newItemFulfillment.selectLine({
                        sublistId: 'item',
                        line: i
                    });

                    newItemFulfillment.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemreceive',
                        value: true
                    });

                    newItemFulfillment.commitLine({
                        sublistId: 'item'
                    });

                }
            }
            
            if(changesMade){
                log.debug("process", "changes made");
                newItemFulfillment.setValue("shipstatus", "A"); // Sets to ready to be picked
                newItemFulfillment.save();
                log.debug("process", "after save");
                record.submitFields({
                    type: 'salesorder',
                    id: salesOrderId,
                    values: {
                        'custbody_natural_products_fulfilled': true
                    }
                });
            }
        }
 
        return {
            getInputData: getInputData,
            map: map
        };
    });