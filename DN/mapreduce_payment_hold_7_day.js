/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var SAVED_SEARCH_ID = "customsearch_ph_day_7_check";
define(["N/search", "N/record", "N/email", "N/render"],
    function (search, record, email, render) {
        var soId;

        function getInputData() {
            var mySearch = search.load({
                id: SAVED_SEARCH_ID
            });
            return mySearch;
        }

        function map(context) {
            var searchResult = JSON.parse(context.value);
            soId = searchResult.id;
            try {
                // log.debug("bin id", bin_id);
                var loadedRecord = record.load({
                    type: "salesorder",
                    id: soId
                });

                loadedRecord.setValue({
                    fieldId: "custbody_payment_hold_backorder",
                    value: false
                });

                loadedRecord.setValue({
                    fieldId: "custbody_payment_hold_end_date",
                    value: ""
                });

                loadedRecord.setValue({
                    fieldId: "orderstatus",
                    value: "A"
                });

                loadedRecord.save();

            } catch (e) {
                //
            }
        }

        return {
            getInputData: getInputData,
            map: map
        };
    });