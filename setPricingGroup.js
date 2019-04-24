
//script is called when a new item is created.
//checks if item pricing group is empty, if empty, set to Pricing Group A

function setPricingGroup(type) {
    if (type == 'create') {
        var tt_itemGroup = nlapiGetFieldValue('custitem_tt_item_group')
        if (!tt_itemGroup) {  
            nlapiSetFieldValue('custitem_tt_item_group', '1')
        }
    }
}
