/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-1-25      Collin Wong         Created Script
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['N/file', 'N/record', 'N/search', 'N/xml', '../Libraries/global_modules.js', '../Libraries/xml_module.js', '../AzureStorage/azure-storage.file.js'],
     /**
      * Module params:
      * @param {file} file
      * @param {record} record
      * @param {search} search
      */
     function (file, record, search, xml, global_modules, xml_module, AzureStorage) {

          var share = 'ils'
          var directory = '/Interface/Upload/Inventory Balance'

          /**
        * Marks the beginning of the Map/Reduce process and generates input data.
        *
        * @typedef {Object} ObjectRef
        * @param {InputContext} context
        * @property {number} id - Internal ID of the record instance
        * @property {string} type - Record type id
        *
        * @return {Array|Object|Search|RecordRef} inputSummary
        * @since 2015.1
        */
          function getInputData(context) {
               var fileService = AzureStorage.FileService

               var filesToGet = fileService.listFilesAndDirectories(share, directory)
                log.debug('filesToGet',filesToGet)
                
               var xmlDocument = xml.Parser.fromString({
                    text: filesToGet
               })
               log.debug('xmlDocument',xmlDocument)
               
               var filesObj = xml_module.xml_2_json(xmlDocument)
               log.debug('filesObj',filesObj)
               return []
               var filesArr = []
               var fileNames = []
               if (filesObj.Entries && filesObj.Entries.File) {
                    var files = filesObj.Entries.File
                    filesArr = files instanceof Array ? files : [files]
               }
               for (var i = 0; i < filesArr.length; i++) {
                    fileNames.push(filesArr[i].Name)
               }
               log.debug('fileNames', fileNames)
               var wms_location_reference_map = global_modules.wms_location_reference_map()
               var scale_data = grab_scale_data(filesArr)
               var inventory_obj = get_inventory(scale_data, wms_location_reference_map)
               var inventory_array = []
               for (var item in inventory_obj) {
                    inventory_array.push(inventory_obj[item])
               }
               var flat_scale_data = flatten_scale_data(scale_data, wms_location_reference_map)
               inventory_array = inventory_array.concat(flat_scale_data)
               fileNames.forEach(function (fileName) {
                    fileService.deleteFile(share, directory, fileName)
                    log.debug('delete file: ', fileName)
               })
               return inventory_array
          }
          /**
        * Executes when the map entry point is triggered and applies to each key/value pair.
        *
        * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
        * @since 2015.1
        */
          function map(context) {
               var inventory_obj = JSON.parse(context.value)
               log.debug('inventory_obj', inventory_obj)
               try {
                    create_balance_record(inventory_obj)
               } catch (e) {
                    log.error('could not create balance record ', 'inventory object ' + JSON.stringify(inventory_obj) + 'error :' + e)
               }
          }

          /**
        * Executes when the summarize entry point is triggered and applies to the result set.
        *
        * @param {SummaryContext} context - Holds statistics regarding the execution of a map/reduce script
        * @since 2015.1
        */
          function summarize(context) {
               context.mapSummary.errors.iterator().each(function (key, value) {
                    log.error(key, value)
                    return true
               })
          }

          /**
       * pulls files from azure and processes them to create an object with item quantities sorted by sku, warehouse and status
       * 
       * @param {array} filesArr  array of files from azure
       * @param {object} 
       * scale_data = {
       *  sku = {
       *   warehouse_id : {
       *       status_id : quantity
       *                }
       *        }
       *    }
       */

          function grab_scale_data(filesArr) {
               var scale_data = {}
               var inventory_status_map = get_inventory_status_map()
               var warehouse_map = get_warehouse_reference_map()
               for (var i = 0; i < filesArr.length; i++) {
                    try {
                         var fileObj = filesArr[i]
                         var fileName = fileObj.Name
                         var fileService = AzureStorage.FileService
                         var fileText = fileService.getFileToText(share, directory, fileName)
                         scale_data = process_scale_xml(fileName, fileText, scale_data, inventory_status_map, warehouse_map)


                    } catch (e) {
                         log.error('error at get scale data', e)
                    }
               }
               log.debug('scale_data', JSON.stringify(scale_data))
               return scale_data
          }

          /**
      * proccess xml from file and adds data to the scale data object
      * @param {string} fileName file name
      * @param {string} fileText xml from file
      * @param {object} scale_data object to add data onto
      * @param {object} inventory_status_map 
      * @param {object} warehouse_map
      * @returns {object} scale_data
      */


          function process_scale_xml(fileName, fileText, scale_data, inventory_status_map, warehouse_map) {
               //Convert raw XML string to xml DOM Object
               var xmlDocument = xml.Parser.fromString({
                    text: fileText
               })
               var sample = 'MAIN'
               if (fileName.match('ibups.xml')) {
                    sample = 'SAMPLE'
               }
               //Convert XML DOM to JSON object
               var fileTextObj = xml_module.xml_2_json(xmlDocument)
               var inventory = fileTextObj.WMWDATA.WMFWUpload.Inventories.Inventory
               var current_item
               var warehouse
               var status_id
               var company
               var sku
               var warehouse_id
               var scale_quantity
               for (var i = 0; i < inventory.length; i++) {
                    try {
                         current_item = inventory[i]
                         sku = current_item.SKU.Item
                         company = current_item.SKU.Company
                         status_id = inventory_status_map[current_item.Status] || ''
                         warehouse = current_item.Warehouse
                         try {
                              warehouse_id = warehouse_map[company][warehouse][sample]
                         } catch (e) {
                              warehouse_id = ''
                         }
                         scale_quantity = current_item.SKU.Quantity
                         if (!scale_data[sku]) {
                              scale_data[sku] = {}
                         }
                         if (!scale_data[sku][warehouse_id]) {
                              scale_data[sku][warehouse_id] = {}
                         }
                         scale_data[sku][warehouse_id][status_id] = scale_quantity
                    } catch (e) {
                         log.error('error at process scale xml', e)
                         global_modules.send_error_email('Error at process scale xml inventory balance upload', e)
                    }
               }

               return scale_data
          }

          /**
       * creates balance record based on inventory object data
       * @param {object} inventory_obj object with all item data
       * @returns {int} saved inventory balance record id 
       */

          function create_balance_record(inventory_obj) {
               var saved_inventory_balance_record = ''
               var datetime = global_modules.format_datetime_obj(new Date())
               var inventory_balance_record = record.create({
                    type: 'customrecord_inventory_balance'
               })
               for (var item in inventory_obj) {
                    try {
                         inventory_balance_record.setValue({
                              fieldId: item,
                              value: inventory_obj[item]
                         })
                    } catch (e) {
                         inventory_balance_record.setValue({
                              fieldId: 'custrecord_invalid_sku',
                              value: inventory_obj[item]
                         })
                         log.error('error at set value inventory blance', e)
                    }
               }
               inventory_balance_record.setValue({
                    fieldId: 'custrecord_date_time',
                    value: datetime
               })
               try {
                    saved_inventory_balance_record = inventory_balance_record.save()
                    log.debug('saved_inventory_balance_record', saved_inventory_balance_record)

               } catch (e) {
                    log.error('error saving inventory balance record', e)
               }
               return saved_inventory_balance_record
          }

          //////////////////////////////////////////////////MAPS FUNCTIONS/////////////////////////////////

          /**
        * get a map of inventory status as the name as the key and id as the value
        * @returns {object} map of statues
        */

          function get_inventory_status_map() {
               var map = {}
               var inventorystatusSearchObj = search.create({
                    type: 'inventorystatus',
                    filters:
                    [
                         ['name', 'isnotempty', '']
                    ],
                    columns:
                    [
                         search.createColumn({
                              name: 'name',
                              sort: search.Sort.ASC
                         })
                    ]
               })
               inventorystatusSearchObj.run().each(function (result) {
                    map[result.getValue({ name: 'name' })] = result.id
                    return true
               })
               return map
          }

          /**
        * returns map to figure out warehouse id based on if sample, scale reference and subsidiary 
        * @returns {object} 
        *  var warehouse_reference_map = {
        *     'Kush Supply CO.':{
        *         'CA-GG':{
        *             'SAMPLE' : 13,
        *             'MAIN': 56
        *         }
        *     },
        * };
        */

          function get_warehouse_reference_map() {
               var warehouse_reference_map = {}
               var subsidiary_map = get_subsidiary_map()
               var locationSearchObj = search.create({
                    type: 'location',
                    filters:
                    [
                         ['custrecord_scale_enabled', 'is', 'T'],
                         'AND',
                         ['isinactive', 'is', 'F'],
                         'AND',
                         ['custrecord_wms_location_reference', 'isnotempty', '']
                    ],
                    columns:
                    [
                         search.createColumn({
                              name: 'name',
                              sort: search.Sort.ASC
                         }),
                         'custrecord_wms_location_reference',
                         'subsidiary',
                         'custrecord_is_sample_location'
                    ]
               })
               locationSearchObj.run().each(function (result) {
                    
                    var subsidiary_text = result.getValue('subsidiary') //for some reason this gives me text
                    var subsidiary_id = subsidiary_map[subsidiary_text]
                    var subsidiary = global_modules.get_scale_company_code_reference(subsidiary_id)
                    var scale_warehouse_reference = result.getValue('custrecord_wms_location_reference')
                    var custrecord_is_sample_location = (result.getValue('custrecord_is_sample_location')) ? 'SAMPLE' : 'MAIN'
                    var warehouse_id = result.id
                    if (!warehouse_reference_map[subsidiary]) {
                         warehouse_reference_map[subsidiary] = {}
                    }
                    if (!warehouse_reference_map[subsidiary][scale_warehouse_reference]) {
                         warehouse_reference_map[subsidiary][scale_warehouse_reference] = {}
                    }
                    warehouse_reference_map[subsidiary][scale_warehouse_reference][custrecord_is_sample_location] = warehouse_id
                    return true
               })
               return warehouse_reference_map
          }



          //////////////////////////////////////////////////HELPER FUNCTIONS/////////////////////////////////


          /**
      * returns difference of 2 numbers
      * @param {number} netsuite_quantity netsuite quantity
      * @param {number} scale_quantity scale quantity
      * @returns {int} difference
      */
          function get_difference(netsuite_quantity, scale_quantity) {
               var difference = Number(scale_quantity) - Number(netsuite_quantity)
               return difference
          }

          /**
       * return object with subsidiary names as keys and the ids as values
       * @returns {object} subsidiary_map
       */
          function get_subsidiary_map() {
               var subsidiarySearchObj = search.create({
                    type: 'subsidiary',
                    filters:
                    [
                         ['isinactive', 'is', 'F']
                    ],
                    columns:
                    [
                         'name',
                         'namenohierarchy'
                    ]
               })
               var subsidiary_map = {}
               subsidiarySearchObj.run().each(function (result) {
                    subsidiary_map[result.getValue({ name: 'namenohierarchy' })] = result.id
                    return true
               })
               return subsidiary_map
          }

          /**
      * returns array of objects with item data from an item search 
      * @param {object} scale_data  data pulled from files in azure
      * @param {object} wms_location_reference_map
      * @returns {object} final_results
      */

          function get_inventory(scale_data, wms_location_reference_map) {
               var final_results = []
               var subsidiary_map = global_modules.get_company_name_to_id_map()
               var inventory_balance = search.create({
                    type: search.Type.INVENTORY_BALANCE,
                    filters:
                    [
                         ['item.type', 'anyof', 'InvtPart', 'Assembly'],
                         'AND',
                         ['location.custrecord_scale_enabled', 'is', 'T'],
                         'AND',
                         ['location.isinactive', 'is', 'F']
                    ],
                    columns:
                    [
                         search.createColumn({
                              name: 'item',
                              sort: search.Sort.ASC
                         }),
                         search.createColumn({
                              join: 'item',
                              name: 'custitem_sku'
                         }),
                         search.createColumn({
                              name: 'location'
                         }),
                         search.createColumn({
                              join: 'location',
                              name: 'subsidiary'
                         }),
                         search.createColumn({
                              name: 'status',
                         }),
                         search.createColumn({
                              join: 'item',
                              name: 'stockunit'
                              //name: "formulanumeric",
                              // formula: "{item.custitem_stock_unit_numeral} * {onhand}"
                         }),
                         search.createColumn({
                              name: 'onhand'
                         })
                    ]
               })
               var item_results = global_modules.getAllResults(inventory_balance)
               item_results.map(function (res) {
             
                    // if(res.getValue({
                    //     name: "item",
                    //     sort: search.Sort.ASC
                    // }) == '3208'){
                    //     debugger;
                    // }
                    final_results = get_item_data(res, scale_data, final_results, wms_location_reference_map, subsidiary_map)
               })
               log.debug('final_results', JSON.stringify(final_results))
               return final_results
          }

          /**
        * returns array of objects with item data from an item search 
        * @param {object} scale_data  data pulled from files in azure
        * @param {object} wms_location_reference_map
        * @returns {object} final_results
        */

          function get_item_data(item_results, scale_data, final_results, wms_location_reference_map, subsidiary_map) {
               var item_id = item_results.getValue({
                    name: 'item',
                    sort: search.Sort.ASC
               })
               var sku = item_results.getValue({
                    join: 'item',
                    name: 'custitem_sku',
               })

               var warehouse_id = item_results.getValue({
                    name: 'location'
               })

               var subsidiary = subsidiary_map[item_results.getValue({
                    join: 'location',
                    name: 'subsidiary'
               })]

               var status = item_results.getValue({
                    name: 'status',
               })
               if (!status) {
                    status = '1'
               }
               var netsuite_quantity = (item_results.getText({ join: 'item', name: 'stockunit' }).replace(/\D/g, '') || 1) * item_results.getValue({ name: 'onhand' })
               var scale_quantity = 0
               if (scale_data[sku] && scale_data[sku][warehouse_id] && scale_data[sku][warehouse_id][status]) {
                    scale_quantity = scale_data[sku][warehouse_id][status]
                    delete scale_data[sku][warehouse_id][status]
               }
               var variance = get_difference(netsuite_quantity, scale_quantity) //custrecord_variance

               var item_obj = {
                    custrecord_inventory_item: item_id,
                    custrecord_warehouse_location: warehouse_id,
                    custrecord_inventory_status: status,
                    custrecord_netsuite_qty: netsuite_quantity,
                    custrecord_wms_qty: scale_quantity,
                    custrecord_variance: variance,
                    custrecord_entity: subsidiary,
                    custrecord_scale_warehouse_reference: wms_location_reference_map[warehouse_id]
               }
               final_results.push(item_obj)
               return final_results
          }

          /**
        * Makes scale data 1 level deep, same as item data, in order to pass into create balance record
        * @param {object} scale_data  data pulled from files in azure
        * @param {object} wms_location_reference_map
        * @returns {object} flat_scale_data
        */

          function flatten_scale_data(scale_data, wms_location_reference_map) {
               var flat_scale_data = []
               var sku_itemid_map = get_sku_itemid_map()
               for (var item in scale_data) {
                    for (var warehouse_id in scale_data[item]) {
                         for (var status in scale_data[item][warehouse_id]) {
                              log.debug('sku_itemid_map[item]', item + ' ' + sku_itemid_map[item])
                              var invalid_sku = (sku_itemid_map[item]) ? '' : item
                              var scale_quantity = scale_data[item][warehouse_id][status]
                              var item_obj = {
                                   custrecord_warehouse_location: warehouse_id,
                                   custrecord_inventory_status: status,
                                   custrecord_wms_qty: scale_quantity,
                                   custrecord_inventory_item: sku_itemid_map[item],
                                   custrecord_scale_warehouse_reference: wms_location_reference_map[warehouse_id],
                                   custrecord_netsuite_qty: 0,
                                   custrecord_variance: scale_quantity,
                                   custrecord_invalid_sku: invalid_sku
                              }
                              flat_scale_data.push(item_obj)
                         }
                    }
               }
               return flat_scale_data
          }

          function get_sku_itemid_map() {
               var item_sku_itemid_map = {}
               var itemSearchObj = search.create({
                    type: 'item',
                    filters:
                    [
                         ['type', 'anyof', 'InvtPart', 'Assembly'],
                         'AND',
                         ['subsidiary', 'anyof', '1'],
                         'AND',
                         ['isinactive', 'is', 'F'],
                         'AND',
                         ['custitem_sku', 'isnotempty', '']
                    ],
                    columns:
                    [
                         'custitem_sku'
                    ]
               })
               var item_results = global_modules.getAllResults(itemSearchObj)
               item_results.map(function (result) {
                    item_sku_itemid_map[result.getValue('custitem_sku')] = result.id
               })
               log.debug('item_sku_itemid_map', item_sku_itemid_map)
               return item_sku_itemid_map
          }

          return {
               getInputData: getInputData,
               map: map,
               summarize: summarize
          }
     })


