
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['N/record', '../Libraries/global_modules.js', '../Libraries/azure_module.js'],
	function runSuitelet(record, global_modules, azure_module) {
		function release_to_warehouse(context){
			var response = {
				success: false
			}
			if (context.request.method == 'POST') {
				var current_record = context.request.parameters
				var XML_TYPE = current_record.XML_TYPE
				if(current_record.receiptOnly){
					//submit the batch to create a receipt.  also relies on global_modules.createScaleReceiptFromTOfulfillment
					var TO_ID = current_record.toId
					var itemfulfillment_options = current_record.itemfulfillment_options
					record.submitFields({
						type: 'transferorder',
						id: TO_ID,
						values: {
							'custbody_warehouse_status': '2'
						}
					})
					var successful_batch_creation = azure_module.on_demand_download(XML_TYPE, TO_ID, itemfulfillment_options)
					if (successful_batch_creation) {

						try {
							record.submitFields({
								type: 'transferorder',
								id: TO_ID,
								values: {
									custbody_receipt_in_wms: true
								}
							})
						} catch (error) {
							log.error({ title: 'randys code probably blocked me from editing the field', details: error })
						}
					}
					return context.response.write(JSON.stringify(response))
				}
				if (XML_TYPE && current_record) {
					var current_record_id = current_record.id
					log.debug('current record', current_record)
					var saved_record
					var download_success
					var expedited = current_record.custbody_expedited_order
					if (expedited == 'true') {
						try{
							download_success = azure_module.on_demand_download(XML_TYPE, current_record_id)
						} catch (e){
							log.error('wms release to warehouse suitelet failed', JSON.stringify(e))
							global_modules.send_error_email('wms release to warehouse suitelet failed', JSON.stringify(current_record) + '\n' + 'ERROR:'+ JSON.stringify(e))
						}
					}
					if (download_success || saved_record) {
						response.success = true
					}
				}
			}
			return context.response.write(JSON.stringify(response))
		}
		return {
			onRequest: release_to_warehouse
		}
	})
   
