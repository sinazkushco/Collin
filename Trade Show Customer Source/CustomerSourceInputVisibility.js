/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       28 Feb 2017     Billi
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */

var CustomerSourceInputVisiblity = {
		oCustomerSource : document.getElementById("inpt_custentity_customer_source5"),
		oInputCustomerSource: document.getElementById("custentitycustentity_customer_trade_show"),
		oTitleCustomerSource: document.getElementById("custentitycustentity_customer_trade_show_fs_lbl"),
		VisibleInput: function(){
			this.oInputCustomerSource.style.display = "inline";
			this.oTitleCustomerSource.style.display = "inline";
			debugger;
			this.oInputCustomerSource.focus();
		},
		HideInput: function(){
			this.oInputCustomerSource.style.display = "none";
			this.oTitleCustomerSource.style.display = "none";
			
		},
		CustomerSourceInputVisiblity:function(){
			if (this.oCustomerSource.title.indexOf('Tradeshow') > -1)
			{
				this.VisibleInput();
			}else
			{
				this.HideInput();
			}
		},
		AddEvent:function(){
			//select the target node
			var target = this.oCustomerSource;
			 
			// create an observer instance
			var observer = new MutationObserver(function(mutations) {
			    mutations.forEach(function(mutation) {
			    	CustomerSourceInputVisiblity.CustomerSourceInputVisiblity();
			    });
			});
			 
			// configuration of the observer:
			var config = { attributes: true, childList: true, characterData: true }
			 
			// pass in the target node, as well as the observer options
			observer.observe(target, config);
		}
}


//document.getElementById("inpt_custentity_customer_source5").addEventListener("blur",function(){CustomerSourceInputVisiblity.CustomerSourceInputVisiblity();});




CustomerSourceInputVisiblity.AddEvent();


CustomerSourceInputVisiblity.CustomerSourceInputVisiblity();
