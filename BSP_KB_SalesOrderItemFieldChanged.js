function BSP_SalesOrderItemFieldChanged(type, name) {
    var currentContext = nlapiGetContext();
   
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    var isSampleForm = (nlapiGetFieldValue('customform') === '169')
    if(isSampleForm){
        return;
    }

    if (type == 'item') {
        if (name == 'item') {
            if (execContext == 'webstore') {
                var GG_WAREHOUSE_ID = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location");
                location = GG_WAREHOUSE_ID; // Garden Grove Sandbox and Production;
                nlapiSetCurrentLineItemValue('item', 'location', location);
            } else if (execContext == 'userinterface') {
                var location = nlapiGetFieldValue('location');
                if ((location == undefined) || (location == null) || (location == '')) { } else {
                    var currLoc = nlapiGetCurrentLineItemValue('item', 'location');
                    if ((currLoc == undefined) || (currLoc == null) || (currLoc == '')) {
                        nlapiSetCurrentLineItemValue('item', 'location', location);
                    }
                }

                document.getElementById('amount_formattedValue').disabled = true;
            }
        } else if (name == 'custcol_item_sku') {
            if (execContext != 'webstore') {

                var location = nlapiGetFieldValue('location');
                if ((location == undefined) || (location == null) || (location == '')) { } else {
                    nlapiSetCurrentLineItemValue('item', 'location', location);
                }
            }
        }
    }
}

function BSP_SalesOrderItemRecalc(type) {

    var currentContext = nlapiGetContext();
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    if (execContext == 'webstore') {
        return;
    }

    if (type == 'item') {
        var rate = nlapiGetCurrentLineItemValue('item', 'rate');
        var quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
        var amount = nlapiGetCurrentLineItemValue('item', 'amount');

        if (amount != (rate * quantity)) {
            amount = rate * quantity;
            nlapiSetCurrentLineItemValue('item', 'amount', amount);
        }
    }
}

function BSP_SalesOrderItemPostSource(type, name) { 
    if (type != "item") {
        return;
    }

    var currentContext = nlapiGetContext();
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    var isSampleForm = (nlapiGetFieldValue('customform') === '169')
    if(isSampleForm){
        return;
    }

    if (type == "item") {
        if (name == "item") {
            if (execContext == "webstore") {
                var GG_WAREHOUSE_ID = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location");
                location = GG_WAREHOUSE_ID; // Garden Grove Sandbox and Production;
                nlapiSetCurrentLineItemValue("item", "location", location);
            } else if (execContext == "userinterface") {
                var isSampleForm = (nlapiGetFieldValue('customform') === '169') // Boolean true if Form Type is Sample Order
                var itemId = nlapiGetCurrentLineItemValue("item", "item");
                var location = nlapiGetFieldValue("location");
                var itemObj;
                if (isSampleForm) {
                    itemObj = getItemInfo(itemId, isSampleForm);
                } else {
                    itemObj = getItemInfo(itemId);
                }
                var itemObjKeys = Object.keys(itemObj);

                if (itemObjKeys.length === 0) {
                    var currLoc = nlapiGetCurrentLineItemValue("item", "location");
                    if ((currLoc == undefined) || (currLoc == null) || (currLoc == "")) {
                        nlapiSetCurrentLineItemValue("item", "location", location);
                    }

                    return;
                }

                var quantity = nlapiGetCurrentLineItemValue("item", "quantity");
                var defaultLocation = itemObj[itemObjKeys[0]].defaultLocation || false;
                var highestAvailableLocation = findHighestAvailable(itemObj);
                // console.log('Item Obj', itemObj);
                // console.log('location', itemObj[location]);
                // console.log('available', itemObj[location].available);
                // console.log("highest available location", highestAvailableLocation);
                if ((location == undefined) || (location == null) || (location == "")) {
                    // console.log('location is undefined');
                    // 
                } else if (itemObj[location] && itemObj[location].available > quantity) {
                    // console.log("condition 1 met");
                    nlapiSetCurrentLineItemValue("item", "location", location);
                } else if (highestAvailableLocation) {
                    // console.log("condition 2 met");
                    nlapiSetCurrentLineItemValue("item", "location", highestAvailableLocation);
                } else if (defaultLocation) {
                    // console.log("condition 3 met");
                    nlapiSetCurrentLineItemValue("item", "location", defaultLocation);
                } else {
                    // console.log("condition 4 met");
                    var currLoc = nlapiGetCurrentLineItemValue("item", "location");
                    if (isSampleForm) {
                        var sampleLocation = nlapiGetFieldValue('custbody_sample_location');
                        nlapiSetCurrentLineItemValue("item", "location", sampleLocation);
                        nlapiSetCurrentLineItemValue("item", "custcol_sample_location", sampleLocation);
                    } else if ((currLoc == undefined) || (currLoc == null) || (currLoc == "")) {
                        nlapiSetCurrentLineItemValue("item", "location", location);
                    }
                }

                // Syncs sample location and location values
                if (isSampleForm) {
                    nlapiDisableLineItemField('item', 'location', true)
                    nlapiSetCurrentLineItemValue("item", "custcol_sample_location", nlapiGetCurrentLineItemValue('item', 'location'));
                }

                document.getElementById("amount_formattedValue").disabled = true;


            }
        } else if (name == "custcol_item_sku") {
            if (execContext != "webstore") {
                var location = nlapiGetFieldValue("location");
                if ((location == undefined) || (location == null) || (location == "")) { } else {
                    nlapiSetCurrentLineItemValue("item", "location", location);
                }
            }
        }
    }
}

function getItemInfo(itemId, isSampleForm) {
    var itemObj = {},
        itemSearch

    if (isSampleForm) {
        // console.log('This is a sample order, loading custom search')
        itemSearch = nlapiSearchRecord("item", null,
            [
                ["internalidnumber", "equalto", itemId],
                "AND",
                ["type", "anyof", "InvtPart", "Kit"],
                "AND",
                ["inventorylocation.custrecord_is_sample_location", "is", "T"]
            ],
            [
                new nlobjSearchColumn("inventorylocation"),
                new nlobjSearchColumn("locationquantityavailable"),
                new nlobjSearchColumn("custitem_default_location"),
                new nlobjSearchColumn("custitem_uom_numeral")
            ]
        );
    } else {
        itemSearch = nlapiSearchRecord("item", null,
            [
                ["internalidnumber", "equalto", itemId],
                "AND",
                ["type", "anyof", "InvtPart", "Kit"],
                  "AND", 
                ["inventorylocation.makeinventoryavailablestore","is","T"]
            ],
            [
                new nlobjSearchColumn("inventorylocation"),
                new nlobjSearchColumn("locationquantityavailable").setSort(true),
                new nlobjSearchColumn("custitem_default_location"),
                new nlobjSearchColumn("custitem_uom_numeral") // SALES UNIT NUMBERAL
            ]
        );
    }

    if (itemSearch) {
        for (var i = 0; i < itemSearch.length; i++) {
            var inventoryLocation = itemSearch[i].getValue("inventorylocation");
            var quantityAvailable = itemSearch[i].getValue("locationquantityavailable");
            var defaultLocation = itemSearch[i].getValue("custitem_default_location");
            var UOM = itemSearch[i].getValue("custitem_uom_numeral") || "1";
            itemObj[inventoryLocation] = {
                available: quantityAvailable / UOM,
                defaultLocation: defaultLocation
            };
        }
    }
    return itemObj;
}


function findHighestAvailable(itemObj) {
    // console.log('Finding Highest Available', itemObj)
    for (var key in itemObj) {
        var quantityAvailable = itemObj[key].available;
        if (quantityAvailable) {
            return key;
        }
    }
    return false;
}