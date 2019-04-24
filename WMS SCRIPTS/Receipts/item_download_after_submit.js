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
 */
define(['N/file', 'N/record', 'N/search', '../Libraries/global_modules.js'],
    /**
      * Module params:
      * @param {file} file
      * @param {record} record
      * @param {search} 
      * @param {global_modules} global_modules
      */
    function (file, record, search, global_modules) {

        var XML_TYPE = 'Item';
        var max_batch_size = 1;

        function afterSubmit(context) {
            azure_module.on_demand_download(XML_TYPE, context);
        }

        return {
            afterSubmit: afterSubmit
        };
    });

