function loopThroughTransaction() {
    //load transaction to loop through
    var transactionType = nlapiGetRecordType();
    var transactionId = nlapiGetRecordId();
    var loadedRecord = nlapiLoadRecord(transactionType, transactionId);
    var itemCount = loadedRecord.getLineItemCount("item");
    var customerId = loadedRecord.getFieldValue("entity");
    var submitTransactionRecord = false;

    if (itemCount) {
        for (var i = 1; i < itemCount + 1; i++) {
            var templateItemId = loadedRecord.getLineItemValue("item", "item", i);
            var itemName = loadedRecord.getLineItemValue("item", "description", i);
            var itemRate = loadedRecord.getLineItemValue("item", "rate", i);
            var itemCustom = nlapiLookupField("inventoryitem", templateItemId, "parent", true).indexOf("BRANDED") > -1;

            if (itemCustom) {
                var customItemId = createCustomItem(templateItemId, itemName, customerId);
                if (customItemId) {
                    loadedRecord.setLineItemValue("item", "item", i, customItemId);
                    loadedRecord.setLineItemValue("item", "description", i, itemName);
                    loadedRecord.setLineItemValue("item", "price", i, -1);
                    loadedRecord.setLineItemValue("item", "rate", i, itemRate);
                    submitTransactionRecord = true;
                }
            }
        }
        if (submitTransactionRecord) {
            var recordSubmitSucessful = nlapiSubmitRecord(loadedRecord);
            if (recordSubmitSucessful) {
                location.reload();
            }
        }
    }
    //TODO: Conditional to make sure item is branded
    //loop through items on transaction
    //calls create custom item
    //add customer field/ add sku/ make name the description
}

/** 
 * @param {string} templateItemId - the internal ID of the template item
 * @param {string} itemName - the description field on the line item
 * @param {string} customer - the internal ID of the customer
 */
function createCustomItem(templateItemId, itemName, customer) {
    var newCustomItem = nlapiCopyRecord("inventoryitem", templateItemId);
    var parentSku = findParentSku(customer);
    var customItemName = createCustomItemName(itemName, customer);
    newCustomItem.setFieldValue("itemid", customItemName); //TODO: ADD FUNCTION THAT MODIFIES NAME
    newCustomItem.setFieldValue("custitem_customer", customer);
    newCustomItem.setFieldValue("custitem_created_from_custom", templateItemId);
    newCustomItem.setFieldValue("parent", parentSku);
    //TODO: CLEAR PRICING LEVELS
    clearPricingLevels(newCustomItem);
    setNewSku(newCustomItem);
    try {
        var newItemId = nlapiSubmitRecord(newCustomItem);
        if (newItemId) {
            alert(itemName + " created.");
            return newItemId;
        }
    } catch (e) {
        alert(itemName + " creation failed. Error Message: " + e.details);
        return false;
    }

}

function clearPricingLevels(newCustomItem) {
    for (var i = 1; i < 9; i++) {
        newCustomItem.setLineItemValue("price", "price_" + i +"_", 1, "");
        if(i != 1){
            newCustomItem.setMatrixValue("price","price", i, ""); //FIXME: NOT WORKING FOR SOME REASON
        }
    }
}

function createCustomItemName(itemName, customer) {
    var newItemName = itemName.substring(0, 57);

    console.log(itemName);
    console.log(newItemName.length);
    console.log(newItemName);
    var increment = 0;
    var itemSearch = true;

    while (itemSearch) {
        increment++;
        newItemName = itemName.substring(0, 57) + " " + increment;
        itemSearch = nlapiSearchRecord("item", null, [
            ["name", "is", newItemName],
            "AND", ["custitem_customer", "anyof", customer]
        ], [
            new nlobjSearchColumn("itemid").setSort(false)
        ]);
    }
    console.log("before return", itemName + " " + itemName.length);
    return newItemName;

}

function findParentSku(customer) {
    var inventoryitemSearch = nlapiSearchRecord("inventoryitem", null, [
        ["parent.name", "haskeywords", "CUSTOM"],
        "AND", ["custitem_sku", "isempty", ""],
        "AND", ["type", "anyof", "InvtPart"],
        "AND", ["custitem_customer", "anyof", customer]
    ], [
        new nlobjSearchColumn("internalid"),
        new nlobjSearchColumn("itemid").setSort(false)
    ]);

    if (inventoryitemSearch) {
        var parentId = inventoryitemSearch[0].getValue("internalid");
        return parentId;
    } else {
        //create item 
        var newParentSku = createParentSku(customer);
        return newParentSku;
    }
}

function createParentSku(customer) {
    var newParentRecord = nlapiCreateRecord('inventoryitem');
    newParentRecord.setFieldValue("custitem2", "T");
    newParentRecord.setFieldValue("custitem_customer", customer);
    newParentRecord.setFieldValue("parent", 4348); //ID FOR CUSTOM
    //var customerName = newParentRecord.getFieldText("custitem_customer");
    var customerName = nlapiLookupField('customer', customer, "entityid");
    newParentRecord.setFieldValue("itemid", customerName);
    newParentRecord.setFieldValue("taxschedule", 1);
    var newParentRecordId = nlapiSubmitRecord(newParentRecord);
    return newParentRecordId;

}

/** Function pulled and modified from BSP Field Change Script File
 * @param {Obj} newCustomItem - new copied record
 */
function setNewSku(newCustomItem) {

    var newItemID = null;
    /* we dont want to generate a new SKU if the user is merely changing classes and an itemID wasnt generated */

    /* if we dont have a SKU or an itemID, we need to generate a new itemID.  then set that new itemID */
    try {
        newItemID = getNewIncrement(); //if the catch block triggers, 97% chance its due to this. check if the saved search exists or the intID got changed.
        if (newItemID) {
            newCustomItem.setFieldValue('custitem_itemid', newItemID); //if the catch block triggers, 2% chance its due to this
        }
    } catch (errorJSON) {
        console.error(errorJSON);
        var errorString = JSON.stringify(errorJSON);
        throw "Error in NetSuite's backend. Contact your administrator with this error object: " + errorString;
    }


    /* if a new itemID was generated, we need to update the SKU.  */
    try {
        if (newItemID) {
            var itemClass = newCustomItem.getFieldValue('class');
            if (itemClass > 0) {
                var classCode = nlapiLookupField('classification', itemClass, 'custrecordcustom_class_code');
                var newSKU = classCode + '-' + newItemID;
                newCustomItem.setFieldValue('custitem_sku', newSKU);
            }
        }
    } catch (errorJSON) {
        console.error(errorJSON);
        errorString = JSON.stringify(errorJSON);
        throw "Error in NetSuite's backend. Contact your administrator with this error object: " + errorString;
    }

}

//Function pulled and modified from BSP Field Change Script File
function getNewIncrement() {
    /* This Saved Search ID#112 should return: an Array of records sorted by highest itemID */
    var results = nlapiSearchRecord('item', 112);

    if (results.length > 0) {
        var highestItemIDinSystem = nlapiLookupField('item', results[0].getId(), 'custitem_itemid'); //if the catch block triggers, 1% chance its due to this. check if custitem_itemid got deleted or was removed from the item/form
        /* Increments the itemID by 1 */
        if (highestItemIDinSystem) {
            var newID = parseInt(highestItemIDinSystem, 10) + 1;
            if (isNaN(newID)) {
                return false; //chance to return NaN if search returns a non-numeric value from .getId()
            } else {
                newID = '0000000' + newID.toString();
                newID = newID.substring(newID.length - 7, newID.length);
            }
        } else {
            newID = '0000001'; //If this block runs, the database may have been wiped?  Or check the saved search
        }
        return newID;
    } else {
        console.error('We want to update the SKU, but zero results were returned from the search. Check the search criteria.');
    }
    return false;
}