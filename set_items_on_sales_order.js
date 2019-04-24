//Set items with their quantities and locations based on fewest fulfillments followed by speed.
//written by collin wong
var acceptable_item_types = ['inventoryitem', 'assemblyitem', 'InvtPart', 'Assembly'];

var context = nlapiGetContext();

//******************** MAIN FUNCTION  ************************
/** creates a loading model to prevent user from making changes while the function is running. 
* creates order json and custom price items based on lines items on current sales order
* calls call_fed_ex_suitelet_userinterface 
* @param none
* @returns none 
*/

function set_ship_locations_userinterface() {
    var modal = jQuery('<div>').addClass('modal').css({
        display: 'block',
        position: 'fixed',
        'z-index': '1000',
        top: '0',
        left: '0',
        height: '100%',
        width: '100%',
        background: "rgba( 255 , 255 , 255 , .8) url('http://i.stack.imgur.com/FhHRx.gif') 50% 50% no-repeat"
    });
    jQuery('body').append(modal); //create a loading screen model
    var order_json = create_order_json();
    var custom_price_items = keep_track_of_custom_prices(order_json.lines);
    call_fed_ex_suitelet_userinterface(order_json, custom_price_items);
}

/** Sends request to get fed ex rates sorted restlet and uses the response to set line items
* @param {object object} order_json has destination address and items and quantities from lines items
* @param {array object} custom_price_items keeps track of lines items with custom pricing
* @return none
*/

function call_fed_ex_suitelet_userinterface(order_json, custom_price_items) {
    var output = {};
    order_json.userinterface = true;
    var request = JSON.stringify(order_json);
    var url =
        'https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274&h=60378349ea77b5405c25';
    var sandbox =
        'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c';
    if (context.environment === 'SANDBOX') {
        url = sandbox;
    }
    jQuery.ajax({
        url: url,
        custom_price_items: custom_price_items,
        dataType: 'json',
        data: {
            payload: request,
            action: 'get_shipping_rates'
        },
        type: 'POST',
        success: function (response) {
            if (response.success) {
                var old_alert = alert;
                alert = function () { }; //prevent alerts from triggering while items are being set
                var out_of_stock_items = response.data.out_of_stock_items;
                var order_items = response.data.sorted_order_json.lines;
                //var ship_methods = response.data.shipping_methods;
                order_items = set_custom_prices(this.custom_price_items, order_items);
                //these 2 functions are in the master sales order entry point library
                set_existing_item_lines(order_items); //changes the current line items with locations and quantities based on response, also removes extra lines
                set_items_with_locations(order_items); //adds new lines if needed to complete the cart
                //set_shipping_cost_based_on_method_userinterface(ship_methods);
                alert = old_alert;
                if (Object.keys(out_of_stock_items).length !== 0) {
                    var out_of_stock_message = create_out_of_stock_message(out_of_stock_items); 
                    alert(out_of_stock_message);
                    nlapiSetFieldValue('custbody_out_of_stock_items', out_of_stock_message); //save out of stock message in a field for user to see
                }
            } else {
                alert(response.status);
            }
            jQuery('.modal').css('display', 'none');
        },
        error: function (response) {
            jQuery('.modal').css('display', 'none');
            output.error = response;
        }
    });
}

/** creates a message with all the out of stock items. 
* @param {array object} out_of_stock_items 
* @returns {string} a string that includes item names and how many are missing inventory needed to complete the order
*/

function create_out_of_stock_message(out_of_stock_items) {
    // nlapiLookupField('item','5841','itemid');//TODO we should convert the internal id of the item to the item name itemid is item name
    var out_of_stock_message = '';
    for (var item in out_of_stock_items) {
        var item_name = nlapiLookupField('item', item, 'itemid');
        var quantity_we_still_need = out_of_stock_items[item];
        out_of_stock_message += item_name + ' missing ' + quantity_we_still_need + '\n';
    }
    return out_of_stock_message;
}

/** sets the shipping cost based on the method selected
 * @param {array object} shipping_methods methods with cost
 * @returns none
 */

function set_shipping_cost_based_on_method_userinterface(shipping_methods) {
    var ship_method_id = nlapiGetFieldValue('shipmethod');
    if (shipping_methods[ship_method_id]) {
        nlapiSetFieldValue('shippingcost', shipping_methods[ship_method_id].cost);
    }
}


