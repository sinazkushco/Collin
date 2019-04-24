function RS_tradeshowBeforeLoad(type,form){
	var currentContext = nlapiGetContext();
	if (type == 'create')
	{
		var location = currentContext.getLocation();
		nlapiSetFieldValue('adjlocation', location);
		
		var customer = 10451; //High Times Cannabis Cup ***CHANGE THIS FOR EACH SHOW***
		nlapiSetFieldValue('entity', customer);
		
		nlapiSetFieldValue('inpt_shipmethod', 'Freight/Other'); //Local Pickup Santa Ana
		nlapiSetFieldValue('shipmethod', 4774);
      	nlapiSetFieldValue('discountitem', 7982);
	}
}

function RS_SetSquare(type,form){
	nlapiSetFieldValue('paymentmethod', 11);
}

function RS_SetCash(type,form){
	nlapiSetFieldValue('paymentmethod', 1);
}

/*
//#####################   COBINE QTY IN ITEM LIST
var arrayItemsList = [];
var midelOfRunning = false;
var operatorConfirmCombination = undefined;
var codeIsCrashedForOneTime = false;

function BS_Combine_Same_Item_Qty() {
	
	try{
		debugger;
console.log("Process is working!!!");
        //### Hesitate to rerun the code in infinity loop. 
        //### It is happening because we are manipulate the list
        if (midelOfRunning == true) { return false; };
        //return true;
        var itemsCount = nlapiGetLineItemCount('item');
        
        BS_Refresh_Array();

        //Get the current item data
        var itemTemp = {};
    	itemTemp.itemId = nlapiGetCurrentLineItemValue('item', 'item');
        itemTemp.itemQty = nlapiGetCurrentLineItemValue('item', 'quantity');
        itemTemp.qtyAvail = nlapiLookupField('item',itemTemp.itemId,'quantityavailable');
        itemTemp.itemType = nlapiGetCurrentLineItemValue('item', 'itemtype');
        debugger;
        
        if (itemsCount > 0){
        	midelOfRunning = true;
            for (var i = arrayItemsList.length - 1; i >= 0; i--) {
                if (arrayItemsList[i].itemId == itemTemp.itemId) {
                    itemTemp.itemQty = Number(arrayItemsList[i].itemQty) + Number(itemTemp.itemQty);
                    nlapiRemoveLineItem('item', i + 1);
                    arrayItemsList.splice(i, 1);
                }
            }
            midelOfRunning = true;
            nlapiSetCurrentLineItemValue('item', 'quantity', itemTemp.itemQty, true, true);
            //nlapiCommitLineItem('item');
        } 
        midelOfRunning = false;
        return true;
	}
	catch(err){
		alert("It faced to the error in combine!");
		codeIsCrashedForOneTime = true;
		return true;
	}
}

//function BS_Remove_Duplicate_Items() {

//try {
 
//  //### Hesitate to reu the code in infinity loop. 
//  //### It is happening because we are manupulate thelist
//  if (midelOfRunning == 1) { return false; };
	
//  var itemsCount = nlapiGetLineItemCount('item');
 
//  if (codeIsCrashedForOneTime == true || (itemsCount != arrayItemsList.length + 1 && itemsCount > 1)){BS_Refresh_Array();}

//  //Get the current item data
//  var itemTemp = {};

//  itemTemp.itemId = nlapiGetLineItemValue('item', 'item', itemsCount);
//  itemTemp.itemQty = nlapiGetLineItemValue('item', 'quantity', itemsCount);
 

//  if (itemsCount > 1) {
//      for (var i = arrayItemsList.length - 1; i >= 0; i--) {
//          if (arrayItemsList[i].itemId == itemTemp.itemId) {
//              midelOfRunning = 1;
//              //nlapiSelectLineItem('item', i+1);
//              nlapiRemoveLineItem('item', i + 1);
//              //nlapiCommitLineItem('item');
//              arrayItemsList.splice(i, 1);
//          }
//      }
//      arrayItemsList.push(itemTemp);
//  } else if (itemsCount == 1 && itemTemp.itemId != null) {
//      arrayItemsList.push(itemTemp);
//  }
//  midelOfRunning = 0;
//  return true;


//} catch (err) {
//  alert("This form faced to a error. \n The error is: \n\n" & err);
//  codeIsCrashedForOneTime = true;
//  midelOfRunning = 0;
//  return true;
//}
//}

function BS_Refresh_Array(){
	var itemsCount = nlapiGetLineItemCount('item');
	for (var i = 0; i < itemsCount; i++){
		arrayItemsList[i].itemId = nlapiGetLineItemValue('item', 'item', i+1);
		arrayItemsList[i].itemQty = nlapiGetLineItemValue('item', 'quantity', i+1);
	}
	codeIsCrashedForOneTime = false;
}

*/