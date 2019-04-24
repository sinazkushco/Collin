function clear_item_cycle(request) {
    nlapiLogExecution('DEBUG', 'STARTED', 'OMG');
    var response = {
        success: false,
        message: 'failed'
    };
    if (request.access) {
        var payload = JSON.parse(request.payload);
        var item_id = payload.item_id;
        var record_type = payload.record_type;
        var location_id = payload.location_id;
        var item_record = nlapiLoadRecord(record_type, item_id);
        var item_record_location_count = item_record.getLineItemCount('locations');
        for (var k = 1; k <= item_record_location_count; k++) {
            var item_record_inventory_location = item_record.getLineItemValue('locations', 'location', k);
            if (item_record_inventory_location == location_id) {
                item_record.setLineItemValue('locations', 'invtclassification', k, '');
                item_record.setLineItemValue('locations', 'invtcountinterval', k, '');
                item_record.setLineItemValue('locations', 'nextinvtcountdate', k, '');
                var saved_record = nlapiSubmitRecord(item_record);
                nlapiLogExecution('DEBUG', 'saved_record', saved_record);
                response.success = true;
                response.message = 'item record saved :' + saved_record;
                break;
            }//end location match
        }//end loop through locations
    }
    return response;
}