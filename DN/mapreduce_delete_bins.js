/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var SAVED_SEARCH_ID = 'customsearch_delete_gg_bin_search';
define(['N/search', 'N/record', 'N/email', 'N/render'],
    function (search, record, email, render) {
        var bin_id;

        function getInputData() {
            var mySearch = search.load({
                id: SAVED_SEARCH_ID
            });
            return mySearch;
        }

        function map(context) {
            var searchResult = JSON.parse(context.value);
            bin_id = searchResult.id;
            try {
                log.debug("bin id", bin_id);
            } catch (e) {
                //
            }
        }

        return {
            getInputData: getInputData,
            map: map
        };
    });