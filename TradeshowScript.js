function RS_tradeshowBeforeLoad(type,form){
	var currentContext = nlapiGetContext();
	if (type == 'create')
	{
		var location = currentContext.getLocation();
		nlapiSetFieldValue('adjlocation', location);
		
		var customer = 1668; //California Cannabis Business Expo ***CHANGE THIS FOR EACH SHOW***
		nlapiSetFieldValue('entity', customer);
		
		nlapiSetFieldValue('inpt_shipmethod', 'Local Pickup (Garden Grove, CA)'); //Local Pickup Santa Ana
		nlapiSetFieldValue('shipmethod', 10694);
		
	}
}

function RS_SetSquare(type,form){
	nlapiSetFieldValue('paymentmethod', 11);
}

function RS_SetCash(type,form){
	nlapiSetFieldValue('paymentmethod', 1);
}


var arrayItemsList = [];
var midelOfRunning = 0
var operatorConfirmCombination = undefined;


function RS_validateSalesOrderLineTest() {
    try {
        debugger;
        //### Hesitate to reu the code in infinity loop. 
        //### It is happening because we are manupulate thelist
        if (midelOfRunning == 1) { return false; };
        


        var itemsCount = nlapiGetLineItemCount('item');

        //Get the current item data
        var itemTemp = {};

        itemTemp.itemId = nlapiGetLineItemValue('item', 'item', itemsCount);
        itemTemp.itemQty = nlapiGetLineItemValue('item', 'quantity', itemsCount);

        if (itemsCount > 1) {
            for (i = arrayItemsList.length - 1; i >= 0; i--) {
                if (arrayItemsList[i].itemId == itemTemp.itemId) {
                    midelOfRunning = 1;
                    arrayItemsList[i].itemQty = Number(arrayItemsList[i].itemQty) + Number(itemTemp.itemQty);
                    nlapiSetLineItemValue('item', 'quantity', itemsCount , arrayItemsList[i].itemQty);
                    nlapiRemoveLineItem('item', i + 1);

                } else {
                    arrayItemsList.push(itemTemp);
                }
            }
        } else if (itemsCount == 1 && itemTemp.itemId != null) {
            arrayItemsList.push(itemTemp);
        }
        midelOfRunning = 0;
        return true;


    } catch (err) {
        alert("This form faced to a error. \n The error is: \n\n" & err);
        midelOfRunning = 0;
        return true;
    }
}