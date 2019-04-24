//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: k_CL_SoToPoLinkerLib.js
//Developer: Carl            
//Date: 10/03/2017
//Module: SOTOPOLINKER
//Description: Library functions for SO to PO Linker
//------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define(
		[ 'N/record', 'N/runtime', 'N/search', 'N/url', './k_CL_IdRecord',
				'N/redirect' ],
		/**
		 * @param {record}
		 *            record
		 * @param {runtime}
		 *            runtime
		 * @param {search}
		 *            search
		 */
		function(record, runtime, search, url, IDLIB, redirect) {

			// ---------------------SO to PO Linker Class-------------------
			function SOTOPOLINKER(intPOId, options) {

				this.intPOId = intPOId;
				if (intPOId) {
					this.OBJPOREC = record.load({
						type : record.Type.PURCHASE_ORDER,
						id : intPOId
					});

					this.intVendorId = this.OBJPOREC.getValue('entity');

				}
			}

			/**
			 * Get Data by Search Relevant Sales Order
			 * 
			 * @returns {Object}
			 */
			SOTOPOLINKER.prototype.getDataBySearchSO = function() {

				if (!this.intVendorId)
					return;

				var arrSOLnItmObj = [];
				// Below criteria will be check during add to PO
				// [ 'custcol_k_linked_po_so', 'anyof', '@NONE@' ],
				// [ 'custcol_k_linked_po_so_uid', search.Operator.ISEMPTY, null
				var objSOSrchRes = search.create(
						{
							type : record.Type.SALES_ORDER,
							filters : [
									[
											'status',
											'anyof',
											[ 'SalesOrd:B', 'SalesOrd:D',
													'SalesOrd:E' ] ],
									'and',
									[ 'item.custitem2', 'is', true ],
									'and',
									[ 'item.vendor', 'anyof',
											[ this.intVendorId ] ], 'and',
									[ 'closed', 'is', 'F' ], 'and',
									[ 'mainline', 'is', 'F' ] ],
							columns : [ 'internalid', 'item', 'quantity',
									IDLIB.REC.N_SALESORD.COL_LINKEDPOSO,
									'lineuniquekey' ]
						}).run().getRange({
					start : 0,
					end : 999
				});
				for (var i = 0; objSOSrchRes && i < objSOSrchRes.length; i++) {

					// Collect SO's relevant line item data
					arrSOLnItmObj.push({
						// LINE : (objSOSrchRes[i].getValue('line') - 1),
						SOID : objSOSrchRes[i].getValue('internalid'),
						ITEM : objSOSrchRes[i].getValue('item'),
						QUANTITY : objSOSrchRes[i].getValue('quantity'),
						LINKEDPOSO : objSOSrchRes[i]
								.getValue(IDLIB.REC.N_SALESORD.COL_LINKEDPOSO),
						LINKEDPOSOUID : objSOSrchRes[i]
								.getValue('lineuniquekey'),
					});
				}

				return arrSOLnItmObj;
			};

			/**
			 * Get Current PO Linked Items, Load current Purchase Order
			 * 
			 * @returns {Array}
			 */
			SOTOPOLINKER.prototype.getCurPOLnkedItms = function() {

				var objPORec = this.OBJPOREC;
				if (!objPORec)
					return;

				var arrCurPOLnkedItms = [];
				var intPOLnItmCnt = objPORec.getLineCount('item');
				for (var i = 0; i < intPOLnItmCnt; i++) {
					var intLnkedSO = objPORec.getSublistValue({
						sublistId : 'item',
						fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSO,
						line : i
					});
					var intLnkedSOUid = objPORec.getSublistValue({
						sublistId : 'item',
						fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSOUID,
						line : i
					});

					if (!intLnkedSO || !intLnkedSOUid)
						continue;

					arrCurPOLnkedItms.push({
						LINE : i,
						ITEM : objPORec.getSublistValue({
							sublistId : 'item',
							fieldId : 'item',
							line : i
						}),
						QUANTITY : objPORec.getSublistValue({
							sublistId : 'item',
							fieldId : 'quantity',
							line : i
						}),
						LINKEDPOSO : intLnkedSO,
						LINKEDPOSOUID : intLnkedSOUid
					});
				}

				return arrCurPOLnkedItms;
			};

			/**
			 * Modify and Submit Purchase Order to: Add SO Items to Purchase
			 * Order Line Item
			 * 
			 * @param {Array}
			 *            arrCurPOLnked Current PO's linked SO info
			 * @param {Array}
			 *            arrRelatedSO SO line data search results, pending
			 *            extend to Purchase Order
			 * 
			 */
			SOTOPOLINKER.prototype.addSOItems = function(arrCurPOLnked,
					arrRelatedSO) {

				var objPORec = this.OBJPOREC;
				if (!objPORec)
					return;

				var intAddSOLnCnt = 0;
				var intPOLnIdx = objPORec.getLineCount('item');
				for (var soIdx = 0; soIdx < arrRelatedSO.length; soIdx++) {

					// Check this SO haven't already linked on current PO
					var intUid = arrRelatedSO[soIdx].LINKEDPOSOUID;
					var bolFoundAddedinPO = false;
					for (var i = 0; i < arrCurPOLnked.length; i++) {
						var intCurPOUid = arrCurPOLnked[i].LINKEDPOSOUID;
						if (intUid == intCurPOUid) {
							// Update/Edit item info, i.e. qty
							objPORec.setSublistValue({
								sublistId : 'item',
								fieldId : 'quantity',
								line : arrCurPOLnked[i].LINE,
								value : arrRelatedSO[soIdx].QUANTITY
							});

							bolFoundAddedinPO = true;
							break;
						}
					}
					if (bolFoundAddedinPO == true)
						continue;

					// Check this SO haven't already linked to other PO
					if (arrRelatedSO[soIdx].LINKEDPOSO
							&& arrRelatedSO[soIdx].LINKEDPOSO != this.intPOId)
						continue;

					// Add PO Item Line
					objPORec.setSublistValue({
						sublistId : 'item',
						fieldId : 'item',
						line : intPOLnIdx,
						value : arrRelatedSO[soIdx].ITEM
					});
					objPORec.setSublistValue({
						sublistId : 'item',
						fieldId : 'quantity',
						line : intPOLnIdx,
						value : arrRelatedSO[soIdx].QUANTITY
					});

					objPORec.setSublistValue({
						sublistId : 'item',
						fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSO,
						line : intPOLnIdx,
						value : arrRelatedSO[soIdx].SOID
					});
					objPORec.setSublistValue({
						sublistId : 'item',
						fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSOUID,
						line : intPOLnIdx,
						value : arrRelatedSO[soIdx].LINKEDPOSOUID
					});

					intPOLnIdx++;
					intAddSOLnCnt++;
				}

				var intPOId = objPORec.save();
				log.debug('addSOItems',
						'Saved current PO with relevant SO Item lines, added line: '
								+ intAddSOLnCnt);
				return intPOId;
			};

			/**
			 * Modify and Submit Sales Order, to add linkage column values
			 * 
			 */
			SOTOPOLINKER.prototype.setSOLnkCol = function() {

				if (!this.intPOId)
					return;

				// Reload PO to get latest/added lines
				var objPORec = record.load({
					type : record.Type.PURCHASE_ORDER,
					id : this.intPOId
				});
				if (!objPORec)
					return;

				var arrUpdatedSOList = [];
				var intPOLnItmCnt = objPORec.getLineCount('item');
				for (var i = 0; i < intPOLnItmCnt; i++) {
					var intLnkedSO = objPORec.getSublistValue({
						sublistId : 'item',
						fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSO,
						line : i
					});
					var intLnkedSOUid = objPORec.getSublistValue({
						sublistId : 'item',
						fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSOUID,
						line : i
					});

					if (!intLnkedSO || !intLnkedSOUid)
						continue;

					log
							.debug(
									'setSOLnkCol - Reload PO to get latest/added lines',
									'intLnkedSO: ' + intLnkedSO
											+ ', intLnkedSOUid: '
											+ intLnkedSOUid);
					// Duplicated SO loaded and treated one time only
					if (arrUpdatedSOList.indexOf(intLnkedSO) != -1)
						continue;

					var objTmpSORec = record.load({
						type : record.Type.SALES_ORDER,
						id : intLnkedSO
					});

					arrUpdatedSOList.push(intLnkedSO);

					log.debug(
							'setSOLnkCol - Detect if this SO has done linkage',
							'Dealing with SO id: ' + intLnkedSO);
					// Detect if this SO has done linkage
					var bolSOColAllLnkedVals = true;
					for (var soLnIdx = 0; soLnIdx < objTmpSORec
							.getLineCount('item'); soLnIdx++) {
						var intLnkedSO_dtc = objTmpSORec.getSublistValue({
							sublistId : 'item',
							fieldId : IDLIB.REC.N_SALESORD.COL_LINKEDPOSO,
							line : soLnIdx
						});
						var intLnkedSOUid_dtc = objTmpSORec.getSublistValue({
							sublistId : 'item',
							fieldId : IDLIB.REC.N_SALESORD.COL_LINKEDPOSOUID,
							line : soLnIdx
						});
						if (!intLnkedSO_dtc || !intLnkedSOUid_dtc) {
							bolSOColAllLnkedVals = false;
							break;
						}
					}
					if (bolSOColAllLnkedVals)
						continue;

					// Update SO column value
					for (var poIdx2 = i; poIdx2 < intPOLnItmCnt; poIdx2++) {

						var intLnkedSO2 = objPORec.getSublistValue({
							sublistId : 'item',
							fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSO,
							line : poIdx2
						});
						var intLnkedSOUid2 = objPORec.getSublistValue({
							sublistId : 'item',
							fieldId : IDLIB.REC.N_PURCHORD.COL_LINKEDPOSOUID,
							line : poIdx2
						});

						log
								.debug('setSOLnkCol - Update SO column value',
										'intLnkedSO2: ' + intLnkedSO2
												+ ', intLnkedSOUid2: '
												+ intLnkedSOUid2);
						// Collect other line with Same SO
						if (intLnkedSO2 != intLnkedSO || !intLnkedSO2
								|| !intLnkedSOUid2)
							continue;

						var intFoundSOLn = objTmpSORec
								.findSublistLineWithValue({
									sublistId : 'item',
									fieldId : 'lineuniquekey',
									value : intLnkedSOUid2
								});

						if (intFoundSOLn != -1 && intFoundSOLn.length > 0)
							continue;

						objTmpSORec.setSublistValue({
							sublistId : 'item',
							fieldId : IDLIB.REC.N_SALESORD.COL_LINKEDPOSO,
							line : intFoundSOLn,
							value : this.intPOId
						});
						objTmpSORec.setSublistValue({
							sublistId : 'item',
							fieldId : IDLIB.REC.N_SALESORD.COL_LINKEDPOSOUID,
							line : intFoundSOLn,
							value : objPORec.getSublistValue({
								sublistId : 'item',
								fieldId : 'lineuniquekey',
								line : poIdx2
							})
						});

					}

					objTmpSORec.save();
				}

				log.debug('setSOLnkCol',
						'Updated relevant SO Item lines linkage, proceed SO: '
								+ arrUpdatedSOList.join(', '));
			};

			return {
				SOTOPOLINKER : SOTOPOLINKER
			};

		});
