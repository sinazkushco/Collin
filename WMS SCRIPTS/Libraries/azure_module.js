/* eslint-disable no-mixed-spaces-and-tabs */
/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-11-01      cWong            Created Script
* 2.00       2018-12-01      dbarnett         Refactoring
*
*/
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 * @NAmdConfig ../AzureStorage/config.json
 */
define(['N/email', 'N/file', 'N/search', 'N/record', 'N/runtime', './xml_module.js', './global_modules.js', '../AzureStorage/azure-storage.file.js', 'N/log'],
     /**
	* Module params:
	* @param {email} email
	* @param {file} file
	* @param {search} search
	* @param {record} record
	* @param {runtime} runtime
	* @param {log}	log
	*/
     function (email, file, search, record, runtime, xml_module, global_modules, AzureStorage, log) {

          /**
	   * Get Azure directories based on xml type and direction
	   * @param {string} XML_TYPE
	   * @param {string} DIRECTION
	   * @return {object} 
	   */
          function get_directory(XML_TYPE, DIRECTION) {
               var wms_constants = global_modules.CONSTANTS.WMS_Configs[XML_TYPE.toUpperCase()]
               return {
                    share: wms_constants[DIRECTION.toUpperCase()].share,
                    directory: wms_constants[DIRECTION.toUpperCase()].directory
               }
          }
          /**
	  * creates file from batch and sends xml into azure, changes status of batch based on success or failure.
	  * @param {object} fileObj
	  * @param {string} XML_TYPE
	  * @return {boolean} 
	  */
          function azure_download(fileObj, XML_TYPE, param_obj) {
               param_obj = param_obj || null
               var azure_folders = get_directory(XML_TYPE, 'download') //get azure directories
               var fileService = AzureStorage.FileService
               var QUEUE_STATUS = { OPEN: 1, NEEDS_REVIEW: 2, COMPLETED: 3, DUPLICATE: 4 }
               var success = false
               var error_message = ''
               try {
                    log.debug('batch', fileObj.json)
                    fileService.createFileFromText(azure_folders.share, azure_folders.directory, fileObj.name, fileObj.text) //creates and sends file to azure
                    success = true
                    if (XML_TYPE == 'Item') {
                         var item_array = fileObj.json.Items.Item
                         log.debug('item_array',item_array)
                         if (param_obj && param_obj.ondemand) {
                              var array_of_item_skus = []
                              for (var i = 0; i < item_array.length; i++) {
                                   array_of_item_skus.push(item_array[i][0].Item)
                              }
                              log.debug('array_of_item_ids', array_of_item_skus)
                              uncheck_download_to_scale(array_of_item_skus, XML_TYPE)
                         } else {
                              var item_id = item_array[0][0].Desc
                              var sku = item_array[0][0].Item
                              try {
                                   var record_id = update_item_date_last_sent_to_scale_by_sku(item_id, sku)
                                   if (record_id) {
                                        log.debug('update date sent to scale success', record_id)
                                   }
                              } catch (e) {
                                   log.error('update date sent to scale failed', e)
                              }
                         }

                    } else if (XML_TYPE == 'BillOfMaterial' && param_obj && param_obj.ondemand) {
                         var bom_array = fileObj.json.BillOfMaterials.BillOfMaterial
                         log.debug('bom_array', bom_array)
                         var array_of_skus = []
                         for (var j = 0; j < bom_array.length; j++) {
                              array_of_skus.push(bom_array[j].Item)
                         }
                         log.debug('array_of_item_ids', array_of_skus)
                         uncheck_download_to_scale(array_of_skus, XML_TYPE)
                    }

               } catch (e) {
                    error_message = JSON.stringify(e)
                    log.error('error at azure download', error_message)
               }
               var status = success ? QUEUE_STATUS.COMPLETED : QUEUE_STATUS.NEEDS_REVIEW
               global_modules.mark_batch_status(fileObj.batch_id, status, error_message) //marks status of batch
               return success
          }

	  /**
	  * creates file from batch and sends xml into azure, changes status of batch based on success or failure.
	  * @param {string} XML_TYPE
	  * @param {int} record_id
       * @param {{type: string, id: number}} secondaryrecord_options
	  * @return {boolean} 
	  */
          function on_demand_download(XML_TYPE, record_id, secondaryrecord_options) {
               var batches = global_modules.create_batches(XML_TYPE, record_id) //creates a xml based on xml type and record id
               log.debug('azure_module.js -> batches', batches)
               var success = false
               if (batches.length) {
                    var needs_review = false
                    if (XML_TYPE == 'Shipment') {
                         try {
                              global_modules.createItemFulfillment(batches[0]) //creates the fulfillment and adds data onto the xml
                         } catch (err) {
                              needs_review = err
                              log.error('err', JSON.stringify(err))
                         }
                    }
                    else if (secondaryrecord_options && secondaryrecord_options.type === 'itemfulfillment' && XML_TYPE == 'Receipt') {
                         try {
                              createScaleReceiptFromTOfulfillment(batches[0], secondaryrecord_options) //TODO: DONALD?? //TODO: SUP! this is my function.  Whats up?
                              log.debug({ title: 'AFTER GLOBAL MODULE', details: batches[0] })

                         } catch (err) {
                              needs_review = err
                              log.error('err', JSON.stringify(err))
                         }
                    }
                    var batch_id = global_modules.create_batch_record(batches[0], XML_TYPE, 'outbound') //creates the batch record with the xml
                    if (needs_review) {
                         global_modules.logTransformError(batches[0].Shipments.Shipment[0].ErpOrder, batches[0], needs_review, '2') //mark needs review
                    } else {
                         var fileObj = global_modules.getInputData_ByQueueRecord(XML_TYPE, batch_id) //builds a file obj based on queue record id
                         log.debug('fileObj', fileObj[0])
                         success = azure_download(fileObj[0], XML_TYPE) //send batch up to azure
                    }
               } else {
                    log.error('THIS RECORD DID NOT MEET THE SEARCH CRITERIA', 'TYPE: ' + XML_TYPE + 'ID: ' + record_id)
               }
               return success
          }
          /**
	   * 
	   * @param {object} batch FileTextObj from the batch of a Receipt XML.
	   * @param { {type: string, id: string|number} } itemfulfillment_options 
	   */
          function createScaleReceiptFromTOfulfillment(batch, itemfulfillment_options) {
               log.audit({ title: 'global_modules.js -> batch of FUL marked shipped from a TO', details: batch })
               var data = batch.Receipts.Receipt[0]

               try {
                    var itemfulfillment = record.load(itemfulfillment_options)
                    if (itemfulfillment) {
                         data.UserDef7 = itemfulfillment_options.id
                         var receiptdetails = []

                         var fulfilled_items = itemfulfillment.getLineCount('item')
                         for (var line = 0; line < fulfilled_items; line++) {

                              var item_itemquantity = itemfulfillment.getSublistValue({
                                   sublistId: 'item',
                                   fieldId: 'itemquantity',
                                   line: line
                              })
                              var item_sku = itemfulfillment.getSublistValue({
                                   sublistId: 'item',
                                   fieldId: 'custcol_item_sku',
                                   line: line
                              })
                              var item_orderline = itemfulfillment.getSublistValue({
                                   sublistId: 'item',
                                   fieldId: 'orderline',
                                   line: line
                              }) //this is 1 higher than on the Transfer Order
                              var receipt_orderline = (Number(item_orderline) + 1).toString()

                              var receiptdetail = {
                                   Action: 'SAVE',
                                   ErpOrderLineNum: global_modules.truncateResult(receipt_orderline, 19),
                                   SKU: {
                                        Action: 'SAVE',
                                        Company: data.Company,
                                        Item: global_modules.truncateResult(item_sku, 25),
                                        Quantity: global_modules.round(item_itemquantity, 5)
                                   }
                              }

                              receiptdetails.push(receiptdetail)
                         } //loop through lines

                         //overwrite the original item detail with the new item detail
                         data.Details.ReceiptDetail = receiptdetails

                    } //fulfillment exists
               } catch (error) {
                    log.error({ title: 'record failed to load', details: error })
                    throw error
               }
          }

          /**
	  * Get open queue records based on xml type
	  * @param {string} XML_TYPE
	  * @return {array} array of fileobjs made from queue records
	  */
          function get_queue_record_data_downloads(XML_TYPE) {
               var results = global_modules.getInputData_ByQueueRecord(XML_TYPE)
               if (results) {
                    log.debug({ title: 'resultsLength', details: results.length })

                    var fileNames = results.map(function (fl) {
                         return fl.name
                    })
                    log.debug({ title: 'fileNames', details: fileNames })
                    log.debug('results', results)
                    return results
               }
               return []
          }

          /**
	  * Creates batch record and sends it to azure
	  * @param {obj} batch JSON to be sent to azure 
	  * @param {string} XML_TYPE 
	  * @return {array} array of fileobjs made from queue records
	  */
          function pull_record_data_download(batch, XML_TYPE, param_obj) {
               var batch_id = global_modules.create_batch_record(batch, XML_TYPE, 'outbound')
               var fileObj = global_modules.getInputData_ByQueueRecord(XML_TYPE, batch_id)[0]
               var success = azure_download(fileObj, XML_TYPE, param_obj) //send batch
          }

          /**
	  * sends xml to azure based on current batch record
	  * @param {int} batch_id
	  * @param {string} XML_TYPE
	  */
          function on_demand_reprocess(batch_id, XML_TYPE) {
               var fileObj = global_modules.getInputData_ByQueueRecord(XML_TYPE, batch_id)[0]
               var success = azure_download(fileObj, XML_TYPE) //send batch
               if (success) {
                    log.debug('batch sent batch id: ', batch_id)
               } else {
                    log.error('reprocess failed', batch_id)
               }
               log.audit('fileObj', JSON.stringify(fileObj))
          }

          function update_item_date_last_sent_to_scale_by_sku(itemid, sku) {
               try {
                    // var itemid = "CMP CCELL Glass Cart White Plastic Mouthpiece 200ct"
                    var record_id = ''
                    var itemid_search_by_sku = search.create({
                         type: 'item',
                         filters:
                              [
                                   ['name', 'is', itemid],
                                   'AND',
                                   ['custitem_sku', 'is', sku]
                              ],
                         columns:
                              [
                                   search.createColumn({ name: 'internalid' }),
                                   search.createColumn({ name: 'isinactive' })
                              ]
                    })
                    var item_internal_id
                    var record_type
                    //var inactive_in_wms = false;
                    itemid_search_by_sku.run().each(function (result) {
                         item_internal_id = result.id
                         record_type = result.recordType
                         //inactive_in_wms = result.getValue({name: "isinactive"})
                    })

                    var now = global_modules.format_datetime(new Date())
                    record_id = record.submitFields({
                         type: record_type,
                         id: item_internal_id,
                         values: {
                              custitem_date_last_sent_to_scale: now
                              //custitem_inactive_in_wms : inactive_in_wms
                         },
                    })

                    return record_id
               } catch (e) {
                    log.debug('error at set scale date', e)
               }
          }

          function uncheck_download_to_scale(array_of_skus, XML_TYPE) {

               var item_ids = get_item_ids_based_on_skus(array_of_skus)
               unset_download_to_scale_and_set_last_date(item_ids, XML_TYPE)

               function unset_download_to_scale_and_set_last_date(item_ids, XML_TYPE) {
                    var now = global_modules.format_datetime(new Date())
                    var values = {
                         custitem_date_last_sent_to_scale: now,
                    }
                    if (XML_TYPE == 'BillOfMaterial') {
                         values['custitem_dl_to_scale_bom'] = false
                    } else if (XML_TYPE == 'Item') {
                         values['custitem_dl_to_scale_item'] = false
                    }
                    item_ids.map(function (id) {
                         var submit_success = record.submitFields({
                              type: record.Type.ASSEMBLY_ITEM,
                              id: id,
                              values: values
                         })
                         log.debug('unset_download_to_scale_and_set_last_date', submit_success)
                    })
               }

               function get_item_ids_based_on_skus(array_of_skus) {
                    var sku_filter = []
                    var filters = global_modules.scale_utils.create_filters('custitem_sku', 'is', array_of_skus)
                    sku_filter.push(global_modules.scale_utils.insert_or_filters(filters))
                    var assemblyitemSearchObj = search.create({
                         type: 'item',
                         filters:
                              [
                                   ['type','anyof','Assembly','InvtPart'],
                                   'AND',
                                   sku_filter,
                                   'AND',
                                   ['isinactive', 'is', 'F']

                              ],
                         columns:
                              [
                                   'internalid'
                              ]
                    })
                    var item_ids = []
                    assemblyitemSearchObj.run().each(function (result) {
                         item_ids.push(result.id)
                         return true
                    })
                    return item_ids
               }

               // function create_filters(field,operator, values) {
               //      var filters = []
               //      values.map(function (value) {
               //           var filter = [field, operator, value]
               //           filters.push(filter)
               //      })
               //      return filters
               // }

               // function insert_or_filters(filters) {
               //      var filters_with_OR = []
               //      for (var i = 0; i < filters.length; i++) {
               //           filters_with_OR.push(filters[i])
               //           if (i != (filters.length - 1)) {
               //                filters_with_OR.push('OR')
               //           }

               //      }
               //      return filters_with_OR
               // }
          }

          var azure_modules = {
               pull_record_data_download: pull_record_data_download,
               azure_download: azure_download,
               on_demand_download: on_demand_download,
               get_queue_record_data_downloads: get_queue_record_data_downloads,
               on_demand_reprocess: on_demand_reprocess
          }
          return azure_modules
     })
