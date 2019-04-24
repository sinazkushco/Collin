/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/error',
    'N/record',
    'N/runtime',
    'N/search',
    'N/https'],
    /**
     * @param {email} email
     * @param {error} error
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     * @param {https} https
     */
    function (error, record, runtime, search, https) {

        /**
         * Map/Reduce Script:
         * Sample Map/Reduce script for blog post.  
         */

        function getInputData() {
            //Dynamically create Saved Search to grab all eligible Sales orders to invoice
            //In this example, we are grabbing all main level data where sales order status are 
            //any of Pending Billing or Pending Billing/Partially Fulfilled
            return search.create({
                type: "salesorder",
                filters:
                    [
                        ["shipmethod", "anyof", "37"],
                        "AND",
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["status", "anyof", "SalesOrd:A"],
                        "AND",
                        ["memorized", "is", "F"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND", 
                        ["amount","greaterthan","0.00"], 
                        "AND", 
                        ["custbody1","anyof","4926"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "tranid", label: "Document Number" })
                    ]
            });
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            try{
                log.debug('context', context.value);
                var sales_order_id = JSON.parse(context.value).id;
                var sales_order_record = record.load({
                    type: record.Type.SALES_ORDER,
                    id: sales_order_id,
                    isDynamic: true
                });
                var order_json = create_order_json(sales_order_record);
                order_json.do_not_sort = true;
                //get order json
                var request = JSON.stringify(order_json);
                var suitelet_url =
                    'https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274&h=60378349ea77b5405c25';
                var sandbox =
                    'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c';
                if (runtime.envType === runtime.EnvType.SANDBOX) {
                    suitelet_url = sandbox;
                }
                var data = {
                    payload: request,
                    action: 'get_shipping_rates'
                };
                var response = https.post({
                    url: suitelet_url,
                    body: data
                });
                //log.debug('response.body', response.body);
                var response_body = JSON.parse(response.body);
                var shipping_methods = response_body.data.shipping_methods;
                var ground_shipping_method = shipping_methods['40'] || '';
                var home_ship_method = shipping_methods['41'] || '';
                log.debug('ground_shipping_method',ground_shipping_method);
                var ground_ship_cost = null;
                var ship_id;
                if(ground_shipping_method){
                     ground_ship_cost = ground_shipping_method.cost;
                     ship_id = 40;
                }else if(home_ship_method){
                    ground_ship_cost = home_ship_method.cost;
                    ship_id = 41;
                }
                log.debug('ground_ship_cost',ground_ship_cost);
                if(ground_ship_cost){
                    try{
                        sales_order_record.setValue({
                            fieldId : 'shipmethod',
                            value : ship_id
                        });
                        sales_order_record.setValue({
                            fieldId : 'shippingcost',
                            value : ground_ship_cost
                        });
                        add_subtotal_line(sales_order_record);
                        add_free_shipping_discount(sales_order_record, ground_ship_cost);
                       
                        var record_saved = sales_order_record.save();
                        log.audit('record_saved',record_saved);
                    }catch(e){
                        log.error('ADD DISCOUNT LINES FAILED', e);
                    }
                }else{
                    log.debug('COULD NOT GET SHIPPING COST', 'NO SHIP COST');
                }
            }catch(e){
                log.error('ERROR AT FREE SHIPPING MAP', e);
            }
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            log.debug('Summary Time', 'Total Seconds: ' + summary.seconds);
            log.debug('Summary Usage', 'Total Usage: ' + summary.usage);
            log.debug('Summary Yields', 'Total Yields: ' + summary.yields);

            log.debug('Input Summary: ', JSON.stringify(summary.inputSummary));
            log.debug('Map Summary: ', JSON.stringify(summary.mapSummary));
            log.debug('Reduce Summary: ', JSON.stringify(summary.reduceSummary));

            //Grab Map errors
            summary.mapSummary.errors.iterator().each(function (key, value) {
                log.error(key, 'ERROR String: ' + value);
                return true;
            });

        }

        function add_free_shipping_discount(sales_order_record, shipping_cost) {
            sales_order_record.selectNewLine('item');
            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                value: 43
            });
            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: 5282
            });
            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                value: '-1'
            });
            //log.debug('DEBUG', 'shipping_cost before adjust', shipping_cost);
            shipping_cost = -adjust_shipping_discount(sales_order_record, shipping_cost);
            //log.debug('DEBUG', 'shipping_cost after adjust', shipping_cost);
            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: shipping_cost
            });
            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'description',
                value: 'Free Shipping'
            });
            sales_order_record.commitLine({
                sublistId: 'item'
            });
        }

        function add_subtotal_line(sales_order_record) {
            //Set line tax code
            var subtotal = sales_order_record.getValue('subtotal');
            sales_order_record.selectNewLine('item');
            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                value: 43
            });

            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: -2
            });

            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price',
                value: '-1'
            });

            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                value: subtotal
            });

            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'description',
                value: 'Sales Order Total'
            });

            sales_order_record.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemtype',
                value: 'Subtotal'
            });
            sales_order_record.commitLine({
                sublistId: 'item'
            });
        }

        function adjust_shipping_discount(sales_order_record, shipping_cost) {
            var discount_rate = sales_order_record.getValue('discountrate');
            log.debug('discountrate ' + typeof discount_rate, discount_rate);
            discount_rate = discount_rate.toString();
            log.debug('discountrate ' + typeof discount_rate, discount_rate);
            if(discount_rate){
                if (discount_rate.indexOf('%') != -1) {
                    //covert rate to decimal
                    discount_rate = Number(discount_rate.substr(0, discount_rate.length - 1)) / 100;
                    var counter_rate = discount_rate * (discount_rate - 1) + 1;
                    var counter_item = Math.ceil(shipping_cost * counter_rate * 100) / 100;
                    shipping_cost = counter_item;
                }
            }
            return shipping_cost;
        }

        function create_order_json(sales_order_record, item_count) {
            var acceptable_item_types = ['inventoryitem', 'assemblyitem', 'InvtPart', 'Assembly'];
            item_count = item_count || sales_order_record.getLineCount('item');
            var order_json = {};
            order_json.shipattention = sales_order_record.getValue('shipattention') || '';
            order_json.shipphone = sales_order_record.getValue('custbody_shipphone') || '';
            order_json.shipaddr1 = sales_order_record.getValue('shipaddr1') || '';
            order_json.shipaddr2 = sales_order_record.getValue('shipaddr2') || '';
            order_json.shipcity = sales_order_record.getValue('shipcity') || '';
            order_json.shipstate = sales_order_record.getValue('shipstate') || '';
            order_json.shipzip = sales_order_record.getValue('shipzip') || '';
            order_json.shipcountry = sales_order_record.getValue('shipcountry') || '';
            order_json.shipisresidential = (sales_order_record.getValue('shipisresidential') == 'T') ? '1' : '0';
            order_json.shipmethod = sales_order_record.getValue('shipmethod');
            order_json.lines = [];
            for (var i = 0; i < item_count; i++) {
                var item_obj = {};
                sales_order_record.selectLine({
                    sublistId: 'item',
                    line: i
                });

                var item_type = sales_order_record.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemtype'
                });
                if (acceptable_item_types.indexOf(item_type) !== -1) {
                    item_obj.item = sales_order_record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    item_obj.quantity = sales_order_record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });

                    item_obj.price_level = sales_order_record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price_display'
                    });

                    item_obj.location = sales_order_record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location'
                    });

                    item_obj.price_id = sales_order_record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'price'
                    }); //OMG

                    item_obj.rate = sales_order_record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate'
                    });
                    order_json.lines.push(item_obj);
                }
            }
            return order_json;
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });




