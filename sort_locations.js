// script is called on Sales Order Form and disables item locations for all locations in the exclusion_array

//list of locations that will NOT be displayed

// to get the exact string, highlight the item row in ns, and use  ** nlapiGetCurrentLineItemText('item', 'location') ** in the console.
var exclusion_array = [
    "KB",
    "KB : Garden Grove, CA : Misplaced Inventory",
    "KB : Garden Grove, CA : Production",
    "KB : Garden Grove, CA : Quarantine",
    "KB : Garden Grove, CA : Samples",
    "KB : Garden Grove, CA : Receiving",
    "KB : Garden Grove, CA (Old) : Misplaced Inventory",
    "KB : Garden Grove, CA (Old) : Production",
    "KB : Garden Grove, CA (Old) : Quarantine",
    "KB : Garden Grove, CA (Old) : Samples",
    "KB : Garden Grove, CA (Old) : Receiving",
    "KB : Kush Energy",
    "KB : Kush Energy : Vendor Drop Ship",
    "KB : Consignment",
    "KB : Consignment : Signature Party Rentals",
    "KB : Offsite #1 (Ontario, CA)"
]

function sort_locations() {
    var context = nlapiGetContext()
    var executionContext = context.getExecutionContext()
    if(executionContext == 'userinterface'){
        try {
            jQuery('#item_location_fs').on('click', function () {  // click handler for Location Field
                //get all tooltip content and put in array
                var location_array = jQuery('.uir-tooltip-content .dropdownDiv').children()
                //loop through location array and remove any matches to exclusion array
                for(var i = 0; i<exclusion_array.length; i++){
                    for(var j = 0; j<location_array.length; j++){
                        if(location_array[j].innerText == exclusion_array[i]){
                            location_array.splice(j, 1)
                        }

                    }
                }
                //remove current content provided by NS
                jQuery('.uir-tooltip-content .dropdownDiv div').remove();
                //append array with exclusions removed
                jQuery('.uir-tooltip-content .dropdownDiv').append(location_array);
            });
        }
        catch (err) {
            if(window && window.console){
                console.log(err);
            }
        }
    }
}

