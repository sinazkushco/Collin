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
define(['N/search', 'N/log'],
	function () {
		var WMS_Configs = {
			ITEM: {
				config_id: 1,
				file_extension: '.imxml',
				folder_id: 830379,
				name: 'Item',
				plural_name: 'Items',
				group_by: 'Item',
				DOWNLOAD: {
					directory: '/Interface/Testinput',
					share: 'ils'
				},
				UPLOAD: {
					directory: '/Interface/Upload/Item',
					share: 'ils'
				},
				required_fields: ['subsidiarynohierarchy', 'custitem_sku', 'itemid'],
				fields: ['custitem_sku', 'subsidiarynohierarchy', 'classnohierarchy',
					'custitem_hazmat_item', 'isinactive', 'itemid',
					'custitem_classification', 'salesdescription',
					'custitem_uom_numeral', 'shipindividually', 'custitem_no_re_packaging',
					'weight', 'custitem_wms_image_url', 'custitem_old_sku',
					'custitem_ea_qty', 'custitem_ea_weight', 'custitem_ea_height',
					'custitem_ea_length', 'custitem_ea_treat_as_loose',
					'custitem_ea_width', 'custitem_ic_height', 'custitem_ic_length',
					'custitem_ic_treat_as_loose', 'custitem_ic_weight', 'custitem_ic_width',
					'custitem_ic_qty', 'custitem_mc_height', 'custitem_mc_length',
					'custitem_mc_qty', 'custitem_mc_treat_as_loose', 'custitem_mc_weight',
					'custitem_mc_width', 'custitem_npi', 'custitem_hot',
					'custitem_lot_wms', 'custitem_upccode', 'custitem_hazmat_packing_group', 'custitem_hazmat_proper_shipping_name',
					'custitem_hazmat_id_num','custitem_hazmat_hazard_class']
			},
			RECEIPT: {
				config_id: 2,
				file_extension: '.rcxml',
				folder_id: 830376,
				name: 'Receipt',
				plural_name: 'Receipts',
				group_by: 'ErpOrderNum',
				DOWNLOAD: {
					directory: '/Interface/Testinput',
					share: 'ils'
				},
				UPLOAD: {
					directory: '/Interface/Upload/Receipts',
					share: 'ils'
				},
				required_fields: []
			},
			SHIPMENT: {
				config_id: 6,
				file_extension: '.shxml',
				folder_id: 830378,
				name: 'Shipment',
				plural_name: 'Shipments',
				group_by: 'ErpOrder',
				DOWNLOAD: {
					directory: '/Interface/Testinput',
					share: 'ils'
				},
				UPLOAD: {
					directory: '/Interface/Upload/Shipments',
					share: 'ils'
				},
				required_fields: ['shipaddress1', 'shipaddressee', 'shipcity', 'shipstate', 'shipzip', 'shipcountry']
			},
			WORKORDER: {
				config_id: 7,
				file_extension: '.woxml',
				folder_id: 830381,
				name: 'WorkOrder',
				plural_name: 'WorkOrders',
				group_by: 'WorkOrderId',
				DOWNLOAD: {
					directory: '/Interface/Testinput',
					share: 'ils'
				},
				UPLOAD: {
					directory: '/Interface/KushTest/workorderDownload',
					share: 'ils'
				},
				required_fields: []
			},
			BILLOFMATERIAL: {
				config_id: 8,
				file_extension: '.bomxml',
				folder_id: 830382,
				name: 'BillOfMaterial',
				plural_name: 'BillOfMaterials',
				group_by: 'Item',
				DOWNLOAD: {
					directory: '/Interface/Testinput',
					share: 'ils'
				},
				UPLOAD: {
					directory: '/Interface/KushTest/bomDownload',
					share: 'ils'
				},
				required_fields: [],
				fields: ['item', 'quantity', 'subsidiarynohierarchy'] //this are sublist values, mainline fields are same as item fields
			},
			INVENTORYTRANSACTION: {
				config_id: 9,
				file_extension: '.itup.xml',
				folder_id: 964393,
				name: 'TransactionHistory',
				plural_name: 'TransHistories',
				group_by: 'UploadInterfaceBatch',
				UPLOAD: {
					directory: '/Interface/Upload/Inventory Transactions',
					share: 'ils'
				},
				required_fields: []
			}
		}



		return {

			WMS_Configs: WMS_Configs,

		}
	})