/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/global_modules.js', '../Libraries/azure_module.js', 'N/search'],
     function runSuitelet(global_modules, azure_module, search) {
          function download_items_and_boms(context) {
               var filters_item = []
               var download_to_scale_item = search.createFilter({
                    name: 'custitem_dl_to_scale_item',
                    operator: search.Operator.IS,
                    values: 'T' //internalidvalue
               })
               filters_item.push(download_to_scale_item)
          
               search_and_download('Item',filters_item)
               global_modules.pause(60)
               
               var filters_bom = []
               var download_to_scale_bom = search.createFilter({
                    name: 'custitem_dl_to_scale_bom',
                    operator: search.Operator.IS,
                    values: 'T' //internalidvalue
               })
               filters_bom.push(download_to_scale_bom)
               search_and_download('BillOfMaterial',filters_bom)

               function search_and_download(XML_TYPE, filters){  
                    var param_obj = {
                         ondemand : true
                    }
                    var batches = global_modules.create_batches(XML_TYPE, null, filters)
                    batches.map(function (batch) {
                         azure_module.pull_record_data_download(batch, XML_TYPE, param_obj)
                    })
               }
          }
          return {
               onRequest: download_items_and_boms
          }
     })
