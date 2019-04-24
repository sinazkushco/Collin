/* eslint-disable quotes */
/**
 * Module Description
 *
 * Version    Date			Author           Remarks
 * 2.00       2018-11-01      cWong			Created Script
 * 2.00       2018-12-01      dbarnett         Refactoring
 *
 */
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/email', 'N/search', 'N/record', './scale_upload_modules.js', './scale_download_modules.js', './scale_constants.js', './scale_utils.js', 'N/log', './uom_validation.js'],
     /**
	* Module params:
	* @param {email} email
	* @param {search} search
	* @param {record} record
	* @param {sum} sum
	* @param {sdm} sdm
	* @param {scale_constants} scale_constants
	* @param {scale_utils} scale_utils
	*/
     function (email, search, record, sum, sdm, scale_constants, scale_utils, log, uom) {

          function send_receipt_button(payload) {
               jQuery.ajax({
                    method: "POST",
                    url: "/app/site/hosting/scriptlet.nl?script=1061&deploy=1",
                    data: payload,
                    dataType: 'json'
               }).always(function () {
                    location.reload()
               })
               var modal = jQuery('<div>').addClass('modal').css({
                    display: 'block',
                    position: 'fixed',
                    'z-index': '1000',
                    top: '0',
                    left: '0',
                    height: '100%',
                    width: '100%',
                    background: 'rgba( 255 , 255 , 255 , .8) url(\'http://i.stack.imgur.com/FhHRx.gif\') 50% 50% no-repeat'
               })
               jQuery('body').append(modal) //create a loading screen model
          }

          var global_modules = {
               //constants
               CONSTANTS: {
                    WMS_Configs: scale_constants.WMS_Configs
               },

               //scale_upload_modules.js
               createItemFulfillment: sum.createItemFulfillment,
               createItemReceipt: sum.createItemReceipt,
               updateItemFulfillment: sum.updateItemFulfillment,
               process_inventorytransaction_STR: sum.process_inventorytransaction_STR,
               //scale_download_modules.js
               generateFileName: sdm.generateFileName,
               logTransformError: sdm.logTransformError,
               groupObjByProp: sdm.groupObjByProp,
               cleanseResults: sdm.cleanseResults,
               formatResults: sdm.formatResults,
               splitResultsIntoBatches: sdm.splitResultsIntoBatches,
               getInputData_ByQueueRecord: sdm.getInputData_ByQueueRecord,//CHECKED
               createJSONXMLObject: sdm.createJSONXMLObject,
               mark_batch_status: sdm.mark_batch_status,//CHECKED
               create_batches: sdm.create_batches,
               release_to_warehouse: sdm.release_to_warehouse,
               create_release_to_warehouse_button: sdm.create_release_to_warehouse_button,
               create_send_receipt_button: sdm.create_send_receipt_button,
               check_required_fields: sdm.check_required_fields,
               compare_changes: sdm.compare_changes,
               getWMSConfig: scale_utils.getWMSConfig,
               round: scale_utils.round,
               format_date: scale_utils.format_date,
               format_datetime: scale_utils.format_datetime,
               format_datetime_obj: scale_utils.format_datetime_obj,
               truncateResult: scale_utils.truncateResult,
               getAllResults: scale_utils.getAllResults,
               lookup_internalID_or_more: scale_utils.lookup_internalID_or_more,
               create_batch_record: scale_utils.create_batch_record,
               updateQueueRecord: scale_utils.updateQueueRecord,
               callNextMapScript: scale_utils.callNextMapScript,
               send_error_email: scale_utils.send_error_email,
               updateWarehouseStatus: scale_utils.updateWarehouseStatus,
               get_ship_reference: scale_utils.get_ship_reference,
               get_warehouses_with_wms: scale_utils.get_warehouses_with_wms,
               get_scale_company_code_reference: scale_utils.get_scale_company_code_reference,
               get_netsuite_company_code_reference: scale_utils.get_netsuite_company_code_reference,
               get_netsuite_company_by_scale_reference_map: scale_utils.get_netsuite_company_by_scale_reference_map,
               wms_location_reference_map: scale_utils.wms_location_reference_map,
               get_scale_warehouse_reference_by_netsuite_warehouse_map: scale_utils.get_scale_warehouse_reference_by_netsuite_warehouse_map,
               get_company_name_to_id_map: scale_utils.get_company_name_to_id_map,
               validate_uom: uom.validate_uom,
               set_ea_weight_if_mc_weight: uom.set_ea_weight_if_mc_weight,
               unset_inactive_in_wms: scale_utils.unset_inactive_in_wms,
               send_receipt_button: send_receipt_button,
               check_if_stocked_in_scale_loc: uom.check_if_stocked_in_scale_loc,
               pause: scale_utils.pause,
               create_loading_modal: scale_utils.create_loading_modal,
               scale_utils: scale_utils,
               sdm: sdm,
               uom: uom,
               sum: sum
          }
          return global_modules
     })

