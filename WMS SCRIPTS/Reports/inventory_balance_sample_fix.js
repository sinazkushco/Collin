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
define([
    'N/file',
    'N/record',
    'N/search',
    'N/xml',
    '../Libraries/global_modules.js',
    '../Libraries/xml_module.js',
    '../AzureStorage/azure-storage.file.js',
    'SuiteScripts/Library/kush_utilities.js'
],
    function (
        file,
        record,
        search,
        xml,
        global_modules,
        xml_module,
        AzureStorage,
        kushUtils
    ) {
        var SHARE = 'ils',
            DIRECTORY = '/Interface/Reporting/PersonalAlert';

        function getInputData(context) {
            var fileService = AzureStorage.FileService;
            var filesToGet = fileService.listFilesAndDirectories(SHARE, DIRECTORY);
            log.debug('Files to get', filesToGet)

            var xmlDocument = xml.Parser.fromString({
                text: filesToGet
            });

            log.debug('xml document', xmlDocument);

            var filesObj = xml_module.xml_2_json(xmlDocument),
                filesArr = [],
                fileNames = [];

            if (filesObj.Entries && filesObj.Entries.File) {
                var files = filesObj.Entries.File;
                filesArr = files instanceof Array ? files : [files];
            }

            filesArr.forEach(function(file) {
                if(file.Name === "Samples Picked and Not Shipped.csv") {
                    fileNames.push(file.Name);
                }
            })
            
            log.debug('fileNames', fileNames);

            var fileName = fileNames[0];
            var csvText = fileService.getFileToText(SHARE, DIRECTORY, fileName)
            var csv = kushUtils.CSVToJson(csvText);

            log.debug('Parsed CSV', csv);

            var skus = csv.map(function(value) {
                return(
                    value.Item
                )
            });
            var scaleInventoryBalanceReport = _getScaleInventoryBalanceReport(skus); // Returns an object with sku as the key

            for(var i=0; i< csv.length; i++) {
                if(scaleInventoryBalanceReport[csv[i].Item]) {
                    csv[i]['netSuiteQuantity'] = scaleInventoryBalanceReport[csv[i].Item].netSuiteQuantity
                    csv[i]['scaleQuantity'] = scaleInventoryBalanceReport[csv[i].Item].scaleQuantity
                    csv[i]['internalId'] = scaleInventoryBalanceReport[csv[i].Item].internalId
                }
            }


            fileNames.forEach(function (fileName) {
                fileService.deleteFile(SHARE, DIRECTORY, fileName);
                log.debug('delete file: ', fileName);
            });
            return csv;
        }

        function map(context) {
            var data = JSON.parse(context.value);
            log.debug('data', JSON.stringify(data));
            var diff = Number(data.netSuiteQuantity) - Number(data.Quantity)
            if(diff !== 0) {
                var submitField = record.submitFields({
                    id: data.internalId,
                    type: 'customrecord_inventory_balance',
                    values: {
                        custrecord_netsuite_qty: diff,
                        custrecord_variance: Number(data.scaleQuantity) - diff
                    }
                })

                log.debug('Submitted Id:', submitField);
            }
        }

        function _getScaleInventoryBalanceReport(skus) {
            var report = {};
            var skusFilter = global_modules.scale_utils.create_filters('custrecord_inventory_item.custitem_sku', 'is', skus);
            var skuFiltersWithOrs = global_modules.scale_utils.insert_or_filters(skusFilter);

            log.debug('Get Scale Inventory Balance Report', JSON.stringify({
                skus: skus,
                skusFilter: skusFilter,
                skuFiltersWithOrs: skuFiltersWithOrs
            }))

            var customrecord_inventory_balanceSearchObj = search.create({
                type: "customrecord_inventory_balance",
                filters:
                    [
                        ["custrecord_date_time", "on", "today"],
                        "AND",
                        skuFiltersWithOrs,
                        "AND",
                        ["custrecord_inventory_status", "anyof", "1"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custitem_sku",
                            join: "CUSTRECORD_INVENTORY_ITEM"
                        }),
                        "custrecord_netsuite_qty",
                        "custrecord_wms_qty",
                    ]
            });

            log.debug('Filters', customrecord_inventory_balanceSearchObj.filterExpression)

            customrecord_inventory_balanceSearchObj.run().each(function (result) {
                var sku = result.getValue({
                    name: "custitem_sku",
                    join: "CUSTRECORD_INVENTORY_ITEM"
                })

                report[sku] = {
                    internalId: result.id,
                    netSuiteQuantity: result.getValue('custrecord_netsuite_qty'),
                    scaleQuantity: result.getValue('custrecord_wms_qty'),
                };
                return true;
            });

            return report
        }




        return {
            getInputData: getInputData,
            map: map
        };
    });


