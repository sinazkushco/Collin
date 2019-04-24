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
define(['../Libraries/global_modules.js', 'N/search'],
    /**
      * Module params:
      * @param {global_modules} global_modules
      * @param {search} search
      */
    function (global_modules, search) {

        var XML_TYPE = 'Receipt';

        function beforeLoad(context) {
            if (context.type != 'create') {
                debugger;
                //need to check if transfer order and to location
                var warehouses_with_wms = global_modules.get_warehouses_with_wms();
                if (context.newRecord.type == 'purchaseorder') {
                    var location = context.newRecord.getValue('location');
                    if (warehouses_with_wms.indexOf(location) != -1) {
                        global_modules.create_release_to_warehouse_button(XML_TYPE, context);
                    }
                } else if (context.newRecord.type == 'returnauthorization') {

                    var returnauthorizationSearchObj = search.create({
                        type: "returnauthorization",
                        filters:
                            [
                                ["type", "anyof", "RtnAuth"],
                                "AND",
                                ["internalidnumber", "equalto", context.newRecord.id],
                                "AND",
                                ["location.custrecord_scale_enabled", "is", "T"]
                            ],
                        columns:
                            [
                                "quantity",
                                "item"
                            ]
                    });
                    var searchResultCount = returnauthorizationSearchObj.runPaged().count;
                    if (searchResultCount) {
                        debugger;
                        log.debug('searchResultCount',searchResultCount)
                        global_modules.create_release_to_warehouse_button(XML_TYPE, context);
                    }
                }

            }
        }
        return {
            beforeLoad: beforeLoad
        };
    });