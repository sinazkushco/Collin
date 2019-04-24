/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------
//Function:         PRI_Trans_DefaultDivision
//Script Type:      Client Script
//Description:	    Lookup division for the class and default the division on the line
//Date:             SG 20181219
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
		function fieldvalue(field, default_val)
		{
			try
			{
				if(field)
				{
					if (field.value)
					{
						return field.value
					}
					else
					{
						if(Array.isArray(field))
						{
							return field[0].value;
						}
						else
						{
							return field;
						}
					}
				}
				else
				{
					return default_val;
				}	
				
			}catch(xx){
				return default_val;
			}
		};
		function rundefault(context)
		{
			var currentRecord = context.currentRecord;
	        var sublistName = context.sublistId;
	        var sublistFieldName = context.fieldId;
	        if(!(sublistName && sublistFieldName))return true;
	        
	        var classId = noempty(currentRecord.getCurrentSublistValue({
				sublistId: sublistName,
				fieldId: 'class'
			}),'');
	        if(classId.length===0)return true;
	        
		    	var fieldLookUp = search.lookupFields({
	        	    type: search.Type.CLASSIFICATION,
	        	    id: classId,
	        	    columns: ['custrecord_division']
	        	});
	        	var custrecord_division = fieldvalue(fieldLookUp.custrecord_division, '');
	        	if(custrecord_division.length===0){
	        		return;
	        	}
	        	currentRecord.setCurrentSublistValue({
					sublistId: sublistName,
					fieldId: 'cseg_division',
					value: custrecord_division
			});
		};
		
        function postSourcing(context) {
    			var currentRecord = context.currentRecord;
	        var sublistName = context.sublistId;
	        var sublistFieldName = context.fieldId;
	        if(!(sublistName && sublistFieldName))return true;
	        if(sublistFieldName=='item' || sublistFieldName=='class')
	        	{
	        		rundefault(context);
	        	}
	        	return true;
        };
        function fieldChanged(context){
			var currentRecord = context.currentRecord;
	        var sublistName = context.sublistId;
	        var sublistFieldName = context.fieldId;
	        if(!(sublistName && sublistFieldName))return true;
	        if(sublistFieldName=='class')
	        	{
	        		rundefault(context);
	        	}
	        return true;
        };
        
        return {
        		postSourcing: postSourcing,
        		fieldChanged: fieldChanged
        }
    });

