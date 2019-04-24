function disable_line_fields(exec) {
    if (exec === 'userinterface') {
        var item_fields_to_disable = ['quantity', 'item', 'location', 'description'];
        var status = nlapiGetFieldValue('status');
        if (status == 'Pending Fulfillment' || status == "Pending Billing/Partially Fulfilled") {
            var allowed_roles = ['1008', '1054', '3']; //warehouse manager, director of operations, administrator
            var allowed_user_ids = ['8510', '528', '1012608', '46336', '507527', '9176', '172124']; //Adrien Anaya, Jonathan Huang, Pamela Chavez, Pamela Glines, Ryan Jue, Reed Longstreth, Dennis Nguyen
            if ((allowed_roles.indexOf(role) == -1 && allowed_user_ids.indexOf(user_id) == -1)) {
                var picked_locations = nlapiGetFieldValues('custbody_locations_picked');
                if (picked_locations && picked_locations.length) {
                    for (var i = 0; i < item_fields_to_disable.length; i++) {
                        nlapiDisableLineItemField('item', item_fields_to_disable[i], true);
                    }
                }
            }
        }
    }
}


function hide_edit_shipto(exec){
    if(exec === 'userinterface'){
        var status_1 = nlapiGetFieldValue('status');
        var allowed_roles = ['1008', '1054', '3']; //warehouse manager, director of operations, administrator
        var allowed_user_ids = ['8510', '528', '1012608', '46336', '507527', '9176', '172124']; //Adrien Anaya, Jonathan Huang, Pamela Chavez, Pamela Glines, Ryan Jue, Reed Longstreth, Dennis Nguyen
        if((allowed_roles.indexOf(role) == -1 && allowed_user_ids.indexOf(user_id) == -1)){
            if (status_1 == 'Pending Fulfillment' || status_1 == "Pending Billing/Partially Fulfilled") {
                try{
                    jQuery("#billaddresslist_popup_link").remove();
                }catch(e){
                    nlapiLogExecution('DEBUG','HIDE SHIP TO ADDY', 'FAILED');
                } 
            }
        }
    }
}