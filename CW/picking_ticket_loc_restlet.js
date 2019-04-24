function main(request) {
    var response = {
        success: false,
        data: '',
        status: 'submit field failed'
    };
    if (request.access) {
        var payload = JSON.parse(request.payload);
        if (payload.location && payload.id && (payload.status == 'Pending Fulfillment' || payload.status  == "Pending Billing/Partially Fulfilled")) {
            try {
                nlapiLogExecution('AUDIT', 'STARTING SUBMIT PICKING LOCATION', JSON.stringify(payload));//
                var sales_order = nlapiLoadRecord('salesorder', payload.id);
                var valid_location = false;
                var item_count = sales_order.getLineItemCount('item');
                for(var i = 1; i <= item_count; i++){
                    var item_location = sales_order.getLineItemValue('item','location',i);
                    if(item_location == payload.location.id){
                        valid_location = true;
                        break;
                    }
                }
                if(valid_location){
                    var record_updated = false;
                    nlapiLogExecution('DEBUG', 'SALES ORDER ID', payload.id);
                    var locations_picked = sales_order.getFieldValues('custbody_locations_picked');//IS THIS AN IMMUTABLE OBJECT, SOMETIMES, that doesnt let us locations_picked.push ?!?!  after this, potentially check if this is an array, then locations_picked.join(',').split(',')
                    if (typeof locations_picked === 'object'){//
                        locations_picked = locations_picked.join(",").split(",");//
                    }//
                    nlapiLogExecution('DEBUG', 'CURRENT LOCATIONS', JSON.stringify(locations_picked));//
                    if (!locations_picked) {
                        locations_picked = payload.location.id;
                        nlapiLogExecution('DEBUG', 'SETTING SINGLE LOCATION', JSON.stringify(locations_picked));//
                        sales_order.setFieldValue('custbody_locations_picked', locations_picked);
                        record_updated = true;
                    } else if (locations_picked.indexOf(payload.location.id) == -1) {
                        if(typeof locations_picked == 'string'){
                            locations_picked = locations_picked.split('');
                        }
                        locations_picked.push(payload.location.id);//InternalError: Array index 1 is out of bounds [0..0]. (picking_ticket_loc_restlet.js$764524#36) -- potential resolution on line 'var locations_picked ='
                        nlapiLogExecution('DEBUG', 'Location to push', payload.location.id);
                        sales_order.setFieldValues('custbody_locations_picked', locations_picked);
                        record_updated = true;
                    }
                    nlapiLogExecution('DEBUG', 'Updated Locations', JSON.stringify(locations_picked));//
                    if (record_updated) {
                        var record = nlapiSubmitRecord(sales_order);
                        nlapiLogExecution('DEBUG', 'Record Submitted', record);
                        response.status = 'submit picking ticket location successful';
                    } else {
                        response.status = 'locations have not changed';
                    }
                    
                    nlapiSubmitField('salesorder', payload.id, 'custbody_user_location', payload.location.name);
                    response.success = true;
                }else{
                    response.status = 'Picking Ticket Should Not Be Printed From This Location';
                }
            } catch (e) {
                nlapiLogExecution('ERROR', 'FAILED TO SUBMIT PICKING TICKET LOCATION '+ payload.id, e);
            }
        }
    }
    return response;
}



 

