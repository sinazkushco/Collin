/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Feb 2017     Billi
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
var AutoAutenticatoinGeneratorInfo = {
    PasswordAutoFill: function() {
        if (document.getElementById("giveaccess_fs").className == 'checkbox_ck'){
            
            //###Trigger Click Event
            document.getElementById("sendemail_fs_inp").click();
            document.getElementById("requirepwdchange_fs_inp").click();
            
            
            document.getElementById("password").value = "Ku$hB0ttles";
            document.getElementById("password2").value = "Ku$hB0ttles";
        }else if(document.getElementById("giveaccess_fs").className == 'checkbox_unck'){
            
            document.getElementById("sendemail_fs").className = 'checkbox_unck';
            document.getElementById("requirepwdchange_fs").className = 'checkbox_unck';
            
            document.getElementById("password").value = "";
            document.getElementById("password2").value = "";
        }
    }
}

// preventAutofill used to limit / prevent Chrome browser from attempting to autofill mobile password input when employee is edited.
function preventAutofill(){
    var context = nlapiGetContext();
    var executionContext = context.getExecutionContext();
    if(executionContext == "userinterface"){
        var password_input = document.querySelector('#custentity_mobile_password_fs > input');
        var type = document.createAttribute('autocomplete')
        type.value = "new-password"
        password_input.setAttributeNode(type)
    }
}

preventAutofill()


document.getElementById("giveaccess_fs").addEventListener("click", AutoAutenticatoinGeneratorInfo.PasswordAutoFill);




