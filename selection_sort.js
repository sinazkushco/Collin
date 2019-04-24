//Use this code for new Item:  Sorts STOCK UNITS, PURCHASE UNITS, and SALE UNITS numerically when UNITS TYPE is 'boxes'
function sort_box_sizes() {
    try {
        jQuery('#stockunit_fs').on('click', function () {  // click handler for STOCK UNITS
            var unit_type = nlapiGetFieldValue('unitstype')  // get UNIT TYPE
            if (unit_type == '2') { // check if UNITS TYPE is BOXES
                var element_array = jQuery('.uir-tooltip-content .dropdownDiv').children()  // get tooltip element array

                var sorted = element_array.sort(compareBy_ascending) //split string to isolate numbers, parse string numbers
                jQuery('.uir-tooltip-content .dropdownDiv div').hide() // hide current elements
                jQuery('.uir-tooltip-content .dropdownDiv').append(sorted) // append new sorted elements
                jQuery('.uir-tooltip-content .dropdownDiv div').show() //show tooltip elements in DOM
            }
        });

        jQuery('#purchaseunit_fs').on('click', function () {
            var unit_type = nlapiGetFieldValue('unitstype')
            if (unit_type == '2') {
                var element_array = jQuery('.uir-tooltip-content .dropdownDiv').children()

                var sorted = element_array.sort(compareBy_ascending)
                jQuery('.uir-tooltip-content .dropdownDiv div').hide()
                jQuery('.uir-tooltip-content .dropdownDiv').append(sorted)
                jQuery('.uir-tooltip-content .dropdownDiv div').show()
            }
        });

        jQuery('#saleunit_fs').on('click', function () {
            var unit_type = nlapiGetFieldValue('unitstype')
            if (unit_type == '2') {
                var element_array = jQuery('.uir-tooltip-content .dropdownDiv').children()

                var sorted = element_array.sort(compareBy_ascending)
                jQuery('.uir-tooltip-content .dropdownDiv div').hide()
                jQuery('.uir-tooltip-content .dropdownDiv').append(sorted)
                jQuery('.uir-tooltip-content .dropdownDiv div').show()
            }
        });
    }

    catch (err) {
        console.log(err);
    }
}


function compareBy_ascending(a, b){
    var first_value = parseInt(a.innerText.split(' ')[2]);
    var comparison_value = parseInt(b.innerText.split(' ')[2]);
    return first_value > comparison_value ? 1 : -1
}

function setDefaultGroup(){
    nlapiSetFieldValue('custitem_tt_item_group', '1')
}

function pageInit(){
    hideAvataxOnWarehouseForm()
    sort_box_sizes()
}

function hideAvataxOnWarehouseForm(){
    var execution = nlapiGetContext().executioncontext;
    var formId = nlapiGetFieldValue('customform');
    if(execution == 'userinterface'){
        var isWarehouseForm = formId == "115" || formId == "116"  ? true : false;
        if(isWarehouseForm){
            jQuery('#custpage_avatab_div').hide();
        }
    }
}

