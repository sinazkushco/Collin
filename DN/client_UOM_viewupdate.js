//client side script to change UOM view field on edit

function pageInit_applyUOMonblurHandler(type) {
	jQuery("input[name='inpt_saleunit']").on('blur', function () {

		var saleUnit_text = nlapiGetFieldText('saleunit');
		if (saleUnit_text) {
            //strips all non-numeric characters. if empty string or only text, set to 1
			var saleUnit_numeral = saleUnit_text.replace(/\D/g, '') || "1";
			nlapiSetFieldValue('custitem_uom_numeral', saleUnit_numeral)
		}

	});
  
  	jQuery("input[name='inpt_stockunit']").on('blur', function () {

		var stockUnit_text = nlapiGetFieldText('stockunit');
		if (stockUnit_text) {
            //strips all non-numeric characters. if empty string or only text, set to 1
			var stockUnit_numeral = stockUnit_text.replace(/\D/g, '') || "1";
			nlapiSetFieldValue('custitem_stock_unit_numeral', stockUnit_numeral)
		}

	});
  
  	jQuery("input[name='inpt_purchaseunit']").on('blur', function () {

		var purchaseUnit_text = nlapiGetFieldText('purchaseunit');
		if (purchaseUnit_text) {
            //strips all non-numeric characters. if empty string or only text, set to 1
			var purchaseUnit_numeral = purchaseUnit_text.replace(/\D/g, '') || "1";
			nlapiSetFieldValue('custitem_purchase_unit_numberal', purchaseUnit_numeral)
		}

	})

}

