function RS_GiveFreeShipping() {

    // var shippingCost = nlapiGetFieldValue('shippingcost');

    // //make sure shipping has already been calculated
    // if(shippingCost == "0.00" || shippingCost == "To Be Calculated" || shippingCost == ""){
    // 	alert("Please calculate the shipping cost before applying the shipping discount");
    // 	return;
    // }
    // else if(shippingCost < 0){
    //   	alert("Error: Shipping cost cannot be negative.");
    //   	return;
    // }

    // var shippingDiscount = shippingCost - (shippingCost*2);
    // var lineCount = nlapiGetLineItemCount('item');
    // var shippingTaxCode = nlapiGetFieldValue('shippingtaxcode');

    // var i=1;
    // var replaceShipping = false;

    // for(i=1; i<=lineCount; i++){
    // 	if(nlapiGetLineItemValue('item', 'item', i) == 5282){
    // 		nlapiSelectLineItem('item', i);

    // 		//set price level to Custom
    // 		nlapiSetCurrentLineItemValue('item', 'price', '-1')

    // 		//Set amount to the negative of the shipping cost
    // 		nlapiSetCurrentLineItemValue('item', 'rate', shippingDiscount)

    // 		//Commit the line so it is saved
    // 		nlapiCommitLineItem('item');
    // 		return;
    // 	}
    // }

    // if((replaceShipping == false) && (nlapiGetCurrentLineItemValue('item', 'item') != "")){
    // 	//Insert new line at the end of the list
    // 	nlapiInsertLineItem('item',lineCount + 1)
    // }

    // if(shippingTaxCode == ""){
    //   	shippingTaxCode = nlapiGetLineItemValue('item', 'taxcode', 1)
    // }

    // //Set line tax code
    // nlapiSetCurrentLineItemValue('item', 'taxcode', shippingTaxCode);

    // //Add "Shipping Discount" as the item
    // nlapiSetCurrentLineItemValue('item', 'item', 5282)

    // //set price level to Custom
    // nlapiSetCurrentLineItemValue('item', 'price', '-1')

    // //Set amount to the negative of the shipping cost
    // nlapiSetCurrentLineItemValue('item', 'rate', shippingDiscount)

    // //Add a description
    // nlapiSetCurrentLineItemValue('item', 'description', 'Free Shipping')

    // //Commit the line so it is saved
    // nlapiCommitLineItem('item');

    // return;
}









var addDiscountLine = {
    shippingCost: -1,
    shippingDiscount: -1,
    lineCount: -1,
    shippingTaxCode: '',
    totalSalesOrder: -1,
    bootstrapObject() {
        addDiscountLine.setShippingCost();
        if (addDiscountLine.validateShippingCost()) {
            addDiscountLine.setShippingDiscount();
            addDiscountLine.setLineCount();
            addDiscountLine.setTaxCode();
            addDiscountLine.setTotalPrice();
            addDiscountLine.insertNewLine();
            addDiscountLine.deleteExistDiscountAndTotalSO();
            addDiscountLine.insertTotalPriceItem();
            addDiscountLine.insertDiscountItem();
        } else {
            return false;
        }
    },
    setShippingCost() {
        addDiscountLine.shippingCost = nlapiGetFieldValue('shippingcost');

    },
    setLineCount() {
        addDiscountLine.lineCount = nlapiGetLineItemCount('item');
    },
    setTaxCode() {

        addDiscountLine.shippingTaxCode = nlapiGetFieldValue('shippingtaxcode');
        if (addDiscountLine.shippingTaxCode == '' && addDiscountLine.lineCount != 0) {
            nlapiGetLineItemValue('item', 'taxcode', 1);
        }
    },
    validateShippingCost() {
        if (addDiscountLine.shippingCost === "0.00" || addDiscountLine.shippingCost === "To Be Calculated" || addDiscountLine.shippingCost === "") {
            alert("Please calculate the shipping cost before applying the shipping discount");
            return false;
        } else if (addDiscountLine.shippingCost < 0) {
            alert("Error: Shipping cost cannot be negative.");
            return false;
        }
        return true;
    },
    setShippingDiscount() {
        addDiscountLine.shippingDiscount = addDiscountLine.shippingCost - (addDiscountLine.shippingCost * 2);
    },
    setTotalPrice() {
        addDiscountLine.totalSalesOrder = nlapiGetFieldValue('subtotal');
    },
    deleteExistDiscountAndTotalSO() {
        for (i = 1; i <= addDiscountLine.lineCount; i++) {
            if (nlapiGetLineItemValue('item', 'item', i) == 5282 ||
                nlapiGetLineItemValue('item', 'item', i) == -2) {
                nlapiRemoveLineItem('item', i);
                nlapiCommitLineItem('item');
                addDiscountLine.setLineCount();
                i = 1;
                continue;
            }
        }
    },
    insertNewLine() {
        if (addDiscountLine.lineCount !== 0) {
            nlapiInsertLineItem('item', addDiscountLine.lineCount + 1);
        } else {
            nlapiInsertLineItem('item', 1);
        }
    },
    insertDiscountItem() {
        //Set line tax code
        nlapiSetCurrentLineItemValue('item', 'taxcode', addDiscountLine.shippingTaxCode, true);

        //Add "Shipping Discount" as the item
        nlapiSetCurrentLineItemValue('item', 'item', 5282, true);

        //set price level to Custom
        nlapiSetCurrentLineItemValue('item', 'price', '-1', true);

        //Set amount to the negative of the shipping cost
        addDiscountLine.shippingDiscount = fix_free_shipping(addDiscountLine.shippingDiscount);
        nlapiSetCurrentLineItemValue('item', 'rate', addDiscountLine.shippingDiscount, true);

        //Add a description
        nlapiSetCurrentLineItemValue('item', 'description', 'Free Shipping', true);

        //Commit the line so it is saved
        nlapiCommitLineItem('item');
    },
    insertTotalPriceItem() {
        //Set line tax code
        nlapiSetCurrentLineItemValue('item', 'taxcode', addDiscountLine.shippingTaxCode, true);

        //Add "Shipping Discount" as the item
        nlapiSetCurrentLineItemValue('item', 'item', -2, true);

        //set price level to Custom
        nlapiSetCurrentLineItemValue('item', 'price', '-1', true);

        //Set amount to the negative of the shipping cost
        nlapiSetCurrentLineItemValue('item', 'amount', addDiscountLine.totalSalesOrder, true);

        //Add a description
        nlapiSetCurrentLineItemValue('item', 'description', 'Sales Order Total', true);
        nlapiSetCurrentLineItemValue('item', 'itemtype', 'Subtotal', true);

        //Commit the line so it is saved
        nlapiCommitLineItem('item');
    }


};

//Added conditional line for Estimate Record, Since Estimate record didn't have any custformbuttons to begin with. 
//This function can't target an custom buttons. This function is built into estimate record's first custom button.
if (document.getElementById('custformbutton1')) {
    document.getElementById('custformbutton1').addEventListener('click', function () {
        addDiscountLine.bootstrapObject();
    });
}


function fix_free_shipping(shipping_cost) {
    var role = nlapiGetRole();
    if (role == '3' || role == '1025') {
        var discount_rate = nlapiGetFieldValue('discountrate');
        if (discount_rate.indexOf('%') != -1) {
            //covert rate to decimal
            discount_rate = Number(discount_rate.substr(0, discount_rate.length - 1)) / 100;
            var counter_rate = discount_rate * (discount_rate - 1) + 1;
            var counter_item = Math.ceil(shipping_cost * counter_rate * 100) / 100;
            shipping_cost = counter_item;
        }
    }
    return shipping_cost;
}