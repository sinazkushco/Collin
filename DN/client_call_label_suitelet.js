/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pageInit = function () {
        // entry point needed to upload script
    };
    exports.callLabelSuitelet = function (itemId, itemType) {

        if(itemType == "inventoryitem"){
            window.open("/app/site/hosting/scriptlet.nl?script=961&deploy=1&itemid=" + itemId);
        } else if( itemType == "assemblyitem") {
            window.open("/app/site/hosting/scriptlet.nl?script=1010&deploy=1&itemid=" + itemId);
        }
       
    };
});
