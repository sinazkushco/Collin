//attaches a warehouse location for each item on a online order
//based on distance from destination and item availability
//then calculates the cost
//currently this is slow af because each item needs to be loaded
//to find its availability
//customscript_fedex_shipping_cost_restlet
//written by Collin Wong

// var input = {
//     "shipattention": "collin wong",
//     "shipphone": "(510) 590-1028",
//     "shipaddr1": "2540 wakefield ave",
//     "shipaddr2": "", "shipcity": "oakland",
//     "shipstate": "",
//     "shipzip": "94606",
//     "shipcountry": "United States",
//     "shipisresidential": "0",
//     "shipmethod": "37",
//     "lines": [
//         { "item": "6751", "quantity": "3" },
//         { "item": "8289", "quantity": "4" }
//     ]
// };

// var output = {
//     "shipattention": "collin wong",
//     "shipphone": "(510) 590-1028",
//     "shipaddr1": "2540 wakefield ave",
//     "shipaddr2": "",
//     "shipcity": "oakland",
//     "shipstate": "",
//     "shipzip": "94606",
//     "shipcountry": "United States",
//     "shipisresidential": "0",
//     "shipmethod": "37",
//     "lines": [
//         { "item": "6751", "location": "3", "quantity": "3" },
//         { "item": "8289", "location": "3", "quantity": "4" }
//     ]
// };

//********************** MAIN FUNCTION **********************
/**Takes in request from suitelet call and sends back a response 
 * @param {object object} request the request made by the suitelet
 * @returns {object} returns a order with the cart sorted by least fulfillments and sapeed 
*/
function init(request) {
    var response = {
        status: 'fail',
        data: '',
        success: false
    };
    nlapiLogExecution('DEBUG', 'request started > ' + typeof request.payload, request.payload);
    if (request.access && request.payload) {//check if restlet is being called from access suitlet
        var order_json = request.payload;
        order_json = JSON.parse(order_json);
        var fedex_rates = get_fed_ex_rates(order_json);
        if (fedex_rates) {
            response.data = fedex_rates;
            if (response.data) {
                response.status = 'fed_ex_shipping_methods recieved';
                response.success = true;
            } else {
                response.status = 'no data object, but order json present';
            }
        } else {
            response.status = 'Invalid Zip Code or We do not have FedEx Zip Code data';
        }
    } else {
        response.status = 'No order json or no access';
    }
    nlapiLogExecution('DEBUG', 'restlet response: ' + typeof response, JSON.stringify(response));
    return response;
}

/** create payload to send to FedEx suitlet
 * sorts order json items based on least amount of fullfillments then speed
 * gets shipping cost based on the sort
 * @param   {object} order_json  object of order json recieved from client
 * @return  {object}  shipping methods and their cost from the FedEx Api
 */

function get_fed_ex_rates(order_json) {
    var output = {};
    var sorted_items;
    var passed_into_fedex;

    try{
        if (!order_json.do_not_sort) {
            var zip_code = order_json.shipzip;//zip code of destination that we use to compare to warehouses
            order_json.lines = condense_order_json_items(order_json.lines);
            for(var i = 0; i < order_json.lines.length; i++){
                order_json.lines[i].item = order_json.lines[i].item.toString();
            }
            debugger;
            var warehouse_with_zones = JSON.parse(nlapiLookupField('customrecord_warehouses_with_zones', 1, 'custrecord_warehouse_with_zones_obj'));
            //find closest warehouses based on zip codes, warehouse_with_zones is a global object
            var warehouses_sorted_by_distance = sort_warehouses_by_zones(zip_code, warehouse_with_zones);
            if (warehouses_sorted_by_distance.length) { //if webstore and warehouses are empty, just pass in original order to FedEx
                var availability = find_availability(order_json, warehouses_sorted_by_distance); //build objects that hold item quantity needed and availabiliy per warehouse. Also builds a map for where items are located
                var items_with_location_and_availability = availability.items_with_location_and_availability; //object with items, quantity needed and availability per location
                var items_with_location_and_availability_for_speed = availability.items_with_location_and_availability_for_speed; //a copy of items_with_location_and_availability for second round sorting 
                var map_where_items_are_available = availability.map_where_items_are_available; //warehouse with what items are available from them.
                sorted_items = sort_by_least_fulfillments(items_with_location_and_availability, items_with_location_and_availability_for_speed, warehouses_sorted_by_distance, map_where_items_are_available);
                output.out_of_stock_items = sorted_items.pop();
                order_json.lines = sorted_items;
                output.sorted_order_json = order_json;
                //grab rates based on order lines
            }
        }
    }catch(e){
        nlapiLogExecution('ERROR','ORDER JSON ERROR', JSON.stringify(order_json));
        nlapiLogExecution('ERROR','WTF SORTING ERROR!!!', e);
    }

    passed_into_fedex = JSON.stringify(order_json);
    var shipping_methods = BSP_FedExInterface(passed_into_fedex);
    output.shipping_methods = JSON.parse(shipping_methods);
    return output ? output : false;
}


/** find item availability based on location and create new order_json_object based on item availability and location
* @param  {array objects} order_json , array  item that needs to be found and its quantity needed warehouses sorted by distance
* @param  {array} warehouses_sorted_by_distance  array of warehouses sorted by distance
* @return {object object} two copies of an object that holds items, their quantities needed and location availability, 
* another object where the warehouses are the keys and an array of items that are available are the values
*/

function find_availability(order_json, warehouses_sorted_by_distance) {
    debugger;
    var output = {};
    var items_with_location_and_availability = {};
    var items_with_location_and_availability_for_speed = {};
    var map_where_items_are_available = {};
    for (var i = 0; i < warehouses_sorted_by_distance.length; i++) {
        map_where_items_are_available[warehouses_sorted_by_distance[i]] = [];
    }
    var items = order_json.lines;
    for (i = 0; i < items.length; i++) {
        var item_id = items[i].item; //item id from order lines array
        var quantity_needed = items[i].quantity;
        items_with_location_and_availability[item_id] = {
            quantity_needed: 0,
            availability: {}
        };
        items_with_location_and_availability_for_speed[item_id] = {
            quantity_needed: 0,
            availability: {}
        };
        items_with_location_and_availability[item_id].quantity_needed = quantity_needed;
        items_with_location_and_availability_for_speed[item_id].quantity_needed = quantity_needed;
        var acceptable_item_types = ['inventoryitem', 'assemblyitem'];
        var item_type = nlapiLookupField('item', item_id, 'recordType');
        if (acceptable_item_types.indexOf(item_type) !== -1) {
            var item_record = nlapiLoadRecord(item_type, item_id);
            var mapped_warehouses = map_locations_array(item_record);//get an object with warehouses and their locations in locations array
            for (var j = 0; j < warehouses_sorted_by_distance.length; j++) {
                //counter to loop through warehouses //id of the item
                var warehouse_id = warehouses_sorted_by_distance[j];
                var line_warehouse_is_in = mapped_warehouses[warehouse_id]; //line where the warehouse is
                if(line_warehouse_is_in){
                    var quantity_available = Math.floor(item_record.getLineItemValue(//find quantity available at the location
                        'locations',
                        'quantityavailable',
                        line_warehouse_is_in
                    ));
                    if (quantity_available >= 1) {
                        items_with_location_and_availability[item_id].availability[warehouse_id] = quantity_available; //add the warehouse and quantity available to the item
                        items_with_location_and_availability_for_speed[item_id].availability[warehouse_id] = quantity_available;
                        map_where_items_are_available[warehouse_id].push(item_id);
                    }
                }
            }
        }
    }
    output.items_with_location_and_availability_for_speed = items_with_location_and_availability_for_speed;
    output.items_with_location_and_availability = items_with_location_and_availability;
    output.map_where_items_are_available = map_where_items_are_available;
    return output;
}

/** finds the minimum number of warehouses that items must be shipped from and then sorts the items by
* @param {object object} items_with_location_and_availability  object of items and where and how much are available, and how many needed
* @param {object object} items_with_location_and_availability_for_speed another copy object of items and where and how much are available, and how many needed
* because we needed a clone for a second phase of sort, and its easier & faster than deep cloning (^_^)
* @param {array} warehouses_sorted_by_distance array of warehouses sorted by distance
* @param {object object} map_where_items_are_available array of warehouses and what items are available at each
* @return  {object}  new order json when items were shipped from closest warehouse possible
*/

function sort_by_least_fulfillments(items_with_location_and_availability, items_with_location_and_availability_for_speed, warehouses_sorted_by_distance, map_where_items_are_available) {
    var output = []; //new order json 
    var order_based_on_least_fulfillments = [];
    var locations_to_ship_from = [];//keep track of locations that an item must ship from
    var item_object = null;// item object inside items_with_location_and_availability
    var availability_object = null;//location availability object inside the item object
    var current_warehouse_id = null;
    var warehouses_with_scores = [];
    var sorted_warehouses_by_scores = null;
    var locations_to_ship_from_sorted_by_distance = [];
    for (var item_id in items_with_location_and_availability) { //find locations with exclusive items then put those items into the output
        item_object = items_with_location_and_availability[item_id];
        availability_object = item_object.availability;
        if (Object.keys(availability_object).length === 1) { //if item is only available from 1 warehouse
            current_warehouse_id = Object.keys(availability_object)[0];
            if (locations_to_ship_from.indexOf(current_warehouse_id) === -1) {
                locations_to_ship_from.push(current_warehouse_id);
            }
            order_based_on_least_fulfillments.push({
                item: item_id,
                quantity: items_with_location_and_availability[item_id].quantity_needed,
                location: current_warehouse_id
            });
            delete items_with_location_and_availability[item_id];
        }
    }
    //gather as many items as possible from those locations with exclusive items
    order_based_on_least_fulfillments = pull_items_from_warehouse_array(items_with_location_and_availability, order_based_on_least_fulfillments, locations_to_ship_from, map_where_items_are_available);
    //recursion time baby
    while (Object.keys(items_with_location_and_availability).length > 0) {
        debugger;
        warehouses_with_scores = score_warehouses_based_on_item_availability(warehouses_sorted_by_distance, locations_to_ship_from, map_where_items_are_available, items_with_location_and_availability);
        sorted_warehouses_by_scores = sort_by_warehouse_score(warehouses_with_scores);
        if (sorted_warehouses_by_scores.length > 1) {
            var warehouse_to_pull_from = [];
            var location_to_push = Object.keys(sorted_warehouses_by_scores[0])[0];
            if (sorted_warehouses_by_scores[0][location_to_push] > 0) {
                warehouse_to_pull_from.push(location_to_push);
                locations_to_ship_from.push(location_to_push);
                order_based_on_least_fulfillments = pull_items_from_warehouse_array(items_with_location_and_availability, order_based_on_least_fulfillments, warehouse_to_pull_from, map_where_items_are_available, map_where_items_are_available);
            } else {
                break;//next available warehouse has 0 items
            }
        } else {
            break; //something is out of stock OUTOFSTOCK
        }
    }
    //sort locations to ship from by speed
    for (var i = 0; i < warehouses_sorted_by_distance.length; i++) {
        if (locations_to_ship_from.indexOf(warehouses_sorted_by_distance[i]) !== -1) {
            locations_to_ship_from_sorted_by_distance.push(warehouses_sorted_by_distance[i]);
        }
    }
    output = sort_by_speed(locations_to_ship_from_sorted_by_distance, items_with_location_and_availability_for_speed);
    return output;
}

/** scores warehouses based on item availability
* @param {array} warehouses_sorted_by_distance warehouse ids sorted by distance
* @param {array} locations_to_ship_from warehouses that have been picked to ship from. we will exclude these for this function
* @param {object object} map_where_items_are_available  array of warehouses and what items are available at each
* @param {object object} items_with_location_and_availability object of items and where and how much are available, and how many needed
* @return  {array object}  array of objects with warehouse ids and their scores sorted by their scores and distance
*/

function score_warehouses_based_on_item_availability(warehouses_sorted_by_distance, locations_to_ship_from, map_where_items_are_available, items_with_location_and_availability) {
    var warehouses_with_scores = [];
    debugger;
    for (var i = 0; i < warehouses_sorted_by_distance.length; i++) { //go to each exclusive warehouse in order of distance
        var current_warehouse_id = warehouses_sorted_by_distance[i];
        if (locations_to_ship_from.indexOf(current_warehouse_id) === -1) { //if warehouse is not already in location_to_ship_from
            var items_available_at_warehouse = map_where_items_are_available[current_warehouse_id];
            var warehouse_scored = {};
            warehouse_scored[current_warehouse_id] = 0;
            for (var item in items_with_location_and_availability) {
                if (items_available_at_warehouse.indexOf(item) != -1) {
                    var quantity_available = +items_with_location_and_availability[item].availability[current_warehouse_id];
                    var quantity_needed = +items_with_location_and_availability[item].quantity_needed;
                    if (quantity_available >= quantity_needed) {
                        warehouse_scored[current_warehouse_id] += quantity_needed;
                    } else {
                        warehouse_scored[current_warehouse_id] += quantity_available;
                    }
                }
            }
            warehouses_with_scores.push(warehouse_scored);
        }
    }
    return warehouses_with_scores;
}

/** grabs as many items as possible from warehouses sorted by distance
* @param {object object} items_with_location_and_availability object of items and where and how much are available, and how many needed
* @param {array object} order_json the order json that needs to be appended to
* @param  {array} locations_to_ship_from warehouses we need to pull from
* @param {object object} map_where_items_are_available array of warehouses and what items are available at each
* @return  {array object} order_json after items have been appended to it
*/

function pull_items_from_warehouse_array(items_with_location_and_availability, order_json, locations_to_ship_from, map_where_items_are_available) {
    for (var i = 0; i < locations_to_ship_from.length; i++) {
        var current_warehouse_id = locations_to_ship_from[i];
        var items_available_at_warehouse = map_where_items_are_available[current_warehouse_id]; //array of items available at warehouse
        for (var j = 0; j < items_available_at_warehouse.length; j++) { //loop through items and put them in order if needed or possible
            var item_id = items_available_at_warehouse[j];//internal id of item
            if (items_with_location_and_availability[item_id]) { //check if item is still needed in order
                var item_object = items_with_location_and_availability[item_id];
                var quantity_needed = item_object.quantity_needed;
                var availability_object = item_object.availability;
                var availability_at_location = availability_object[current_warehouse_id];
                if (+availability_at_location >= +quantity_needed) {//if warehouse has more than we need just push the quantity needed to the order object
                    order_json.push({
                        item: item_id,
                        quantity: quantity_needed,
                        location: current_warehouse_id
                    });
                    delete items_with_location_and_availability[item_id];
                } else {
                    //push as many items from this location as possible and find remainder for the next warehouse
                    if (+availability_at_location > 0) {
                        item_object.quantity_needed -= availability_at_location;
                        order_json.push({
                            item: item_id,
                            quantity: availability_at_location,
                            location: current_warehouse_id
                        });
                    }//end if available at location
                }//end else (needed is greater than available)
            }//end if item is still in order
        }//end loop through items 
    }//end loop through warehouses
    return order_json;
}

/** grabs as many items as possible from the closest warehouses they are available from
* @param  {array} warehouses_sorted_by_distance array of warehouse ids sorted by distance
* @param  {object} order_with_availability  object with items, how many of each needed and where they are available, and how much are available per location
* @return  {object}  new order json when items were shipped from closest warehouse possible
*/


function sort_by_speed(warehouses_sorted_by_distance, order_with_availability) { //find where the item is 
    var new_item_array = [];
    var out_of_stock_items = {};
    var item;
    //loop through locations and find the quantity available at each location until quantity needed is met
    if (warehouses_sorted_by_distance.length) {
        for (item in order_with_availability) {
            var quantity_needed = order_with_availability[item].quantity_needed; //quantity needed from order lines array 
            var j = 0;//increment to next warehouse if quantity available is less than quantity needed
            while (quantity_needed > 0) {
                var item_to_push = {}; //new order line item that needs to be added with location
                //counter to loop through warehouses
                item_to_push.item = item; //id of the item
                var warehouse_number = warehouses_sorted_by_distance[j]; //int id of warehouse
                item_to_push.location = warehouse_number; //which warehouse we are on
                var quantity_available = order_with_availability[item].availability[warehouse_number] || 0;
                //quantity_available = look up item availability at warehouses_sorted_by_distance[j]
                if (+quantity_available >= +quantity_needed) {//if warehouse has more than we need just push the quantity needed to the order object
                    item_to_push.quantity = quantity_needed;
                    quantity_needed = 0;
                    new_item_array.push(item_to_push);
                } else {
                    //push as many items from this location as possible and find remainder for the next warehouse
                    if (quantity_available > 0) {
                        item_to_push.quantity = quantity_available;
                        quantity_needed = quantity_needed - quantity_available;
                        new_item_array.push(item_to_push);
                    }
                    j++;//move to next warehouse          
                }
                if (j == warehouses_sorted_by_distance.length && quantity_needed > 0) {
                    out_of_stock_items[item] = quantity_needed;
                    break;
                }
            }
        }
    } else if (Object.keys(order_with_availability).length) {
        for (item in order_with_availability) {
            out_of_stock_items[item] = order_with_availability[item].quantity_needed;
        }
    }
    new_item_array.push(out_of_stock_items);
    return new_item_array;
    //return an object of locations as the key and quantity available as the value
}

/** map out the locations array to find how which locations are at which index of the array *
 * @param {string} item_record  used to load a record and find length of locations array *
 * @return {object} an object with locations as keys and their positions in the locations array as values  
 */

function map_locations_array(item_record) {
    var warehouses_with_their_positions_in_array = {};
    //get the length of locations array
    var length_of_locations_array = item_record.getLineItemCount('locations');
    for (var i = 1; i <= length_of_locations_array; i++) {
        var warehouse_id = item_record.getLineItemValue(
            'locations',
            'location',
            i
        );
        warehouses_with_their_positions_in_array[warehouse_id] = i;
    }
    return warehouses_with_their_positions_in_array;
}

/** used to add the same item in the order array if it shows up more than once
 * @param {array object} order_json array of objects with items and their quantity needed
 * @return {array object} condense_order_json  array of objects with items and their quantity needed without duplicate items
 */

function condense_order_json_items(order_json) {//used to add the same item in the order array if it shows up more than once
    var condense_order_json = [];
    var lookup_table = {};
    var condensed_count = 0;
    for (var i = 0; i < order_json.length; i++) {
        var item_id = order_json[i].item;
        var lookup_key = null;
        if (lookup_table[item_id] === 0 || lookup_table[item_id]) {
            condense_order_json[lookup_table[item_id]].quantity = Number(condense_order_json[lookup_table[item_id]].quantity) + Number(order_json[i].quantity);
            condensed_count++;
        } else {
            condense_order_json.push(order_json[i]);
            lookup_table[item_id] = i - condensed_count;
        }
    }

    return condense_order_json;
}


/** sort all available locations based on distance from delivery point
 * @param {str} zipcode zipcode of destination
 * @param  {warehouse_with_zones} array array of zone numbers provided by FedEx base on distance from warehouse
 * @return {sorted_warehouses_without_zone_values} array of locations sorted by distance from delivery point [1,12,3,4....]  
 */

function sort_warehouses_by_zones(zip_code, warehouse_with_zones) { //sort closest warehouse locations from delivery address
    //grab zone data for warehouses based on first 3 digits of the zip code
    var first_3_digits_of_zip = zip_code.substring(0, 3);
    //object of zones based on first 3 digits of destination zip code
    var fed_ex_zones = warehouse_with_zones[first_3_digits_of_zip] || warehouse_with_zones['928'];
    //sort locations based on distance from delivery address, zip code?
    var sorted_warehouses = [];
    var kb_warehouses = [];
    var warehouse_search = nlapiSearchRecord("location",null,
    [
       ["makeinventoryavailablestore","is","T"], 
       "AND", 
       ["subsidiary","anyof","1"]
    ], 
    [
       new nlobjSearchColumn("name").setSort(false), 
       new nlobjSearchColumn("state")
    ]
    );

    for(var j = 0; j < warehouse_search.length; j++){
        kb_warehouses.push(warehouse_search[j].id);
    }
    //sort warehouses based on zone values
    for (var warehouse in fed_ex_zones) {
        if(kb_warehouses.indexOf(warehouse) != -1){
            if (fed_ex_zones[warehouse] == 'na') {
                return [];
            }
            sorted_warehouses.push([warehouse, fed_ex_zones[warehouse]]);
        }
    }

    sorted_warehouses.sort(function (a, b) {
        return a[1] - b[1];
    });
    debugger;
    //removed zone values
    var sorted_warehouses_without_zone_values = [];
    for (var i = 0; i < sorted_warehouses.length; i++) {
        var warehouse_id = sorted_warehouses[i][0];
        sorted_warehouses_without_zone_values.push(warehouse_id);
    }
    //return array with sorted warehouses i.e [1,2,6,5]
    return sorted_warehouses_without_zone_values;
}

function swap(array, i, j) {
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
}

/** sort warehouses based on their score, scores are based on how many items are available 
 * @param  {array of objects} warehouses_with_scores inside the objects are warehouse ids as keys and scores as values
 * @return  {array of objects} sorted_warehouses_by_scores 
 */

function sort_by_warehouse_score(warehouses_with_scores) {
    var sorted_warehouses_by_scores;
    var swapped;
    do {
        swapped = false;
        for (var i = 0; i < warehouses_with_scores.length; i++) {
            if (warehouses_with_scores[i] && warehouses_with_scores[i + 1]) {
                if (warehouses_with_scores[i][Object.keys(warehouses_with_scores[i])[0]] < warehouses_with_scores[i + 1][Object.keys(warehouses_with_scores[i + 1])[0]]) {
                    swap(warehouses_with_scores, i, i + 1);
                    swapped = true;
                }
            }
        }
    } while (swapped);
    sorted_warehouses_by_scores = warehouses_with_scores;
    return sorted_warehouses_by_scores;
}

/*********************************
 * FEDEX SHIPPING CALCULATOR START
 * this massive block of code gives an estimate of shipping cost
 * based on the order json object
 * search OMFG to find function that starts it all
 * if you wish to edit this... may the force be with you.
 * not written by Collin
 * *****************************/

// Global Variables
{
    var FedEx_UseProd = true;
    var FedEx_ProdURL = 'https://ws.fedex.com:443/web-services/rate';
    var FedEx_TestURL = 'https://wsbeta.fedex.com:443/web-services/rate';

    var FedEx_ProdKey = 'Hh28ltTJ9feCZ5iA';
    var FedEx_ProdPassword = 'bAiAHUX38HNUGxDrOzrxoET5s';
    var FedEx_TestKey = 'SrJG7aXR29K2ryt4';
    var FedEx_TestPassword = 'rkockgheEkj2WqCjdecIcgLx0';

    var FedEx_ProdAccountNumber = '622169487';
    var FedEx_ProdMeterNumber = '110028245';
    var FedEx_TestAccountNumber = '510087127';
    var FedEx_TestMeterNumber = '118676830';

    var Version_ServiceId = 'crs';
    var Version_Major = '20';
    var Version_Intermediate = '0';
    var Version_Minor = '0';

    var Payment_Type = 'SENDER';
    var DropoffType = 'REGULAR_PICKUP';
    var RateRequestType = 'LIST';

    var MaxWeight = 50;
    var MaxWeightFragile = 45;
    var PercentFullThreshold = 0.6; // 60 Percent

    var HazmatShippingUnitCost = 50;

    var LocationsDic = {};
    var LocationsArr = [];
    var PkgDefsArr = [];
    var ShipMethodsDic = {};
    var ShippingRatesDic = {};
    var OrderDetails = {};
    //var OrderDetails = JSON.parse('{"shipattention":"Test Customer","shipphone":"(371) 209-3920","shipaddr1":"300 S Beverly Dr","shipaddr2":"","shipcity":"Beverly Hills ","shipstate":"","shipzip":"90212","shipcountry":"US","lines":[{"item":"3741","quantity":"4","description":"13 Dram Opaque SELECT Pop Top Bottles (315 qty.)"},{"item":"2851","quantity":"2","description":"BudGloves� Premium Nitrile Gloves"},{"item":"2871","quantity":"3","description":"MK Lighters Master Case (1000 qty.)"}]}');
    var CountryDic = {};

    var FedExSoapMsgs = '';
    var PkgsText = '';
    var OrderLinesHTML = '';
    var DefaultShippingMethod = 'FEDEX_GROUND';
    var ExcludeFreeShipping = '0';

    var ShippingCostDialog;
    var SelectingShipMethods = false;
    var extid = Date.now();//
}

function DefineCountries() {
    CountryDic['Andorra'] = 'AD';
    CountryDic['United Arab Emirates'] = 'AE';
    CountryDic['Afghanistan'] = 'AF';
    CountryDic['Antigua and Barbuda'] = 'AG';
    CountryDic['Anguilla'] = 'AI';
    CountryDic['Albania'] = 'AL';
    CountryDic['Armenia'] = 'AM';
    CountryDic['Netherlands Antilles (Deprecated)'] = 'AN';
    CountryDic['Angola'] = 'AO';
    CountryDic['Antarctica'] = 'AQ';
    CountryDic['Argentina'] = 'AR';
    CountryDic['American Samoa'] = 'AS';
    CountryDic['Austria'] = 'AT';
    CountryDic['Australia'] = 'AU';
    CountryDic['Aruba'] = 'AW';
    CountryDic['Aland Islands'] = 'AX';
    CountryDic['Azerbaijan'] = 'AZ';
    CountryDic['Bosnia and Herzegovina'] = 'BA';
    CountryDic['Barbados'] = 'BB';
    CountryDic['Bangladesh'] = 'BD';
    CountryDic['Belgium'] = 'BE';
    CountryDic['Burkina Faso'] = 'BF';
    CountryDic['Bulgaria'] = 'BG';
    CountryDic['Bahrain'] = 'BH';
    CountryDic['Burundi'] = 'BI';
    CountryDic['Benin'] = 'BJ';
    CountryDic['Saint Barthélemy'] = 'BL';
    CountryDic['Bermuda'] = 'BM';
    CountryDic['Brunei Darussalam'] = 'BN';
    CountryDic['Bolivia'] = 'BO';
    CountryDic['Bonaire, Saint Eustatius and Saba'] = 'BQ';
    CountryDic['Brazil'] = 'BR';
    CountryDic['Bahamas'] = 'BS';
    CountryDic['Bhutan'] = 'BT';
    CountryDic['Bouvet Island'] = 'BV';
    CountryDic['Botswana'] = 'BW';
    CountryDic['Belarus'] = 'BY';
    CountryDic['Belize'] = 'BZ';
    CountryDic['Canada'] = 'CA';
    CountryDic['Cocos (Keeling) Islands'] = 'CC';
    CountryDic['Congo, Democratic Republic of'] = 'CD';
    CountryDic['Central African Republic'] = 'CF';
    CountryDic['Congo, Republic of'] = 'CG';
    CountryDic['Switzerland'] = 'CH';
    CountryDic['Cote d\'Ivoire'] = 'CI';
    CountryDic['Cook Islands'] = 'CK';
    CountryDic['Chile'] = 'CL';
    CountryDic['Cameroon'] = 'CM';
    CountryDic['China'] = 'CN';
    CountryDic['Colombia'] = 'CO';
    CountryDic['Costa Rica'] = 'CR';
    CountryDic['Serbia and Montenegro (Deprecated)'] = 'CS';
    CountryDic['Cuba'] = 'CU';
    CountryDic['Cape Verde'] = 'CV';
    CountryDic['Curaçao'] = 'CW';
    CountryDic['Christmas Island'] = 'CX';
    CountryDic['Cyprus'] = 'CY';
    CountryDic['Czech Republic'] = 'CZ';
    CountryDic['Germany'] = 'DE';
    CountryDic['Djibouti'] = 'DJ';
    CountryDic['Denmark'] = 'DK';
    CountryDic['Dominica'] = 'DM';
    CountryDic['Dominican Republic'] = 'DO';
    CountryDic['Algeria'] = 'DZ';
    CountryDic['Ceuta and Melilla'] = 'EA';
    CountryDic['Ecuador'] = 'EC';
    CountryDic['Estonia'] = 'EE';
    CountryDic['Egypt'] = 'EG';
    CountryDic['Western Sahara'] = 'EH';
    CountryDic['Eritrea'] = 'ER';
    CountryDic['Spain'] = 'ES';
    CountryDic['Ethiopia'] = 'ET';
    CountryDic['Finland'] = 'FI';
    CountryDic['Fiji'] = 'FJ';
    CountryDic['Falkland Islands'] = 'FK';
    CountryDic['Micronesia, Federal State of'] = 'FM';
    CountryDic['Faroe Islands'] = 'FO';
    CountryDic['France'] = 'FR';
    CountryDic['Gabon'] = 'GA';
    CountryDic['United Kingdom'] = 'GB';
    CountryDic['Grenada'] = 'GD';
    CountryDic['Georgia'] = 'GE';
    CountryDic['French Guiana'] = 'GF';
    CountryDic['Guernsey'] = 'GG';
    CountryDic['Ghana'] = 'GH';
    CountryDic['Gibraltar'] = 'GI';
    CountryDic['Greenland'] = 'GL';
    CountryDic['Gambia'] = 'GM';
    CountryDic['Guinea'] = 'GN';
    CountryDic['Guadeloupe'] = 'GP';
    CountryDic['Equatorial Guinea'] = 'GQ';
    CountryDic['Greece'] = 'GR';
    CountryDic['South Georgia'] = 'GS';
    CountryDic['Guatemala'] = 'GT';
    CountryDic['Guam'] = 'GU';
    CountryDic['Guinea-Bissau'] = 'GW';
    CountryDic['Guyana'] = 'GY';
    CountryDic['Hong Kong'] = 'HK';
    CountryDic['Heard and McDonald Islands'] = 'HM';
    CountryDic['Honduras'] = 'HN';
    CountryDic['Croatia/Hrvatska'] = 'HR';
    CountryDic['Haiti'] = 'HT';
    CountryDic['Hungary'] = 'HU';
    CountryDic['Canary Islands'] = 'IC';
    CountryDic['Indonesia'] = 'ID';
    CountryDic['Ireland'] = 'IE';
    CountryDic['Israel'] = 'IL';
    CountryDic['Isle of Man'] = 'IM';
    CountryDic['India'] = 'IN';
    CountryDic['British Indian Ocean Territory'] = 'IO';
    CountryDic['Iraq'] = 'IQ';
    CountryDic['Iran (Islamic Republic of)'] = 'IR';
    CountryDic['Iceland'] = 'IS';
    CountryDic['Italy'] = 'IT';
    CountryDic['Jersey'] = 'JE';
    CountryDic['Jamaica'] = 'JM';
    CountryDic['Jordan'] = 'JO';
    CountryDic['Japan'] = 'JP';
    CountryDic['Kenya'] = 'KE';
    CountryDic['Kyrgyzstan'] = 'KG';
    CountryDic['Cambodia'] = 'KH';
    CountryDic['Kiribati'] = 'KI';
    CountryDic['Comoros'] = 'KM';
    CountryDic['Saint Kitts and Nevis'] = 'KN';
    CountryDic['Korea, Democratic People\'s Republic'] = 'KP';
    CountryDic['Korea, Republic of'] = 'KR';
    CountryDic['Kuwait'] = 'KW';
    CountryDic['Cayman Islands'] = 'KY';
    CountryDic['Kazakhstan'] = 'KZ';
    CountryDic['Lao People\'s Democratic Republic'] = 'LA';
    CountryDic['Lebanon'] = 'LB';
    CountryDic['Saint Lucia'] = 'LC';
    CountryDic['Liechtenstein'] = 'LI';
    CountryDic['Sri Lanka'] = 'LK';
    CountryDic['Liberia'] = 'LR';
    CountryDic['Lesotho'] = 'LS';
    CountryDic['Lithuania'] = 'LT';
    CountryDic['Luxembourg'] = 'LU';
    CountryDic['Latvia'] = 'LV';
    CountryDic['Libya'] = 'LY';
    CountryDic['Morocco'] = 'MA';
    CountryDic['Monaco'] = 'MC';
    CountryDic['Moldova, Republic of'] = 'MD';
    CountryDic['Montenegro'] = 'ME';
    CountryDic['Saint Martin'] = 'MF';
    CountryDic['Madagascar'] = 'MG';
    CountryDic['Marshall Islands'] = 'MH';
    CountryDic['Macedonia'] = 'MK';
    CountryDic['Mali'] = 'ML';
    CountryDic['Myanmar (Burma)'] = 'MM';
    CountryDic['Mongolia'] = 'MN';
    CountryDic['Macau'] = 'MO';
    CountryDic['Northern Mariana Islands'] = 'MP';
    CountryDic['Martinique'] = 'MQ';
    CountryDic['Mauritania'] = 'MR';
    CountryDic['Montserrat'] = 'MS';
    CountryDic['Malta'] = 'MT';
    CountryDic['Mauritius'] = 'MU';
    CountryDic['Maldives'] = 'MV';
    CountryDic['Malawi'] = 'MW';
    CountryDic['Mexico'] = 'MX';
    CountryDic['Malaysia'] = 'MY';
    CountryDic['Mozambique'] = 'MZ';
    CountryDic['Namibia'] = 'NA';
    CountryDic['New Caledonia'] = 'NC';
    CountryDic['Niger'] = 'NE';
    CountryDic['Norfolk Island'] = 'NF';
    CountryDic['Nigeria'] = 'NG';
    CountryDic['Nicaragua'] = 'NI';
    CountryDic['Netherlands'] = 'NL';
    CountryDic['Norway'] = 'NO';
    CountryDic['Nepal'] = 'NP';
    CountryDic['Nauru'] = 'NR';
    CountryDic['Niue'] = 'NU';
    CountryDic['New Zealand'] = 'NZ';
    CountryDic['Oman'] = 'OM';
    CountryDic['Panama'] = 'PA';
    CountryDic['Peru'] = 'PE';
    CountryDic['French Polynesia'] = 'PF';
    CountryDic['Papua New Guinea'] = 'PG';
    CountryDic['Philippines'] = 'PH';
    CountryDic['Pakistan'] = 'PK';
    CountryDic['Poland'] = 'PL';
    CountryDic['St. Pierre and Miquelon'] = 'PM';
    CountryDic['Pitcairn Island'] = 'PN';
    CountryDic['Puerto Rico'] = 'PR';
    CountryDic['State of Palestine'] = 'PS';
    CountryDic['Portugal'] = 'PT';
    CountryDic['Palau'] = 'PW';
    CountryDic['Paraguay'] = 'PY';
    CountryDic['Qatar'] = 'QA';
    CountryDic['Reunion Island'] = 'RE';
    CountryDic['Romania'] = 'RO';
    CountryDic['Serbia'] = 'RS';
    CountryDic['Russian Federation'] = 'RU';
    CountryDic['Rwanda'] = 'RW';
    CountryDic['Saudi Arabia'] = 'SA';
    CountryDic['Solomon Islands'] = 'SB';
    CountryDic['Seychelles'] = 'SC';
    CountryDic['Sudan'] = 'SD';
    CountryDic['Sweden'] = 'SE';
    CountryDic['Singapore'] = 'SG';
    CountryDic['Saint Helena'] = 'SH';
    CountryDic['Slovenia'] = 'SI';
    CountryDic['Svalbard and Jan Mayen Islands'] = 'SJ';
    CountryDic['Slovak Republic'] = 'SK';
    CountryDic['Sierra Leone'] = 'SL';
    CountryDic['San Marino'] = 'SM';
    CountryDic['Senegal'] = 'SN';
    CountryDic['Somalia'] = 'SO';
    CountryDic['Suriname'] = 'SR';
    CountryDic['South Sudan'] = 'SS';
    CountryDic['Sao Tome and Principe'] = 'ST';
    CountryDic['El Salvador'] = 'SV';
    CountryDic['Sint Maarten'] = 'SX';
    CountryDic['Syrian Arab Republic'] = 'SY';
    CountryDic['Swaziland'] = 'SZ';
    CountryDic['Turks and Caicos Islands'] = 'TC';
    CountryDic['Chad'] = 'TD';
    CountryDic['French Southern Territories'] = 'TF';
    CountryDic['Togo'] = 'TG';
    CountryDic['Thailand'] = 'TH';
    CountryDic['Tajikistan'] = 'TJ';
    CountryDic['Tokelau'] = 'TK';
    CountryDic['East Timor'] = 'TL';
    CountryDic['Turkmenistan'] = 'TM';
    CountryDic['Tunisia'] = 'TN';
    CountryDic['Tonga'] = 'TO';
    CountryDic['Turkey'] = 'TR';
    CountryDic['Trinidad and Tobago'] = 'TT';
    CountryDic['Tuvalu'] = 'TV';
    CountryDic['Taiwan'] = 'TW';
    CountryDic['Tanzania'] = 'TZ';
    CountryDic['Ukraine'] = 'UA';
    CountryDic['Uganda'] = 'UG';
    CountryDic['US Minor Outlying Islands'] = 'UM';
    CountryDic['United States'] = 'US';
    CountryDic['Uruguay'] = 'UY';
    CountryDic['Uzbekistan'] = 'UZ';
    CountryDic['Holy See (City Vatican State)'] = 'VA';
    CountryDic['Saint Vincent and the Grenadines'] = 'VC';
    CountryDic['Venezuela'] = 'VE';
    CountryDic['Virgin Islands (British)'] = 'VG';
    CountryDic['Virgin Islands (USA)'] = 'VI';
    CountryDic['Vietnam'] = 'VN';
    CountryDic['Vanuatu'] = 'VU';
    CountryDic['Wallis and Futuna'] = 'WF';
    CountryDic['Samoa'] = 'WS';
    CountryDic['Kosovo'] = 'XK';
    CountryDic['Yemen'] = 'YE';
    CountryDic['Mayotte'] = 'YT';
    CountryDic['South Africa'] = 'ZA';
    CountryDic['Zambia'] = 'ZM';
    CountryDic['Zimbabwe'] = 'ZW';
}

function DefineShipMethods() {
    DefineCountries();

    ShipMethodsDic = {};
    var shipMethodObj = {};

    shipMethodObj = {};
    shipMethodObj['id'] = 38;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx 2 Day';
    shipMethodObj['code'] = 'FEDEX_2_DAY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 39;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Express Saver';
    shipMethodObj['code'] = 'FEDEX_EXPRESS_SAVER';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 40;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Ground';
    shipMethodObj['code'] = 'FEDEX_GROUND';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 41;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Home Delivery';
    shipMethodObj['code'] = 'GROUND_HOME_DELIVERY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 5230;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Priority Overnight';
    shipMethodObj['code'] = 'PRIORITY_OVERNIGHT';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 5266;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Standard Overnight';
    shipMethodObj['code'] = 'STANDARD_OVERNIGHT';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 4776;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx International Economy';
    shipMethodObj['code'] = 'INTERNATIONAL_ECONOMY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

    shipMethodObj = {};
    shipMethodObj['id'] = 4775;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx International Priority';
    shipMethodObj['code'] = 'INTERNATIONAL_PRIORITY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;

}

function DefinePackages() {
    PkgDefsArr = new Array();

    var pkgDef1 = {};
    pkgDef1['id'] = 1;
    pkgDef1['name'] = '20x20x15';
    pkgDef1['height'] = 20;
    pkgDef1['length'] = 20;
    pkgDef1['width'] = 15;
    pkgDef1['dimUnits'] = 'IN';
    pkgDef1['weightUnits'] = 'LB';
    pkgDef1['maxWeight'] = MaxWeight;
    pkgDef1['maxVolume'] = pkgDef1['height'] * pkgDef1['length'] * pkgDef1['width'];
    pkgDef1['maxLinearLength'] = pkgDef1['height'] + pkgDef1['length'] + pkgDef1['width'];

    var pkgDef2 = {};
    pkgDef2['id'] = 2;
    pkgDef2['name'] = '20x10x10';
    pkgDef2['height'] = 20;
    pkgDef2['length'] = 10;
    pkgDef2['width'] = 10;
    pkgDef2['dimUnits'] = 'IN';
    pkgDef2['weightUnits'] = 'LB';
    pkgDef2['maxWeight'] = MaxWeight;
    pkgDef2['maxVolume'] = pkgDef2['height'] * pkgDef2['length'] * pkgDef2['width'];
    pkgDef2['maxLinearLength'] = pkgDef2['height'] + pkgDef2['length'] + pkgDef2['width'];

    var pkgDef3 = {};
    pkgDef3['id'] = 3;
    pkgDef3['name'] = '6x6x6';
    pkgDef3['height'] = 6;
    pkgDef3['length'] = 6;
    pkgDef3['width'] = 6;
    pkgDef3['dimUnits'] = 'IN';
    pkgDef3['weightUnits'] = 'LB';
    pkgDef3['maxWeight'] = MaxWeight;
    pkgDef3['maxVolume'] = pkgDef3['height'] * pkgDef3['length'] * pkgDef3['width'];
    pkgDef3['maxLinearLength'] = pkgDef3['height'] + pkgDef3['length'] + pkgDef3['width'];

    var pkgDef4 = {};
    pkgDef4['id'] = 4;
    pkgDef4['name'] = '12x12x7';
    pkgDef4['height'] = 12;
    pkgDef4['length'] = 12;
    pkgDef4['width'] = 7;
    pkgDef4['dimUnits'] = 'IN';
    pkgDef4['weightUnits'] = 'LB';
    pkgDef4['maxWeight'] = MaxWeight;
    pkgDef4['maxVolume'] = pkgDef4['height'] * pkgDef4['length'] * pkgDef4['width'];
    pkgDef4['maxLinearLength'] = pkgDef4['height'] + pkgDef4['length'] + pkgDef4['width'];

    var pkgDef5 = {};
    pkgDef5['id'] = 5;
    pkgDef5['name'] = '16x16x16';
    pkgDef5['height'] = 16;
    pkgDef5['length'] = 16;
    pkgDef5['width'] = 16;
    pkgDef5['dimUnits'] = 'IN';
    pkgDef5['weightUnits'] = 'LB';
    pkgDef5['maxWeight'] = MaxWeight;
    pkgDef5['maxVolume'] = pkgDef5['height'] * pkgDef5['length'] * pkgDef5['width'];
    pkgDef5['maxLinearLength'] = pkgDef5['height'] + pkgDef5['length'] + pkgDef5['width'];

    var pkgDef6 = {};
    pkgDef6['id'] = 6;
    pkgDef6['name'] = '18x18x28';
    pkgDef6['height'] = 18;
    pkgDef6['length'] = 18;
    pkgDef6['width'] = 28;
    pkgDef6['dimUnits'] = 'IN';
    pkgDef6['weightUnits'] = 'LB';
    pkgDef6['maxWeight'] = MaxWeight;
    pkgDef6['maxVolume'] = pkgDef6['height'] * pkgDef6['length'] * pkgDef6['width'];
    pkgDef6['maxLinearLength'] = pkgDef6['height'] + pkgDef6['length'] + pkgDef6['width'];

    // Place largest pkg first
    PkgDefsArr.push(pkgDef6);
    PkgDefsArr.push(pkgDef1);
    PkgDefsArr.push(pkgDef5);
    PkgDefsArr.push(pkgDef2);
    PkgDefsArr.push(pkgDef4);
    PkgDefsArr.push(pkgDef3);
}

function PadString(pad, str, padLeft) {
    if (typeof str === 'undefined')
        return pad;
    if (padLeft) {
        return (pad + str).slice(-pad.length);
    } else {
        return (str + pad).substring(0, pad.length);
    }
}


function BSP_FedExRequestRate(salesOrderID, locObj) {
    var shippingRate = '0';
    var defaultShippingCost = 0;
    try {
        var response;
        var headers = BSP_FedExHeader(salesOrderID);
        var body = BSP_FedExBody(salesOrderID, locObj);
        if (body == '') {
            return defaultShippingCost;
        }

        var soapPayload = BSP_FedExSoapEnvelope('RateRequest', headers + body);

        // {"User-Agent-x": "SuiteScript-Call"};
        var soapHead = {};
        soapHead['Content-Type'] = 'text/xml';
        soapHead['SOAPAction'] = 'http://fedex.com/ws/rate/v20/getRates';

        var fedExWSURL = (FedEx_UseProd) ? FedEx_ProdURL : FedEx_TestURL;

        response = nlapiRequestURL(fedExWSURL, soapPayload, soapHead);
        var responseCode = response.getCode();
        if (responseCode == 200) {
            var soapText = response.getBody();
            logRecord(3, soapText);//

            var soapXML = nlapiStringToXML(soapText);
            var ratesHTML = '';

            FedExSoapMsgs = soapPayload + soapText;

            var rateReply = nlapiSelectNode(soapXML, '//*[name()="RateReply"]');
            var result = nlapiSelectValue(rateReply, '//*[name()="HighestSeverity"]');
            if ((result == 'SUCCESS') || (result == 'WARNING') || (result == 'NOTE')) {
                //RateReplyDetails
                //RatedShipmentDetails
                //ShipmentRateDetail
                //TotalNetChargeWithDutiesAndTaxes
                var notificationsNode = nlapiSelectNode(rateReply, '//*[name()="Notifications"]');
                var messageNode = nlapiSelectNode(notificationsNode, '//*[name()="Message"]');
                var message = nlapiSelectValue(messageNode, '.');

                //:: Lookup Rates and store them in a Dic indexed by Shipping Method Id
                //ratesHTML += '<table width="100%"><tr><td valign="top">';
                //ratesHTML += '<h2>Available Shipping Rates:</h2>';

                var rateReplyDetails = nlapiSelectNodes(soapXML, '//*[name()="RateReplyDetails"]');
                for (var i = 0; i < rateReplyDetails.length; i++) {
                    var rateReplyDetailNode = rateReplyDetails[i];
                    var ratedShipmentDetails = nlapiSelectNodes(rateReplyDetailNode, '*[name()="RatedShipmentDetails"]');
                    if (ratedShipmentDetails.length > 0) {
                        var ratedShipmentDetailNode = ratedShipmentDetails[0];
                        var shipmentRateDetailNode = nlapiSelectNode(ratedShipmentDetailNode, '*[name()="ShipmentRateDetail"]');
                        var totalChargesNode = nlapiSelectNode(shipmentRateDetailNode, '*[name()="TotalNetFedExCharge"]');
                        var shippingRateNode = nlapiSelectNode(totalChargesNode, '*[name()="Amount"]');
                        shippingRate = nlapiSelectValue(shippingRateNode, '.');
                        var serviceTypeNode = nlapiSelectNode(rateReplyDetailNode, '*[name()="ServiceType"]');
                        var serviceType = nlapiSelectValue(serviceTypeNode, '.');

                        //Add 25% to shipping rate
                        // var shippingRateMarkedUp = parseFloat(shippingRate) * 1.25;  25% markup on shipping cost (webstore)
                        var shippingRateMarkedUp = parseFloat(shippingRate) * 1.05;

                        var shippingCost = shippingRateMarkedUp + locObj['hazmatShippingCost'];

                        if (serviceType == DefaultShippingMethod) {
                            defaultShippingCost = shippingCost;
                        }

                        var shippingMethodDetail = {};
                        var shippingMethodId = serviceType + '-' + locObj['id'];
                        var shippingMethodInternalId = '';
                        var shipMethodObj = ShipMethodsDic[serviceType];
                        if ((shipMethodObj != null) && (shipMethodObj != undefined)) {
                            shippingMethodInternalId = shipMethodObj['id'];
                        }
                        //LMAO

                        if (!ShippingRatesDic[shippingMethodInternalId]) {
                            shippingMethodDetail['id'] = shippingMethodId;
                            shippingMethodDetail['internalId'] = shippingMethodInternalId;
                            shippingMethodDetail['code'] = serviceType;
                            shippingMethodDetail['cost'] = shippingCost.toFixed(2);
                            shippingMethodDetail['locId'] = locObj['id'];
                            ShippingRatesDic[shippingMethodInternalId] = shippingMethodDetail;
                        } else {
                            ShippingRatesDic[shippingMethodInternalId]['cost'] = (+ShippingRatesDic[shippingMethodInternalId]['cost'] + +shippingCost.toFixed(2)).toFixed(2);
                        }

                        //ratesHTML += '<input type="radio" id="' + serviceType + '-' + locObj['id'] + '" name="selShipMethod' + '-' + locObj['id'] + '"';
                        //ratesHTML += ' value="' + serviceType + '"';
                        //ratesHTML += ' onclick="SelectShipMethod(\'' + serviceType + '\'';
                        //ratesHTML += ',\'' + shippingCost.toFixed(2) + '\'';
                        //ratesHTML += ',\'' + locObj['id'] + '\');"';
                        //ratesHTML += ' >' + serviceType + ': $' + shippingCost.toFixed(2) + '</input><br>';
                    }
                }
            }
            else {
                nlapiLogExecution('DEBUG', 'FedExInterface Suitelet - response - result != SUCCESS/WARNING/NOTE', result);//
                //alert('Error: Unable to get real-time rates. Invalid package weight.');
            }

            //ratesHTML += '</td>';
            //ratesHTML += '<td valign="top" style="margin-left:20px;">';
            //ratesHTML += '<h2>FedEx Notes:</h2><p>' + message + '</p>';
            //ratesHTML += '<button type="button" onclick="GetRealTimeShippingRates();">Get Real-time Rates</button>';
            //ratesHTML += '</td></tr></table>';
            //ratesHTML += '<p>&nbsp;</p>';
            locObj['ratesHTML'] = ratesHTML;

            return defaultShippingCost;
        }
        else {
            //var soapText = response.getBody();
            //FedExSoapMsgs = soapPayload + soapText;

            //alert('Error: Unable to access real-time rates. Response Code: ' + responseCode);

            nlapiLogExecution('ERROR', 'FedExInterface Suitelet - response - statusCode !== 200', responseCode);//

            locObj['ratesHTML'] = '';
            return defaultShippingCost;
        }
    }
    catch (error) {
        //alert('Error: ' + error.message);

        if (error instanceof nlobjError) {//
            nlapiLogExecution('ERROR', 'FedExInterface Suitelet - request/response -- whole thing errored, nlobjError thrown', error.getDetails());//
        } else {//
            try {//
                nlapiLogExecution('ERROR', 'FedExInterface Suitelet - request/response -- whole thing errored, error.toString() is', error.toString());//
            } catch (e) {//
                nlapiLogExecution('ERROR', 'FedExInterface Suitelet - request/response -- whole thing errored, error.message is', error.message);//
            }//
        }//

        locObj['ratesHTML'] = '';
        return defaultShippingCost;
    }
}

function BSP_FedExHeader(salesOrderID) {
    var soapHeader = '';

    soapHeader += '<WebAuthenticationDetail>';
    soapHeader += '<UserCredential>';
    soapHeader += '<Key>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdKey : FedEx_TestKey;
    soapHeader += '</Key>';
    soapHeader += '<Password>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdPassword : FedEx_TestPassword;
    soapHeader += '</Password>';
    soapHeader += '</UserCredential>';
    soapHeader += '</WebAuthenticationDetail>';
    soapHeader += '<ClientDetail>';
    soapHeader += '<AccountNumber>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdAccountNumber : FedEx_TestAccountNumber;
    soapHeader += '</AccountNumber>';
    soapHeader += '<MeterNumber>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdMeterNumber : FedEx_TestMeterNumber;
    soapHeader += '</MeterNumber>';
    soapHeader += '</ClientDetail>';
    soapHeader += '<TransactionDetail>';
    soapHeader += '<CustomerTransactionId>' + salesOrderID + '</CustomerTransactionId>';
    soapHeader += '</TransactionDetail>';
    soapHeader += '<Version>';
    soapHeader += '<ServiceId>' + Version_ServiceId + '</ServiceId>';
    soapHeader += '<Major>' + Version_Major + '</Major>';
    soapHeader += '<Intermediate>' + Version_Intermediate + '</Intermediate>';
    soapHeader += '<Minor>' + Version_Minor + '</Minor>';
    soapHeader += '</Version>';

    return soapHeader;
}

function GetDefaultRatesHTML() {
    var ratesHTML = '';

    ratesHTML += '<table width="100%"><tr><td valign="top">';
    ratesHTML += '<h2>Available Shipping Rates:</h2>';
    ratesHTML += '</td>';
    ratesHTML += '<td valign="top" style="margin-left:20px;">';
    ratesHTML += '<h2>FedEx Notes:</h2><p>&nbsp;</p>';
    ratesHTML += '<button type="button" onclick="GetRealTimeShippingRates();">Get Real-time Rates</button>';
    ratesHTML += '</td></tr></table>';
    ratesHTML += '<p>&nbsp;</p>';

    return ratesHTML;
}

function ProcessLineItems(salesOrderID) {
    var Field = {
        WEIGHT: 'weight',
        UOM: 'custitem_uom_numeral',
        WEIGHTUNIT: 'weightunit',
        HEIGHT: 'custitem_pkg_height',
        WIDTH: 'custitem_pkg_width',
        LENGTH: 'custitem_pkg_length',
        DESCRIPTION: 'salesdescription',
        UPC_NEW: 'custitem_sku',
        UPC_OLD: 'upccode',
        SHIP_INDIVIDUALLY: 'shipindividually',
        EXCLUDE_FREE_SHIPPING: 'custitem_hazmat_item',
        //EXCLUDE_FREE_SHIPPING: 'custitem_no_free_shipping', We are now offering free shipping on all items except Hazmat Items 4/19/2018
        NO_REPACKAGING: 'custitem_no_re_packaging',
        STORE_DISPLAY_NAME: 'storedisplayname',
        PARENT: 'parent',
        FRAGILE: 'custitem_fragile_item',
        HAZMAT: 'custitem_hazmat_item'
        //this array exists twice in this file; make sure you update the other one too
    };

    LocationsArr = new Array();
    LocationsDic = {};

    var HazmatShippingTotalCost = 0;

    var orderLines = OrderDetails['lines'] || 0;
    if (orderLines === 0) {
        orderLines = {};
        orderLines.length = 0;
    } else if (Object.keys(orderLines).length === 0) {
        orderLines.length = 0;
    }
    for (var i = 0; i < orderLines.length; i++) {
        var orderLine = orderLines[i];
        var hazmatShippingCost = 0;
        var itemLocNum = +orderLine['location'] || nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location"); //6 now set with collins magic //OMFG
        if (itemLocNum > 0) {
            var itemType = 'InvtPart'; //::orderLine['itemtype'];
            var itemId = orderLine['item'];

            if ((itemId == 5446) || (itemId == 5447) || (itemId == 5436) || (itemId == 5450) || (itemId == 5449) || (itemId == 5451) || (itemId == 5452) || (itemId == 5461) || (itemId == 5462) || (itemId == 5460) || (itemId == 5463) || (itemId == 5464) || (itemId == 5465) || (itemId == 5466) || (itemId == 5467) || (itemId == 5468) || (itemId == 5469) || (itemId == 5470) || (itemId == 5471)) {
                itemType = 'Kit';
            }

            if ((itemType == 'InvtPart') || (itemType == 'Kit') || (itemType == 'Assembly') || (itemType == 'NonInvtPart')) {
                var itemTypeName = 'inventoryitem';
                if (itemType === 'Kit') {
                    itemTypeName = 'kititem';
                } else if (itemType === 'Assembly') {
                    itemTypeName = 'assemblyitem';
                } else if (itemType === 'NonInvtPart') {
                    itemTypeName = 'noninventoryitem';
                }

                if (itemId > 0) {
                    // var fields = [Field.WEIGHTUNIT, Field.HEIGHT, Field.WIDTH, Field.LENGTH, Field.DESCRIPTION, Field.UPC_NEW, Field.UPC_OLD, Field.SHIP_INDIVIDUALLY, Field.EXCLUDE_FREE_SHIPPING, Field.NO_REPACKAGING, Field.STORE_DISPLAY_NAME, Field.PARENT, Field.FRAGILE, Field.HAZMAT];
                    // var itemRec = nlapiLookupField(itemTypeName, +itemId, fields);
                    var itemFieldNames = [Field.WEIGHT, Field.UOM, Field.WEIGHTUNIT,
                    Field.HEIGHT, Field.WIDTH, Field.LENGTH, Field.DESCRIPTION,
                    Field.UPC_NEW, Field.UPC_OLD, Field.SHIP_INDIVIDUALLY,
                    Field.EXCLUDE_FREE_SHIPPING, Field.NO_REPACKAGING,
                    Field.STORE_DISPLAY_NAME, Field.PARENT,
                    Field.FRAGILE, Field.HAZMAT];

                    var itemRecord = nlapiLookupField(itemTypeName, +itemId, itemFieldNames);//
                    if (itemRecord !== null) {
                        var weight = itemRecord[Field.WEIGHT] ? +itemRecord[Field.WEIGHT] : 0;
                        if (weight > 0 && +itemRecord[Field.UOM] > 1) {
                            weight *= itemRecord[Field.UOM];
                        }//

                        var itemObj = {};
                        itemObj['lineNum'] = i;
                        itemObj['itemId'] = +itemId;
                        itemObj['quantity'] = orderLine['quantity'];
                        itemObj['name'] = itemRecord[Field.STORE_DISPLAY_NAME] || '';
                        itemObj['notes'] = '';
                        itemObj['location'] = itemLocNum;

                        if (weight <= 0) {
                            itemObj['shipIndividually'] = '1';
                            itemObj['notes'] = 'Weight not defined'
                        } else {
                            if (itemRecord[Field.SHIP_INDIVIDUALLY] === 'T') {
                                itemObj['shipIndividually'] = '1';
                                itemObj['notes'] = 'Ships separately'
                            } else {
                                itemObj['shipIndividually'] = '0';
                            }
                        }

                        if (itemRecord[Field.EXCLUDE_FREE_SHIPPING] === 'T' || itemRecord[Field.EXCLUDE_FREE_SHIPPING] === '1') {
                            ExcludeFreeShipping = '1';
                            itemObj['excludeFreeShipping'] = '1';
                        }//DIFFERENCE HERE
                        itemObj['fragileItem'] = itemRecord[Field.FRAGILE] === 'T' ? '1' : '0';

                        if (itemRecord[Field.HAZMAT] === 'T') {
                            hazmatShippingCost = HazmatShippingUnitCost * itemObj['quantity'];
                            itemObj['hazmatItem'] = '1';
                        } else {
                            itemObj['hazmatItem'] = '0';
                        }

                        itemObj['noRePackaging'] = itemRecord[Field.NO_REPACKAGING] === 'T' ? '1' : '0';
                        itemObj['weight'] =
                            itemRecord[Field.WEIGHTUNIT] === '2' ? weight * 0.0625 /* OZ */ :
                                itemRecord[Field.WEIGHTUNIT] === '3' ? weight * 2.2046 /* KG */ :
                                    itemRecord[Field.WEIGHTUNIT] === '4' ? weight * 0.0022 /* G  */ :
                                        weight; /* 1 = LB, no more enums */
                        itemObj['weightUnits'] = 'LB';

                        itemObj['width'] = itemRecord[Field.WIDTH] ? +itemRecord[Field.WIDTH] : 1;
                        itemObj['height'] = itemRecord[Field.HEIGHT] ? +itemRecord[Field.HEIGHT] : 1;
                        itemObj['length'] = itemRecord[Field.LENGTH] ? +itemRecord[Field.LENGTH] : 1;
                        itemObj['desc'] = itemRecord[Field.DESCRIPTION];
                        itemObj['upccode'] = itemRecord[Field.UPC_NEW] ? itemRecord[Field.UPC_NEW] : itemRecord[Field.UPC_OLD];

                        var locObj = {};
                        if (LocationsDic[itemLocNum] === undefined || LocationsDic[itemLocNum] === null) {
                            var locationFieldNames = ['name', 'phone', 'address1', 'address2', 'city', 'state', 'zip', 'country'];//
                            locObj = nlapiLookupField('location', itemLocNum, locationFieldNames);//
                            locObj['id'] = itemLocNum;
                            locObj['shippingCost'] = '0';
                            locObj['hazmatShippingCost'] = 0; //hazmatShippingCost;
                            locObj['items'] = new Array();
                            locObj['pkgs'] = new Array();
                            locObj['pkgsHTML'] = '';
                            locObj['pkgsText'] = '';
                            locObj['ratesHTML'] = ''; //GetDefaultRatesHTML();

                            LocationsArr.push(itemLocNum);
                            LocationsDic[itemLocNum] = locObj;
                        }

                        locObj = LocationsDic[itemLocNum];
                        if (ExcludeFreeShipping === '1' || itemObj['excludeFreeShipping'] === '1') {
                            locObj['excludeFreeShipping'] = '1';
                        }
                        var itemsArray = locObj['items'];
                        itemsArray.push(itemObj);
                        locObj['hazmatShippingCost'] += hazmatShippingCost;

                    } else {
                        nlapiLogExecution('ERROR', 'Cannot lookup-- Item Type: Item ID', itemTypeName + ': ' + itemId);
                    } //if the lookupfield is successful
                } //if itemid > 0
            } //if itemlocnum > 0, which it always is cuz this is hardcoded
        } //if item exists
    } //for loop

}

function ItemFitsPackage(pkgDef, itemHeight, itemWidth, itemLength) {
    if ((itemHeight <= pkgDef['height']) && (itemWidth <= pkgDef['width']) && (itemLength <= pkgDef['length'])) {
        return true;
    }

    if ((itemHeight <= pkgDef['width']) && (itemWidth <= pkgDef['length']) && (itemLength <= pkgDef['height'])) {
        return true;
    }

    if ((itemHeight <= pkgDef['length']) && (itemWidth <= pkgDef['height']) && (itemLength <= pkgDef['width'])) {
        return true;
    }

    return false;
}

function AddToPackage(pkgsArray, itemObj, pkgDefLevel) {
    var itemQuantity = 1;
    var itemName = itemObj['name'];
    var itemDesc = itemObj['desc'];
    var itemNotes = itemObj['notes'];
    var itemSKU = itemObj['upccode'];//uses UPC_NEW, or UPC_OLD
    var itemWeight = itemObj['weight'];
    var itemWeightUnits = itemObj['weightUnits'];
    var itemId = itemObj['itemId'];
    var itemHeight = itemObj['height'];
    var itemWidth = itemObj['width'];
    var itemLength = itemObj['length'];
    var itemVolume = itemHeight * itemWidth * itemLength;
    var itemLinearLength = itemHeight + itemWidth + itemLength;
    var itemNoRePackaging = itemObj['noRePackaging'];
    var itemFragile = itemObj['fragileItem'];

    var i = 0;
    for (i = 0; i < pkgsArray.length; i++) {
        var pkgObj = pkgsArray[i];
        var pkgDefIndex = pkgObj['pkgDefIndex'];
        var currPkgVolume = pkgObj['currentVolume'];
        var currPkgWeight = pkgObj['currentWeight'];
        var currPkgLinearLength = pkgObj['currentLinearLength'];

        var pkgDef = PkgDefsArr[pkgDefIndex];
        var pkgMaxVolume = pkgDef['maxVolume'];
        var pkgMaxWeight = (pkgObj['fragileItem'] == false) ? pkgDef['maxWeight'] : MaxWeightFragile;
        var pkgMaxLinearLength = pkgDef['maxLinearLength'];
        if (((currPkgVolume + itemVolume) <= pkgMaxVolume) &&
            ((currPkgWeight + itemWeight) <= pkgMaxWeight) /* &&
         ((currPkgLinearLength + itemLinearLength) <= pkgMaxLinearLength) */) {
            //alert('Adding Item to Package...')
            if (ItemFitsPackage(pkgDef, itemHeight, itemWidth, itemLength)) {
                //alert('Item #: ' + itemId + ' Size: ' + itemObj['length'] + 'x' + itemObj['width'] + 'x' + itemObj['height']);
                //alert('Pkg Def: ' + (pkgDefIndex + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
                var itemObj2 = {};
                itemObj2['itemId'] = itemId;
                itemObj2['name'] = itemName;
                itemObj2['desc'] = itemDesc;
                itemObj2['notes'] = itemNotes;
                itemObj2['upccode'] = itemSKU;
                itemObj2['quantity'] = itemQuantity;
                itemObj2['weight'] = itemWeight;
                itemObj2['weightUnits'] = itemWeightUnits;
                itemObj2['height'] = itemHeight;
                itemObj2['width'] = itemWidth;
                itemObj2['length'] = itemLength;
                itemObj2['volume'] = itemVolume;
                itemObj2['shipIndividually'] = '0';
                itemObj2['noRePackaging'] = itemNoRePackaging;
                itemObj2['fragileItem'] = itemFragile;

                var pkgItems = pkgObj['items'];
                pkgItems.push(itemObj2);

                pkgObj['currentVolume'] = currPkgVolume + itemVolume;
                pkgObj['currentWeight'] = currPkgWeight + itemWeight;
                pkgObj['currentLinearLength'] = currPkgLinearLength + itemLinearLength;
                pkgObj['percentFull'] = (currPkgVolume + itemVolume) / pkgMaxVolume;
                if (itemFragile == '1') {
                    pkgObj['fragileItem'] = true;
                }
                return;
            }
            else {
                //alert('Item does not fit package');
            }
        }
    }

    var j = pkgDefLevel;
    for (i = 0; i < PkgDefsArr.length; i++) {
        var pkgDef = PkgDefsArr[j];
        var pkgMaxVolume = pkgDef['maxVolume'];
        var pkgMaxWeight = (itemFragile == '0') ? pkgDef['maxWeight'] : MaxWeightFragile;
        var pkgMaxLinearLength = pkgDef['maxLinearLength'];
        if ((itemVolume <= pkgMaxVolume) &&
            (itemWeight <= pkgMaxWeight) /* &&
         (itemLinearLength <= pkgMaxLinearLength)*/) {
            //alert('Adding Item to Package...')
            if (ItemFitsPackage(pkgDef, itemHeight, itemWidth, itemLength)) {
                //alert('Item #: ' + itemId + ' Size: ' + itemObj['length'] + 'x' + itemObj['width'] + 'x' + itemObj['height']);
                //alert('Pkg Def: ' + (j + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
                var itemObj2 = {};
                itemObj2['itemId'] = itemId;
                itemObj2['name'] = itemName;
                itemObj2['desc'] = itemDesc;
                itemObj2['notes'] = itemNotes;
                itemObj2['upccode'] = itemSKU;
                itemObj2['quantity'] = itemQuantity;
                itemObj2['weight'] = itemWeight;
                itemObj2['weightUnits'] = itemWeightUnits;
                itemObj2['height'] = itemHeight;
                itemObj2['width'] = itemWidth;
                itemObj2['length'] = itemLength;
                itemObj2['volume'] = itemVolume;
                itemObj2['shipIndividually'] = '0';
                itemObj2['noRePackaging'] = itemNoRePackaging;
                itemObj2['fragileItem'] = itemFragile;

                var pkgObj = {};
                var pkgItems = new Array();
                pkgItems.push(itemObj2);
                pkgObj['items'] = pkgItems;
                pkgObj['currentVolume'] = itemVolume;
                pkgObj['currentWeight'] = itemWeight;
                pkgObj['currentLinearLength'] = itemLinearLength;
                pkgObj['percentFull'] = itemVolume / pkgMaxVolume;
                pkgObj['pkgDefIndex'] = j;
                if (itemFragile == '1') {
                    pkgObj['fragileItem'] = true;
                }
                else {
                    pkgObj['fragileItem'] = false;
                }
                pkgsArray.push(pkgObj);
                return;
            }
            else {
                //alert('Item does not fit package');
            }
        }

        j = (j + 1) % PkgDefsArr.length;
    }

    if (pkgDefLevel == 0) {
        itemObj['shipIndividually'] = '1';
        itemObj['notes'] = 'Over-sized Package';
    }
}

function GenerateShippingCostHTML(pkgsArray) {

    PkgsText = '';

    var i = 0;
    var dlgHTML = '';
    dlgHTML += '<style type="text/css">';
    dlgHTML += 'table.gridtable {width: 100%;color:#000000;border-width: 1px;border-color: #666666;border-collapse: collapse; }';
    dlgHTML += 'table.gridtable th {border-width: 1px;padding: 8px;border-style: solid;border-color: #666666; }';
    dlgHTML += 'table.gridtable td {border-width: 1px;padding: 8px;border-style: solid;border-color: #666666;background-color: #ffffff; }';
    dlgHTML += 'table.gridtable2 {width: 100%;color:#333333;border-width: 1px;border-color: #999999;border-collapse: collapse; }';
    dlgHTML += 'table.gridtable2 th {border-width: 1px;padding: 8px;border-style: solid;border-color: #999999;background-color: #607799;color: #ffffff }';
    dlgHTML += 'table.gridtable2 td {border-width: 1px;padding: 8px;border-style: solid;border-color: #999999;background-color: #ffffff; }';
    dlgHTML += 'tr.shipseparate {color: #FF0000; }';
    dlgHTML += 'tr.tableheader {background-color: #dedede;color: #000000 }';
    dlgHTML += '</style>';
    dlgHTML += '<table class="gridtable">';
    dlgHTML += '<tr class="tableheader"><th>Pkg #</th><th>Pkg Weight</th><th>Pkg Dimensions</th><th>Percent Full</th><th>Items included in the Pkg</th></tr>';

    for (i = 0; i < pkgsArray.length; i++) {

        var pkgObj = pkgsArray[i];
        var pkgDefIndex = pkgObj['pkgDefIndex'];
        var pkgDef = {};
        if (pkgDefIndex < 0) {
            var itemsArr = pkgObj['items'];
            var itemObj2 = itemsArr[0];
            var itemHeight = itemObj2['height'];
            var itemLength = itemObj2['length'];
            var itemWidth = itemObj2['width'];

            pkgDef['id'] = 0;
            pkgDef['name'] = itemHeight.toString() + 'x' + itemLength.toString() + 'x' + itemWidth.toString();
            pkgDef['height'] = itemHeight;
            pkgDef['length'] = itemLength;
            pkgDef['width'] = itemWidth;
            pkgDef['dimUnits'] = 'IN';
            pkgDef['weightUnits'] = 'LB';
            pkgDef['maxWeight'] = MaxWeight;
            pkgDef['maxVolume'] = pkgDef['height'] * pkgDef['length'] * pkgDef['width'];
            pkgDef['maxLinearLength'] = pkgDef['height'] + pkgDef['length'] + pkgDef['width'];
        }
        else {
            pkgDef = PkgDefsArr[pkgDefIndex];
        }

        var seqNumber = i + 1;
        var pkgHeight = pkgDef['height'];
        var pkgWidth = pkgDef['width'];
        var pkgLength = pkgDef['length'];
        var pkgDimUnits = pkgDef['dimUnits'];
        var pkgWeightUnits = pkgDef['weightUnits'];

        var pkgWeight = pkgObj['currentWeight'];
        var pkgVolume = pkgObj['currentVolume'];
        var pkgPercentFull = pkgObj['percentFull'] * 100;

        // Update Pkg Dims
        pkgObj['height'] = pkgHeight;
        pkgObj['width'] = pkgWidth;
        pkgObj['length'] = pkgLength;

        var pkgItems = pkgObj['items'];

        var pkgShipSeparate = '0';
        if (pkgItems.length > 0) {
            var itemObj2 = pkgItems[0];
            pkgShipSeparate = itemObj2['shipIndividually'];
        }

        if (pkgShipSeparate == '1') {
            dlgHTML += '<tr class="shipseparate">';
        }
        else {
            dlgHTML += '<tr>';
        }

        PkgsText += '[Pkg #: ' + seqNumber + '] &nbsp;&nbsp;';
        PkgsText += '[Pkg Size: ' + pkgHeight.toString() + 'x' + pkgLength.toString() + 'x' + pkgWidth.toString() + ' ' + pkgDimUnits + '] &nbsp;&nbsp;';
        PkgsText += '[Total Weight: ' + pkgWeight.toFixed(2) + ' ' + pkgWeightUnits + ']\n\n';
        PkgsText += 'Items included in the Package: ' + '\n';
        PkgsText += '-----------------------------------------------------------------------------' + '\n';

        dlgHTML += '<td>' + seqNumber + '</td>';
        dlgHTML += '<td>' + pkgWeight.toFixed(2) + ' ' + pkgWeightUnits + '</td>';
        dlgHTML += '<td>' + pkgHeight.toString() + 'x' + pkgLength.toString() + 'x' + pkgWidth.toString() + ' ' + pkgDimUnits + '</td>';
        dlgHTML += '<td>' + pkgPercentFull.toFixed(2) + '% </td>';
        dlgHTML += '<td>';

        dlgHTML += '<table class="gridtable2">';
        dlgHTML += '<tr><th>SKU</th><th>Name</th><th>Quantity</th><th>Weight</th><th>Dimensions</th><th>Notes</th></tr>';

        var j = 0;
        for (j = 0; j < pkgItems.length; j++) {
            var itemObj = pkgItems[j];
            if ((itemObj != null) && (itemObj != undefined)) {
                var pkgItemQuantity = itemObj['quantity'];
                var pkgItemName = itemObj['name'];
                var pkgItemDesc = itemObj['desc'];
                var pkgItemSKU = itemObj['upccode'];//uses UPC_NEW, or UPC_OLD
                var pkgItemWeight = itemObj['weight'];
                var pkgItemWeightUnits = itemObj['weightUnits'];
                var pkgItemHeight = itemObj['height'];
                var pkgItemLength = itemObj['length'];
                var pkgItemWidth = itemObj['width'];
                var pkgItemNotes = itemObj['notes'];

                pkgItemName = pkgItemName.replace(/"/g, 'inch');
                pkgItemDesc = pkgItemDesc.replace(/"/g, 'inch');

                pkgItemName = pkgItemName.replace(/&amp;|&/g, "\&");
                pkgItemDesc = pkgItemDesc.replace(/&amp;|&/g, "\&");

                if (pkgShipSeparate == '1') {
                    dlgHTML += '<tr class="shipseparate">';
                }
                else {
                    dlgHTML += '<tr>';
                }
                dlgHTML += '<td>' + pkgItemSKU + '</td>';
                dlgHTML += '<td>' + pkgItemName + '</td>';
                dlgHTML += '<td>' + pkgItemQuantity + '</td>';
                dlgHTML += '<td>' + pkgItemWeight.toFixed(2) + ' ' + pkgItemWeightUnits + '</td>';
                dlgHTML += '<td>' + pkgItemHeight.toString() + 'x' + pkgItemLength.toString() + 'x' + pkgItemWidth.toString() + ' IN</td>';
                dlgHTML += '<td>' + pkgItemNotes + '</td>';
                dlgHTML += '</tr>';

                var itemSeq = j + 1;
                PkgsText += '[Item #: ' + itemSeq.toString() + '] &nbsp;&nbsp;';
                PkgsText += '[SKU: ' + pkgItemSKU + '] &nbsp;&nbsp;';
                PkgsText += '[Qty: ' + pkgItemQuantity + ']\n';
                PkgsText += 'Name: ' + pkgItemName + '\n';
                PkgsText += 'Notes:' + pkgItemNotes + '\n';

                if (itemSeq < pkgItems.length) {
                    PkgsText += '\n';
                }
            }
        }
        dlgHTML += '</table>';
        dlgHTML += '</td></tr>';

        PkgsText += '-----------------------------------------------------------------------------' + '\n\n';
    }

    dlgHTML += '</table>';

    return dlgHTML;
}

function ReorgPackages(pkgsArray, pkgDefLevel) {
    var i = 0;
    for (i = pkgsArray.length - 1; i >= 0; i--) {
        var pkgObj = pkgsArray[i];
        var percentFull = pkgObj['percentFull'];
        var pkgDef = PkgDefsArr[pkgObj['pkgDefIndex']];
        //alert('Pkg #: ' + (i+1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height'] + ' Current % Full: ' + (percentFull * 100));
        if (percentFull <= PercentFullThreshold) {
            var currPkgsCount = pkgsArray.length;
            var itemsArr = pkgObj['items'];
            pkgsArray.splice(i, 1);

            var j = 0;
            for (j = 0; j < itemsArr.length; j++) {
                var itemObj = itemsArr[j];
                var quantity = itemObj['quantity'];

                if (quantity > 0) {
                    var k = 0;
                    for (k = 0; k < quantity; k++) {
                        var shipIndividually = itemObj['shipIndividually'];
                        if (shipIndividually == '0') {
                            AddToPackage(pkgsArray, itemObj, pkgDefLevel);

                            // Force Pkgs to stay at the same count with max utilization
                            if (pkgsArray.length > currPkgsCount) {
                                // Additional Pkg was added. Revert back to old Pkg
                                pkgsArray.pop();
                                pkgsArray.pop();
                                pkgsArray.push(pkgObj);
                                j = itemsArr.length; // break out of outer loop as well
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

function CalcAveragePercentFull(pkgsArray) {
    // Calculate Average Package Percent Full
    var i = 0;
    var count = 0;
    var averagePercentFull = 0;
    for (i = 0; i < pkgsArray.length; i++) {
        var pkgObj = pkgsArray[i];
        var percentFull = pkgObj['percentFull'];
        if (percentFull < PercentFullThreshold) {
            count++;
            averagePercentFull += percentFull;
        }
    }

    if (count > 0) {
        averagePercentFull = averagePercentFull / count;
    }

    return averagePercentFull;
}

function GroupLineItems(pkgsArray) {
    var i = 0;
    var averagePercentFull = 0;
    for (i = 0; i < pkgsArray.length; i++) {
        var pkgObj = pkgsArray[i];
        var itemsArr = pkgObj['items'];
        var grpItemsArr = new Array();
        var grpItemsDic = {};

        var j = 0;
        for (j = 0; j < itemsArr.length; j++) {
            var itemObj = itemsArr[j];
            var quantity = itemObj['quantity'];
            var weight = itemObj['weight'];
            var itemId = itemObj['itemId'];

            if ((grpItemsDic[itemId] == undefined) || (grpItemsDic[itemId] == null)) {
                grpItemsArr.push(itemId);
                grpItemsDic[itemId] = itemObj;
            }
            else {
                var grpItemObj = grpItemsDic[itemId];
                grpItemObj['quantity'] += quantity;
                grpItemObj['weight'] += weight;
            }
        }

        itemsArr = new Array();
        for (j = 0; j < grpItemsArr.length; j++) {
            itemId = grpItemsArr[j];
            grpItemObj = grpItemsDic[itemId];
            itemsArr.push(grpItemObj);
        }

        if (itemsArr.length == 1) {
            grpItemObj = itemsArr[0];
            quantity = grpItemObj['quantity'];
            if (quantity == 1) {
                if (grpItemObj['noRePackaging'] == '1') {
                    grpItemObj['notes'] = 'No repackaging necessary';
                    grpItemObj['shipIndividually'] = '1';

                    var itemHeight = grpItemObj['height'];
                    var itemWidth = grpItemObj['width'];
                    var itemLength = grpItemObj['length'];
                    var itemVolume = itemHeight * itemWidth * itemLength;
                    var itemLinearLength = itemHeight + itemWidth + itemLength;

                    pkgObj['currentVolume'] = itemVolume;
                    pkgObj['currentLinearLength'] = itemLinearLength;
                    pkgObj['percentFull'] = itemVolume / itemVolume;
                    pkgObj['pkgDefIndex'] = -1;
                }
            }
        }

        pkgObj['items'] = itemsArr;
    }
}

function CalcPackages(salesOrderID, locObj) {
    var i = 0;
    var selectedPkg;
    var totalWeight = 0;

    var itemsArray = locObj['items'];
    var pkgsArray = locObj['pkgs'];

    for (i = 0; i < itemsArray.length; i++) {
        var itemObj = itemsArray[i];
        var quantity = itemObj['quantity'];

        if (quantity > 0) {
            var j = 0;
            for (j = 0; j < quantity; j++) {
                var shipIndividually = itemObj['shipIndividually'];
                if (shipIndividually == '0') {
                    AddToPackage(pkgsArray, itemObj, 0);
                }

                totalWeight += itemObj['weight'];
            }
        }
    }

    var maxAvgPercentFull = CalcAveragePercentFull(pkgsArray);
    var maxPkgDefLevel = 0;
    for (i = 1; i < PkgDefsArr.length; i++) {
        var pkgDef = PkgDefsArr[i];
        //alert('Pkg Def: ' + (i + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
        ReorgPackages(pkgsArray, i);
        var avgPercentFull = CalcAveragePercentFull(pkgsArray);
        //alert('Avg % Full after Reorg: ' + (avgPercentFull * 100));
        if (avgPercentFull > maxAvgPercentFull) {
            //alert(avgPercentFull + ' > ' + maxAvgPercentFull);
            maxAvgPercentFull = avgPercentFull;
            maxPkgDefLevel = i;
        }
    }
    //alert('Final Reorg - Pkg Def: ' + maxPkgDefLevel);
    ReorgPackages(pkgsArray, maxPkgDefLevel);
    /*
     maxAvgPercentFull = CalcAveragePercentFull(pkgsArray);
     maxPkgDefLevel = 0;
     for (i = 2; i < PkgDefsArr.length; i++) {
     var pkgDef = PkgDefsArr[i];
     alert('Pkg Def: ' + (i + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
     ReorgPackages(pkgsArray, i);
     var avgPercentFull = CalcAveragePercentFull(pkgsArray);
     alert('Avg % Full after Reorg: ' + (avgPercentFull * 100));
     if (avgPercentFull > maxAvgPercentFull) {
     alert(avgPercentFull + ' > ' + maxAvgPercentFull);
     maxAvgPercentFull = avgPercentFull;
     maxPkgDefLevel = i;
     }
     }
     alert('Final Reorg - Pkg Def: ' + maxPkgDefLevel);
     ReorgPackages(pkgsArray, maxPkgDefLevel);
     */

    GroupLineItems(pkgsArray);

    for (i = 0; i < itemsArray.length; i++) {
        var itemObj = itemsArray[i];
        var shipIndividually = itemObj['shipIndividually'];
        if (shipIndividually == '1') {
            var notes = itemObj['notes'];
            if (notes.indexOf('Weight not defined') >= 0) {
                var itemWeight = itemObj['weight'];
                var itemHeight = itemObj['height'];
                var itemWidth = itemObj['width'];
                var itemLength = itemObj['length'];
                var itemVolume = itemHeight * itemWidth * itemLength;
                var itemLinearLength = itemHeight + itemWidth + itemLength;

                var pkgObj = {};
                var pkgItems = new Array();
                pkgItems.push(itemObj);
                pkgObj['items'] = pkgItems;
                pkgObj['currentVolume'] = itemVolume;
                pkgObj['currentWeight'] = itemWeight;
                pkgObj['currentLinearLength'] = itemLinearLength;
                pkgObj['percentFull'] = itemVolume / itemVolume;
                pkgObj['pkgDefIndex'] = -1;
                pkgsArray.push(pkgObj);
            }
            else {
                var j = 0;
                var quantity = itemObj['quantity'];
                for (j = 0; j < quantity; j++) {
                    itemObj['quantity'] = 1;
                    var itemWeight = itemObj['weight'];
                    var itemHeight = itemObj['height'];
                    var itemWidth = itemObj['width'];
                    var itemLength = itemObj['length'];
                    var itemVolume = itemHeight * itemWidth * itemLength;
                    var itemLinearLength = itemHeight + itemWidth + itemLength;

                    var pkgObj = {};
                    var pkgItems = new Array();
                    pkgItems.push(itemObj);
                    pkgObj['items'] = pkgItems;
                    pkgObj['currentVolume'] = itemVolume;
                    pkgObj['currentWeight'] = itemWeight;
                    pkgObj['currentLinearLength'] = itemLinearLength;
                    pkgObj['percentFull'] = itemVolume / itemVolume;
                    pkgObj['pkgDefIndex'] = -1;
                    pkgsArray.push(pkgObj);
                }
            }
        }
    }

    locObj['totalWeight'] = totalWeight;
    locObj['pkgsHTML'] = ''; //GenerateShippingCostHTML(pkgsArray);
    locObj['pkgsText'] = ''; //PkgsText;
}

function BSP_FedExBody(salesOrderID, locObj) {
    var timestamp = new Date();

    var totalWeight = 0;
    var packageCount = 0;
    var seqNumber = 1;
    var groupNumber = 1;
    var groupPkgCount = 1;
    var pkgItemSKU = '';
    var pkgItemName = '';
    var pkgItemQuantity = 0;
    var pkgItemDesc = '';

    var itemsArr = locObj['items'];
    var pkgsArr = locObj['pkgs'];

    var locationName = locObj['name'];
    var locationPhone = locObj['phone'];
    var locationAddress1 = locObj['address1'];
    var locationAddress2 = locObj['address2'];
    var locationCity = locObj['city'];
    var locationState = locObj['state'];
    var locationZip = locObj['zip'];
    var locationCountry = locObj['country'];
    //:: Replace nlapiGetField
    var shipToContact = OrderDetails['shipattention'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToPhone = OrderDetails['shipphone'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToAddress1 = OrderDetails['shipaddr1'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToAddress2 = OrderDetails['shipaddr2'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToCity = OrderDetails['shipcity'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToState = OrderDetails['shipstate'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToZip = OrderDetails['shipzip'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToCountry = OrderDetails['shipcountry'].replace(/[^\u0000-\u007F]+/gm, "");
    var shipToResidential = OrderDetails['shipisresidential'].replace(/[^\u0000-\u007F]+/gm, "");


    if (shipToCountry === 'GB') { shipToState = '' }

    if (shipToCountry.length > 2) {
        shipToCountry = CountryDic[shipToCountry];
    }

    var soapBody = '';
    totalWeight = locObj['totalWeight'];
    if (totalWeight <= 0) {
        return soapBody;
    }

    packageCount = pkgsArr.length;

    soapBody += '<RequestedShipment>';
    soapBody += '<ShipTimestamp>' + timestamp.toISOString() + '</ShipTimestamp>';
    soapBody += '<DropoffType>' + DropoffType + '</DropoffType>';
    soapBody += '<TotalWeight>';
    soapBody += '<Units>LB</Units>';
    soapBody += '<Value>' + totalWeight.toFixed(2) + '</Value>';
    soapBody += '</TotalWeight>';
    soapBody += '<Shipper>';
    soapBody += '<Contact>';
    soapBody += '<CompanyName>' + locationName + '</CompanyName>';
    soapBody += '<PhoneNumber>' + locationPhone + '</PhoneNumber>';
    soapBody += '</Contact>';
    soapBody += '<Address>';
    soapBody += '<StreetLines>' + locationAddress1 + '</StreetLines>';
    soapBody += '<StreetLines>' + locationAddress2 + '</StreetLines>';
    soapBody += '<City>' + locationCity + '</City>';
    soapBody += '<StateOrProvinceCode>' + locationState + '</StateOrProvinceCode>';
    soapBody += '<PostalCode>' + locationZip + '</PostalCode>';
    soapBody += '<CountryCode>' + locationCountry + '</CountryCode>';
    soapBody += '</Address>';
    soapBody += '</Shipper>';
    soapBody += '<Recipient>';
    soapBody += '<Contact>';
    soapBody += '<PersonName>' + shipToContact + '</PersonName>';
    soapBody += '<PhoneNumber>' + shipToPhone + '</PhoneNumber>';
    soapBody += '</Contact>';
    soapBody += '<Address>';
    soapBody += '<StreetLines>' + shipToAddress1 + '</StreetLines>';
    soapBody += '<StreetLines>' + shipToAddress2 + '</StreetLines>';
    soapBody += '<City>' + shipToCity + '</City>';
    soapBody += '<StateOrProvinceCode>' + shipToState + '</StateOrProvinceCode>';
    soapBody += '<PostalCode>' + shipToZip + '</PostalCode>';
    soapBody += '<CountryCode>' + shipToCountry + '</CountryCode>';
    soapBody += '<Residential>' + shipToResidential + '</Residential>';
    soapBody += '</Address>';
    soapBody += '</Recipient>';
    soapBody += '<ShippingChargesPayment>';
    soapBody += '<PaymentType>' + Payment_Type + '</PaymentType>';
    soapBody += '<Payor>';
    soapBody += '<ResponsibleParty>';
    soapBody += '<AccountNumber>';
    soapBody += (FedEx_UseProd) ? FedEx_ProdAccountNumber : FedEx_TestAccountNumber;
    soapBody += '</AccountNumber>';
    soapBody += '</ResponsibleParty>';
    soapBody += '</Payor>';
    soapBody += '</ShippingChargesPayment>';
    soapBody += '<RateRequestTypes>' + RateRequestType + '</RateRequestTypes>';

    soapBody += '<PackageCount>' + packageCount.toString() + '</PackageCount>';

    var i = 0;
    for (i = 0; i < packageCount; i++) {
        var pkgObj = pkgsArr[i];
        var pkgWeight = pkgObj['currentWeight'];
        if (pkgWeight > 0) {
            // var soapLength = soapBody.length;//
            soapBody += '<RequestedPackageLineItems>';

            seqNumber = i + 1;
            groupNumber = 1;
            groupPkgCount = 1;

            soapBody += '<SequenceNumber>' + seqNumber.toString() + '</SequenceNumber>';
            soapBody += '<GroupNumber>' + groupNumber.toString() + '</GroupNumber>';
            soapBody += '<GroupPackageCount>' + groupPkgCount.toString() + '</GroupPackageCount>';

            var pkgDefIndex = pkgObj['pkgDefIndex'];
            var pkgDef = {};
            if (pkgDefIndex < 0) {
                var itemsArr = pkgObj['items'];
                var itemObj2 = itemsArr[0];
                var itemHeight = itemObj2['height'];
                var itemLength = itemObj2['length'];
                var itemWidth = itemObj2['width'];

                pkgDef['id'] = 0;
                pkgDef['name'] = itemHeight.toString() + 'x' + itemLength.toString() + 'x' + itemWidth.toString();
                pkgDef['height'] = itemHeight;
                pkgDef['length'] = itemLength;
                pkgDef['width'] = itemWidth;
                pkgDef['dimUnits'] = 'IN';
                pkgDef['weightUnits'] = 'LB';
                pkgDef['maxWeight'] = MaxWeight;
                pkgDef['maxVolume'] = pkgDef['height'] * pkgDef['length'] * pkgDef['width'];
                pkgDef['maxLinearLength'] = pkgDef['height'] + pkgDef['length'] + pkgDef['width'];
            }
            else {
                pkgDef = PkgDefsArr[pkgDefIndex];
            }

            var pkgHeight = pkgDef['height'];
            var pkgWidth = pkgDef['width'];
            var pkgLength = pkgDef['length'];
            var pkgDimUnits = pkgDef['dimUnits'];
            var pkgWeightUnits = pkgDef['weightUnits'];

            soapBody += '<Weight>';
            soapBody += '<Units>' + pkgWeightUnits + '</Units>';
            soapBody += '<Value>' + pkgWeight.toFixed(2) + '</Value>';
            soapBody += '</Weight>';
            soapBody += '<Dimensions>';
            soapBody += '<Length>' + pkgLength.toFixed(0) + '</Length>';
            soapBody += '<Width>' + pkgWidth.toFixed(0) + '</Width>';
            soapBody += '<Height>' + pkgHeight.toFixed(0) + '</Height>';
            soapBody += '<Units>' + pkgDimUnits + '</Units>';
            soapBody += '</Dimensions>';

            var j = 0;
            var itemsArr = pkgObj['items'];
            for (j = 0; j < itemsArr.length; j++) {
                var itemObj = itemsArr[j];
                pkgItemQuantity = itemObj['quantity'];
                pkgItemName = itemObj['name'];
                pkgItemDesc = itemObj['desc'];
                pkgItemSKU = itemObj['upccode'];//uses UPC_NEW, or UPC_OLD

                // pkgItemName = pkgItemName.replace(/"/g, 'inch');Collin
                // pkgItemDesc = pkgItemDesc.replace(/"/g, 'inch');

                // pkgItemName = pkgItemName.replace(/&amp;|&/g, "");
                // pkgItemDesc = pkgItemDesc.replace(/&amp;|&/g, "");

                // soapBody += '<ContentRecords>';
                // soapBody += '<PartNumber>' + pkgItemSKU + '</PartNumber>';
                // soapBody += '<ItemNumber>' + pkgItemName + '</ItemNumber>';
                // soapBody += '<ReceivedQuantity>' + pkgItemQuantity.toString() + '</ReceivedQuantity>';
                // soapBody += '<Description>' + pkgItemDesc + '</Description>';
                // soapBody += '</ContentRecords>';
            }

            soapBody += '</RequestedPackageLineItems>';

        }
    }

    soapBody += '</RequestedShipment>';

    logRecord(2, soapBody);//

    return soapBody;
}

function BSP_FedExSoapEnvelope(requestType, requestBody) {
    var soap = '';
    soap += '<?xml version="1.0" encoding="utf-8"?>\n';
    soap += '<SOAP-ENV:Envelope ';
    soap += 'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ';
    soap += 'xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" ';
    soap += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
    soap += 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ';
    soap += 'xmlns="http://fedex.com/ws/rate/v20" >';
    soap += '<SOAP-ENV:Body>';
    soap += '<' + requestType + '>';
    soap += requestBody;
    soap += '</' + requestType + '>';
    soap += '</SOAP-ENV:Body>';
    soap += '</SOAP-ENV:Envelope>';
    return soap;
}

function SelectShipMethod(shipMethod, shippingCost, itemLoc) {
    if ((ShipMethodsDic[shipMethod] == undefined) || (ShipMethodsDic[shipMethod] == null)) {
        alert('Shipping Method (' + shipMethod + ') not defined in NetSuite.');
    }
    else {
        var shipMethodObj = ShipMethodsDic[shipMethod];
        nlapiSetFieldValue('shipmethod', shipMethodObj['id']);

        var locObj = LocationsDic[itemLoc];
        locObj['shippingCost'] = shippingCost;

        //nlapiSetFieldValue('shippingcost', shipMethodObj['cost']);
    }
}

function GetRealTimeShippingRates() {
    var totalShippingCost = 0;
    if (ExcludeFreeShipping === undefined) {
        ExcludeFreeShipping = '0';
    }
    DefineShipMethods();
    //:: Change FedExRequestRate to return Default Shipping Method Cost
    var salesOrderID = 0;
    for (var i = 0; i < LocationsArr.length; i++) {
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];
        var shippingCost_of_one_location = BSP_FedExRequestRate(salesOrderID, locObj);
        totalShippingCost += shippingCost_of_one_location;
        if (locObj['excludeFreeShipping'] === '1') {
            ExcludeFreeShipping = '1';
        }
    }
    //ShowShippingRatesDialog(true);
    return totalShippingCost;
}

function GetSuggestedPackages(salesOrderID) {
    DefinePackages();
    ProcessLineItems(salesOrderID);

    for (var i = 0; i < LocationsArr.length; i++) {
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];

        CalcPackages(salesOrderID, locObj);
    }
}

function BSP_FedExCalculateShipping() {
    var salesOrderID = 0; //nlapiGetFieldValue('id');

    GetSuggestedPackages(salesOrderID);

    nlapiLogExecution('DEBUG', "About to call Real TIme Rates");
    var shipping_cost = GetRealTimeShippingRates();
    return shipping_cost;
    //ShowShippingRatesDialog(showDialog);

    //form.getField('custpage_bsp_shippinghtml').setDisplayType('hidden');
}

function logRecord(fieldRef, details) {//
    var lookup = {//
        comments: 'custrecord_fedex_unit_comments',//
        1: 'custrecord_fedex_log_1_input_json',//orderJSON//
        2: '',// specific conditional to handle case//
        3: '',// specific conditional to handle case//
        4: 'custrecord_fedex_log_4_output_json',//shippingMethodsJSON//
        5: 'custrecord_fedex_unit_success_extid',//
        6: 'custrecord_fedex_unit_time_created',//
        fullSOAP: 'custrecord_fedex_log_2_req_soapbody_full',//soapBody//
        fullXML: 'custrecord_fedex_log_3_resp_xmlbody_full',//soapText//
        reqRegExp: new RegExp(/custrecord_fedex_log_2_req_soapbody/),//
        resRegExp: new RegExp(/custrecord_fedex_log_3_resp_xmlbody/),//
        req1: 'custrecord_fedex_log_2_req_soapbody1',//soapBody//
        req2: 'custrecord_fedex_log_2_req_soapbody2',//soapBody//
        req3: 'custrecord_fedex_log_2_req_soapbody3',//soapBody//
        req4: 'custrecord_fedex_log_2_req_soapbody4',//soapBody//
        req5: 'custrecord_fedex_log_2_req_soapbody5',//soapBody//
        req6: 'custrecord_fedex_log_2_req_soapbody6',//soapBody//
        req7: 'custrecord_fedex_log_2_req_soapbody7',//soapBody//
        req8: 'custrecord_fedex_log_2_req_soapbody8',//soapBody//
        res1: 'custrecord_fedex_log_3_resp_xmlbody1',//soapText//
        res2: 'custrecord_fedex_log_3_resp_xmlbody2',//soapText//
        res3: 'custrecord_fedex_log_3_resp_xmlbody3',//soapText//
        res4: 'custrecord_fedex_log_3_resp_xmlbody4',//soapText//
        res5: 'custrecord_fedex_log_3_resp_xmlbody5',//soapText//
        res6: 'custrecord_fedex_log_3_resp_xmlbody6',//soapText//
        res7: 'custrecord_fedex_log_3_resp_xmlbody7',//soapText//
        res8: 'custrecord_fedex_log_3_resp_xmlbody8',//soapText//
        res9: 'custrecord_fedex_log_3_resp_xmlbody9',//soapText//
        res10: 'custrecord_fedex_log_3_resp_xmlbody10',//soapText//
        res11: 'custrecord_fedex_log_3_resp_xmlbody11',//soapText//
        res12: 'custrecord_fedex_log_3_resp_xmlbody12',//soapText//
        res13: 'custrecord_fedex_log_3_resp_xmlbody13',//soapText//
        res14: 'custrecord_fedex_log_3_resp_xmlbody14',//soapText//
        res15: 'custrecord_fedex_log_3_resp_xmlbody15',//soapText//
        res16: 'custrecord_fedex_log_3_resp_xmlbody16',//soapText//
        res17: 'custrecord_fedex_log_3_resp_xmlbody17',//soapText//
        res18: 'custrecord_fedex_log_3_resp_xmlbody18',//soapText//
        res19: 'custrecord_fedex_log_3_resp_xmlbody19',//soapText//
        res20: 'custrecord_fedex_log_3_resp_xmlbody20',//soapText//
        res21: 'custrecord_fedex_log_3_resp_xmlbody21',//soapText//
        res22: 'custrecord_fedex_log_3_resp_xmlbody22',//soapText//
        res23: 'custrecord_fedex_log_3_resp_xmlbody23',//soapText//
        res24: 'custrecord_fedex_log_3_resp_xmlbody24',//soapText//
        res25: 'custrecord_fedex_log_3_resp_xmlbody25',//soapText//
        res26: 'custrecord_fedex_log_3_resp_xmlbody26',//soapText//
        res27: 'custrecord_fedex_log_3_resp_xmlbody27',//soapText//
        res28: 'custrecord_fedex_log_3_resp_xmlbody28',//soapText//
        res29: 'custrecord_fedex_log_3_resp_xmlbody29',//soapText//
        res30: 'custrecord_fedex_log_3_resp_xmlbody30',//soapText//
        res31: 'custrecord_fedex_log_3_resp_xmlbody31',//soapText//
        res32: 'custrecord_fedex_log_3_resp_xmlbody32'//soapText//
        /*
          these are the fields that exist on the NetSuite custom record.
          if you create a field in netsuite, you need to update the reference here in this lookup table.
          the reason we do this lookup table is we rather the code fail gracefully with proper error handling in this isolated function
            than throw an error in the actual shipping suitelet call or post any null values when the scheduler runs
        */


    };//
    fieldRef =                        //
        fieldRef === 2 ? 'req1' :     //
            fieldRef === 3 ? 'res1' :     //
                "" + fieldRef;//

    if (lookup[fieldRef] !== undefined && details) {//
        var title = extid + ',' + lookup[fieldRef];// creates param1//
        nlapiLogExecution('AUDIT', title, details.substr(0, 3999));// creates the log record//
        if (details.length > 3999) {//LogExecution is max 3999 characters//
            var prefix = fieldRef.substr(0, 3);//returns 'xml' 'soa' or something else//
            if (prefix === 'req' || prefix === 'res') {//
                var regExp = prefix + "RegExp";//
                var suffix = Number(lookup[fieldRef].replace(lookup[regExp], "")) + 1;//
                var newFieldRef = prefix + suffix;//
                logRecord(newFieldRef, details.substr(3999));//
            } else {//
                var baseErrorMessage = lookup[fieldRef] + ' is longer than 3999 characters (' + details.length + ')';//
                nlapiLogExecution('AUDIT', extid + ',' + lookup['comments'], baseErrorMessage);//
                nlapiLogExecution('ERROR', "FedEx Shipping Suitelet Soft Error", baseErrorMessage + '. Logs created for ExtID: ' + extid + '. A new field needs to be made.');//
            }//
        }//
    } else {//
        var detailsLength = details !== undefined ? details.length : 0;//
        var logDetailsMessage = fieldRef + ' reference does not exist? | Details Length is: ' + detailsLength + ', make at least ' + Math.ceil(detailsLength / 4000) + ' new fields | No logs created for this field for ExtID: ' + extid;
        nlapiLogExecution('AUDIT', extid + ',' + lookup['comments'], logDetailsMessage);//
        nlapiLogExecution('ERROR', "FedEx Shipping Suitelet Soft Error", logDetailsMessage);//
    }//
}//

//OMFG this function does everything above!
function BSP_FedExInterface(orderJSON) { //called from get_fedex_rates
    OrderDetails = {};
    ShippingRatesDic = {};

    var shippingMethodsJSON = '';
    if ((orderJSON != null) && (orderJSON != undefined) && (orderJSON != '')) {
        try {
            logRecord(1, orderJSON);//
            OrderDetails = JSON.parse(orderJSON);
        }
        catch (err) {
            nlapiLogExecution('ERROR', 'FedEx Shipping Suitelet Error: Error Thrown', err);//
            nlapiLogExecution('ERROR', 'FedEx Shipping Suitelet Error: ordjson', orderJSON);//
        }

        var totalShippingCost = BSP_FedExCalculateShipping();

        if (ShippingRatesDic !== null && ShippingRatesDic !== undefined) {
            ShippingRatesDic['excludeFreeShipping'] = ExcludeFreeShipping;
            ShippingRatesDic['totalShippingCost'] = totalShippingCost.toFixed(2);
            shippingMethodsJSON = JSON.stringify(ShippingRatesDic);
            logRecord(4, shippingMethodsJSON);//
            logRecord(5, extid.toString());//
            var Time = new Date(extid);//
            var timeCreated = getDate(Time) + ' ' + getTime(Time);//
            logRecord(6, timeCreated);//
        }
    }
    return shippingMethodsJSON; //this is actually a json string
}

function pad(time, sigFigs) {
    sigFigs = sigFigs || 2;
    var scalar = sigFigs;
    var zeroes = "0";
    while (--scalar) {
        zeroes += "0";
    }
    return (zeroes + time).slice(sigFigs * -1);
}
function getDate(time) {
    return '' + time.getFullYear() + '/' + pad(time.getMonth() + 1) + '/' + pad(time.getDate());
}
function getTime(time) {
    var ampm = time.getHours() >= 12 ? ' PM' : ' AM';
    return '' + pad(time.getHours()) + ':' + pad(time.getMinutes()) + ':' + pad(time.getSeconds()) + '.' + pad(time.getMilliseconds(), 3) + ampm;
}

Date.prototype.getTimestamp = getTimestamp;
function getTimestamp() {
    var time = this;
    return getDate(time) + ' ' + getTime(time);

    function pad(time, sigFigs) {
        sigFigs = sigFigs || 2;
        var scalar = sigFigs;
        var zeroes = "0";
        while (--scalar) {
            zeroes += "0";
        }
        return (zeroes + time).slice(sigFigs * -1);
    }
    function getDate(time) {
        return '' + time.getFullYear() + '/' + pad(time.getMonth() + 1) + '/' + pad(time.getDate());
    }
    function getTime(time) {
        var ampm = time.getHours() >= 12 ? ' PM' : ' AM';
        return '' + pad(time.getHours()) + ':' + pad(time.getMinutes()) + ':' + pad(time.getSeconds()) + '.' + pad(time.getMilliseconds(), 3) + ampm;
    }
}

/****************************************
 * CALCULATOR ENDS
 *************************************/

//warehouses for reference
// var warehouses = {
//     denver: {
//         zip: 80207,
//         id: 3
//     },
//     garden_grove: {
//         zip: 92841,
//         id: 6
//     },
//     lawndale: {
//         zip: 90260,
//         id: 5
//     },
//     santa_ana: {
//         zip: 92705,
//         id: 1
//     },
//     woodinville: {
//         zip: 98072,
//         id: 2
//     }
// };

