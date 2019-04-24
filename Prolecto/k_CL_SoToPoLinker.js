//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: k_CL_SoToPoLinker.js
//Developer: Carl            
//Date: 10/03/2017
//Module: SOTOPOLINKER
//Description: Library functions for SO to PO Linker(Separated), since server side 
//			library can't use 'N/currentRecord' module.
//------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define([ 'N/record', 'N/runtime', 'N/search', 'N/url', 'N/https',
		'N/currentRecord', 'N/ui/message' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search, url, https, currentRecord, message) {

			/**
			 * Add SO Item button click event
			 * 
			 * @returns
			 */
			function k_Btn_AddSoItems() {

				try{
					jQuery('#custpage_sotopolinker_addsoitem').val('Please wait. Adding SO Items... ');
					jQuery('#secondarycustpage_sotopolinker_addsoitem').val('Please wait. Adding SO Items... ');
				}catch(ex){}
				
				var objCurRecord = currentRecord.get();
				var intPOId = objCurRecord.id;
				var objPostBody = {
					'custparam_poid' : intPOId
				};

				var strSLUrl = url.resolveScript({
					scriptId : 'customscript_k_sl_sotopolinker',
					deploymentId : 'customdeploy_k_sl_sotopolinker'
				});

				var strPOUrl = '/app/accounting/transactions/purchord.nl?id='
						+ intPOId;

				https.post.promise({
					url : strSLUrl,
					body : objPostBody
				}).then(
						function(response) {

							var strReturnMsg = response ? response.body : '';
							console.log('Response body: ' + strReturnMsg);
							// Make a redirection
							location.href = strPOUrl
									+ '&custparam_sotopolinker_msg='
									+ strReturnMsg;
						}).catch(function onRejected(reason) {
																	
						 alert('Invalid Request or Failed, reason:' +
						 JSON.stringify(reason));
						 location.href = strPOUrl + '&custparam_sotopolinker_msg=' +
						 JSON.stringify(reason);
						});// Enable catch when deploy

				return false;
			}

			return {
				k_Btn_AddSoItems : k_Btn_AddSoItems
			};
		});
