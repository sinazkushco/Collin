//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: k_SL_SoToPoLinker.js
//Developer: Carl            
//Date: 10/03/2017
//Module: SOTOPOLINKER
//Description: SO to PO Linker
//		On demand via a button on the Purchase Order record, find Sales Order lines that qualify.
//		For each qualifying item, add a linked line to the Purchase Order that references the related Sales Order Line.
//		When the Purchase Order is saved, ensure that the Sales Order line is then linked back to the Purchase Order line. 
//------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @author Carl, Zeng
 * @description Suitelet
 */
define(
		[ 'N/record', 'N/runtime', 'N/search', 'N/redirect',
				'./k_CL_SoToPoLinkerLib' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search, redirect, LIB) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest(context) {

				// SuiteLet URL Parameters
				var param_intPOId = context.request.parameters.custparam_poid;

				log.debug('k_SL_SoToPoLinker', 'param_intPOId: '
						+ param_intPOId);
				if (!param_intPOId || context.request.method != 'POST')
					context.response
							.write({
								output : 'Please click on "Add SO Items" button on Purchase Order(view mode) to proceed SO to PO Linker.'
							});

				var strRespTxt = 'success';
				var insPOtoSOLnk = new LIB.SOTOPOLINKER(param_intPOId);
				if (context.request.method === 'POST') {

					try {
						// [1] Check current PO's linked SO info
						var arrCurPOLnked = insPOtoSOLnk.getCurPOLnkedItms();
						log.debug('k_SL_SoToPoLinker - arrCurPOLnked',
								'arrCurPOLnked: '
										+ JSON.stringify(arrCurPOLnked));

						// [2] Search all relevant Sales Orders valid data
						var arrRelatedSO = insPOtoSOLnk.getDataBySearchSO();
						log
								.debug('k_SL_SoToPoLinker - arrRelatedSO',
										'arrRelatedSO: '
												+ JSON.stringify(arrRelatedSO));

						// [3] Add new lines to Current PO, update item qty.
						insPOtoSOLnk.addSOItems(arrCurPOLnked, arrRelatedSO);

						// [4] Update SO to create a reference link in columns
						insPOtoSOLnk.setSOLnkCol();

					} catch (ex) {
						strRespTxt = (ex && ex.message) ? ex.message : ex;
					}

					// [5] PO page updated show 'Add SO Items' proceed message
					context.response.write({
						output : strRespTxt
					});
				}
			}

			return {
				onRequest : onRequest
			};

		});
