/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define(['N/search'], function(search) {

	function saveRecord(context) {
		if (jQuery("#errorRow").length) {
			return false;
		}
		return true;
	}

	function validateEmail(email) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	function validateField(context) {
		if (context.fieldId == "custentity_transaction_emails") {
			var correctEmails = true;
			var currentInput = context.currentRecord.getValue("custentity_transaction_emails").replace(" ", "");
			var emailArray = currentInput.split(",");
			var errorMsg = "<tr id='errorRow'><td><div><span class='text' style='background-color: yellow'>ERROR: Field contains invalid characters. Please enter valid email(s) and/or separate multiple emails with a comma.</span></div></td></tr>"
			emailArray.forEach(function (currentEmail) {
				if (!validateEmail(currentEmail) && currentInput) {
					jQuery("#errorRow").remove();
					jQuery("#custentity_transaction_emails_fs_lbl_uir_label").parent().append(errorMsg);
					correctEmails = false;
				}
			});

			if (correctEmails) {
				jQuery("#errorRow").remove();
			}
        }
        
		return true;
	}

	
	var returnObj = {};
	returnObj.saveRecord = saveRecord;
	returnObj.validateField = validateField;
	return returnObj;
});

