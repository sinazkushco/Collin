/* eslint-disable no-mixed-spaces-and-tabs */
/**
* Module Description
* 
* Version    Date            Author           Remarks
* 1.00       2018-12-14      Collin Wong         Created Script
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/azure_module.js', '../Libraries/global_modules.js'],
     /**
	 * Module params:
	 * @param {azure_module} azure_module
	 * @param {global_modules} global_modules
	 * @param {record} record
	 */
     function (azure_module, global_modules) {

          var XML_TYPE = 'Item'

          function afterSubmit(context) {
               if (context.type != 'delete') {
                    var record_id = context.newRecord.id
                    var submit_success
                    if (context.type == 'create') {
                         azure_module.on_demand_download(XML_TYPE, record_id)
                        //  submit_success = record.submitFields({
                        //       type: record.Type.INVENTORY_ITEM,
                        //       id: record_id,
                        //       values: {
                        //            custitem_download_to_scale: true
                        //       }
                        //  })	
                        //  log.debug('submit success', submit_success)			
                    } else {
                         var new_record = context.newRecord
                         var old_record = context.oldRecord
                         var fields = global_modules.CONSTANTS.WMS_Configs.ITEM.fields//list of fields used by scale
                         var sublists = {}
						 var new_record_sku = new_record.getValue('custitem_sku')
                         if (new_record_sku) {
                              var changed = global_modules.compare_changes(new_record, old_record, fields, sublists) //check if any scale related fields have been changed
                              if (changed) {
                                   try {
                                        var missing_fields = global_modules.check_required_fields(record_id, XML_TYPE) //check if any required fields are missing
                                        log.debug('missing fields', JSON.stringify(missing_fields))
                                        if (!missing_fields.length) { //if all required fields then create and send xml
											 azure_module.on_demand_download(XML_TYPE, record_id)
											//  submit_success = record.submitFields({
                                            //       type: record.Type.INVENTORY_ITEM,
                                            //       id: record_id,
                                            //       values: {
                                            //            custitem_download_to_scale: true
                                            //       }
                                            //  })	
                                             log.debug('submit success', submit_success)		
                                        }
                                   } catch (e) {
                                        log.error('error', e)
                                   }
                              }
                         }
                    }
               }
          }
          return {
               afterSubmit: afterSubmit
          }
     })