function inventory_count_item_aftersubmit(type) {
    var warehouses_with_inventory_counting = null;
    if (type == 'create') {
        try{
            warehouses_with_inventory_counting = nlapiSearchRecord("location", null, //grab warehouses that use inventory count
            [
                ["custrecord_location_cycle_count", "is", "T"]
            ],
            [
                new nlobjSearchColumn("name").setSort(false)
            ]
        );
        }catch(e){
            log.error('error',JSON.stringify(e));
        }

        var warehouse_ids = [];
        if(warehouses_with_inventory_counting){
            for (var p = 0; p < warehouses_with_inventory_counting.length; p++) {
                warehouse_ids.push(warehouses_with_inventory_counting[p].id);
            }
            var item_type_map = {
                'InvtPart': 'inventoryitem',
                'Assembly': 'assemblyitem'
            };
            var newRecord = nlapiGetNewRecord();
            var acceptable_item_types = ['inventoryitem', 'assemblyitem', 'InvtPart', 'Assembly'];
            var item_count = newRecord.getLineItemCount('item');
            for (var i = 1; i <= item_count; i++) {
                var item_id = newRecord.getLineItemValue('item', 'item', i);
                var item_receiving_location = newRecord.getLineItemValue('item', 'location', i);
                if(warehouse_ids.indexOf(item_receiving_location) != -1){
                    var item_type = newRecord.getLineItemValue('item', 'itemtype', i);
                    if (acceptable_item_types.indexOf(item_type) != -1) {
                        var mapped_item_type = item_type_map[item_type];
                        var item_record = nlapiLoadRecord(mapped_item_type, item_id);
                        var item_record_classification = item_record.getFieldValue('custitem_classification');
                        if (!item_record_classification) {
                            item_record_classification = '1';
                            item_record.setFieldValue('custitem_classification', item_record_classification);
                        }
                        var cycle_map_record = nlapiLookupField('customrecord_kch_field_controller', '3', 'custrecord_custom_objects');
                        var cycle_map_object = JSON.parse(cycle_map_record);
                        var count_interval = cycle_map_object[item_record_classification].count_interval;
                        var item_record_location_count = item_record.getLineItemCount('locations');
                        for (var j = 1; j < item_record_location_count; j++) {
                            var item_record_inventory_location = item_record.getLineItemValue('locations', 'location', j);
                            if (item_record_inventory_location == item_receiving_location) { //found line location is in
                                var item_classification = item_record.getLineItemValue('locations', 'invtclassification', j);
                                if (!item_classification) {//if no item classification then fill it in for that line
                                    var now = new Date();
                                    now.setTime(now.getTime() + Number(count_interval) * 24 * 60 * 60 * 1000);
                                    var next_count_date = format_date(now);
                                    item_record.setLineItemValue('locations', 'invtclassification', j, item_record_classification);
                                    item_record.setLineItemValue('locations', 'invtcountinterval', j, count_interval);
                                    item_record.setLineItemValue('locations', 'nextinvtcountdate', j, next_count_date);
                                    var saved_record = nlapiSubmitRecord(item_record);
                                    nlapiLogExecution('DEBUG', 'saved_record', saved_record);
                                }//end if item classification is empty
                                break;
                            }//end if locations match
                        }//end loop through item location sublist
                    }//end if acceptable item types
                }//if warehouse is doing inventory count
            }//for loop through IR item lines
        }//end if warehouses
    }
}

function format_date(datetime) {
    var time = datetime;
    return getDate(time);
    function pad(time, sigFigs) {
        sigFigs = sigFigs || 2;
        var scalar = sigFigs;
        var zeroes = "0";
        while (--scalar) {
            zeroes += "0";
        }
        return (zeroes + time).slice(sigFigs * -1);
    }
    function getDate(time) {
        return '' + pad(time.getMonth() + 1) + '/' + pad(time.getDate()) + '/' + time.getFullYear();
    }
}

