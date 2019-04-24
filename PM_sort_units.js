//Use this code for new Item:  Sorts STOCK UNITS, PURCHASE UNITS, and SALE UNITS numerically when UNITS TYPE is 'boxes'
function sort_box_sizes(){
    try {
        jQuery('#stockunit_fs').on('click', function(){  // click handler for STOCK UNITS
            var unit_type = nlapiGetFieldValue('unitstype')  // get UNIT TYPE
            if(unit_type == '2'){ // check if UNITS TYPE is BOXES
                var element_array = jQuery('.uir-tooltip-content .dropdownDiv').children()  // get tooltip element array
                
                var sorted = element_array.sort((a, b) => parseInt(a.innerText.split(' ')[2]) > parseInt(b.innerText.split(' ')[2])  ? 1 : -1) //split string to isolate numbers, parse string numbers
                jQuery('.uir-tooltip-content .dropdownDiv div').hide() // hide current elements
                jQuery('.uir-tooltip-content .dropdownDiv').append(sorted) // append new sorted elements
                jQuery('.uir-tooltip-content .dropdownDiv div').show() //show tooltip elements in DOM
                console.log(sorted)
            }
        });
        
        jQuery('#purchaseunit_fs').on('click', function(){
            var unit_type = nlapiGetFieldValue('unitstype')
            if(unit_type == '2'){
                var element_array = jQuery('.uir-tooltip-content .dropdownDiv').children()
                
                var sorted = element_array.sort((a, b) => parseInt(a.innerText.split(' ')[2]) > parseInt(b.innerText.split(' ')[2])  ? 1 : -1)
                jQuery('.uir-tooltip-content .dropdownDiv div').hide()
                jQuery('.uir-tooltip-content .dropdownDiv').append(sorted)
                jQuery('.uir-tooltip-content .dropdownDiv div').show()
                console.log(sorted)
            }
        });
        
        jQuery('#saleunit_fs').on('click', function(){
            var unit_type = nlapiGetFieldValue('unitstype')
            if(unit_type == '2'){
                var element_array = jQuery('.uir-tooltip-content .dropdownDiv').children()
                
                var sorted = element_array.sort((a, b) => parseInt(a.innerText.split(' ')[2]) > parseInt(b.innerText.split(' ')[2])  ? 1 : -1)
                jQuery('.uir-tooltip-content .dropdownDiv div').hide()
                jQuery('.uir-tooltip-content .dropdownDiv').append(sorted)
                jQuery('.uir-tooltip-content .dropdownDiv div').show()
                console.log(sorted)
            }
        });
    }
    
    catch (err) {
        console.log(err);
    }
}

        