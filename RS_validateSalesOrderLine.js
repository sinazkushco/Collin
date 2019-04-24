function RS_validateSalesOrderLine(type){
    if (type == 'item'){
        if( nlapiGetCurrentLineItemValue('item', 'description') == ""){
  
            alert("Please add a description for this line.  Customers will see this description on their order confirmation");
            return false;
        }
        else{
            return true;
        }
    }
    else{
        return true;
    }
  }