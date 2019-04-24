/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.pageInit = function () {
        // entry point needed to upload script
    };
    exports.postToReprocess = function (direction, json, type, batchId, url) {
        //json = JSON.parse(json);
        // console.log(json);
        // console.log(dataObj);
        // dataObj = JSON.parse(dataObj);
        debugger;

        var butt = document.querySelector('#custpage_str_reprocess');
        butt.disabled = true;
        butt.className = "";
        butt.style.cursor = "progress";
        butt.style.borderWidth = "0px";

        jQuery
            .ajax({
                method: "POST",
                url: url,
                data: {
                    direction: direction,
                    json: json,
                    type: type,
                    batchId: batchId
                }
            })
            .done(function (res) {
                debugger;
                var successElement = "<h1 id=\"reprocess_success_message\" style=\"display: inline; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #44D62C;\">Reprocess Request Sent</h1>";
                jQuery(".uir-page-title-firstline").append(successElement);
                jQuery("#reprocess_success_message").fadeOut(3000, function () {
                    jQuery("#reprocess_success_message").remove();
                    alert('Reprocessing Finished');
                    window.location.reload();
                });
            });
    };
});