function check_for_natural_products(exec){
    if(exec === 'userinterface'){
        var item_count = nlapiGetLineItemCount('item');
        var natural_product_found = false;
        for(var i = 1; i <= item_count; i++){
            var item = {};
            item.class = nlapiGetLineItemValue('item','class_display',i);
            item.name = nlapiGetLineItemValue('item','item_display',i);
            item.desc = nlapiGetLineItemValue('item','description',i);
            if(item.class.indexOf('Natural Products') != -1 || item.name.match(/terpene/gmi) || item.desc.match(/terpene/gmi)){
                nlapiLogExecution('DEBUG','Item', JSON.stringify(item));
                var credit_card_internal_ids = ['6','3','4','5'];
                var payment_method = nlapiGetFieldValue('paymentmethod');
                natural_product_found = true;
                if(credit_card_internal_ids.indexOf(payment_method) != -1){
                    alert('Payment Method is Discover/Amex/VISA/MasterCard\n'+
                        'Payment Processing Profile is CyberSource-LIVE\n'+
                        'Do Not Use Credits Cards For Orders With Natural Products!');
                        return false;
                }
            }
        }//end for loop
        if(natural_product_found){
            set_natural_product_checkboxes();
        }else{
            nlapiSetFieldValue('custbody_has_natural_products', 'F');
        }
    }
	return true;
}

function set_natural_product_checkboxes(){
    var status = nlapiGetFieldValue('status');
    if(status === 'Pending Fulfillment'){
        var natural_products_fulfilled = nlapiGetFieldValue('custbody_natural_products_fulfilled');
        if(natural_products_fulfilled === 'F'){
            nlapiSetFieldValue('custbody_has_natural_products', 'T');
        }
    }
}