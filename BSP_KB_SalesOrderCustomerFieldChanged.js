function BSP_SalesOrderCustomerFieldChanged(type, name)
{
    if (name == 'entity') {
        
        //set yourself as sales rep
        var salesRep = nlapiGetFieldValue('custbody1');
        if (salesRep == ''){
            nlapiSetFieldValue('custbody1', nlapiGetContext().getUser());
        }

        //set Location Field after customer field is changed to your location.
        var loc = getLocation(); // Get User Location
        if (loc > 0) {
            nlapiSetFieldValue('location', loc);
        }
    }
}



function getLocation(){
    var loc = nlapiGetLocation(); // Get User Location

    if (!loc || loc < 1) {
        var filters = [];
        var columns = [];
        filters[0] = new nlobjSearchFilter('name', null, 'contains', 'Garden Grove');
        columns[0] = new nlobjSearchColumn('name');

        var searchresults = nlapiSearchRecord('location', null, filters, columns);
        var searchresult = searchresults[0];
        loc = searchresult ? searchresult.getId() : 0;
    }
    return loc;
}