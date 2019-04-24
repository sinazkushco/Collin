/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Jan 2017     Billi
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function clientValidateField(request, responseText){
	//VARIABLE 
	var finalResult = false;
	var rowCustomer;
	var stageResult = null;
	var customerId = null;
	var customerAccess = null;
	var columns = [];
	var filters = [];
	//MAIN CODE
	try{
		if ( request.getParameter('email') !== null && request.getParameter('email') !== undefined ) {
			filters[0] = new nlobjSearchFilter('email', null, 'is',request.getParameter('email'));
			
			columns[0] = new nlobjSearchColumn('email');
			columns[1] = new nlobjSearchColumn('Stage');
			columns[2] = new nlobjSearchColumn('giveaccess');
			
			var results = new nlapiSearchRecord('customer', null, filters, columns);
			if (results.length > 0)
				{
					finalResult = true;
					rowCustomer = results[0];
					customerId = results[0].getId();
					stageResult = rowCustomer.getValue('Stage');
					customerAccess = rowCustomer.getValue('giveaccess');
				}else{
					stageResult = 'SUCCESS';
				}
		}
	}
	catch(err){
		//FAIL - LET CUSTOMER TO REGISTER
		stageResult = 'CRASHED';
		responseText.write(finalResult + ',' + stageResult + ',' + customerId + ',' + customerAccess);
	}
	
	//RESULT
	responseText.write(finalResult + ',' + stageResult + ',' + customerId + ',' + customerAccess);
}

function clientUpdateCustomerFields(request, responseText){
	try{
		var rowCustomer;

		var customerId;
		
		
		var columns = [];
		
		var finalResult = null;
		var customerCompany;
		var customerFirstName;
		var customerLastName;
		var customerPhone;
		var stageResult;
		
		
		if (( request.getParameter('email') !== null && request.getParameter('email') !== undefined ) &&
		    ( request.getParameter('password') !== null && request.getParameter('password') !== undefined )) {
			var customerEmail = request.getParameter('email');
			var customerPassword = request.getParameter('password');
			var customerPassword2 = request.getParameter('password2');
			var customerFirstName = request.getParameter('firstname');
			var customerLastName = request.getParameter('lastname');
			var customerCompany = request.getParameter('companyname');
			var customerPhone = request.getParameter('phone');
			
			
			
			
			
			//SEARCH FOR CUSTOMER
			var filters = new nlobjSearchFilter('email', null, 'is',customerEmail);
			
			columns[0] = new nlobjSearchColumn('email');
			columns[1] = new nlobjSearchColumn('Stage');
			
			var results = new nlapiSearchRecord('customer', null, filters, columns);
			
			if (results.length > 0)
				{
					finalResult = true;
					rowCustomer = results[0];
					
					stageResult = rowCustomer.getValue('Stage');
					
					
					
					customerId = results[0].getId();
					var rec = nlapiLoadRecord('customer', customerId);
				    rec.setFieldValue('giveaccess', 'T');
				    rec.setFieldValue('password', customerPassword);
				    rec.setFieldValue('password2', customerPassword2);
				    
				    rec.setFieldValue('firstname', customerFirstName);
				    rec.setFieldValue('lastname', customerLastName);
				    
				    rec.setFieldValue('phone', customerPhone);
				    
				    var pass = rec.getFieldValue('password');
				    nlapiLogExecution('DEBUG',pass);
				    
				    nlapiSubmitRecord(rec,true);
					
				    
				    if ((customerCompany != '') && (customerCompany!=null) && (customerCompany!=undefined)){
				    	rec.setFieldValue('companyname', customerCompany);
				    }
				    
				    
				    
				    
				    
				    responseText.write('SUCCESS');
				}
			
		}else{
			responseText.write('NODATA');
		}
	}
	catch(err){
		responseText.write('FAIL' + ' - ' + customerId + ' - ' + customerPassword+ ' - ' + customerPassword2 + ' - ' + customerFirstName+ ' - ' + customerLastName+ ' - ' + customerPhone + ' - \n' + err);
	}
	

}
/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */










function pageInit(type) {
	if(type == 'create'){
		var context = nlapiGetContext();
		var username = context.getEmail();
		alert("Hello" + username);
	}
	return true;
}