//***********************************APPLY SHIPPING ALGORITHM***********************************************

//set items with their quantities and locations based on fewest fulfillments followed by speed.
//calls the master suitelet which calls the get_fedex_rates_sorted restlet
//returns shipping methods, a sorted order json and shipping methods with cost
//written by collin wong
//var acceptable_item_types = ['InvtPart', 'Assembly'];
//var after_ship_address = false;
var set_ship_locations_running = false;
var set_ship_method_running = false;

function set_ship_locations(exec, context) {
    if (exec === 'webstore') {
        var item_count = nlapiGetLineItemCount('item');
        if (!set_ship_locations_running && item_count > 0) {
            set_ship_locations_running = true;
            if (item_count > 0) {
                var order_json = create_order_json(item_count);
                var custom_price_items = keep_track_of_custom_prices(order_json.lines);
                //if (order_json.shipzip) {
                    call_fed_ex_suitelet(order_json, context, item_count, custom_price_items);
                //}
            }
            set_ship_locations_running = false;
        }
    }
}


function hide_optimize_location_button(exec) {
    if (exec === 'userinterface') {
        var role = nlapiGetRole();
        var ALLOWED_ROLES = [
            '3',//admins
            '1025'//
        ];
        jQuery = jQuery ? jQuery : undefined;
        if (ALLOWED_ROLES.indexOf(role) == -1 && jQuery) {//hides Optimize Ship Locations Button
            jQuery('#tbl_custformbutton3').hide();
        }
    }
}

function call_fed_ex_suitelet(order_json, context, item_count, custom_price_items) {
    var output = {};
    item_count = item_count || nlapiGetLineItemCount('item');
    var request = JSON.stringify(order_json);

    if (context.environment === 'SANDBOX') {
        url = 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c';
    }else{
        url = 'https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274&h=60378349ea77b5405c25';
    }
    var data = {
        payload: request,
        action: 'get_shipping_rates'
    };
    try {
        var response = nlapiRequestURL(url, data, null, null, 'POST');
        nlapiLogExecution('AUDIT', 'GET FED EX RATE RESPONSE WEBSTORE', response.getBody());
        response = JSON.parse(response.getBody());
        //var out_of_stock_items = response.data.out_of_stock_items;
        var order_items = response.data.sorted_order_json.lines;
        order_items = set_custom_prices(custom_price_items, order_items);
        var ship_methods = response.data.shipping_methods;
        set_existing_item_lines(order_items, item_count);
        set_items_with_locations(order_items);
    } catch (err) {
        nlapiLogExecution('AUDIT', 'RESPONSE CALL FED EX SUITELET FAILED', err);
    }
}


function set_items_with_locations(order_items) {
    for (var i = 0; i < order_items.length; i++) {
        nlapiSelectNewLineItem('item');
        nlapiSetCurrentLineItemValue('item', 'item', order_items[i].item, true, true);
        nlapiSetCurrentLineItemValue('item', 'location', order_items[i].location, true, true);
        nlapiSetCurrentLineItemValue('item', 'quantity', order_items[i].quantity, true, true);
        if (exec === 'userinterface') {
            if (order_items[i].price_level && order_items[i].price_level !== 'Base Price') {
                nlapiSetCurrentLineItemValue('item', 'price_display', order_items[i].price_level, true, true);
                nlapiSetCurrentLineItemValue('item', 'price', order_items[i].price_id, true, true);//OMG
                nlapiSetCurrentLineItemValue('item', 'rate', order_items[i].rate, true, true);
            }
        }
        nlapiCommitLineItem('item');
    }
}

function create_order_json(item_count) {
    var acceptable_item_types = ['inventoryitem', 'assemblyitem', 'InvtPart', 'Assembly'];
    item_count = item_count || nlapiGetLineItemCount('item');
    var order_json = {};
    order_json.shipattention = nlapiGetFieldValue('shipattention');
    order_json.shipphone = nlapiGetFieldValue('shipphone');
    order_json.shipaddr1 = nlapiGetFieldValue('shipaddr1');
    order_json.shipaddr2 = nlapiGetFieldValue('shipaddr2');
    order_json.shipcity = nlapiGetFieldValue('shipcity');
    order_json.shipstate = nlapiGetFieldValue('shipstate');
    order_json.shipzip = nlapiGetFieldValue('shipzip');
    order_json.shipcountry = nlapiGetFieldValue('shipcountry');
    order_json.shipisresidential = (nlapiGetFieldValue('shipisresidential') == 'T') ? '1' : '0';
    order_json.shipmethod = nlapiGetFieldValue('shipmethod');
    order_json.lines = [];
    for (var i = 1; i <= item_count; i++) {
        var item_obj = {};
        nlapiSelectLineItem('item', i);
        item_obj.item = nlapiGetCurrentLineItemValue('item', 'item');
        var item_type = nlapiGetCurrentLineItemValue('item', 'itemtype');
        if (acceptable_item_types.indexOf(item_type) !== -1) {
            item_obj.quantity = nlapiGetCurrentLineItemValue('item', 'quantity');
            item_obj.price_level = nlapiGetCurrentLineItemValue('item', 'price_display');
            item_obj.price_id = nlapiGetCurrentLineItemValue('item', 'price'); //OMG
            item_obj.rate = nlapiGetCurrentLineItemValue('item', 'rate');
            order_json.lines.push(item_obj);
        }
    }
    return order_json;
}

function set_existing_item_lines(order_json) {
    var item_count = nlapiGetLineItemCount('item');
    var acceptable_item_types = ['inventoryitem', 'assemblyitem', 'InvtPart', 'Assembly'];
    for (var i = 1; i <= item_count; i++) {
        nlapiSelectLineItem('item', i);
        var item_id = nlapiGetCurrentLineItemValue('item', 'item');
        var item_type = nlapiGetCurrentLineItemValue('item', 'itemtype');
        if (acceptable_item_types.indexOf(item_type) !== -1) {
            var item_line_in_order_json = look_up_item_in_order_json(order_json, item_id);
            if (item_line_in_order_json) {
                nlapiSetCurrentLineItemValue('item', 'item', item_line_in_order_json.item, true, true);
                nlapiSetCurrentLineItemValue('item', 'location', item_line_in_order_json.location, true, true);
                nlapiSetCurrentLineItemValue('item', 'quantity', item_line_in_order_json.quantity, true, true);
                if (exec === 'userinterface') {
                    if (item_line_in_order_json.price_level && item_line_in_order_json.price_level !== 'Base Price') {
                        nlapiSetCurrentLineItemValue('item', 'price_display', item_line_in_order_json.price_level, true, true);
                        nlapiSetCurrentLineItemValue('item', 'price', item_line_in_order_json.price_id, true, true); //OMG
                        nlapiSetCurrentLineItemValue('item', 'rate', item_line_in_order_json.rate, true, true);
                    }
                }
                nlapiCommitLineItem('item');
            } else {
                nlapiRemoveLineItem('item', i);
                i--;
                item_count--;
            }
        }
    }
}

function set_shipping_cost_based_on_method(shipping_methods) {
    var ship_method_id = nlapiGetFieldValue('shipmethod');
    if (shipping_methods) {
        shipping_methods = JSON.parse(shipping_methods);
        if (shipping_methods[ship_method_id]) {
            nlapiSetFieldValue('shippingcost', shipping_methods[ship_method_id].cost);
        }
    }
}



function look_up_item_in_order_json(order_json, item_id) {
    for (var i = 0; i < order_json.length; i++) {
        if (order_json[i].item == item_id) {
            return order_json.splice(i, 1)[0];
        }
    }
    return false;
}

/** adds multiple lines for the same item together, summing up their quantities
 * @param {array object} order_json items and their quantities needed for the order
 * @returns {array object} the order condensed
 */

function condense_order_json_items(items) {//used to add the same item in the order array if it shows up more than once
    var items_copy = JSON.parse(JSON.stringify(items));
    for (var i = 0; i < items_copy.length; i++) {
        var current_item = items_copy[i];
        for (j = i + 1; j < items_copy.length; j++) {
            if (current_item.item === items_copy[j].item && current_item.rate === items_copy[j].rate) {
                current_item.quantity = Number(current_item.quantity) + Number(items_copy[j].quantity);
                items_copy.splice(j, 1);
                j--;
            }
        }
    }
    return items_copy;
}

/** stores items with custom pricing and their quantities needed for the order
 * @param {items} order_json items and their quantities needed for the order
 * @returns {array object} items with custom pricing and their quantities
 */

function keep_track_of_custom_prices(items) {
    var items_with_custom_pricing = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].price_level !== 'Base Price') {
            items_with_custom_pricing.push(items[i]);
        }
    }
    var condensed_items = condense_order_json_items(items_with_custom_pricing);
    return condensed_items;
}

/** edits the the order json with correct price levels 
 * @param {array object} items_with_custom_pricing items with custom pricing and their quantities
 * @param {array object} order_items items with their quantities and ship from locations
 * @returns {array object} items with custom pricing and their quantities
 */

function set_custom_prices(items_with_custom_pricing, order_items) {
    var original_fed_ex_length = order_items.length;
    for (var i = 0; i < items_with_custom_pricing.length; i++) {
        var current_custom_priced_item = items_with_custom_pricing[i];
        for (var j = 0; j < original_fed_ex_length; j++) {
            var current_fed_ex_item = order_items[j];
            if (current_custom_priced_item.item === current_fed_ex_item.item) {
                if (current_custom_priced_item.quantity >= current_fed_ex_item.quantity) {
                    current_fed_ex_item.price_level = current_custom_priced_item.price_level;
                    current_fed_ex_item.price_id = current_custom_priced_item.price_id;
                    current_fed_ex_item.rate = current_custom_priced_item.rate;
                    current_custom_priced_item.quantity = +current_custom_priced_item.quantity - +current_fed_ex_item.quantity;
                    if (current_custom_priced_item.quantity == 0) {
                        break;
                    }
                } else {
                    current_fed_ex_item.quantity = +current_fed_ex_item.quantity - +current_custom_priced_item.quantity;
                    current_custom_priced_item.location = current_fed_ex_item.location;
                    order_items.push(current_custom_priced_item);
                }
            }
        }
    }
    return order_items;
}


//***********************************APPLY SHIPPING ALGORITHM END***********************************************
