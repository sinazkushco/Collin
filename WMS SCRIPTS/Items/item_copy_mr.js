/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(["N/search", "N/record"], function (search, record) {

    function getInputData() {
        log.debug("PHASE", "GET INPUT");
        return search.create({
            type: "inventoryitem",
            filters: [
                ["custitem_wms_use_for_test", "is", "T"],
                "AND",
                ["custitem_old_item_name","isempty",""],
                "AND",
                ["custitem_new_item_id","isempty",""]
            ],
            columns: [
                search.createColumn({
                    name: "itemid",
                    sort: search.Sort.ASC
                }),
                "displayname",
                "salesdescription",
                "type",
                "baseprice",
                "custitem_sku",
                "custitem_wms_use_for_test"
            ]
        });
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        // you have the result row. use it like this....
        var oldItemId = searchResult.id;
        var oldItemDesc = searchResult.values.salesdescription;
        var itemRecord = record.copy({
            type: record.Type.INVENTORY_ITEM,
            id: oldItemId,
            isDynamic: false
        });

        var isMatrixChild = itemRecord.getValue("matrixtype") == "CHILD";

        if(isMatrixChild){
            itemRecord.setValue("parent", null);
            itemRecord.setValue("custitem1", null);
            itemRecord.setValue("matrixtype", null);
        }

        itemRecord.setValue("custitem_old_item_name", oldItemDesc);
        if (oldItemDesc.length > 56) {
            oldItemDesc = oldItemDesc.substring(0, 56) + "-NEW";
        } else {
            oldItemDesc = oldItemDesc + "-NEW";
        }
        itemRecord.setValue("itemid", oldItemDesc);
        itemRecord.setValue("isonline", false);
        itemRecord.setValue("isinactive", true);


        try {
            var newItemId = itemRecord.save();
            record.submitFields({
                type: 'inventoryitem',
                id: oldItemId,
                values: {
                    'custitem_new_item_id': newItemId
                }
            });
            log.debug("new item id", newItemId);
        } catch (e) {

            log.debug("Error: Item " + oldItemId, e);
        }


    }

    return {
        getInputData: getInputData,
        map: map
    };
});