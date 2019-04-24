function RS_discountTax(type,field){
	var subtotal = Number(nlapiGetFieldValue('subtotal'));
	var tax = Number(nlapiGetFieldValue('taxtotal'));

	var taxDiscount = 0;
	if(tax == null || subtotal == 0){
		return true;
	}

	taxDiscount = 0-(subtotal - (subtotal * (subtotal/(tax+subtotal))));
	nlapiSetFieldValue('discountrate', taxDiscount);
    document.getElementById('custpage_ava_calculatetax').click();
    var forLoop = 0
    for (;forLoop < 5;){
      subtotal = Number(nlapiGetFieldValue('subtotal'));
    var total = nlapiGetFieldValue('total');
    if (total != subtotal){
      var x = subtotal - total;
      taxDiscount = taxDiscount + x
      
      nlapiSetFieldValue('discountrate', taxDiscount);
    }else{
      break;
    }
    }

  	return true;

}

document.getElementById('item_addedit').addEventListener("click", RS_discountTax);

document.getElementById('item_splits').addEventListener('keypress',function(e){
  debugger;
  var key = e.which || e.keyCode;
  if(key == 13){
    window.setTimeout(RS_discountTax,1000);
  }
})
