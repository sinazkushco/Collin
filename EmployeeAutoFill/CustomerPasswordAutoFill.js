/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Feb 2017     Billi
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
//function suitelet(request, response){

//}

var someChangeHappen = Boolean(document.getElementById("giveaccess_fs").className == 'checkbox_ck');
var PasswordSetting = {
	passwordsent: false,
	PasswordAutoFill: function() {
		this.passwordsent = false;
		if (document.getElementById("giveaccess_fs").className == 'checkbox_ck'){
			debugger;
			//window.someChangeHappen = 1;
			//###Trigger Click Event
			//document.getElementById("sendemail_fs_inp").click();
			
			
			document.getElementById("password").value = "Ku$hB0ttles";
			document.getElementById("password2").value = "Ku$hB0ttles";
		}else if(document.getElementById("giveaccess_fs").className == 'checkbox_unck'){
			if (document.getElementById("sendemail_fs").className == 'checkbox_ck')
			{
				document.getElementById("sendemail_fs_inp").click();
			}
			
			document.getElementById("password").value = "";
			document.getElementById("password2").value = "";
		}
	},
    appURL: "https://checkout.kushbottles.com/c.4516274/checkout-2-05-0/services/account-forgot-password.ss?c=4516274&n=1",
    CreateXMLElement: function () {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            // code for IE6, IE5
            return new ActiveXObject("Microsoft.XMLHTTP");
        } else {
            console.log('The page faced to the problem \n The page does not sent link to the customer. \n Please explain to the customer.');
            alert("Forget passowrd does not send to the customer. \n More description was left in console section for your reference.");
            return undefined;
        }
    },
    xhttp: '',
    GetEmailFromURL: function(name, url){
    	if (!url) {
    	      url = window.location.href;
    	    }
    	    name = name.replace(/[\[\]]/g, "\\$&");
    	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    	        results = regex.exec(url);
    	    if (!results) return null;
    	    if (!results[2]) return '';
    	    return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    CheckEmailWithServer: function () {
    	if ((this.passwordsent == false) && (document.getElementById("giveaccess_fs_inp").checked == true)){
//    		if ((this.passwordsent == false) && (document.getElementById("giveaccess_fs_inp").checked == true) && (window.someChangeHappen != document.getElementById("giveaccess_fs_inp").checked)){	
	    	var EmailAddress = document.getElementById('email').value;
	    	var url = 'https://checkout.kushbottles.com/checkout-2-05-0/pass.html?email=' + EmailAddress;
	    	
		    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
		    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
	
		    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
		    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
		    
		    var w = 500;
		    var h = 300;
		    
		    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
		    var top = ((height / 2) - (h / 2)) + dualScreenTop;
	    	
	    	var win = window.open(url, 'KushBottles send reset password','width=500,height=300,scrollbars=n');
	    	this.passwordsent = true;
	    	//this.someChangeHappen = false;
	    	//win.focus();
    	}
    	return true;
    }
}


//document.getElementById("giveaccess_fs").addEventListener("click", PasswordSetting.PasswordAutoFill);
