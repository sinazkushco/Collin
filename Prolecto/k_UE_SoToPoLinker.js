//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: k_UE_SoToPoLinker.js
//Developer: Carl            
//Date: 10/03/2017
//Module: SOTOPOLINKER
//Description: On demand via a button on the Purchase Order record, find Sales Order lines that qualify.
//------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(
		[ 'N/error', 'N/record', 'N/redirect', 'N/runtime', 'N/search',
				'N/ui/serverWidget' ],
		// Module does not exist: N/ui/message.js
		/**
		 * @param {error}
		 *            error
		 * @param {record}
		 *            record
		 * @param {redirect}
		 *            redirect
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(error, record, redirect, runtime, search, ui) {

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @param {Form}
			 *            scriptContext.form - Current form
			 * @Since 2015.2
			 */
			function beforeLoad(scriptContext) {

				// runtime.getCurrentScript().executionContext
				if (runtime.executionContext == runtime.ContextType.USER_INTERFACE
						&& scriptContext.type == scriptContext.UserEventType.VIEW) {

					// Add SO Item Button
					var objForm = scriptContext.form;
					objForm.clientScriptModulePath = './k_CL_SoToPoLinker.js';
					objForm.addButton({
						id : 'custpage_sotopolinker_addsoitem',
						label : 'Add SO Items',
						functionName : 'k_Btn_AddSoItems'
					});

					// Show message if applicable
					var param_strLinkerMsg = scriptContext.request.parameters.custparam_sotopolinker_msg;
					if (param_strLinkerMsg && param_strLinkerMsg.length > 0) {
						var objFldLnkerMsg = objForm.addField({
							id : 'custpage_strlinkermsg',
							type : 'inlinehtml',
							label : 'SO to PO Linker'
						});
						objFldLnkerMsg.updateBreakType({
							breakType : ui.FieldBreakType.STARTROW
						});
						objFldLnkerMsg.updateLayoutType({
							layoutType : ui.FieldLayoutType.OUTSIDEABOVE
						});
						if (param_strLinkerMsg == 'success')
							objFldLnkerMsg.defaultValue = '<div id="div__alert"><div class="uir-alert-box confirmation session_confirmation_alert" width="100%" role="status"><div class="icon confirmation"><img src="/images/icons/messagebox/icon_msgbox_confirmation.png" alt=""></div><div class="content"><div class="title">Confirmation</div><div class="descr">Added relevant Sales Order\'s Item to current Purchase Order successfully.</div></div></div></div>';
						else
							objFldLnkerMsg.defaultValue = '<div id="div__alert"><div class="uir-alert-box" width="100%" role="status"><div class="icon"><img src="/images/icons/messagebox/icon_msgbox_failed.png" alt=""></div><div class="content"><div class="title">Notice</div><div class="descr">'
									+ param_strLinkerMsg
									+ '</div></div></div></div>';
					}
				}

				return true;
			}

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {Record}
			 *            scriptContext.oldRecord - Old record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @Since 2015.2
			 */
			function beforeSubmit(scriptContext) {

			}

			/**
			 * Function definition to be triggered before record is loaded.
			 * 
			 * @param {Object}
			 *            scriptContext
			 * @param {Record}
			 *            scriptContext.newRecord - New record
			 * @param {Record}
			 *            scriptContext.oldRecord - Old record
			 * @param {string}
			 *            scriptContext.type - Trigger type
			 * @Since 2015.2
			 */
			function afterSubmit(scriptContext) {

			}

			return {
				beforeLoad : beforeLoad
			};

		});
