


function service(request,response){
    var result = [];

    try{
        var id = request.getParameter("id");
        var itemRecord = loadItem(id);

        if (itemRecord){
            var linecount = itemRecord.getLineItemCount('locations');

            for (var iterator = 1; iterator <= linecount; iterator++){

                // Iterate through the lines of the "location" sublist
                var locationName = itemRecord.getLineItemValue('locations','location_display',iterator);
                var qtyAvailable = itemRecord.getLineItemValue('locations','quantityavailable',iterator);
                var locationId = itemRecord.getLineItemValue('locations','locationid',iterator);
                var qtyOnOrder = itemRecord.getLineItemValue('locations','quantityonorder', iterator);
                var qtyInTransit = itemRecord.getLineItemValue('locations','quantityintransit', iterator)


                // This is used to match the existing Kush bottles script on front end
                // it's only a string, the real qty available is in the field "qtyAvailable"
                var qty = "false";
                // Kush Bottles logic to determinate if the location is available on the webstore (copy/paste from script Item_Availability_Qty)
                if (qtyAvailable > 0 && nlapiLookupField('location', locationId, 'makeinventoryavailablestore') === 'T') {
                    qty = "true";
                }
                 if(!qtyOnOrder){
                     qtyOnOrder = 0;
                 }
                 if(!qtyInTransit){
                     qtyInTransit = 0;
                 }

                

                // Build location element
                result.push({
                    location : locationName,
                    qty : qty, // simple string
                    locationId : locationId,
                    qtyAvailable : qtyAvailable, // real qty available on the location
                    qtyOnOrder : qtyOnOrder,
                    qtyInTransit : qtyInTransit
                })
            }
        }



    }catch(e){
        nlapiLogExecution("ERROR","ERROR tring to get locations for the item",e)
    }

    response.write(JSON.stringify(result))
}


function loadItem(itemId) {

    var itemRecord;
    try {
        itemRecord = nlapiLoadRecord('inventoryitem', itemId);
    }
    catch(SSS_RECORD_TYPE_MISMATCH) {
        try {
            itemRecord = nlapiLoadRecord('discountitem', itemId);
        }
        catch(SSS_RECORD_TYPE_MISMATCH) {
            try {
                itemRecord = nlapiLoadRecord('noninventoryitem', itemId);
            }
            catch(SSS_RECORD_TYPE_MISMATCH) {
                try {
                    itemRecord = nlapiLoadRecord('kititem', itemId);
                }
                catch(SSS_RECORD_TYPE_MISMATCH) {
                    try {
                        itemRecord = nlapiLoadRecord('assemblyitem', itemId);
                    }
                    catch(SSS_RECORD_TYPE_MISMATCH) {
                        try {
                            itemRecord = nlapiLoadRecord('serviceitem', itemId);
                        }
                        catch(SSS_RECORD_TYPE_MISMATCH) {
                            try {
                                itemRecord = nlapiLoadRecord('descriptionitem', itemId);
                            }
                            catch(e) {
                                return "";
                            }
                        }
                    }
                }
            }
        }
    }

    return itemRecord;
}