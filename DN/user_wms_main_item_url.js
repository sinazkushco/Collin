/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/file"], function (require, exports, log, file) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = function (context) {
        var newRecord = context.newRecord;
        var itemUrlLineCount = newRecord.getLineCount("itemimages");
        if (itemUrlLineCount > 0) {
            var topImage = newRecord.getSublistValue({
                sublistId: "itemimages",
                fieldId: "nkey",
                line: 0
            });
            var fileObj = file.load({
                id: topImage
            });
            var imageUrl = fileObj.name;
            log.debug("top image", imageUrl);
        }
        //load record
        //get file id from sublist
        //load file? obtain url
        //paste url into item record
        log.debug("top image", topImage);
    };
});
