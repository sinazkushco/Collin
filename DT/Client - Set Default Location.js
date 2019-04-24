/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function pageInit_set_default_location(type){
    if (type == 'create'){
        var context = nlapiGetContext();
        var user = context.user;
        var loc = nlapiGetFieldValue('location');
        if (loc === "" || loc === null){
            var usersCurrentLocationSetOnEmployeeRecord = nlapiGetLocation();
            if (usersCurrentLocationSetOnEmployeeRecord.length){
                nlapiSetFieldValue('location', usersCurrentLocationSetOnEmployeeRecord);
            }
        }
        if(user == '1229625'){
            nlapiSetFieldValue('undepfunds', 'F');
            nlapiSetFieldValue('account', '671');
        }
    }
}