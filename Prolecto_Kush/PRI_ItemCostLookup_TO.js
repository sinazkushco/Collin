/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
//------------------------------------------------------------------
// Copyright 2019, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------
//Function:         PRI_ItemCostLookup_TO
//Script Type:      Client Script
//Description:	    Lookup item cost on transfer order
//Date:             SG 20190222
//------------------------------------------------------------------
define(["N/record", "N/search"],
    function(record, search) {
		function noempty(input_value, default_value)
		{
		  if (!input_value)
		  {
		      return default_value;
		  }
		  if (input_value.length==0)
		  {
		      return default_value;
		  }
		  return input_value;
		};
        function validateLine(context){
			var currentRecord = context.currentRecord;
	        var sublistName = context.sublistId;
	        if(sublistName=='item')
	        	{
		        var locId = noempty(currentRecord.getValue({
					fieldId: 'location'
				}),'');
		        if(locId.length===0)return true;
		        var itemId = noempty(currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: 'item'
				}),''); 
		        if(itemId.length===0)return true;
		        var quantity = noempty(currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: 'quantity'
				}),'0'); 
		        if(quantity===0)return true;
		        // run search of files associated with this record
		    		var rows = [];
		        	var recordSearch = search.create({
		                    "type" : search.Type.ITEM,
		                    "filters" : [ { name:"internalidnumber", operator:search.Operator.EQUALTO, values:itemId },
		                    				{ name:"internalid", join:"inventorylocation", operator:search.Operator.IS, values:locId}],
		                    "columns" : [ {name:"locationaveragecost"}, {name:"custitem_stock_unit_numeral"}, {name:"custitem_uom_numeral"} ]
		                });
				var recordSearchRange = recordSearch.run().getRange(0, 10);
				log.debug({title:"recordSearchRange.length: ", details:recordSearchRange.length});
				if (recordSearchRange.length > 0) 
				{
					var cost = noempty(recordSearchRange[0].getValue({name:"locationaveragecost"}),'0');
					if(cost)
					{
						var custitem_uom_numeral = noempty(recordSearchRange[0].getValue({name:"custitem_uom_numeral"}), '0');
						var custitem_stock_unit_numeral = noempty(recordSearchRange[0].getValue({name:"custitem_stock_unit_numeral"}), '0');
						if (parseFloat(custitem_uom_numeral) != parseFloat(custitem_stock_unit_numeral)){
							if(parseFloat(custitem_uom_numeral)>0 && parseFloat(custitem_stock_unit_numeral)>0){
								var packsize = ( parseFloat(custitem_stock_unit_numeral) / parseFloat(custitem_uom_numeral) );
								cost = parseFloat(cost) / parseFloat(packsize);
							}
						}
						currentRecord.setCurrentSublistValue({
							sublistId: sublistName,
							fieldId: 'rate',
							value: cost
						})
						currentRecord.setCurrentSublistValue({
							sublistId: sublistName,
							fieldId: 'amount',
							value: parseFloat(cost) * parseFloat(quantity)
						})
					}
				}
	        		
	        	}
	        return true;
        };
        
        return {
        		validateLine: validateLine
        }
    });

