function BSP_SalesOrderBeforeLoad(type,form)
{
    if (type != 'create')
    {
        return;
    }
  
  	if(nlapiGetFieldValue('custbody1') > 0){
      
      return;
      
    }

    var location = 0;
    var currUser = 0;
    var salesRep = 0;

    var currentContext = nlapiGetContext();
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    if (execContext == 'webstore') {
        currUser = 5464; // House Account Sandbox
        currUser = 519; // House Account Production
        salesRep = 4926; // Online Account Production
        location = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location"); // Garden Grove Sandbox and Production;
    }
    else
    {
        currUser = currentContext.getUser();
        if ((currUser == undefined) || (currUser == null) || (currUser == '')) {

            return;

            /* Use House Employee
            var filters = new Array();
            filters[0] = new nlobjSearchFilter('entityid', null, 'contains', 'House');
            var columns = new Array();
            columns[0] = new nlobjSearchColumn('entityid');

            var empFound = false;
            var searchresults = nlapiSearchRecord('employee', null, filters, columns);
            for (var i = 0; i < searchresults.length; i++) {
                var searchresult = searchresults[i];
                currUser = searchresult.getId();
                empFound = true;
                break;
            }
            if (!empFound)
                return;
            */
        }

        if (currUser > 0)
        {
            salesRep = currUser;
            location = nlapiGetLocation(); // Get User Location
            //location = nlapiLookupField('employee', currUser, 'location');
            if ((location == undefined) || (location == null) || (location == '')) {

                var filters = new Array();
                filters[0] = new nlobjSearchFilter('name', null, 'contains', 'Santa Ana');
                var columns = new Array();
                columns[0] = new nlobjSearchColumn('name');

                var locFound = false;
                var searchresults = nlapiSearchRecord('location', null, filters, columns);
                for (var i = 0; i < searchresults.length; i++) {
                    var searchresult = searchresults[i];
                    location = searchresult.getId();
                    locFound = true;
                    break;
                }
                if (!locFound)
                    location = 0;
            }
        }
    }
  
    if ((currUser > 0) && (salesRep > 0)) {
        nlapiSetFieldValue('custbody1', salesRep);
      	//nlapiSetFieldValue('salesrep', currUser);
    }

    if (location > 0) {
        nlapiSetFieldValue('location', location);
    }
}
