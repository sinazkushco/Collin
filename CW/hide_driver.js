//shows delivery driver field if ship method is local delivery or special order
//else hide it.
//written by Collin Wong

//local delivery = 5209
//special order = 11362
function hide_driver_field_change(type,name,linenum){
    if(name == 'shipmethod'){
        var shipmethod = nlapiGetFieldValue('shipmethod');
        if(shipmethod == 5209 || shipmethod == 11362){
            nlapiSetFieldDisplay('custbody_deliverydriver', true);
        }else{
            nlapiSetFieldDisplay('custbody_deliverydriver', false);
            nlapiSetFieldValue('custbody_deliverydriver', '');
        }
    }
}


/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function hide_driver_init(type){
    var shipmethod = nlapiGetFieldValue('shipmethod');
    if(shipmethod == 5209 || shipmethod == 11362){
        nlapiSetFieldDisplay('custbody_deliverydriver', true);
    }else{
        nlapiSetFieldDisplay('custbody_deliverydriver', false);
        nlapiSetFieldValue('custbody_deliverydriver', '');
    }
}