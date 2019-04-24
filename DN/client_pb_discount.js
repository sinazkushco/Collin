/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function saveRecord_pbDiscount() {
	var context = nlapiGetContext().getExecutionContext();

	//will always calculate discount for web store orders
	//TODO: IMPLEMENT ONCE WEB STORE UI IS COMPLETE
	if (context == "webstore") {
		var discountField = nlapiGetFieldText("discountitem"); //if discount field is empty - calc discount
		if(!discountField){
			calc_discount();
		}
	}

	//will only calculate discount if PB discount exist (this is to combat people trying adding many categories temporarily just for a big discount)
	//FIXME: LOOK INTO MORE CONDITIONALS - On Edit? What if already billed should this still run? 
	if (context == "userinterface") {
		var discountExist = nlapiGetFieldText("discountitem").indexOf("Bundle Discount") > -1;
		if (discountExist) {
			calc_discount();
		}
	}

	return true;
}

function calc_discount(type, action) {
	var categoryResults = findCategories();
	var discountCategories = categoryResults.list;
	var total = categoryResults.total;

	if (discountCategories.length > 1) {
		nlapiLogExecution("DEBUG", "Testing Recalc", "array higher than 1");
		var totalDiscountPercent = findDiscountPercentage(discountCategories);
		setHeaderDiscount(totalDiscountPercent, total);
	}
}

function findCategories() {
	//clears discount item before calculating - in case someone removes an item and keeps their previous discount
	nlapiSetFieldValue("discountitem", "");
	var categoryList = [];
	var itemCount = nlapiGetLineItemCount('item');
	var totalPrice = 0;
	var combineCategories = {}; //obj

	
	if (itemCount > 0) {
		//first loop to find total price & combine categories/discounts
		for (var i = 1; i <= itemCount; i++) {
			var lineItemAmount = +nlapiGetLineItemValue('item', 'amount', i);
            var itemDiscountCategory = nlapiGetLineItemValue('item', 'custcol_discount_category', i);
            var itemType = nlapiGetLineItemValue('item', 'itemtype', i);

			if (itemDiscountCategory) {
				if (!combineCategories[itemDiscountCategory]) {
					combineCategories[itemDiscountCategory] = lineItemAmount;
				} else {
					combineCategories[itemDiscountCategory] += lineItemAmount;
				}
			}

			nlapiLogExecution("DEBUG", typeof lineItemAmount, "lineItemAmount: " + lineItemAmount);

            if(itemType == "InvtPart" || itemType == "NonInvtPart" || itemType == "Assembly"){
				totalPrice = totalPrice + +lineItemAmount; //creating total value of order
			}
		}

		//second loop , checks if each category is greater than 5 percent
		for (var DC in combineCategories) {
			if (+combineCategories[DC] > (totalPrice * .05)) {
				categoryList.push(DC);
			}
		}
	}


	nlapiLogExecution("DEBUG", "categoryList", categoryList);
	return {
		list: categoryList,
		total: totalPrice
	};
}

function findDiscountPercentage(discountCategories) {
	var runningTotal = -2; //as of feb/2018 - we're going to subtract 2 percent from the total discount percentage
	for (i = 0; i < discountCategories.length; i++) {
		var itemDiscountCategoryPercentage = nlapiLookupField('customrecord_discount_categories', discountCategories[i], 'custrecord_pricing');
		runningTotal = runningTotal + parseInt(itemDiscountCategoryPercentage);
	}
	//as of feb/2018 - we're setting a max discount of 8%
	if(runningTotal > 8) {
		runningTotal = 8;
	}
	return runningTotal;
}

function setHeaderDiscount(totalDiscountPercent, total) {
	var discountAmount = (+total * +totalDiscountPercent / 100).toFixed(2);
	
	nlapiLogExecution("DEBUG", "TOTAL / PERCENT / FINAL DISCOUNT AMOUNT", {
		"TOTAL": total,
		"PERCENT": totalDiscountPercent,
		"FINAL DISCOUNT AMOUNT": discountAmount
	});
	//set pricing bundle discount in discount item field
	nlapiSetFieldValue("discountitem", 9692);
	nlapiSetFieldValue("discountrate", -discountAmount);

}

function moveDiscountButton() {
	//disables column to prevent cheating
	var context = nlapiGetContext().getExecutionContext();
	if (context == "userinterface") {
		nlapiDisableLineItemField('item', "custcol_discount_category" , true);
		var pbBtn = jQuery("#tbl_custpage_calc_pb_dc").parent();
		var discountField = jQuery("#discountitem_fs_lbl_uir_label").parent().parent();
		discountField.append(pbBtn);
	}
}

