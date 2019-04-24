/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *@NModuleScope Public
 */
define(['N/search', 'N/log','N/file'], get_item_objects_with_locations_and_quantities);

var max_governance = 130;
var SEARCH;
var LOG;
var FILE;
//********************** MAIN FUNCTION **********************
function get_item_objects_with_locations_and_quantities(search, log, file) {
    var returnObj = {};
    SEARCH = search;
    LOG = log;
    FILE = file;
    returnObj.post = get_event_data;
    return returnObj;
}

function get_event_data(post) {
    var response = {};
    LOG.debug('post', post);
    if (post.access) {
        var search_results = SEARCH.load({
            id: 'customsearch_event_calender_for_script'
        }).run();
        search_results = getAllResults(search_results);
        LOG.debug('search_results', JSON.stringify(search_results));
        var obfuscated = [];
        for (var i = 0; i < search_results.length; i++) {
            var row = search_results[i];
            obfuscated.push(get_obfuscated_row(row));
        }
        LOG.debug('obfuscated row', JSON.stringify(obfuscated));
        response.data = obfuscated;
        response.success = true;
    } else {
        response.success = false;
        response.data = 'no direct access allowed';
    }
    return response;
}


/** recursively searches a nlobjSearchResultSet or N/search.ResultSet until all results are found. *
 *  Function was made due to nlapiSearchrecord or N/search.ResultSet.run returning a limit of 1000 rows. This function can return up to 999000 results *
 *  Consumes at least 10 governance units per call *
 *  start is inclusive, end is exclusive *
 * @param resultSetObj  {nlobjSearchResultSet || N/search.ResultSet }  object returned from nlobjSearch.prototype.runSearch() or N/search.Search.run(); *
 * @param startIndex    [optional] {int} index of where to start the associatedSearch. if not provided, starts at 0 *
 * @returns {nlobjSearchResult[]}  A single array of all nlobjSearchResult objects of a associatedSearch *
 */
function getAllResults(resultSetObj, startIndex) {
    startIndex = startIndex || 0;
    var pageSize = 1000; //for testing, change this to 100 or a value smaller than your resultSet
    var endIndex = startIndex + pageSize; //default is 1000
    var results = resultSetObj.getRange(startIndex, endIndex) || []; // 10 governance units per call
    var moreResults = results.length === pageSize ? getAllResults(resultSetObj, endIndex) : [];
    var allResults = results.concat(moreResults);
    return allResults;
}

function get_obfuscated_row(row) {
    var FRONTEND = {
        internalid: 'ID'
        , custrecord_event_name: "NAME"
        , custrecord_event_start_date: "START_DATE"
        , custrecord_event_end_date: "END_DATE"
        , custrecord_hyperlink: "URL"
        , custrecord_onsite_hours_text: "HOURS_TEXT"
        , custrecord_onsite_hours_start: "HOURS_START"
        , custrecord_onsite_hours_end: "HOURS_END"
        , custrecord_booth_number: "BOOTH"
        , custrecord_event_description: "DESCRIPTION"
        , custrecord_speaking_segment: "GUEST"
        , custrecord_promo_code: "PROMOCODE"
        , custrecord_closing_comment: "COMMENT"
        , custrecord_image: 'IMAGE'
        , custrecord_event_location: 'LOCATION'
    };
    var obfuscated_row = {};
    for (var column in FRONTEND) {
        if(column == 'custrecord_image'){
            var image_id = row.getValue({
                name: 'custrecord_image'
            });
            if(image_id){
                LOG.debug('image id',image_id);
                var image_file = FILE.load({
                    id: image_id
                });
                var image_url = image_file.url;
                obfuscated_row[FRONTEND[column]] = image_url;
            }else{
                obfuscated_row[FRONTEND[column]] = '';
            }
        }else{
            obfuscated_row[FRONTEND[column]] = row.getValue({
                name: column
            });
        }
        
    }
    return obfuscated_row;
}