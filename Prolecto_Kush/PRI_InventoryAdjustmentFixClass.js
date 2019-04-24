//------------------------------------------------------------------
// Copyright 2018, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Function: customizeGlImpact
//Description: Classify the P&L to match the class of the items 
//Date: SG 20181111
//------------------------------------------------------------------
function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
	try{
		var rectype = transactionRecord.getRecordType();
		var recid   = transactionRecord.getId();
		if (rectype!='inventoryadjustment')return;

		var linecount = standardLines.getCount();
		if (linecount==0)return;
		nlapiLogExecution('DEBUG', 'standardLines linecount', linecount);
		
		var memo = 'Reclassify product class';
		
		// the first line has the adjustment account
		var firstLine = standardLines.getLine(0);
		var plAccount = firstLine.getAccountId();
		var plClass   = noempty(firstLine.getClassId(),0);
		var plLocation = noempty(firstLine.getLocationId(),0);
		if(plLocation==0){
			return;
			nlapiLogExecution("ERROR", 'Exiting inventory adjustment reclassification. Location is empty.');
		}
		var plDepartment = noempty(firstLine.getDepartmentId(),0);
		var plAmount  = 0
		nlapiLogExecution("DEBUG", 'plLocation:'+plLocation, 'plDepartment:'+plDepartment);
		var class_list = {};
		// the remaining lines hold the items + classes
		for (var i = 1; i < linecount; i++){
			var currLine = standardLines.getLine(i);
			var classId = noempty(currLine.getClassId(),0);
			if(parseInt(classId)==0)continue;
			var debit = noempty(currLine.getDebitAmount(),0);
			var credit = noempty(currLine.getCreditAmount(),0);
			var amt = parseFloat(debit) - parseFloat(credit);
			plAmount = plAmount + amt;
			var key = '_'.concat(classId);
			var bal = parseFloat(noempty(class_list[key], 0)) + parseFloat(amt);
			nlapiLogExecution('DEBUG', i+'. class:'+key, 'bal:'+bal + '   debit:'+debit + '   credit:'+credit + '   amt:'+amt + '  plAmount:'+plAmount);
			class_list[key] = bal;
		}
		
		if(parseFloat(plAmount)==0)
		{
			return;
		}
		
		
		var newLine = customLines.addNewLine();
		newLine.setAccountId(parseInt(plAccount));
		if(parseInt(plClass)>0)newLine.setClassId(parseInt(plClass));
		if(parseInt(plLocation)>0)newLine.setLocationId(parseInt(plLocation));
		if(parseInt(plDepartment)>0)newLine.setDepartmentId(parseInt(plDepartment));
		if(parseFloat(plAmount)>=0){
			plAmount = RoundNumber(parseFloat(plAmount),2);
			newLine.setDebitAmount(plAmount);
		}else{
			plAmount = RoundNumber(parseFloat(plAmount) * parseFloat(-1),2);
			newLine.setCreditAmount(plAmount);
		}
		newLine.setMemo(memo);
		
		
		var keys = Object.keys(class_list);
		var klen = keys.length;
		for (var i=0; i<klen; i++){
			var field = keys[i];
			var this_amount = RoundNumber(parseFloat(class_list[field]) * parseFloat(-1), 2);
			if(parseFloat(this_amount)==0){
				continue;
			}
			var newLine = customLines.addNewLine();
			newLine.setAccountId(parseInt(plAccount));
			newLine.setClassId(parseInt(field.substring(1,99)));
			if(parseInt(plLocation)>0)newLine.setLocationId(parseInt(plLocation));
			if(parseInt(plDepartment)>0)newLine.setDepartmentId(parseInt(plDepartment));
			nlapiLogExecution('DEBUG', i+'. plAccount:'+plAccount + '   setClassId:'+field.substring(1,99), 'amt:'+this_amount);
			if(parseFloat(this_amount)>=0){
				newLine.setDebitAmount(this_amount);
			}else{
				this_amount = RoundNumber(parseFloat(this_amount) * parseFloat(-1),2);
				newLine.setCreditAmount(this_amount);
			}
			newLine.setMemo(memo);
		}
		
	}catch(e){
		try
		{
			var err_title = 'Unexpected error';
			var err_description = '';
			if (e){
				if ( e instanceof nlobjError ){
					err_description = err_description + ' ' + e.getCode() + '|' + e.getDetails();
				}else{
					err_description = err_description + ' ' + e.toString();
				}
			}
			nlapiLogExecution('ERROR', 'Log Error ' + err_title, err_description);
		}catch(ex){
			nlapiLogExecution('ERROR', 'Error performing error logging');
		} 
	}
}
//------------------------------------------------------------------
//Function: 		RoundNumber
//Record: 			N/A
//Script Type: 		internal
//Description:  	Rounds to a decimal point
//Date:				MZ 20121130
//------------------------------------------------------------------
function RoundNumber (number, decimal){
	var retval = Math.round(Math.pow(10, decimal) * number)/ Math.pow(10, decimal);
	if (decimal = 2){
		var s_retval = retval.toString();
		if (s_retval.indexOf('.')>=0){
			anum = s_retval.split('.');
			var rem = anum[1];
			if (rem.length == 1){
				return s_retval + "0";
			}
		}else{
			return s_retval + ".00";
		}
	}
	return retval; 
};

//------------------------------------------------------------------
//Function: _noempty
//Output: return the input_value if it has a value else the default value
//Description: 
//Date: SG 20120311
//------------------------------------------------------------------
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