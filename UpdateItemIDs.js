function UpdateItemIDs()
{
    var itemID = '';
    var searchresults = nlapiSearchRecord('inventoryitem', null, null, null);
    if (searchresults != null) {
        for (var i = 0; i < searchresults.length; i++) {
            var searchresult = searchresults[i];
            var internalID = searchresult.getId();
            if (internalID > 0)
            {
                var itemID = nlapiLookupField('inventoryitem', internalID, 'custitem_itemid');
                if (itemID == '')
                {
                    var itemRec = nlapiLoadRecord('inventoryitem', internalID);
                    if (itemRec != null) {
                        var sku = itemRec.getFieldValue('custitem_sku');
                        if (sku.length > 3) {
                            itemID = sku.substring(3);
                            itemID = itemID.substring(0, 7);

                            itemRec.setFieldValue('custitem_itemid', itemID);
                            var iid = nlapiSubmitRecord(itemRec);
                        }
                    }
                }
                else if (itemID.length > 7)
                {
                    itemID = itemID.substring(0, 7);
                    var itemRec = nlapiLoadRecord('inventoryitem', internalID);
                    if (itemRec != null) {
                            itemRec.setFieldValue('custitem_itemid', itemID);
                            var iid = nlapiSubmitRecord(itemRec);
                    }
                }
            }
        }
    }
}
