function BSP_VendorBeforeLoad(type,form)
{
    if (type != 'create') {
        return;
    }

    var vendorID = '';
    var lastVendorID = '';
    var searchresults = nlapiSearchRecord('vendor', 108);
    if (searchresults != null) {
        if (searchresults.length > 0) {
            var searchresult = searchresults[0];
            var internalID = searchresult.getId();
            vendorID = nlapiLookupField('vendor', internalID, 'custentityvendorid');
            if (lastVendorID == '') {
                lastVendorID = vendorID;
            }
        }
    }

    if (lastVendorID == '') {
        vendorID = 'V0000001'
    }
    else {
        var vendorNum = parseInt(lastVendorID.substring(1), 10) + 1;
        vendorID = '0000000' + vendorNum.toString();
        vendorID = 'V' + vendorID.substring(vendorID.length - 7, vendorID.length);
    }

    nlapiSetFieldValue('custentityvendorid', vendorID);
}
