/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Feb 2017     Billi
 *
 */
/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

function CheckQtyInEachLocation(request, responseText){
	try{
		var matrixItemId;
		var arrayChildItem;
		var itemId;
		var key = request.getParameter('key');
		
		if (key != -1){
			matrixItemId = request.getParameter('ItemId');
			arrayChildItem = getMatrixItemChild(matrixItemId);
			itemId = ArrayItem(arrayChildItem,key);
		}else{
			itemId = request.getParameter('ItemId');
		}
        
        var itemType = nlapiLookupField("item", itemId, "recordtype");
		var itemrecord = nlapiLoadRecord(itemType,itemId);
		var linecount = itemrecord.getLineItemCount('locations');
		
		var qtyList = {};
		var locationList = {};
		var jsonResult = [];
		
		for (var rowLocationInfo = 1; rowLocationInfo <= linecount; rowLocationInfo++){
			var tempObj = {};
			var locationName = itemrecord.getLineItemValue('locations','location_display',rowLocationInfo);
			var qtyAvailable = 'false'
			var locationId = itemrecord.getLineItemValue('locations','locationid',rowLocationInfo);
			if  ((itemrecord.getLineItemValue('locations','quantityavailable',rowLocationInfo) > 0) &&
                 (nlapiLookupField('location', locationId, 'makeinventoryavailablestore') === 'T'))
			{
				qtyAvailable = 'true';
			}
			tempObj.location = locationName;
			tempObj.qty = qtyAvailable;
            tempObj.locationId = nlapiLookupField('location', locationId, 'makeinventoryavailablestore');

			jsonResult.push(tempObj);
		}
		responseText.write(JSON.stringify(jsonResult));
	}
	catch(err){
		responseText.write("KIT");
	}
	
}
function ArrayItem(arrayItems,key) {
	var countNumberOfItem = 0;
	var ItemID = -1;
	nlapiLogExecution('DEBUG', "Items Name Before Search", arrayItems[0].getValue('itemid'));
	for (var i = 0; i < arrayItems.length; i++){
		//var strItemDescription = arrayItems[0].columns[0].value;
		nlapiLogExecution('DEBUG', "Items Name Search BEFORE IF", arrayItems[i].getValue('itemid'));
		nlapiLogExecution('DEBUG', "Items Name Search BEFORE IF", typeof key);
		nlapiLogExecution('DEBUG', "Items Name Search BEFORE IF", arrayItems[i].getValue('itemid').search(key) );
		if (arrayItems[i].getValue('itemid').search(key) > -1){
			nlapiLogExecution('DEBUG', "Items Name Search", arrayItems[i].getValue('itemid'));
			countNumberOfItem += 1;
			ItemID = arrayItems[i].id;
		}
	}
	
		return ItemID;
}

function getMatrixItemChild(matrixItemID) {
	nlapiLogExecution('DEBUG','Searching the item', 'Searching..');
	//Get the item id
	searchItem = nlapiSearchRecord('inventoryitem',null,[new nlobjSearchFilter('itemid',null,'is',matrixItemID)],null);
	
	//Search the child item
	var filters = new Array();
	filters.push(new nlobjSearchFilter('matrixchild',null,'is','T'));
	filters.push(new nlobjSearchFilter('parent',null,'anyof',matrixItemID));
	var searchCols = new Array();
	searchCols.push(new nlobjSearchColumn('itemid'));
	searchCols.push(new nlobjSearchColumn('baseprice'));
	var searchChItem = nlapiSearchRecord('inventoryitem',null,filters,searchCols);
	
	return searchChItem;
	
}
