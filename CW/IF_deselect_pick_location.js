function deselect_pick_location_beforeload(type) {
    var status = nlapiGetFieldValue('status');
    nlapiLogExecution('DEBUG', 'STATUS', status);
    var shipmethod = nlapiGetFieldText('shipmethod').toUpperCase();
    nlapiLogExecution('DEBUG', 'shipmethod', shipmethod);
    if (type == 'create') {
        if ((shipmethod.match('LOCAL ') && status === 'Packed') || status == 'Shipped') {
            deselect_pick_location();
        }
    } else if (type == 'edit' || type == 'ship') {
        var fulfillment_id = nlapiGetRecordId();
        var systemnotes = nlapiSearchRecord("transaction", null,
            [
                ["internalidnumber", "equalto", fulfillment_id],
                "AND",
                ["systemnotes.field", "anyof", "TRANDOC.KSTATUS"],
                "AND",
                ["systemnotes.newvalue", "is", "Shipped"],
                "AND",
                ["mainline", "is", "T"]
            ],
            [
                new nlobjSearchColumn("tranid")
            ]
        );
        if(systemnotes){
            if(systemnotes.length){
                deselect_pick_location();
            }
        }
    }
}

function deselect_pick_location(){
    var created_from = nlapiGetFieldValue('createdfrom');
    nlapiLogExecution('DEBUG', 'created_from', created_from);
    var salesorder = nlapiLoadRecord('salesorder', created_from);
    var locations_picked = salesorder.getFieldValues('custbody_locations_picked');//returns array of strings
    nlapiLogExecution('DEBUG', 'LOCATIONS PICKED', JSON.stringify(locations_picked));
    if (locations_picked) {
        if (typeof locations_picked == 'string') {
            locations_picked = locations_picked.split();
        }
        nlapiLogExecution('DEBUG', 'LOCATIONS PICKED IN IF', JSON.stringify(locations_picked));
        var fulfillment_location = nlapiGetLineItemValue('item', 'location', 1);
        nlapiLogExecution('DEBUG', 'FULFILLMENT LOCATIONS', fulfillment_location);
        if (locations_picked.indexOf(fulfillment_location) > -1) {
            var new_locations_picked_array = [];
            for (var i = 0; i < locations_picked.length; i++) {
                if (locations_picked[i] != fulfillment_location) {
                    new_locations_picked_array.push(locations_picked[i]);
                }
            }
            nlapiLogExecution('DEBUG', 'new_locations_picked_array', JSON.stringify(new_locations_picked_array));
            salesorder.setFieldValues('custbody_locations_picked', new_locations_picked_array);
            nlapiLogExecution('DEBUG', 'custbody_locations_picked', JSON.stringify(salesorder.getFieldValues('custbody_locations_picked')));
            var submit = nlapiSubmitRecord(salesorder);
            nlapiLogExecution('DEBUG', 'SUBMIT', submit);
        }
    }
}