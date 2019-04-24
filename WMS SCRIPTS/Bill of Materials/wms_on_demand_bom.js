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
define(['../Libraries/azure_module.js', '../Libraries/global_modules.js', 'N/record'],
     /**
	 * Module params:
	 * @param {azure_module} azure_module
	 * @param {global_modules} global_modules
	 * @param {record} record
	 */
     function (azure_module, global_modules, record) {

          function afterSubmit(context) {
               if (context.type != 'delete') {
                    var new_record = context.newRecord
                    var record_id = context.newRecord.id
                    var submit_success
                    if (context.type == 'create') { //always create xml on create
                         submit_success = record.submitFields({
                              type: record.Type.ASSEMBLY_ITEM,
                              id: record_id,
                              values: {
                                   custitem_download_to_scale: true
                              }
                         })	
                         log.debug('submit success', submit_success)		
                    } else { //on edit only send xml if changes were made to fields scale uses

                         var old_record = context.oldRecord

                         var fields = global_modules.CONSTANTS.WMS_Configs.ITEM.fields
                         var sublists = { //sublist fields in scale
                              member: global_modules.CONSTANTS.WMS_Configs.BILLOFMATERIAL.fields
                         }
                         var new_record_sku = new_record.getValue('custitem_sku')
                         if (new_record_sku) {
                              var changed = global_modules.compare_changes(new_record, old_record, fields, sublists) //see if any scale related fields have changed during edit
                              if (changed) {
                                   submit_success = record.submitFields({
                                        type: record.Type.ASSEMBLY_ITEM,
                                        id: record_id,
                                        values: {
                                             custitem_dl_to_scale_item: true,
                                             custitem_dl_to_scale_bom: true 
                                        }
                                   })	
                              }
                         }
                    }
               }
          }
          // /** creates and sends a item and bom xml
		// * @param {object} record_id id of current record
		// */
          // function download_item_and_bom(record_id) {
          //      azure_module.on_demand_download('Item', record_id)
          //      azure_module.on_demand_download('BillOfMaterial', record_id)
          // }
          return {
               afterSubmit: afterSubmit
          }
     })


