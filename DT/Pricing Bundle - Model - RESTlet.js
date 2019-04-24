//Settings to change front end configs
var SETTINGS = {
    MAX_NUMBER_OF_SUGGESTIONS: 3,
    MAX_SUGGESTIONS_PER_CATEGORY: 24,
    // test_request: {"lastitem": "5930", "items": "6307,5893,3474,6251"}
    test_request: {"lastitem": "5930", "items": "5930"}
};

//Global Variables
var scriptName = "Bundle Pricing - Model RESTlet.js ";
var environment = nlapiGetContext().getEnvironment();

var response = {};
Array.prototype.shuffle = durstenfeldShuffle;
Array.prototype.add_translated_DC = add_translated_DC;

//Maps.  NetSuite Field Names are Private keys.  JSON Response keys are Public keys.
var Fields = {
    ITEM: {
        RECORD: 'item'
        , Private: {
            ID: 'internalid'
            , NAME: 'storedisplayname'
            , IMAGE: 'custitem_primary_image'
            , URL: 'urlcomponent'
            , CATEGORY: 'custitem_discount_category'
            // , PERCENT: 'custitem_discount_category_percentage'
        }
        , Public: {
            internalid: 'ID'
            , storedisplayname: 'NAME'
            , custitem_primary_image: 'IMAGE'
            , urlcomponent: 'URL'
            , custitem_discount_category: 'CATEGORY'
            // , custitem_discount_category_percentage: 'PERCENT'
        }
    }
    , DC: {
        RECORD: 'customrecord_discount_categories'
        , Private: {
            ID: 'internalid'
            , NAME: 'name'
            // , PERCENT: 'custrecord_discount_percentage'
            , SUGGESTED: 'custrecord_suggested_category'
        }
        , Public: {
            internalid: 'ID'
            , name: 'NAME'
            // , custrecord_discount_percentage: 'PERCENT'
            , custrecord_suggested_category: 'SUGGESTED'
        }
    }
};

//when debugging, set request to test
if(window && window.console){
    debugger;
    handleAction_BUNDLE(SETTINGS.test_request, response)
}

function entryPoint_RESTlet_Pricing_Bundle_GET(request) {
    if (request.action === 'bundle') {
        handleAction_BUNDLE(request, response);
        response.status = 'SUCCESS';
    }
    response.status = response.status || 'WRONG ACTION';
    nlapiLogExecution('DEBUG', scriptName+ 'outgoing response', JSON.stringify(response));
    return response; //regular object
}

function handleAction_BUNDLE(request, response){
    var cartitems_raw = null,
        lastitem_raw = null;

    nlapiLogExecution('DEBUG', scriptName+ 'incoming request ' + typeof request, JSON.stringify(request));

    // //get info the the last item added to cart.  to be used for banner
    // var lastitem = getInfoForItem(request.lastitem);
    // nlapiLogExecution('DEBUG', scriptName+ 'lastitem', JSON.stringify(lastitem));
    // if (lastitem[Fields.ITEM.Private.ID] === request.lastitem) {
    //     lastitem_raw = lastitem; //this line is not useless, dont delete
    //     response.lastitem = translateForPublic(lastitem_raw, 'ITEM');
    // }

    //get info for all items in cart.  to be used for DC calculations
    var cartitems = request.items.split(',');
    if (Array.isArray(cartitems) && cartitems.length) {
        cartitems_raw = getInfoForCartItems(cartitems);
        // response.cartitems = cartitems_raw.map(function(item){return translateForPublic(item, 'ITEM')});
        nlapiLogExecution('DEBUG', scriptName+ 'info_cartitems', JSON.stringify(cartitems_raw));
    }

    if (cartitems_raw) {
        var suggestedItems = suggestItems(cartitems_raw);
        if (suggestedItems){
            response.suggestions = suggestedItems;
        }
    }
}
//returns an array of objects of an item record for front end use
function getInfoForCartItems(cart){
    var cartInfo = [];
    for (var i = 0; i < cart.length; i++) {
        var info = getInfoForItem(cart[i]);
        if (info){
            cartInfo.push(info);
        }
    }
    return cartInfo;
}

//returns an object of values of an item record for front end use
function getInfoForItem(internalid) {
    var result = null;
    var itemType = nlapiLookupField('item', internalid, 'recordtype');//not 100% necessary but will prevent errors by being explicit
    if (itemType && itemType !== 'discountitem') {
        var itemFields = [];
        for (var key in Fields.ITEM.Private){
            itemFields.push(Fields.ITEM.Private[key])
        }
        result = nlapiLookupField(itemType, internalid, itemFields) || null;
    } else {
        nlapiLogExecution('ERROR',scriptName+ 'getInfoForItem failed', internalid +' does not exist')
    }
    return result;
}

function suggestItems(cartitems_raw){
    var suggestions = [];
    var DC_Search = new DiscountCategorySearch(cartitems_raw);
    var results = DC_Search.runCustomSearch(); //[]
    if (results.length){
        suggestions = DC_Search.getSuggestions(); //translated for public
    }
    if (window){
        window.DC_Search = DC_Search;
        window.results = results;
        window.suggestions = suggestions;
        debugger;
    }
    suggestions.forEach( function(category){
        delete category[Fields.DC.Public.custrecord_suggested_category]
    });

    var logSuggestions = results.slice(0);
    logSuggestions.forEach( function(row, index, arr) { if (typeof row === 'string' ) {arr[index] = index+": "+row; } });
    logSuggestions = logSuggestions.filter(function(row){return typeof row === 'string' && row.search('selected') > -1}).join(' | ');
    nlapiLogExecution('AUDIT', scriptName+ 'logSuggestions', logSuggestions);
    return suggestions;
}

function Search(type){
    this.Keys = Fields[type];
    this.type = this.Keys.RECORD;
    this.filters = [];
    this.columns = defineColumns(this.Keys.Private);

    this.results = null;    //set by runSearch. contains raw results from NetSuite
    this.output = null;     //set by runSearch. contains output we will use.

    this.runSearch = function(){
        if (this.type && this.columns.length){
            /** ok sorry to the future developer.  this search returns a max of 1000 results.  we currently have no DC with 1000 items
             * but we spent way too much time on the Bundle Pricing feature so we wanna push it out, and fix this later.

             * you're here because over 1000 results were returned huh?  youre in luck:  we already wrote the code to handle more than 1000 items for a search.
             * ...but you have to find it.
             *
             * you need to create a nlobjSearchResultSet instead of a nlapiSearchRecord call.
             * DT_updatePersonas.js has a SS1.0 version (kinda), fedex_log_unit_creator.js has a SS2.0 implementation.
             * both SS versions, you want to use my recursive function to get all values from search result set.
             *
             * collin is currently working on a function to grab marketing tab info for customer records.  you can use his call
             * -Donald Tran
             */
            this.results = nlapiSearchRecord(this.type, null, this.filters, this.columns);
            if (this.results){
                var output = [];
                for (var index = 0; index < this.results.length; index++){
                    var row = this.getAllValuesFromSearchResult(this.results[index]);
                    output.push(row);
                }
                this.output = output;
                return this.output;
            }
        }
        return false;
    };

    this.setFilters = function(input){
        this.filters = input;
    };
    this.setColumns = function(input){
        this.filters = input;
    };

    this.getAllValuesFromSearchResult = function(result){
        return getAllValuesFromSearchResult(result, this.Keys.Private);
    };

    //pass in a map to return an array of nlobjSearchColumn
    function defineColumns(map){
        var columns = [];
        for (var key in map){
            var column = columns.length === 0 ?
                new nlobjSearchColumn(map[key],null,null).setSort(false) :
                new nlobjSearchColumn(map[key],null,null);
            columns.push(column);
        }
        return columns;
    }
}

/** extends Search constructor.
 * used for searching discount categories based on all the items in the cart
 * @param cartitems_raw
 * @returns {Search}
 * @constructor
 */
function DiscountCategorySearch(cartitems_raw){
    var search = new Search('DC');
    var cart_categories = getCategoriesInCart(cartitems_raw);
    var filters = [
        // //this code block is for if you want to make discount category custom records inactive
        // ["isinactive","is","F"]
        // ,"AND",
        // ["custrecord_suggested_category","noneof","@NONE@"]
    ];
    // search.setFilters(filters);

    function getCategoriesInCart(cartitems){
        var categoriesInCart = {};
        cartitems.forEach(function(item){
            var itemDC = item[Fields.ITEM.Private.CATEGORY];
            if(itemDC){
                categoriesInCart[itemDC] = categoriesInCart[itemDC] ? categoriesInCart[itemDC] + 1 : 1;
            }
        });
        nlapiLogExecution('DEBUG', scriptName+ 'categoriesInCart', JSON.stringify(categoriesInCart));
        return categoriesInCart;
        //expected result:  '{"4":1,"9":1}'
    }

    search.getSuggestedCategoriesFromCart = function(){
        var suggestedCategories = [];
        for (var category in cart_categories){
            var suggestion = nlapiLookupField(this.Keys.RECORD, category, this.Keys.Private.SUGGESTED);
            if (suggestion && cart_categories[suggestion] === undefined){
                suggestedCategories.push(suggestion);
            }
        }
        this.suggestedCategories = suggestedCategories;
        return suggestedCategories;
    };

    /**
     * @returns {Array}
     */
    search.runCustomSearch = function(){
        var all_DCs = this.runSearch();
        if (all_DCs.length){
            all_DCs.unshift('zero'); //make the array index line up with internalids
            for (var index in cart_categories){
                all_DCs[index] = 'in cart'; //gets rid of categories that are already in the cart
            }
        }
        this.all_DCs = all_DCs;
        return all_DCs; //[]
    };

    /**
     * @returns {Array}
     */
    search.getSuggestions = function(){
        var suggestions = [];
        var maxSuggestions = SETTINGS.MAX_NUMBER_OF_SUGGESTIONS;

        var suggestedCategories = this.getSuggestedCategoriesFromCart();
        nlapiLogExecution('DEBUG', scriptName+ 'suggestedCategories', JSON.stringify(suggestedCategories));
        //adds suggested categories to [suggestions], only if the suggested category isnt in the cart.  do it until we run out of suggestions or reach the max.
        for (var i = 0; i < suggestedCategories.length && suggestions.length < maxSuggestions; i++ ){
            var suggested = this.all_DCs[suggestedCategories[i]];
            if (typeof suggested === 'object' && suggested[this.Keys.Private.ID]){
                if ( suggestions.add_translated_DC(suggested) ){ // suggestions.push(suggested);
                    this.all_DCs[suggestedCategories[i]] = 'selected - by suggestion';
                }
            }
        }

        //if we still need suggestions, fill up [suggestions] until we equal the max amount as specified in our settings
        var otherCategories = this.all_DCs.filter( function(category){ return typeof category === 'object' });
        var otherCategories_randomized = otherCategories.shuffle();
        while (suggestions.length < maxSuggestions && otherCategories_randomized.length) {
            var success = suggestions.add_translated_DC( otherCategories_randomized.shift() ); // suggestions.push( otherCategories_randomized.shift() );
            if (success){
                this.all_DCs[success] = 'selected - by random';
            }
        }
        // nlapiLogExecution('AUDIT', scriptName+ 'suggestions', JSON.stringify(suggestions));

        this.suggestions = suggestions;
        return suggestions;
    };
    // suggestions = [{"internalid":"3","name":"Pre-Roll Tubes","custrecord_discount_percentage":"2.0%","custrecord_suggested_category":"4"},{"internalid":"12","name":"Exit Bags","custrecord_discount_percentage":"2.0%","custrecord_suggested_category":"9"}]

    return search;
}

/** extends Search constructor.
 * used for searching items based on discount category passed in
 * @param discount_category
 * @returns {Search}
 * @constructor
 */
// function ItemSearch_from_DC(discount_category){
//     var search = new Search('ITEM');
//
//     var internalid = search.Keys.Private.ID;
//     var filters_items = [
//         ["isonline","is","T"]
//         , "AND" ,
//         ["quantityavailable","isnotempty",""]
//         , "AND" ,
//         ["custitem_discontinued","is","F"]
//         , "AND" ,
//         ["matrixchild","is","F"]
//         , "AND" ,
//         ["custitem_discount_category","anyof",discount_category[internalid]]
//         // , 'AND' ,
//         // ["transaction.type","anyof","CashSale","CustInvc"]
//         // , "AND" ,
//         // ["transaction.trandate","within","daysago30","daysago0"]
//         // , "AND" ,
//         // ["transaction.mainline","is","F"]
//         // // , "AND" ,
//         // // ["sum(formulanumeric: {transaction.quantity}/({quantityavailable}*{custitem_uom_numeral}))","lessthan","4"]
//     ];
//     // var columns_items = [
//     //     new nlobjSearchColumn("amount","transaction","SUM").setSort(true),
//     //     new nlobjSearchColumn("internalid",null,"GROUP"),
//     //     new nlobjSearchColumn("storedisplayname",null,"GROUP"),
//     //     new nlobjSearchColumn("custitem_primary_image",null,"GROUP"),
//     //     new nlobjSearchColumn("urlcomponent",null,"GROUP"),
//     //     new nlobjSearchColumn("custitem_discount_category",null,"GROUP")
//     // ];
//
//
//     search.setFilters(filters_items);
//     // search.setColumns(columns_items);
//
//     return search;
// }


/** used for Array.prototype.addDC
 * takes in a discount category and searches netsuite for a list items within the category
 * if the search returns at least 1 item, adds it to the Array and returns true, else returns false
 *
 * @param discount_category     object  needs a key of internalid
 * @returns {boolean}
 */
function add_translated_DC(discount_category){
    var maxItemsPerSuggestion = SETTINGS.MAX_SUGGESTIONS_PER_CATEGORY;
    var currentCategory = discount_category[Fields.DC.Private.ID];

    var results = doSummarySearch(currentCategory, maxItemsPerSuggestion); //[]

    //@TODO Use the loaded
    // var item = new ItemSearch_from_DC(discount_category);
    // var results = item.runSearch(); //[]
    if (results.length){
        // nlapiLogExecution('AUDIT', scriptName+ 'discount_category used: '+ discount_category[Fields.DC.Private.ID] +'- '+ discount_category[Fields.DC.Private.NAME], JSON.stringify(results));

        var results_limited = results.slice(0,maxItemsPerSuggestion);
        var translated_DC = translateForPublic(discount_category, 'DC');
        translated_DC.items = results_limited.map(function(item){return translateForPublic(item, 'ITEM')});
        this.push(translated_DC);
        return currentCategory;
    }
    return false;
}

function doSummarySearch(discount_category_ID, maxItemsPerSuggestion){
    // var searchid = {SANDBOX: '961', PRODUCTION: '1035'};
    // var loadedSearch = nlapiLoadSearch('item', searchid[environment]);//  {nlobjSearch}
    var tranhistory = {SANDBOX: ['daysago90', 'daysago60'], PRODUCTION: ['daysago30', 'daysago0']};

    var filters = [
        //new nlobjSearchFilter(name, join, operator, value1, value2) .setFormula() .setSummaryType()
        new nlobjSearchFilter('isonline',					null,			'is',			'T'),
        new nlobjSearchFilter('quantityavailable',			null,			'isnotempty',	null),
        new nlobjSearchFilter('custitem_discontinued',		null,			'is',			'F'),
        new nlobjSearchFilter('matrixchild',				null,			'is',			'F'),
        new nlobjSearchFilter('custitem_discount_category',	null,			'anyof',		discount_category_ID),
        new nlobjSearchFilter('type',						"transaction",	'anyof',		['CustInvc', 'CashSale']),
        new nlobjSearchFilter('trandate',					"transaction",	'within',		tranhistory[environment]),
        new nlobjSearchFilter('mainline',					"transaction",	'is',			'F'),
        new nlobjSearchFilter('formulanumeric',				null,			'lessthan',		'4')
            .setFormula("{transaction.quantity}/({quantityavailable}*{custitem_uom_numeral})")
            .setSummaryType('sum')
    ];
    var columns = [
        //new nlobjSearchColumn(name, join, summary)
        new nlobjSearchColumn('amount',							'transaction',	'sum').setSort('true'),
        new nlobjSearchColumn('internalid',						null,			'group'),
        new nlobjSearchColumn('storedisplayname',				null,			'group'),
        new nlobjSearchColumn('custitem_primary_image',			null,			'group'),
        new nlobjSearchColumn('urlcomponent',					null,			'group'),
        new nlobjSearchColumn('custitem_discount_category',		null,			'group')
    ];
    var itemSearch = nlapiCreateSearch('item', filters, columns); //{nlobjSearch}
    var itemResultSet = itemSearch.runSearch();                     //  {nlobjSearchResultSet}
    var results_raw = itemResultSet.getResults(0, maxItemsPerSuggestion);
    // var results_raw = getAllResults(itemResultSet);                 //  [ {nlobjSearchResult}, {nlobjSearchResult}, ...]
    var results = getAllSummaryValuesFromSearch(results_raw);       //  [ {}, {}, ...]
    return results;
}

//from an nlobjSearchResult, grabs all summary values
function getAllSummaryValuesFromSearch(results) {
    var output = [];
    var map = Fields.ITEM.Private;

    for (var index = 0; index < results.length; index++){
        var row = getAllSummaryValuesFromSummarySearchResult(results[index], map);
        output.push(row);
    }

    return output;
}

//from an nlobjSearchResult, grabs all values from all columns on a summary search.
// theres two functions because a ternary doubles the amount of checks, slowing down the overall search
function getAllSummaryValuesFromSummarySearchResult(result, map){
    var row = {};
    for (var column in map){
        row[map[column]] = result.getValue(map[column], null, 'group');
    }
    return row;
}

//from an nlobjSearchResult, grabs all values from all columns on a non summary search
function getAllValuesFromSearchResult(result, map){
    var row = {};
    for (var column in map){
        row[map[column]] = result.getValue(map[column]);
    }
    return row;
}

/** used for Array.prototype.shuffle
 * Uses Durstenfeld shuffle algorithm to Randomize array element order in-place.  Durstenfeld is fast and optimized for computing.
 * does not mutate the original array
 * @returns {array}
 */
function durstenfeldShuffle(){
    var array = this.slice(0);
    for (var i = array.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var memory = array[i];
        array[i] = array[j];
        array[j] = memory;
    }
    return array;
}

//takes an items private key and looks up their public keys.  relies on global 'Fields'
function translateForPublic(objectOfPrivateKeys, type){
    var objectOfPublicKeys = {};
    for (var netsuiteField in objectOfPrivateKeys){
        objectOfPublicKeys[Fields[type].Public[netsuiteField]] = objectOfPrivateKeys[netsuiteField];
    }
    return objectOfPublicKeys;
}

// /** Recursively searches a nlobjSearchResultSet or N/search.ResultSet until all results are found. *
//  *  Function was made due to nlapiSearchRecord or N/search.ResultSet.run returning a limit of 1000 rows. This function can return up to 999000 results *
//  *  Consumes at least 10 governance units per call *
//  *  start is inclusive, end is exclusive *
//  * @param resultSetObj  {nlobjSearchResultSet || N/search.ResultSet }  object returned from nlobjSearch.prototype.runSearch() or N/search.Search.run(); *
//  * @param startIndex    [optional] {int} index of where to start the associatedSearch. if not provided, starts at 0 *
//  * @returns {nlobjSearchResult[]}  A single array of all nlobjSearchResult objects of a associatedSearch *
//  */
// function getAllResults(resultSetObj, startIndex){
//     startIndex = startIndex || 0;
//     var pageSize = 1000; //for testing, change this to 100 or a value smaller than your resultSet
//     var endIndex = startIndex + pageSize; //default is 1000
//
//     if (resultSetObj.getResults === undefined && typeof resultSetObj.getRange === 'function') {
//         resultSetObj.getResults = resultSetObj.getRange; //in SS2.0, getResults has been renamed to getRange
//     }
//     var results = resultSetObj.getResults(startIndex, endIndex) || []; // 10 governance units per call
//     var moreResults = results.length === pageSize ? getAllResults(resultSetObj, endIndex) : [];
//     var allResults = results.concat(moreResults);
//     return allResults;
// }