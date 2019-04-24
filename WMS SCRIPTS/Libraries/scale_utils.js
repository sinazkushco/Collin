/* eslint-disable semi */
/* eslint-disable quotes */
/* eslint-disable indent */
/* Version    Date            Author           Remarks
* 2.00       2018-02-13      cWong            Created Script
*
*/
/**
* @NApiVersion 2.x
* @NModuleScope SameAccount
*/
define(['N/log', 'N/record', './scale_constants.js', 'N/search', 'N/email', './moment.min.js'],

	function (log, record, scale_constants, search, email, moment) {

		/**
		* shorten strings to fit lengths in scale db, also removes special characters by default but can be disabled
		* @param {string} str 
		* @param {int} len length
		* @return {boolean} keep_special_char
		*/
		function truncateResult(str, len, keep_special_char) {
			keep_special_char = keep_special_char || false
			try {
				str = (str || '').substring(0, len)
				if (!keep_special_char) {
					str = str.replace(/[^\w\s-]/gi, '')
				}
				return str
			} catch (e) {
				log.error('str at truncate result', JSON.stringify(str))
				log.error('error', e)
			}
		}

		/**
		* Load and grab config record for specific XML type
		* @param {string} configType  XML type
		* @returns {object} configLookup object with config values 
		*/
		function getWMSConfig(configType) {
			var configTypeID = scale_constants.WMS_Configs[configType.toUpperCase()].config_id

			var configLookup = search.lookupFields({
				type: 'customrecord_wms_configuration',
				id: configTypeID,
				columns: ['name', 'custrecord_wms_max_batch_size',
					'custrecord_wms_rec_save_search', 'custrecord_json_templet', 'custrecord_queue_record_search']
			})
			return configLookup
		}

		/**
		* Round to a specified decimal place
		* @param {number} value number to round
		* @param {int} decimals decimal places
		* @returns {number} rounded number
		*/
		function round(value, decimals) {
			if (!value && value !== 0) {
				return ''
			}

			return Math.abs(Number(Math.round(value + 'e' + decimals) + 'e-' + decimals))
		}

		/**
		* Format date to be scale readable
		* @param {string} date_string
		* @returns {datetime} formated_date
		*/
		function format_date(date_string) {
			if (!date_string) {
				return ''
			}
			date_string = new Date(date_string)
			date_string = getDate(date_string)

			function pad(time, sigFigs) {
				sigFigs = sigFigs || 2
				var scalar = sigFigs
				var zeroes = '0'
				while (--scalar) {
					zeroes += '0'
				}
				return (zeroes + time).slice(sigFigs * -1)
			}

			function getDate(time) {
				return '' + time.getFullYear() + '/' + pad(time.getMonth() + 1) + '/' + pad(time.getDate())
			}

			var split = date_string.split('/')
			var formated_date = split.join('-') + 'T00:00:00-05:00'
			return formated_date
		}

		/**
		* Updates warehouse status of specific record based on criteria
		* @param {string} type record type
		* @param {int} id record id
		*/
		function updateWarehouseStatus(type, id) {
			//lookup field on statuss
			var recordStatus = search.lookupFields({
				type: type,
				id: id,
				columns: ['status']
			}).status[0].text

			if (type == record.Type.PURCHASE_ORDER) {
				processPurchaseOrderStatus(recordStatus, type, id)
				return
			}

			if (type == record.Type.RETURN_AUTHORIZATION) {
				processReturnAuthStatus(recordStatus, type, id)
				return
			}

			if (recordStatus == 'Pending Approval' || !recordStatus) {
				submitUpdate(type, id, '1') //Not Released
				return
			}

			var isComplete = checkComplete(recordStatus)
			if (isComplete) {
				submitUpdate(type, id, '5') //Complete
				return
			}

			var isPendingRelease = checkPendingRelease(id) //Pending Release
			if (isPendingRelease) {
				submitUpdate(type, id, '2')
				return
			}

			var isFullyReleased = checkFullyReleased(type, id)
			if (isFullyReleased) {
				submitUpdate(type, id, '4') //Fully Released
			} else {
				submitUpdate(type, id, '3') //Partial
			}
			return

			function checkFullyReleased(type, id) {
				var fullyReleased = true
				var searchType = (type == 'transferorder') ? 'TrnfrOrd' : 'SalesOrd'
				var filter = [
					['internalidnumber', 'equalto', id],
					'AND',
					['cogs', 'is', 'F'],
					'AND',
					['type', 'anyof', searchType],
					'AND',
					['taxline', 'is', 'F'],
					'AND',
					['shipping', 'is', 'F'],
					'AND',
					['mainline', 'is', 'F'],
					'AND',
					['quantity', 'greaterthan', '0'],
					"AND",
					["item.type", "anyof", "Assembly", "InvtPart", "NonInvtPart"]
				]

				if (type == 'transferorder') {
					filter.push('AND', ['transactionlinetype', 'anyof', 'SHIPPING'])
				}

				var transactionSearchObj = search.create({
					type: type,
					filters: filter,
					columns: [
						'quantity',
						'quantitypicked'
					]
				})

				transactionSearchObj.run().each(function (result) {
					var soQty = Math.abs(result.getValue('quantity')) //TO QTY COMES OUT NEGATIVE
					var fulQty = result.getValue('quantitypicked')

					if (soQty != fulQty) { //SO QTY DOES NOT MATCH FUL QTY
						fullyReleased = false
					}
					if (fullyReleased === false) {
						return false
					}
					return true
				})

				return fullyReleased
			}

			function checkComplete(recordStatus) {
				if (recordStatus != 'Pending Fulfillment' && recordStatus != 'Pending Approval' && recordStatus != 'Partially Fulfilled' && recordStatus != 'Pending Billing/Partially Fulfilled' && recordStatus != 'Pending Receipt/Partially Fulfilled') {
					return true
				} else {
					return false
				}
			}

			function checkPendingRelease(id) {
				//search used to find all item fulfillments for current record.  Pass in scale_warehouse locations
				var itemfulfillmentSearchObj = search.create({
					type: 'itemfulfillment',
					filters: [
						['type', 'anyof', 'ItemShip'],
						'AND',
						['createdfrom', 'anyof', id],
						'AND',
						['cogs', 'is', 'F'],
						'AND',
						['shipping', 'is', 'F'],
						'AND',
						['status', 'noneof', 'ItemShip:C']
					],
					columns: [
						'statusref',
						'item',
						'quantity'
					]
				})

				var fulfillmentItemCount = itemfulfillmentSearchObj.runPaged().count

				//IF there are no item fulfillment records associated with the order, move to Pending Release.
				if (!fulfillmentItemCount) {
					return true
				} else {
					return false
				}
			}

			function submitUpdate(type, id, status) {
				record.submitFields({
					type: type,
					id: id,
					values: {
						'custbody_warehouse_status': status //Complete
					}
				})
			}

			function processReturnAuthStatus(recordStatus, type, id) {
				if (recordStatus == 'Pending Refund' || recordStatus == 'Refunded') {
					submitUpdate(type, id, '5') //Complete
				} else if (recordStatus == 'Pending Receipt' || recordStatus == 'Partially Received/Pending Refund' || recordStatus == 'Partially Received') {
					submitUpdate(type, id, '4') //Fully Released
				}
			}

			function processPurchaseOrderStatus(recordStatus, type, id) {
				if (recordStatus == 'Pending Bill' || recordStatus == 'Fully Billed') {
					submitUpdate(type, id, '5') //Complete
				}
			}
		}

		/**
		* Updates warehouse status of specific record based on criteria
		* @param {string} type //record type
		* @param {int} id //record id
		* @returns {int} new_batch_id
		*/
		function create_batch_record(batch, configType, direction) {
			var direction_map = {
				outbound: '2',
				inbound: '1'
			}
			var direction_id = direction_map[direction]
			var configTypeID = scale_constants.WMS_Configs[configType.toUpperCase()].config_id
			var batch_string = JSON.stringify(batch)
			var batch_record = record.create({
				type: 'customrecord_wms_queue_records'
			})
			batch_record.setValue({
				fieldId: 'custrecord_wms_json',
				value: batch_string
			})
			batch_record.setValue({
				fieldId: 'custrecord_wms_record_type',
				value: configTypeID
			})
			batch_record.setValue({
				fieldId: 'custrecord_wms_direction',
				value: direction_id
			})
			var new_batch_id = batch_record.save({ ignoreMandatoryFields: true })
			try {
				set_warehouse_status(batch, configType)
			} catch (e) {
				log.error('set_warehouse_status', JSON.stringify(e))
			}
			return new_batch_id
		}

		/**
		* updates warehouse status of all records in a batch
		* @param {array} batch 
		* @param {string} XML_TYPE  
		*/
		function set_warehouse_status(batch, XML_TYPE) {
			var record_type_map = {
				Shipment:
				{
					'Sales Order': 'salesorder',
					'Sample Order': 'salesorder',
					'Transfer Order': 'transferorder',
					'Consignment Order': 'transferorder'
				},
				Receipt: {
					PO: 'purchaseorder',
					TO: 'transferorder',
					RMA: 'returnauthorization',
					'Consignment Order': 'transferorder'
				}
			}
			var id
			var type
			if (XML_TYPE == 'Shipment') {
				batch.Shipments.Shipment.forEach(function (entry) {
					id = entry.ErpOrder
					type = record_type_map[XML_TYPE][entry.OrderType]
					updateWarehouseStatus(type, id)
				})
			} else if (XML_TYPE == 'Receipt') {
				batch.Receipts.Receipt.forEach(function (entry) {
					id = entry.ErpOrderNum
					type = record_type_map[XML_TYPE][entry.ReceiptIdType]
					var status = '4'
					record.submitFields({
						id: id,
						type: type,
						values: {
							custbody_warehouse_status: status
						}
					})
				})
			}
		}

		/** grabs all results in a search object
		 * @param {object} osearch
		 * @returns {Result[]} all results of passed search object
		 */
		function getAllResults(osearch) {
			var all = []
			var results = []

			var startIndex = 0
			var endIndex = 1000
			var pageSize = 1000

			do {
				results = osearch.run().getRange({
					start: startIndex,
					end: endIndex
				})

				all = all.concat(results)

				startIndex += pageSize
				endIndex += pageSize
			} while (results.length === pageSize)

			return all
		}

		/** check if any line items are scale enabled
		 * @param {int} rec_id
		 * @returns {searchResultCount} number of results
		 */
		function wms_enabled_item_line(rec_id) {
			var transactionSearchObj = search.create({
				type: 'transaction',
				filters:
					[
						['type', 'anyof', 'PurchOrd', 'RtnAuth', 'SalesOrd', 'TrnfrOrd'],
						'AND',
						['location.custrecord_scale_enabled', 'is', 'T'],
						'AND',
						['internalidnumber', 'equalto', rec_id]
					],
				columns:
					[
						'location',
						'type',
						'quantity',
						'item'
					]
			})
			var searchResultCount = transactionSearchObj.runPaged().count
			return searchResultCount
		}

		/** sends email to dev
		 * @param {string} subject
		 * @param {string} body
		 */
		function send_error_email(subject, body, recipients) {
			recipients = recipients || '358183'
			email.send({
				author: '358183',
				recipients: recipients,
				subject: subject,
				body: body
			})
		}

		/** check if order has an back ordered items
		* this is an object, use xml type as a key before function call
	 	* @param {int} id id of record
	 	*/
		var check_for_backorder = {
			SHIPMENT: function (id) {
				var back_order_search = search.create({
					type: 'transaction',
					filters:
						[
							["mainline", "is", "F"],
							"AND",
							["item.type", "anyof", "Assembly", "InvtPart"],
							"AND",
							[["quantitycommitted", "isempty", ""], "OR", ["formulanumeric: ABS({quantity}) - {quantitycommitted}", "greaterthan", "0"]],
							"AND",
							["internalidnumber", "equalto", id],
							"AND",
							["shipping", "is", "F"],
							"AND",
							[[["type", "anyof", "TrnfrOrd"], "AND", ["transactionlinetype", "anyof", "SHIPPING"]], "OR", ["type", "anyof", "SalesOrd"]]
						],
					columns:
						[
							'quantity',
							'item',
							'quantitycommitted'
						]
				})
				var count = back_order_search.runPaged().count
				return count
			},
			WORKORDER: function (id) {
				var workorderSearchObj = search.create({
					type: 'workorder',
					filters:
						[
							['type', 'anyof', 'WorkOrd'],
							'AND',
							['internalidnumber', 'equalto', id],
							'AND',
							['mainline', 'is', 'F'],
							'AND',
							['formulanumeric: {quantity} - {quantitycommitted}', 'greaterthan', '0'],
							'AND',
							['sum(formulanumeric: Max(Nvl({Quantity},0)) – Max(NVL({quantitycommitted},0))))', 'greaterthan', '0']
						],
					columns:
						[
							search.createColumn({
								name: 'tranid',
								summary: 'GROUP'
							}),
							search.createColumn({
								name: 'item',
								summary: 'GROUP'
							}),
							search.createColumn({
								name: 'formulanumeric',
								summary: 'SUM',
								formula: '{quantity} - {quantitycommitted}'
							})
						]
				})
				var searchResultCount = workorderSearchObj.runPaged().count
				return searchResultCount
			}
		}

		/** calls a map reduce script
		 * @param {int} scriptId
		 * @param {int} deploymentId
		 * @param {object} task task module
		 */
		function callNextMapScript(scriptId, deploymentId, task) {
			var scriptTask = task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: scriptId,
				deploymentId: deploymentId
			})
			scriptTask.submit()
			return true
		}

		/**
         * Looks up a field's value to find the internalid.  Make sure your field is a free-form-text, and a unique identifier, or else you'll get bad data.
         * @param { {TYPE: string, FIELD: string, VALUE: string } } options {TYPE: netsuite record.Type, FIELD: field's internalid, VALUE: string}
         * @param {string|string[]} [ARRAY_OF_MORE_COLUMNS=] optional param: a string of a column name or an array strings of column names
         * @param {boolean} [INACTIVE=false] send true to not filter for isinactive=F.  defaults to false
         * @returns { string|false|{text: string, value: any} }  Internal ID as a string, as false, or an object with your specified columns
         */
		function lookup_internalID_or_more(options, ARRAY_OF_MORE_COLUMNS, INACTIVE) {
			try {
				//defines variables
				var internalid_column = search.createColumn({ name: 'internalid' });
				var columns = [
					internalid_column
				];

				//determines if more columns need to be searched
				if (typeof ARRAY_OF_MORE_COLUMNS === 'string') {
					columns.push(search.createColumn({ name: ARRAY_OF_MORE_COLUMNS }));
				}
				else if (ARRAY_OF_MORE_COLUMNS instanceof Array) {
					ARRAY_OF_MORE_COLUMNS.forEach(function (columnname, number) {
						if (typeof columnname === 'string') {
							columns.push(search.createColumn({ name: columnname }));
						} else {
							throw "Bad Input: Array values need to be a string. | Index: " + number + ", Value: " + JSON.stringify(columnname);
						}
					});
				}
				else if (typeof ARRAY_OF_MORE_COLUMNS === 'undefined' || ARRAY_OF_MORE_COLUMNS === null) {
					//user is only searching for internalid.  thisis ok.
				} else {
					throw "Bad Input: Wrong data type.  Second param needs to be a string or array of strings. | " + typeof ARRAY_OF_MORE_COLUMNS;
				}

				//defines the search
				var searchoptions = {
					type: options.TYPE,
					filters: [
						[options.FIELD, "is", options.VALUE]
					],
					columns: columns
				};

				//adds the inactive filter unless the user passes in true
				if (!INACTIVE) {
					searchoptions.filters.push("AND", ["isinactive", "is", "F"]);
				}


				//runs search
				var nsSearch = search.create(searchoptions);
				var nsResultSet = nsSearch.run();
				var results = nsResultSet.getRange({ start: 0, end: 420 });

				// if (results.length === 1) {  //potential for no data if bad data is present
				if (results.length) {           //potential for bad data if bad data is present
					var result = results[0];
					if (result.columns.length === 1) {
						//user is only searching for internalid
						return result.getValue(internalid_column);
					} else {
						//user specified more columns to search
						var output = {
							id: result.getValue(internalid_column)
						};
						ARRAY_OF_MORE_COLUMNS.forEach(function (columnname) {
							output[columnname] = {
								text: result.getText(columnname),
								value: result.getValue(columnname)
							};
						});
						return output;
					}
				} else {
					//no results found
					return false;
				}
			} catch (error) {
				log.error({ title: 'scale_utils.js -> failed inside lookup_internalID_or_more', details: error });
				return false;
			}
		}

		/**
		 * @param {number} queueRecordId
         * @param {string} action   switch: 'COMPLETE', 'SKIP', 'ERROR', 'WAITING', 'UPDATE'
         * @param {string|object} [data]
         * @return {number}   on success, returns queueRecordId.
         */
		function updateQueueRecord(queueRecordId, action, data) {
			var values = {}
			switch (action) {
				case 'COMPLETE':
					values = {
						custrecord_wms_status: "3",
						custrecord_wms_netsuite_record: data ? data : ''
					}
					break
				case 'IGNORE':
					values = {
						custrecord_wms_status: "4",
						custrecord_error_message: data
					}
					break
				case 'OPEN':
					values = {
						custrecord_wms_status: "1"
					}
					break
				case 'ERROR':
					values = {
						custrecord_wms_status: "2",
						custrecord_error_message: JSON.stringify(data) //NOTE THAT THIS STRINGIFY FOR YOU
					}
					break
				case 'WAITING':
					values = {
						custrecord_wms_status: "5",
						custrecord_error_message: data
					}
					break
				case 'UPDATE':
					values = data
					break
				default:
					// return false;
					throw "WRONG ACTION: YO you have to call my function with something from the switch statement. read JSdoc"
			}


			return record.submitFields({
				type: 'customrecord_wms_queue_records',
				id: queueRecordId,
				values: values,
				options: { ignoreMandatoryFields: true }
			})
		}

		/** calls a map reduce script
		 * @param {int} scriptId
		 * @param {int} deploymentId
		 * @param {object} task task module
	 	*/
		function get_ship_reference(shipmethod_id) {
			if (!shipmethod_id) {
				return null
			}
			var customrecord_scale_ship_cross_referenceSearchObj = search.create({
				type: 'customrecord_scale_ship_cross_reference',
				filters:
					[
						['custrecord_nsshipvia', 'anyof', shipmethod_id]
					],
				columns:
					[
						'custrecord_scale_ship_service_level',
						'custrecord_scale_shipper_code',
						'custrecord_nsshipvia',
						'custrecord_scale_ship_carrier',
					]
			})
			var results = getAllResults(customrecord_scale_ship_cross_referenceSearchObj)[0] || false
			return results
		}

		/** calls a map reduce script
		 * @param {int} scriptId
		 * @param {int} deploymentId
		 * @param {object} task task module
		 */
		function get_scale_company_code_reference(subsidiary) {
			var customrecord_scale_company_cross_refSearchObj = search.create({
				type: 'customrecord_scale_company_cross_ref',
				filters:
					[
						['isinactive', 'is', 'F'],
						'AND',
						['custrecord_ns_subsidiary', 'anyof', subsidiary]
					],
				columns:
					[
						'custrecord_scale_company_ref'
					]
			})
			var reference = ''
			customrecord_scale_company_cross_refSearchObj.run().each(function (result) {
				reference = result.getValue({ name: 'custrecord_scale_company_ref' })
				return true
			})
			return reference
		}

		/** get netsuite company name based on scale company name
	 	* @param {string} subsidiary
		* @returns {string} internal id of the netsuite company
	 	*/
		function get_netsuite_company_code_reference(subsidiary) {
			var customrecord_scale_company_cross_refSearchObj = search.create({
				type: 'customrecord_scale_company_cross_ref',
				filters:
					[
						['custrecord_scale_company_ref', 'is', subsidiary]
					],
				columns:
					[
						'custrecord_ns_subsidiary'
					]
			})
			var reference = null
			customrecord_scale_company_cross_refSearchObj.run().each(function (result) {
				reference = result.getValue({ name: 'custrecord_ns_subsidiary' })
			})
			return reference
		}

		/** get object with scale company name as keys with netsuite company names and internal ids as the values
	 	* @param none
		* @returns {object} 
	 	*/
		function get_netsuite_company_by_scale_reference_map() {
			var company_reference_object = {}
			var customrecord_scale_company_cross_refSearchObj = search.create({
				type: 'customrecord_scale_company_cross_ref',
				filters:
					[
						['isinactive', 'any', '']
					],
				columns:
					[
						'custrecord_ns_subsidiary',
						'custrecord_scale_company_ref'
					]
			})
			customrecord_scale_company_cross_refSearchObj.run().each(function (result) {
				var scale_company_ref = result.getValue({ name: 'custrecord_scale_company_ref' })
				company_reference_object[scale_company_ref] = {
					value: result.getValue({ name: 'custrecord_ns_subsidiary' }),
					text: result.getText({ name: 'custrecord_ns_subsidiary' })
				}
				return true
			})
			return company_reference_object
		}

		/** get object with scale company name as keys with netsuite company names and internal ids as the values
	  	* @param none
		* @returns {object} 
	  	*/
		function get_scale_company_reference_by_netsuite_company_map() {
			var company_reference_object = {}
			var customrecord_scale_company_cross_refSearchObj = search.create({
				type: 'customrecord_scale_company_cross_ref',
				filters:
					[
						['isinactive', 'is', 'F']
					],
				columns:
					[
						'custrecord_ns_subsidiary',
						'custrecord_scale_company_ref'
					]
			})
			customrecord_scale_company_cross_refSearchObj.run().each(function (result) {
				var subsidiary_id = result.getValue({ name: 'custrecord_ns_subsidiary' })
				company_reference_object[subsidiary_id] = result.getValue({ name: 'custrecord_scale_company_ref' })
				return true
			})
			return company_reference_object
		}

		/** returns object with warehouse ids as keys and their scale reference as the values
		* @returns {object} 
		*/
		function wms_location_reference_map() {
			var map = {}
			var locationSearchObj = search.create({
				type: 'location',
				filters:
					[
						['custrecord_wms_location_reference', 'isnotempty', '']
					],
				columns:
					[
						'custrecord_wms_location_reference'
					]
			})
			locationSearchObj.run().each(function (result) {
				map[result.id] = result.getValue({ name: 'custrecord_wms_location_reference' })
				return true
			})
			return map
		}

		/** returns and array of all scale enabled warehouses
		* @returns {array} warehouses_using_wms
		*/
		function get_warehouses_with_wms() {
			var warehouses_using_wms = []
			var srcObj = search.load({
				id: 'customsearch_locations_with_wms'
			})
			var results = getAllResults(srcObj)
			results.forEach(function (res) {
				warehouses_using_wms.push(res.id)
			})
			return warehouses_using_wms
		}

		/**
 		* returns datetime to a format that netsuite can accept
 		* @param {datetime} datetime object with all item data
 		* @returns {string} datetime 
		 */

		function format_datetime(date_string) {
			if (!date_string) {
				return ''
			}
			date_string = new Date(date_string)
			date_string = getDate(date_string)

			function pad(time, sigFigs) {
				sigFigs = sigFigs || 2
				var scalar = sigFigs
				var zeroes = '0'
				while (--scalar) {
					zeroes += '0'
				}
				return (zeroes + time).slice(sigFigs * -1)
			}

			function getDate(time) {
				var hour = time.getHours()
				var ampm = 'am'
				if (hour > 12) {
					hour = hour - 12
					ampm = 'pm'
				}
				if (hour == 0) {
					hour = 12
				}

				return pad(time.getMonth() + 1) + '/' + pad(time.getDate()) + '/' + time.getFullYear() + ' ' + pad(hour) + ':' + pad(time.getMinutes()) + ':' + pad(time.getSeconds()) + ' ' + ampm
			}

			//var split = date_string.split('/')
			//var formated_date = split.join('-') + 'T00:00:00-05:00'
			return date_string
		}

		/**
  * returns datetime to a format that netsuite can accept
  * @param {datetime} datetime object with all item data
  * @returns {datetime} 
*/

		function format_datetime_obj(datetime) {
			return moment(datetime, "YYYY-MM-DD HH:mm:ss").toDate();
		}

		/**
  * returns map of subsidiary name to ids 
  * @returns {object} sub_map
  */

		function get_company_name_to_id_map() {
			var sub_map = {};
			var subsidiarySearchObj = search.create({
				type: "subsidiary",
				filters:
					[
						["isinactive", "is", "F"]
					],
				columns:
					[
						"namenohierarchy"
					]
			});
			subsidiarySearchObj.run().each(function (result) {
				sub_map[result.getValue({ name: 'namenohierarchy' })] = result.id
				return true;
			});
			return sub_map
		}

		function unset_inactive_in_wms(fieldId, currentRecord) {
			if (fieldId == 'isinactive') {
				var isactive = !currentRecord.getValue('isinactive');
				if (isactive) {
					currentRecord.setValue({
						fieldId: 'custitem_inactive_in_wms',
						value: false
					})
				}
			}
		}

		function create_loading_modal(text) {
			var modal = jQuery('<div>').text(text).addClass('modal').css({
				display: 'block',
				position: 'fixed',
				'z-index': '1000',
				top: '0',
				left: '0',
				height: '100%',
				width: '100%',
				background: 'rgba( 255 , 255 , 255 , .8) url(\'http://i.stack.imgur.com/FhHRx.gif\') 50% 50% no-repeat',
				'text-align': 'center',
				padding: '25%',
				'font-size': '28px'
			})
			jQuery('body').append(modal) //create a loading screen model
			//jQuery(modal).remove()
		}

		function pause(waitTime) { //seconds
			try {
				var endTime = new Date().getTime() + waitTime * 1000
				var now = null
				do {
					//throw in an API call to eat time
					now = new Date().getTime() //
				} while (now < endTime)
			} catch (e) {
				nlapiLogExecution('ERROR', 'not enough sleep')
			}
		}

		function create_filters(field, operator, values) {
			var filters = []
			values.map(function (value) {
				 var filter = [field, operator, value]
				 filters.push(filter)
			})
			return filters
	   }

	   function insert_or_filters(filters) {
			var filters_with_OR = []
			for (var i = 0; i < filters.length; i++) {
				 filters_with_OR.push(filters[i])
				 if (i != (filters.length - 1)) {
					  filters_with_OR.push('OR')
				 }

			}
			return filters_with_OR
	   }

		return {
			create_batch_record: create_batch_record,
			round: round,
			format_date: format_date,
			truncateResult: truncateResult,
			getWMSConfig: getWMSConfig,
			updateWarehouseStatus: updateWarehouseStatus,
			set_warehouse_status: set_warehouse_status,
			getAllResults: getAllResults,
			wms_enabled_item_line: wms_enabled_item_line,
			send_error_email: send_error_email,
			check_for_backorder: check_for_backorder,
			lookup_internalID_or_more: lookup_internalID_or_more,
			updateQueueRecord: updateQueueRecord,
			callNextMapScript: callNextMapScript,
			get_netsuite_company_code_reference: get_netsuite_company_code_reference,
			get_netsuite_company_by_scale_reference_map: get_netsuite_company_by_scale_reference_map,
			get_ship_reference: get_ship_reference,
			get_warehouses_with_wms: get_warehouses_with_wms,
			get_scale_company_reference_by_netsuite_company_map: get_scale_company_reference_by_netsuite_company_map,
			get_scale_company_code_reference: get_scale_company_code_reference,
			wms_location_reference_map: wms_location_reference_map,
			format_datetime: format_datetime,
			format_datetime_obj: format_datetime_obj,
			get_company_name_to_id_map: get_company_name_to_id_map,
			unset_inactive_in_wms: unset_inactive_in_wms,
			pause: pause,
			create_loading_modal: create_loading_modal,
			create_filters: create_filters,
			insert_or_filters:insert_or_filters
		}
	})