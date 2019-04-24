/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 May 2017     Billi
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
	window.onload = function() {
	    var element = document.createElement("script");
	    element.src = "https://system.sandbox.netsuite.com/jqueryUI/jquery-ui.min.js?NS_VER=2016.2.0&minver=162";
	    document.body.appendChild(element);

	    element = document.createElement('link');
	    element.rel= 'stylesheet';
	    element.rel = 'text/css';
	    element.href = 'https://system.sandbox.netsuite.com/jqueryUI/jquery-ui.min.css?NS_VER=2016.2.0&minver=162';
	    document.head.appendChild(element);
	    	
	};
	
}
