function stop_insert_between_ct_items(exec) {
    try {
        var context = nlapiGetContext()
        var user = context.user;
        var soCreatedDate = nlapiGetFieldValue("createddate") || new Date().toLocaleString();
        soCreatedDate = Date.parse(soCreatedDate);

        

        if (soCreatedDate < 1549328400000) { // before 2/4/2019 5:00 pm
            return;
        }

        // if(user !== "806057"){return}

        debugger;
        var item_id = nlapiGetCurrentLineItemValue('item', 'item');
        // if (item_id == '15740') { //Sandbox item
        if (item_id == '15806') { //Production item

            if (exec == 'userinterface') {

                alert('You cannot insert between a subcharge and its item');
            }
            return false;
        }
    } catch (e) {
        nlapiLogExecution('DEBUG', 'ERROR AT STOP stop_insert_between_ct_items', e);
    }
    return true;
}


// function validate_delete(exec){
//     var index = nlapiGetCurrentLineItemIndex('item');
//     var ct = nlapiGetCurrentLineItemValue('item','custcol_kush_cteligible');
//     // var item_id  = nlapiGetCurrentLineItemValue('item','item');
//     if(ct == 'T'){
//         nlapiRemoveLineItem('item', index+1);
//     }   
//     // else if(item_id == '15738'){
//     //     nlapiRemoveLineItem('item', index-1);
//     // }
//     return true;
// }

// var tariff = nlapiGetCurretLineItemValue('item','custcol_kush_cteligible');
// if(tariff == 'T'){
//     nlapiInsertLineItem('item', index);
//     nlapiSetCurrentLineItemValue('item','item','15738');
//     nlapiCommitLineItem('item');
// }


function recalcTariffs() {
    var context = nlapiGetContext()
    var user = context.user;
    var soCreatedDate = nlapiGetFieldValue("createddate") || new Date().toLocaleString();
    soCreatedDate = Date.parse(soCreatedDate);

    var authorizedUsers = {
        1226574: 'Randy',
        806057: 'Matt',
        528 : 'LJ',
        1044073 : 'Alexis'
    }

    if (soCreatedDate < 1549328400000 || authorizedUsers[user]) { // before 2/4/2019 5:00 pm
        return;
    }

 




    var itemLineCount = nlapiGetLineItemCount("item") + 1;
    if (itemLineCount == 1) {
        return;
    }
    var running;

    if (!window.sessionStorage.getItem('tariffs running')) {
        window.sessionStorage.setItem('tariffs running', true);
    } else {
        running = true;
    }

    if (running) {
        return;
    }

    for (var i = 1; i < itemLineCount; i++) {
        nlapiSelectLineItem("item", i);
        var itemDescription = nlapiGetCurrentLineItemValue("item", "description");
        var itemAmount = nlapiGetCurrentLineItemValue("item", "amount");
        var isCtItem = nlapiGetCurrentLineItemValue("item", "custcol_kush_cteligible") == "T" ? true : false;
        // var isCtSurcharge = nlapiGetCurrentLineItemValue("item", "item") == "15740" ? true : false; //Sanbox item
        var isCtSurcharge = nlapiGetCurrentLineItemValue("item", "item") == "15806" ? true : false; //Production item

        var nextLineExist = nlapiGetLineItemValue("item", "item", i + 1);

        if (isCtItem) {
            if (nextLineExist) {
                var nextItem = nlapiGetLineItemValue("item", "item", i + 1);
                var nextItemAmount = nlapiGetLineItemValue("item", "amount", i + 1);
                var tariffAmount = itemAmount * .03;
                // if (nextItem == 15740) { //Next item is surcharge Sandbox item
                if (nextItem == 15806) { //Next item is surcharge Prodcution item

                    if (nextItemAmount == tariffAmount) { //Do amounts match?
                        continue;
                    } else { //Amounts dont match
                        nlapiSelectLineItem("item", i + 1);
                        addCtSurcharge(itemAmount, itemDescription, false); //Surcharge Update
                        i++;
                    }
                } else { //next item is not a surcharge but needs to be
                    nlapiInsertLineItem("item", i + 1);
                    addCtSurcharge(itemAmount, itemDescription, true); //Surcharge Add
                    i++;
                    itemLineCount++;
                }
            } else { //No line exist in front, make new line
                nlapiSelectNewLineItem("item");
                addCtSurcharge(itemAmount, itemDescription, true); //Surcharge Add
            }
        } else if (isCtSurcharge) {
            if (i == 1) { //Surcharge is the first item
                nlapiRemoveLineItem("item", i);
                i--;
                itemLineCount--;
            } else {
                var prevItemIsCt = nlapiGetLineItemValue("item", "custcol_kush_cteligible", i - 1) == "T" ? true : false;
                if (!prevItemIsCt) {
                    nlapiRemoveLineItem("item", i);
                    i--;
                    itemLineCount--;
                }
            }

        }

    }
    window.sessionStorage.removeItem('tariffs running');

    function addCtSurcharge(itemAmount, itemDescription, newItem) {
        if (newItem) {
            // nlapiSetCurrentLineItemValue('item', 'item', 15740, true, true); //Sandbox item
            nlapiSetCurrentLineItemValue('item', 'item', 15806, true, true);
            // nlapiSetCurrentLineItemValue('item', 'item', 15740, false); //Faster
        }
        var ctRate = itemAmount * .03;
        nlapiSetCurrentLineItemValue('item', 'quantity', 1);
        // nlapiSetCurrentLineItemValue("item", "description", "Tariff Charge - " + itemDescription);
        // nlapiSetCurrentLineItemValue('item', 'taxcode', 43, false); //Avatax
        // nlapiSetCurrentLineItemValue('item', 'location', 56, false); //New GG  
        nlapiSetCurrentLineItemValue("item", "description", "Chinese Import Duty - 3% ");
        nlapiSetCurrentLineItemValue('item', 'rate', ctRate);
        nlapiCommitLineItem("item");
    }
}