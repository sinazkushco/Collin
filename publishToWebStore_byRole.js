// Published by Matt Barnett
// Store Manager: 1007, Admin: 3 
// netsuite ID _publishToWebStore_access

function disablePublishToWebStore_byRole(type){
    //get context to determine current user
    var context = nlapiGetContext()
    var exec = context.getExecutionContext()
    if(exec === 'userinterface'){
        // check for current user role
        var role = context.getRole();
        //if role is NOT 1013 (Store manager) or 3 (admin)
        if(type == 'edit' &&
          (role != '1007'
          && role != '3')){
            // restrict access to checkbox (disable)
            nlapiSetFieldDisabled('isonline', true)
        }
    }

}

