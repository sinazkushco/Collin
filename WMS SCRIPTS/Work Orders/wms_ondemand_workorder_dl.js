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
define(['../Libraries/global_modules.js'],
    /**
      * Module params:
      * @param {global_modules} global_modules
      */
    function (global_modules) {

        var XML_TYPE = 'WorkOrder';

        function beforeLoad(context) {
            global_modules.create_release_to_warehouse_button(XML_TYPE,context);
        }
        
        return {
            beforeLoad: beforeLoad
        };
    });