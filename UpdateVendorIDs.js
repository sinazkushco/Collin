function UpdateVendorIDs()
{
    var vendorID = '';
    var searchresults = nlapiSearchRecord('vendor', null, null, null);
    if (searchresults != null) {
        for (var i = 0; i < searchresults.length; i++) {
            var searchresult = searchresults[i];
            var internalID = searchresult.getId();
            if (internalID > 0)
            {
                var vendorRec = nlapiLoadRecord('vendor', internalID);
                if (vendorRec != null) {
                    var vendorNum = parseInt(i, 10) + 1;
                    vendorID = '0000000' + vendorNum.toString();
                    vendorID = 'V' + vendorID.substring(vendorID.length - 7, vendorID.length);

                    vendorRec.setFieldValue('custentityvendorid', vendorID);
                    var iid = nlapiSubmitRecord(vendorRec);
                }
            }
        }
    }
}
