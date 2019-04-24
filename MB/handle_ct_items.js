// // page level variables
// var surcharge = false;  // do we want to add a surcharge item?
// var no_recurse = false;  // do not recurse when we add a line in script
// var CONST_SURCHARGE_ITEM = '15806';  // constant defines my item SKU internal id for Surcharge item
var isTariff_recurse = false;
var item_recurse = false;

// var defaultLocation = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location") //"6"; //defaults the location to Santa Ana
var defaultLocation = "66"

// validate hook
function validateline(sublist) {
    //SO form only
    if (nlapiGetFieldValue('customform') !== '109') return true;
    var context = nlapiGetContext();
    var user = context.user;
    var lines = parseInt(nlapiGetCurrentLineItemIndex(sublist));
    masterLineCount = lines



    surcharge = false;
    if (no_recurse) { return true };
    var surcharge_req = nlapiGetCurrentLineItemValue(sublist, "custcol_kush_cteligible");

    if (surcharge_req) {
        if (surcharge_req == 'T') {
            surcharge = true;
        }
    }
    return true;
}



// recalc hook
function recalc(sublist) {
    //SO form only
    if (nlapiGetFieldValue('customform') !== '109') return true;
    if (sublist == 'promotions') {
        return true;
    }


    var context = nlapiGetContext();
    var user = context.user;

    if (no_recurse) return true;
    if (!surcharge) return true;
    // var recalcline = parseInt(nlapiGetCurrentLineItemIndex(sublist));
    var recalcline = masterLineCount;
    var lines = parseInt(nlapiGetLineItemCount(sublist));

    // if(masterLineCount < lines){ // check if a promotion has moved us to a new line.  If so, move back one line
    //     recalcline = recalcline -1;
    // }
    nlapiSelectLineItem(sublist, recalcline)
    // var nextLine = recalcline + 1;
    var nextLine = recalcline + 1;
    var nextLine_item = nlapiGetLineItemValue(sublist, "item", nextLine);
    var itemAmount = nlapiGetLineItemValue("item", "amount", recalcline);
    var tariffAmount = itemAmount * .03;
    var new_line = parseInt(recalcline) + parseInt(1);

    if (surcharge) {
        // are we on the last line already? Add a line
        // otherwise insert a line
        if (recalcline == lines) {
            no_recurse = true;
            recurse_promotions = true;
            nlapiSelectNewLineItem(sublist);
            nlapiSetCurrentLineItemValue(sublist, 'item', CONST_SURCHARGE_ITEM, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'location', defaultLocation, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'quantity', 1, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'rate', tariffAmount, true, true);
            nlapiSetCurrentLineItemValue(sublist, "description", "Chinese Import Duty ", true, true);
            nlapiCommitLineItem(sublist);
            no_recurse = false;
        }
        else if (nextLine_item == CONST_SURCHARGE_ITEM) {
            no_recurse = true;
            recurse_promotions = true;
            nlapiSelectLineItem(sublist, nextLine)
            nlapiSetCurrentLineItemValue(sublist, 'rate', tariffAmount, true, true);
            nlapiCommitLineItem(sublist);
            no_recurse = false;


        }
        else if (lines == new_line) {
            // no_recurse = true;
            // nlapiInsertLineItem(sublist, new_line);
            // nlapiSetCurrentLineItemValue(sublist, 'item', CONST_SURCHARGE_ITEM, true, true);
            // nlapiSetCurrentLineItemValue(sublist, 'location', "6", true, true);
            // nlapiSetCurrentLineItemValue(sublist, 'quantity', 1, true, true);
            // nlapiSetCurrentLineItemValue(sublist, 'rate', tariffAmount, true, true);
            // nlapiSetCurrentLineItemValue(sublist, "description", "Chinese Import Duty ", true, true);

            // nlapiCommitLineItem(sublist);
            // no_recurse = false;

            no_recurse = true;
            recurse_promotions = true;
            nlapiSelectLineItem(sublist, nextLine)
            nlapiSetCurrentLineItemValue(sublist, 'item', CONST_SURCHARGE_ITEM, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'location', defaultLocation, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'quantity', 1, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'rate', tariffAmount, true, true);
            nlapiSetCurrentLineItemValue(sublist, "description", "Chinese Import Duty ", true, true);
            nlapiCommitLineItem(sublist);
            no_recurse = false;

        }
        else if (lines > new_line) {
            no_recurse = true;
            recurse_promotions = true;
            nlapiInsertLineItem(sublist, new_line);
            nlapiSetCurrentLineItemValue(sublist, 'item', CONST_SURCHARGE_ITEM, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'location', defaultLocation, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'quantity', 1, true, true);
            nlapiSetCurrentLineItemValue(sublist, 'rate', tariffAmount, true, true);
            nlapiSetCurrentLineItemValue(sublist, "description", "Chinese Import Duty ", true, true);
            nlapiCommitLineItem(sublist);
            no_recurse = false;

        }

    }
}

function recalcTariffs_onSave() {

    // var context = nlapiGetContext()
    // var user = context.user;
    // var soCreatedDate = nlapiGetFieldValue("createddate") || new Date().toLocaleString();
    // soCreatedDate = Date.parse(soCreatedDate);

    // //SO form only
    // if (nlapiGetFieldValue('customform') !== '109') return true;

    // var itemLineCount = nlapiGetLineItemCount("item") + 1;
    // if (itemLineCount == 1) {
    //     return true;
    // }
    // var running;

    // if (!window.sessionStorage.getItem('tariffs running')) {
    //     window.sessionStorage.setItem('tariffs running', true);
    // } else {
    //     running = true;
    // }

    // if (running) {
    //     return true;
    // }
    // debugger;
    // for (var i = 1; i < itemLineCount; i++) {
    //     nlapiSelectLineItem("item", i);
     
    //     var itemDescription = nlapiGetCurrentLineItemValue("item", "description");
    //     var itemAmount = nlapiGetCurrentLineItemValue("item", "amount");
    //     var isCtItem = nlapiGetCurrentLineItemValue("item", "custcol_kush_cteligible") == "T" ? true : false;
    //     var ctAmount = nlapiGetCurrentLineItemValue('item', 'custcol_kush_cteligible')

    //     // var isCtSurcharge = nlapiGetCurrentLineItemValue("item", "item") == "15740" ? true : false; //Sanbox item
    //     var isCtSurcharge = nlapiGetCurrentLineItemValue("item", "item") == "15806" ? true : false; //Production item

    //     var nextLineExist = nlapiGetLineItemValue("item", "item", i + 1);

    //     if (isCtItem) {
    //         if (nextLineExist) {
    //             var nextItem = nlapiGetLineItemValue("item", "item", i + 1);
    //             var nextItemAmount = nlapiGetLineItemValue("item", "amount", i + 1);
    //             var tariffAmount = (itemAmount * .03).toFixed(2);
    //             // if (nextItem == 15740) { //Next item is surcharge Sandbox item
    //             if (nextItem == 15806) { //Next item is surcharge Prodcution item

    //                 if (nextItemAmount == tariffAmount) { //Do amounts match?
    //                     continue;
    //                 } else { //Amounts dont match
    //                     nlapiSelectLineItem("item", i + 1);
    //                     addCtSurcharge(itemAmount, itemDescription, tariffAmount, false); //Surcharge Update
    //                     i++;
    //                 }
    //             } else { //next item is not a surcharge but needs to be
    //                 nlapiInsertLineItem("item", i + 1);
    //                 addCtSurcharge(itemAmount, itemDescription, tariffAmount, true); //Surcharge Add
    //                 i++;
    //                 itemLineCount++;
    //             }
    //         } else { //No line exist in front, make new line
    //             nlapiSelectNewLineItem("item");
    //             addCtSurcharge(itemAmount, itemDescription, tariffAmount, true); //Surcharge Add
    //         }
    //     } else if (isCtSurcharge) {
    //         if (i == 1) { //Surcharge is the first item
    //             nlapiRemoveLineItem("item", i);
    //             i--;
    //             itemLineCount--;
    //         } else {
    //             var prevItemIsCt = nlapiGetLineItemValue("item", "custcol_kush_cteligible", i - 1) == "T" ? true : false;
    //             if (!prevItemIsCt) {
    //                 nlapiRemoveLineItem("item", i);
    //                 i--;
    //                 itemLineCount--;
    //             }
    //         }

    //     }
    // }
    // window.sessionStorage.removeItem('tariffs running');

    // function addCtSurcharge(itemAmount, itemDescription, tariffAmount, newItem) {
    //     if (newItem) {
    //         // nlapiSetCurrentLineItemValue('item', 'item', 15740, true, true); //Sandbox item
    //         nlapiSetCurrentLineItemValue('item', 'item', 15806, true, true);
    //         // nlapiSetCurrentLineItemValue('item', 'item', 15740, false); //Faster
    //     }
    //     var ctRate = tariffAmount;
    //     nlapiSetCurrentLineItemValue('item', 'quantity', 1);
    //     // nlapiSetCurrentLineItemValue("item", "description", "Tariff Charge - " + itemDescription);
    //     // nlapiSetCurrentLineItemValue('item', 'taxcode', 43, false); //Avatax
    //     // nlapiSetCurrentLineItemValue('item', 'location', 56, false); //New GG  
    //     nlapiSetCurrentLineItemValue('item','location', defaultLocation, false);
    //     nlapiSetCurrentLineItemValue("item", "description", "Chinese Import Duty - 3% ");
    //     nlapiSetCurrentLineItemValue('item', 'rate', ctRate);
    //     nlapiCommitLineItem("item");
    // }
    return true;
}

function stop_insert_between_ct_items(type) {
    var context = nlapiGetContext()
    var exec = context.executioncontext;
    if (exec == 'userinterface') {

        try {
            var context = nlapiGetContext()


            var item_id = nlapiGetCurrentLineItemValue(type, 'item');
            // if (item_id == '15740') { //Sandbox item
            if (item_id == '15806' || item_id == CONST_SURCHARGE_ITEM_SCA) { //Production item

                alert('You cannot insert between a subcharge and its item');
                return false;
            }
        } catch (e) {
            nlapiLogExecution('DEBUG', 'ERROR AT STOP stop_insert_between_ct_items', e);
        }



    }
    return true;
}


// function validate_delete(type) {
//     var context = nlapiGetContext();
//     var user = context.user;
//     var role = context.role;
//     var exec = context.executioncontext;
//     if (exec == 'userinterface') {

//         // if (role == '3') return true;
//         if (isTariff_recurse) return true;

//         if (item_recurse) return true;


//         var index = nlapiGetCurrentLineItemIndex('item');
//         index = Number(index)
//         var lineCount_relative = Number(nlapiGetLineItemCount(type)) - 1;
//         var ct = nlapiGetCurrentLineItemValue('item', 'custcol_kush_cteligible');
//         var currentLineItem = nlapiGetLineItemValue(type, "item", index);
// debugger;

//         if (currentLineItem == CONST_SURCHARGE_ITEM || currentLineItem == CONST_SURCHARGE_ITEM_SCA) {
//             return false;
//         } else if (ct !== '') {
//             if (index == lineCount_relative) {
//                 isTariff_recurse = true;
//                 item_recurse = true;
//                 nlapiRemoveLineItem('item', index + 1);
//                 nlapiRemoveLineItem('item', index);
//                 isTariff_recurse = false;
//                 item_recurse = false;
//             } else {
//                 isTariff_recurse = true;
//                 item_recurse = true;
//                 nlapiRemoveLineItem('item', index);
//                 isTariff_recurse = false;
//                 item_recurse = false;
//             }
//         }
//     }
//     return true;
// }

function validate_delete(type) {
    var context = nlapiGetContext();
    var user = context.user;
    var role = context.role;
    var exec = context.executioncontext;
    if (exec == 'userinterface') {

        if (role != '3') return true;
        if (isTariff_recurse) return true;

        if (item_recurse) return true;


        var index = nlapiGetCurrentLineItemIndex('item');
        index = Number(index)
        var lineCount_relative = Number(nlapiGetLineItemCount(type)) - 1;
        var ct = nlapiGetCurrentLineItemValue('item', 'custcol_kush_cteligible');
        var currentLineItem = nlapiGetLineItemValue(type, "item", index);


        if (currentLineItem == CONST_SURCHARGE_ITEM) {
            return false;
        } else if (ct == 'T') {
            if (index == lineCount_relative) {
                isTariff_recurse = true;
                item_recurse = true;
                nlapiRemoveLineItem('item', index + 1);
                nlapiRemoveLineItem('item', index);
                isTariff_recurse = false;
                item_recurse = false;
            } else {
                isTariff_recurse = true;
                item_recurse = true;
                nlapiRemoveLineItem('item', index);
                isTariff_recurse = false;
                item_recurse = false;
            }
        }
    }
    return true;
}

function changeDiscountText() {
    var context = nlapiGetContext();
    var user = context.user;
    var exec = context.executioncontext;
    if (exec == 'userinterface') {
        jQuery('span#discounttotal_fs_lbl').text('Adjustments')
    }
}

// function removeWebstoreTariff_onSave() {
//     var context = nlapiGetContext(),
//         exec = context.executioncontext,
//         user = context.user;
//     if (exec == 'userinterface') {
//         if (user != "806057") {
//             return true;
//         }
//         var servicedBy = nlapiGetFieldValue('custbody1');
//         if (servicedBy == "4926") {
//             var promoCount = nlapiGetLineItemCount('promotions') + 1;
//             var onlineTariffPromo = "2626";
//             for (var i = 1; i < promoCount; i++) {
//                 nlapiSelectLineItem('promotions', i)
//                 var currentPromoCode = nlapiGetCurrentLineItemValue('promotions', 'couponcode');
//                 if (currentPromoCode == onlineTariffPromo) {
//                     nlapiRemoveLineItem('promotions', i);
//                     break;
//                 }
//             }
//         }
//     }
//     return true;
// }