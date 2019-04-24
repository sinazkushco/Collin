/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(["N/search", "N/record"], function (search, record) {

    function getInputData() {
        log.debug("PHASE", "GET INPUT");
        return search.create({
   type: "item",
   filters:
   [
      ["internalidnumber","equalto","10898"], 
      "OR", 
      ["internalidnumber","equalto","3650"], 
      "OR", 
      ["internalidnumber","equalto","10878"], 
      "OR", 
      ["internalidnumber","equalto","10857"], 
      "OR", 
      ["internalidnumber","equalto","5893"], 
      "OR", 
      ["internalidnumber","equalto","3646"]
   ],
   columns:
   [
      search.createColumn({
         name: "itemid",
         sort: search.Sort.ASC
      }),
      "displayname",
      "salesdescription",
      "type",
      "baseprice",
      "custitem_sku",
      "internalid"
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
        // itemRecord.setValue("custitem_item_reporting_key", null);
        itemRecord.setValue("itemid", oldItemDesc);
        try{
            itemRecord.setValue("custitem_old_item_ref", oldItemId);
        } catch (e2){
            //
        }

        itemRecord.setValue("isonline", false);
        itemRecord.setValue("isinactive", true);


        try {
            var newItemId = itemRecord.save();
            record.submitFields({
                type: "inventoryitem",
                id: oldItemId,
                values: {
                    "custitem_new_item_id_ref": newItemId
                }
            });
            
            log.debug("new item id", newItemId);
        } catch (e) {

            // if(newItemId){
            //     record.submitFields({
            //         type: "inventoryitem",
            //         id: oldItemId,
            //         values: {
            //             "custitem_new_item_id": newItemId
            //         }
            //     });
            // }

            // log.debug("Error: Item " + oldItemId, e);
        }


    }

    return {
        getInputData: getInputData,
        map: map
    };
});