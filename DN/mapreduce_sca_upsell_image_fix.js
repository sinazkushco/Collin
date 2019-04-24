/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var SAVED_SEARCH_ID = "customsearch_item_image_fix_search";
define(["N/search", "N/record"],
    function (search, record) {
        function getInputData() {
            var mySearch = search.load({
                id: SAVED_SEARCH_ID
            });
            return mySearch;
        }

        function map(context) {
            var searchResult = JSON.parse(context.value);
            var itemId = searchResult.id;
            try {

                var itemRecord = record.load({
                    type: "inventoryitem",
                    id: itemId
                });

                var imageName = itemRecord.getSublistValue({
                    sublistId: "itemimages",
                    fieldId: "name",
                    line: 0
                });

                var newURL = "https://www.kushsupplyco.com/Images/items/" + imageName;

                itemRecord.setValue("custitem_sca_upsell_image_url", newURL);

                itemRecord.save();

            } catch (e) {
                //
            }
        }

        return {
            getInputData: getInputData,
            map: map
        };
    });