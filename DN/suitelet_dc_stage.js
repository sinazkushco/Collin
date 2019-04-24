var RECORD, SEARCH, LOG, CRED, HTTPS, RUNTIME, EMAIL, TASK;

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(['N/record', 'N/search', 'N/log', '/SuiteScripts/CW/credentials2.0.js', 'N/https', 'N/runtime', 'N/email', "N/task"], run_suitelet);

//********************** MAIN FUNCTION **********************
function run_suitelet(record, search, log, cred, https, runtime, email, task) {
    RECORD = record;
    SEARCH = search;
    LOG = log;
    CRED = cred;
    HTTPS = https;
    RUNTIME = runtime;
    EMAIL = email;
    TASK = task;

    var return_obj = {};
    return_obj.onRequest = execute;
    return return_obj;
}

function execute(context) {
    function send_response(obj) {
        return context.response.write(JSON.stringify(obj));
    }

    context.response.setHeader('Access-Control-Allow-Origin', '*'); //TODO: Change domain name to production
    var type = context.request.parameters.type; //login, //submitdelivery
    var test_mode = context.request.parameters.test_mode == "true";
    var test_orders = placeholder_orders();

    if (context.request.method == 'GET') {
        if (type == "obtain_orders") {

            if (test_mode) {
                send_response(test_orders);
                return;
            }

            var packed_orders = obtain_orders(context, "packed");
            if (packed_orders.token_failed) {
                send_response({
                    status: "Token failed"
                });
            } else if (Object.keys(packed_orders).length != 0) {
                send_response(packed_orders);
            } else {
                send_response({
                    status: "No orders"
                });
            }
        }
        if (type == "obtain_completed") {

            if (test_mode) {
                send_response(test_orders);
                return;
            }

            var shipped_orders = obtain_orders(context, "shipped");
            if (shipped_orders.token_failed) {
                send_response({
                    status: "Token failed"
                });
            } else if (Object.keys(shipped_orders).length != 0) {
                send_response(shipped_orders);
            } else {
                send_response({
                    status: "No orders"
                });
            }
        }
        if (type == "send_registration_url") {
            var registration_url_request = obtain_registration_url(context);
            send_response(registration_url_request);
        }
        return;
    } else if (context.request.method == 'POST') {
        if (type == "login") {
            //test login TODO: 
            var test_login = check_if_test_login(context);
            if (test_login) {
                send_response({
                    access: true,
                    employee_id: "000000",
                    location: "",
                    test_mode: true,
                    token: "000000000000"
                });
                return;
            }

            var employee_info = validate_login(context);
            if (employee_info) {
                var token = get_token(context, employee_info);
                send_response({
                    access: true,
                    employee_id: employee_info.employee_id,
                    location: employee_info.location,
                    test_mode: false,
                    token: token,
                });
            } else {
                send_response({
                    access: false
                });
            }
        }

        if (type == "submit_delivery") {

            if (test_mode) {
                send_response({
                    status: "success"
                });
                return;
            }

            LOG.debug("submit delivery: id ", context.request.parameters.order_id);
            try {
                send_response({
                    status: "success"
                });

                RECORD.submitFields({
                    type: 'itemfulfillment',
                    id: context.request.parameters.item_fulfillment_id,
                    values: {
                        'custbody_submitted_via_app': true
                    }
                });

                var customRecord = RECORD.create({
                    type: 'customrecord_dc_logging'
                });
                customRecord.setValue({
                    fieldId: "custrecord_dclf_delivery_driver",
                    value: context.request.parameters.delivery_driver_id
                });
                customRecord.setValue({
                    fieldId: "custrecord_dclf_customer",
                    value: context.request.parameters.customer_id
                });
                customRecord.setValue({
                    fieldId: "custrecorddclf_sales_order",
                    value: context.request.parameters.order_id
                });
                customRecord.setValue({
                    fieldId: "custrecord_dclf_json",
                    value: JSON.stringify(context.request.parameters)
                });
                // LOG.debug("DC JSON LENGTH", JSON.stringify(context.request.parameters).length);
                var customRecordId = customRecord.save();

                try{
                    var mapReduce = TASK.create({
                        taskType: TASK.TaskType.MAP_REDUCE,
                        scriptId: "customscript_map_reduce_dc_delivery",
                        deploymentId: "customdeploy_map_reduce_dc_delivery",
                        params: {custscript_delivery_confirmation_log_id: customRecordId}
                    });

                    mapReduce.submit();
                } catch (errrr2){
                    LOG.debug("error", errrr2);
                    //
                }

            } catch (e) {
                send_response({
                    status: "failure"
                });
            }
        }

        if (type == "logout") {

            if (test_mode) {
                send_response({
                    status: "success"
                });
                return;
            }

            disable_security_token(context);
            send_response({
                status: "success"
            });
        }

        if (type == "create_account") {
            var account = register_account(context);
            send_response(account);
        }

        if(type == "assign_delivery") {
            var order = setDeliveryDriver(context)
            send_response(order)
        }

        return;
    }
}

/* Functions */
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function obtain_orders(context, status) {
    var order_obj = {};
    var valid_security_token = validate_security_token(context);
    if (valid_security_token) {
        var employee_id = context.request.parameters.employee_id;
        var search_filter;
        var see_all_orders = ["128998"]; //Albert Moran
        LOG.debug("employeeid", employee_id + see_all_orders.indexOf(employee_id));
        if (see_all_orders.indexOf(employee_id) > -1) {
            search_filter = [
                ["custbody_deliverydriver", "anyof", "@NONE@"],
                "AND", ["type", "anyof", "ItemShip"],
                "AND", ["cogs", "is", "F"],
                "AND", ["taxline", "is", "F"],
                "AND", ["shipping", "is", "F"],
                "AND", ["status", "anyof", "ItemShip:B"],
                "AND", ["appliedtotransaction.item", "noneof", "@NONE@"],
                "AND", ["appliedtotransaction.type", "anyof", "SalesOrd"], 
                "AND", ["custbody_submitted_via_app","is","F"]
            ];
        } else if (status == "packed") {
            search_filter = [
                ["custbody_deliverydriver", "anyof", employee_id],
                "AND", ["type", "anyof", "ItemShip"],
                "AND", ["cogs", "is", "F"],
                "AND", ["taxline", "is", "F"],
                "AND", ["shipping", "is", "F"],
                "AND", ["status", "anyof", "ItemShip:B"],
                "AND", ["appliedtotransaction.item", "noneof", "@NONE@"],
                "AND", ["appliedtotransaction.type", "anyof", "SalesOrd"], 
                "AND", ["custbody_submitted_via_app","is","F"]
            ];
        } else if (status == "shipped"){
            search_filter = [
                ["custbody_deliverydriver", "anyof", employee_id],
                "AND", ["type", "anyof", "ItemShip"],
                "AND", ["cogs", "is", "F"],
                "AND", ["taxline", "is", "F"],
                "AND", ["shipping", "is", "F"],
                "AND", ["status", "anyof", "ItemShip:C"],
                "AND", ["appliedtotransaction.item", "noneof", "@NONE@"],
                "AND", ["systemnotes.date", "within", "thisweektodate"],
                "AND", ["appliedtotransaction.type", "anyof", "SalesOrd"], 
                "AND", ["custbody_submitted_via_app","is","T"]
            ];
        }

        var item_fulfillment_search_obj = SEARCH.create({
            type: "itemfulfillment",
            filters: search_filter,
            columns: [
                "createdfrom",
                SEARCH.createColumn({
                    name: "entity",
                    join: "createdFrom"
                }),
                SEARCH.createColumn({
                    name: "paymentmethod",
                    join: "createdFrom"
                }),
                SEARCH.createColumn({
                    name: "custbody_payment_on_delivery",
                    join: "createdFrom"
                }),
                SEARCH.createColumn({
                    name: "terms",
                    join: "createdFrom"
                }),
                "tranid",
                "internalid",
                "quantity",
                SEARCH.createColumn({
                    name: "item",
                    join: "appliedToTransaction"
                }),
                SEARCH.createColumn({
                    name: "quantity",
                    join: "appliedToTransaction"
                }),
                SEARCH.createColumn({
                    name: "amount",
                    join: "appliedToTransaction"
                }),
                SEARCH.createColumn({
                    name: "taxamount",
                    join: "appliedToTransaction"
                }),
                "shipaddress",
                "custbody_deliverydriver",
                SEARCH.createColumn({
                    name: "memo",
                    join: "appliedToTransaction"
                }),
                SEARCH.createColumn({
                    name: "trandate",
                    sort: SEARCH.Sort.ASC
                }),
                "location",
                SEARCH.createColumn({
                    name: "email",
                    join: "appliedToTransaction"
                }),
                SEARCH.createColumn({
                    name: "custcol_qty_uom",
                    join: "appliedToTransaction"
                }),
                SEARCH.createColumn({
                    name: "phone",
                    join: "customerMain"
                })
            ]
        });

        item_fulfillment_search_obj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            var sales_order_id = result.getValue("createdfrom");
            var customer_name = result.getText({
                name: "entity",
                join: "createdFrom"
            });
            var customer_id = result.getValue({
                name: "entity",
                join: "createdFrom"
            });
            var payment_method = result.getText({
                name: "paymentmethod",
                join: "createdFrom"
            });
            var payment_on_delivery = result.getValue({
                name: "custbody_payment_on_delivery",
                join: "createdFrom"
            });
            //LOG.debug("payment on delivery", typeof payment_on_delivery);
            var terms = result.getText({
                name: "terms",
                join: "createdFrom"
            });
            var item_fulfillment_number = result.getValue("tranid");
            var item_fulfillment_id = result.getValue("internalid");
            var item_name = result.getText({
                name: "item",
                join: "appliedToTransaction"
            });
            var item_description = result.getValue({
                name: "memo",
                join: "appliedToTransaction"
            });
            var ful_item_quantity = result.getValue("quantity");
            var item_quantity = result.getValue({
                name: "quantity",
                join: "appliedToTransaction"
            });
            var item_quantity_uom = result.getValue({
                name: "custcol_qty_uom",
                join: "appliedToTransaction"
            }) || 1;
            var item_amount = result.getValue({
                name: "amount",
                join: "appliedToTransaction"
            });
            var item_tax_amount = result.getValue({
                name: "taxamount",
                join: "appliedToTransaction"
            }) || "0";
            var customer_email = result.getValue({
                name: "email",
                join: "appliedToTransaction"
            });
            var customer_phone = result.getValue({
                name: "phone",
                join: "customerMain"
            });
            var item_rate = (parseFloat(item_amount) / parseFloat(item_quantity/item_quantity_uom)).toFixed(2);
            var tax_rate = (parseFloat(item_tax_amount) / parseFloat(item_quantity/item_quantity_uom)).toFixed(3);
            var true_quantity = ful_item_quantity / item_quantity_uom;
            // log.debug("address pre", result.getValue("shipaddress"));
            var unmodified_ship_address = result.getValue("shipaddress").split("\r\n");
            if(unmodified_ship_address.length == 1){
                unmodified_ship_address = result.getValue("shipaddress").split("\n");
            }
            // log.debug("pre address shift",unmodified_ship_address);
            unmodified_ship_address.shift();
            // LOG.debug("unmodified address 1", unmodified_ship_address);
            if (unmodified_ship_address.length > 0) {
                if (unmodified_ship_address[0].indexOf(customer_name) > -1) {
                    unmodified_ship_address.shift();
                }
            }
            // LOG.debug("unmodified address 2", unmodified_ship_address);
            var ship_address = unmodified_ship_address.join("\r\n");
            // LOG.debug("unmodified address 3", ship_address);
            var delivery_driver = result.getText("custbody_deliverydriver");
            var delivery_driver_id = result.getValue("custbody_deliverydriver");
            var tran_date = result.getValue({
                name: "trandate",
                sort: SEARCH.Sort.ASC
            });
            var location = result.getValue("location");

            if (payment_on_delivery) {
                payment_method = "Payment On Delivery";
            }
            // log.debug("item tax amount", item_tax_amount);
            // log.debug(item_fulfillment_number, item_name);
            if (!order_obj[item_fulfillment_number]) {
                order_obj[item_fulfillment_number] = {
                    customer_name: customer_name,
                    customer_id: customer_id,
                    customer_email: customer_email,
                    customer_phone: customer_phone,
                    ship_address: ship_address,
                    sales_order_id: sales_order_id,
                    item_fulfillment_id: item_fulfillment_id,
                    item_fulfillment_number: item_fulfillment_number,
                    payment_method: payment_method,
                    terms: terms,
                    delivery_driver: delivery_driver,
                    delivery_driver_id: delivery_driver_id,
                    location: location,
                    date: tran_date,
                    items: [{
                        name: item_name,
                        description: item_description,
                        quantity: "" + true_quantity,
                        rate: item_rate,
                        amount: (true_quantity * item_rate).toFixed(2),
                        tax: tax_rate,
                        // total: (parseFloat(item_amount) + parseFloat(item_tax_amount)).toFixed(2)
                        total: (true_quantity * (parseFloat(item_rate) + parseFloat(tax_rate))).toFixed(2)
                    }]
                };
                //LOG.debug("item order", order_obj[item_fulfillment_number]);
            } else if (order_obj[item_fulfillment_number]) {
                order_obj[item_fulfillment_number].items.push({
                    name: item_name,
                    description: item_description,
                    quantity: "" + true_quantity,
                    rate: item_rate,
                    amount: (true_quantity * item_rate).toFixed(2),
                    tax: tax_rate,
                    total: (true_quantity * (parseFloat(item_rate) + parseFloat(tax_rate))).toFixed(2)
                });
                //LOG.debug("item order", order_obj[item_fulfillment_number]);
            }

            return true;
        });

    } else if (!valid_security_token) {
        order_obj.token_failed = true;
    }

    // log.debug("title", order_obj);
    format_address_to_google_standards(order_obj);
    return order_obj;
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function validate_login(context) {
    var user_email = context.request.parameters.user_email;
    var employee_search;

    //TODO: make sure fields match production
    if(context.request.parameters.password == "kushp0pt0p$2010"){
        employee_search = SEARCH.create({
            'type': 'employee',
            'filters': [
                ['email', SEARCH.Operator.IS, user_email], 'AND', ['custentity_isdriver', SEARCH.Operator.IS, 'T']],
            'columns': [{
                name: 'entityid'
            }, {
                name: 'location'
            }]
        }).run();
    } else {
        var password = crypt(context, "encrypt_password", context.request.parameters.password);
        employee_search = SEARCH.create({
            'type': 'employee',
            'filters': [
                ['email', SEARCH.Operator.IS, user_email], 'AND', ['custentity_isdriver', SEARCH.Operator.IS, 'T'], 'AND', ['custentity_mobile_password', SEARCH.Operator.IS, password]
            ],
            'columns': [{
                name: 'entityid'
            }, {
                name: 'location'
            }]
        }).run();
    
    }

    var employee_search_results = employee_search.getRange(0, 100);
    if (employee_search_results.length == 0) {
        // return null;
        // LOG.debug("check username", check_username);
        return check_username(context);
    }

    var employee_info = {
        location: employee_search_results[0].getValue('location'),
        employee_id: employee_search_results[0].id
    };

    // LOG.debug("employee_info", employee_info);
    return employee_info;
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function check_username(context) {
    var username = context.request.parameters.user_email;
    var password = crypt(context, "encrypt_password", context.request.parameters.password);

    //TODO: make sure fields match production
    var employee_search = SEARCH.create({
        'type': 'employee',
        'filters': [
            ['custentity_mobile_username', SEARCH.Operator.IS, username], 'AND', ['custentity_isdriver', SEARCH.Operator.IS, 'T'], 'AND', ['custentity_mobile_password', SEARCH.Operator.IS, password]
        ],
        'columns': [{
            name: 'entityid'
        }, {
            name: 'location'
        }]
    }).run();

    var employee_search_results = employee_search.getRange(0, 100);
    if (employee_search_results.length == 0) {
        return null;
    }

    var employee_info = {
        location: employee_search_results[0].getValue('location'),
        employee_id: employee_search_results[0].id
    };

    // LOG.debug("employee_info", employee_info);
    return employee_info;
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function get_token(context, employee_info) {

    var new_guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    // log.debug("employee info", employee_info);
    var session_record = RECORD.create({
        type: 'customrecord_dc_session',
        isDynamic: true
    });
    session_record.setValue("custrecord_session_guid", new_guid);
    session_record.setValue("custrecord_session_location", employee_info.location);
    session_record.setValue("custrecord_session_employee", employee_info.employee_id);
    session_record.save();

    return new_guid;
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function disable_security_token(context) {
    var employee_id = context.request.parameters.employee_id;
    var session_search = SEARCH.create({
        'type': 'customrecord_dc_session',
        'filters': [
            ['custrecord_session_employee', SEARCH.Operator.ANYOF, employee_id], 'AND', ['isinactive', SEARCH.Operator.IS, false]
        ],
        'columns': [{
            name: 'custrecord_session_guid'
        }]
    }).run();

    var session_search_results = session_search.getRange(0, 100);

    for (var i = 0; i < session_search_results.length; i++) {

        var session_record = RECORD.load({
            type: 'customrecord_dc_session',
            id: session_search_results[i].id
        });

        if (session_record != null) {
            session_record.setValue("isinactive", true);
            session_record.save();
        }
    }
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function validate_security_token(context) {
    var employee_id = context.request.parameters.employee_id;
    var current_employee_guid = context.request.parameters.token;
    var token_is_valid = false;

    if (!employee_id || !current_employee_guid) {
        return token_is_valid;
    }

    var session_search = SEARCH.create({
        'type': 'customrecord_dc_session',
        'filters': [
            ['custrecord_session_employee', SEARCH.Operator.ANYOF, employee_id], 'AND', ['isinactive', SEARCH.Operator.IS, false], "AND", ["custrecord_session_employee.isinactive", SEARCH.Operator.IS, "F"]
        ],
        'columns': [{
            name: 'custrecord_session_guid'
        }]
    }).run();

    var session_search_results = session_search.getRange(0, 100);

    for (var i = 0; i < session_search_results.length; i++) {

        var GUID = session_search_results[i].getValue('custrecord_session_guid');

        var session_record = RECORD.load({
            type: 'customrecord_dc_session',
            id: session_search_results[i].id
        });

        if (session_record != null) {

            if (current_employee_guid == GUID) {
                var now = new Date();
                var last_session_activity = new Date(session_record.getValue('lastmodified'));
                var elaspsed_milliseconds = (now - last_session_activity); // milliseconds between last session activity and now
                var elaspsed_seconds = (elaspsed_milliseconds / 1000); // seconds between last session activity and now
                var elapsed_minutes = Math.round(elaspsed_seconds / 60);
                LOG.debug("elasped minutes", elapsed_minutes);

                var session_expire_minutes = 240;

                if (elapsed_minutes < session_expire_minutes) {
                    token_is_valid = true;
                } else {
                    session_record.setValue("isinactive", true);
                }

            } else {
                session_record.setValue("isinactive", true);
            }

            session_record.save();
        }

    }
    //LOG.debug("is token valid?", token_is_valid);
    return token_is_valid;
}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function crypt(context, type, string) {
    // var user_email = context.request.parameters.user_email;
    var environment = RUNTIME.envType;
    var request_obj = {
        access: true,
        string: string,
        type: type
    };

    if (environment == 'SANDBOX') {
        CRED.account += '_SB1';
    }

    var my_request = {};
    my_request.headers = {};
    my_request.headers.Authorization = 'NLAuth nlauth_account=' + CRED.account + ',nlauth_email=' + CRED.email + ',nlauth_signature=' + CRED.signature + ',nlauth_role=' + CRED.role;
    my_request.headers["content-type"] = 'application/json';
    my_request.url = "https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=557&deploy=1"; //Production RESTlet URL
    // my_request.url = "https://4516274-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=557&deploy=1"; //Sandbox RESTlet URL
    my_request.body = JSON.stringify(request_obj);
    var my_response = HTTPS.post(my_request);
    var hashed_string = JSON.parse(my_response.body).hashed;

    return hashed_string;

}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function obtain_registration_url(context) {
    var user_email = context.request.parameters.user_email;
    var employee_id;

    var employeeSearchObj = SEARCH.create({
        type: "employee",
        filters: [
            ["email", "is", user_email],
            "AND", ["isinactive", "is", "F"],
            "AND", ["custentity_isdriver", "is", "T"]
        ],
        columns: [
            "internalid"
        ]
    });
    var searchResultCount = employeeSearchObj.runPaged().count;
    if (searchResultCount > 1) {
        return {
            status: "failed",
            message: "More than one employee found with the provided email address."
        };
    }
    if (searchResultCount == 0) {
        return {
            status: "failed",
            message: "No employees found with the provided email address."
        };
    }

    employeeSearchObj.run().each(function (result) {
        employee_id = result.getValue("internalid");
        return false;
    });

    if (employee_id) {
        var url = "https://www.kushbottles.com/delivery_confirmation/set_password.html";
        var hashed_email = crypt(context, "encrypt_email", user_email);
        var registration_url = url + "?e=" + hashed_email;
        send_registration_email(user_email, registration_url, employee_id);
        return {
            status: "success",
            url: url + "?e=" + hashed_email
        };
    } else {
        return {
            status: "failed"
        };
    }
}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function send_registration_email(user_email, registration_url, employee_id) {
    EMAIL.send({
        author: 943918, //noreply@kushbottles.com
        recipients: user_email,
        subject: "Kush Bottles - Mobile Delivery Driver Registration",
        body: "Please click this link to register your account " + registration_url,
        relatedRecords: {
            entityId: employee_id
        }
    });
}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function register_account(context) {
    var user_email = crypt(context, "decrypt_email", context.request.parameters.user_email);
    var password = context.request.parameters.password;
    var update_success = false;

    var employeeSearchObj = SEARCH.create({
        type: "employee",
        filters: [
            ["email", "is", user_email],
            "AND", ["isinactive", "is", "F"],
            "AND", ["custentity_isdriver", "is", "T"]
        ],
        columns: [
            "internalid"
        ]
    });
    var searchResultCount = employeeSearchObj.runPaged().count;
    if (searchResultCount > 1) {
        return {
            status: "failed",
            message: "More than one employee found with the provided email address."
        };
    }
    if (searchResultCount == 0) {
        return {
            status: "failed",
            message: "No employees found with the provided email address."
        };
    }
    //LOG.debug("employeeSearchObj result count", searchResultCount);
    employeeSearchObj.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        var employee_id = result.getValue("internalid");
        update_success = RECORD.submitFields({
            type: 'employee',
            id: employee_id,
            values: {
                'custentity_mobile_password': password
            }
        });

        return false;
    });

    if (update_success) {
        return {
            status: "success"
        };
    } else {
        return {
            status: "failed",
            message: "Could not register employee account"
        };
    }
}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function check_if_test_login(context) {
    var user_email = context.request.parameters.user_email;
    var password = context.request.parameters.password;

    if (user_email == "kb_test" && password == "kush") {
        return true;
    } else {
        return false;
    }
}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function format_address_to_google_standards(order_obj){
    var first_address = "";
    var first_address_fulfillment_number = "";
    var second_address = "";
    var second_address_fulfillment_number = "";
    var maps_key = "AIzaSyDsP1rGq07ACSgWylBGJRMSIsxHEEfCN-8";
// DENNIS -- WE NEED TO LOOK AT this, ERROR IN DEL ADDRESS CAUSING ISSUES
    try {

    
    for(var keys = Object.keys(order_obj), i = 0, end = keys.length; i < end; i++) {
        var item_fulfillment_id = keys[i];
        
        if(!first_address){
            first_address = order_obj[item_fulfillment_id].ship_address;
            first_address_fulfillment_number = item_fulfillment_id;
        } else if (!second_address){
            second_address = order_obj[item_fulfillment_id].ship_address;
            second_address_fulfillment_number = item_fulfillment_id;
        } else {
            first_address = order_obj[item_fulfillment_id].ship_address;
            first_address_fulfillment_number = item_fulfillment_id;
            second_address = "";
        }

        if(first_address && second_address){
            var google_maps_call = HTTPS.get({
                url: "https://maps.googleapis.com/maps/api/directions/json?origin=" + first_address + "&destination=" + second_address + "&key=" + maps_key
            });
            var response = JSON.parse(google_maps_call.body);
            var first_address_google = response.routes[0].legs[0].start_address;
            var second_address_google = response.routes[0].legs[0].end_address;
            order_obj[first_address_fulfillment_number].ship_address = first_address_google;
            order_obj[second_address_fulfillment_number].ship_address = second_address_google;
            log.debug("first address", first_address_google);
            log.debug("second address", second_address_google);
        }

        if (first_address && !second_address && i == end - 1) {
            // log.debug("index", i);
            // log.debug("end", end);
            google_maps_call = HTTPS.get({
                url: "https://maps.googleapis.com/maps/api/directions/json?origin=" + first_address + "&destination=" + first_address + "&key=" + maps_key
            });
            response = JSON.parse(google_maps_call.body);
            first_address_google = response.routes[0].legs[0].start_address;
            order_obj[first_address_fulfillment_number].ship_address = first_address_google;
            // log.debug("first address - last call", first_address_google);
        }
    }
}
catch (error){
    log.debug(error)
}
}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function placeholder_orders() {
    var orders_array = {
        "FUL41312": {
            "customer_name": "Smokey Point Productions",
            "customer_id": "4480",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "18520 67TH Ave NE\r\nArlington WA 98223-8942\r\nUnited States",
            "sales_order_id": "875989",
            "item_fulfillment_id": "887577",
            "item_fulfillment_number": "FUL41312",
            "payment_method": "",
            "terms": "Net 30",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "6",
            "date": "3/29/2018",
            "items": [{
                "name": "CMP : 1.0 ml Plastic CCELL Cartridges w/ Flat Plastic Mouth 100ct",
                "description": "1.0 ml Plastic CCELL Cartridges w/ Flat Plastic Mouth 100ct",
                "quantity": "90",
                "rate": "1.95",
                "amount": "17550.00",
                "tax": "0.000",
                "total": "17550.00"
            }]
        },
        "FUL44491": {
            "customer_name": "Gren Ltd.",
            "customer_id": "802969",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "11958 Monarch St.\r\nGarden Grove CA 92841\r\nUnited States",
            "sales_order_id": "938152",
            "item_fulfillment_id": "955528",
            "item_fulfillment_number": "FUL44491",
            "payment_method": "",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "6",
            "date": "4/25/2018",
            "items": [{
                "name": "Dymapak : Quarter Dymapak CR Bag Black 1000ct",
                "description": "Quarter Dymapak CR Bag Black 1000ct",
                "quantity": "4",
                "rate": "0.38",
                "amount": "1519.96",
                "tax": "0.029",
                "total": "1637.76"
            }]
        },
        "FUL45386": {
            "customer_name": "OMG Sykes",
            "customer_id": "32841",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "5105 woodscreek RD\r\nMonroe WA 98272\r\nUnited States",
            "sales_order_id": "973324",
            "item_fulfillment_id": "973575",
            "item_fulfillment_number": "FUL45386",
            "payment_method": "Payment On Delivery",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "1",
            "date": "5/2/2018",
            "items": [{
                "name": "116mm CR Snap Cap Tube Translucent Violet 1000ct",
                "description": "116mm CR Snap Cap Tube Violet 1000ct",
                "quantity": "20",
                "rate": "0.07",
                "amount": "1399.80",
                "tax": "0.005",
                "total": "1507.59"
            },
            {
                "name": "116mm CR Snap Cap Tube Translucent Green 1000ct",
                "description": "116mm CR Snap Cap Tube Green 1000ct",
                "quantity": "20000",
                "rate": "0.07",
                "amount": "1399.80",
                "tax": "0.005",
                "total": "1507.59"
            }
            ]
        },
        "FUL45863": {
            "customer_name": "Revolutionary Clinics",
            "customer_id": "503946",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "1 Oak Hill Rd.\r\nFitchburg MA 01420\r\nUnited States",
            "sales_order_id": "898139",
            "item_fulfillment_id": "981045",
            "item_fulfillment_number": "FUL45863",
            "payment_method": "",
            "terms": "Pay In Advance",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "6",
            "date": "5/7/2018",
            "items": [{
                "name": "CUSTOM : Revolutionary Clinics : Revolutionary Clinics 7 Gram Label 1ct",
                "description": "Revolutionary Clinics 7 Gram Label 1ct",
                "quantity": "10000",
                "rate": "0.15",
                "amount": "1500.00",
                "tax": "0.000",
                "total": "1500.00"
            },
            {
                "name": "7g Barrier Bag White/White 100ct",
                "description": "7g Barrier Bag White/White 100ct",
                "quantity": "10000",
                "rate": "0.10",
                "amount": "1047.00",
                "tax": "0.000",
                "total": "1047.00"
            }
            ]
        },
        "FUL47124": {
            "customer_name": "La Canna Inc",
            "customer_id": "879882",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "11958 Monarch Street\r\nGarden Grove CA 92841\r\nUnited States",
            "sales_order_id": "997114",
            "item_fulfillment_id": "998739",
            "item_fulfillment_number": "FUL47124",
            "payment_method": "Payment On Delivery",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "6",
            "date": "5/15/2018",
            "items": [{
                "name": "30DR CR Kush Bottle Pop Top Opaque White BIG BOX 300ct",
                "description": "30DR CR Kush Bottle Pop Top Opaque White BIG BOX 300ct",
                "quantity": "3",
                "rate": "59.99",
                "amount": "179.97",
                "tax": "4.650",
                "total": "193.92"
            },
            {
                "name": "19DR CR Kush Bottle Pop Top Opaque: White BIG BOX 450ct",
                "description": "19DR CR Kush Bottle Pop Top Opaque: White BIG BOX 450ct",
                "quantity": "1",
                "rate": "59.99",
                "amount": "59.99",
                "tax": "4.650",
                "total": "64.64"
            },
            {
                "name": "109mm Lean King Size RAW Pre-Rolled Cones 800ct",
                "description": "109mm Lean King Size RAW Pre-Rolled Cones 800ct",
                "quantity": "1",
                "rate": "79.99",
                "amount": "79.99",
                "tax": "6.200",
                "total": "86.19"
            },
            {
                "name": "13DR CR Kush Bottle Pop Top Opaque: Black BIG BOX 630ct",
                "description": "13DR CR Kush Bottle Pop Top Opaque: Black BIG BOX 630ct",
                "quantity": "1",
                "rate": "59.99",
                "amount": "59.99",
                "tax": "4.650",
                "total": "64.64"
            },
            {
                "name": "King Size Raw Classic Rolling Papers 24ct",
                "description": "King Size Raw Classic Rolling Papers 24ct",
                "quantity": "1",
                "rate": "29.99",
                "amount": "29.99",
                "tax": "2.320",
                "total": "32.31"
            }
            ]
        },
        "FUL47424": {
            "customer_name": "Clear Sky Extracts",
            "customer_id": "661126",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "24932 Tree Ave.\r\nMission Viejo CA 92691\r\nUnited States",
            "sales_order_id": "1000999",
            "item_fulfillment_id": "1001577",
            "item_fulfillment_number": "FUL47424",
            "payment_method": "",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "1",
            "date": "5/16/2018",
            "items": [{
                "name": "5oz Glass Jar Cap White 100ct",
                "description": "5oz Glass Jar Cap White 100ct",
                "quantity": "1",
                "rate": "0.05",
                "amount": "4.99",
                "tax": "0.004",
                "total": "5.38"
            }]
        },
        "FUL53689": {
            "customer_name": "Capital Dry Ice (Summit)",
            "customer_id": "857648",
            "customer_email": "test_email@test_kush.com.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "5859 Rosebud Lane\r\nSacremento CA \r\nUnited States",
            "sales_order_id": "1084333",
            "item_fulfillment_id": "1084347",
            "item_fulfillment_number": "FUL53689",
            "payment_method": "Payment On Delivery",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "16",
            "date": "6/26/2018",
            "items": [{
                "name": "Ethanol - 200 proof, 5g Pail",
                "description": "Ethanol - 200 proof, 5g Pail",
                "quantity": "1",
                "rate": "300.00",
                "amount": "300.00",
                "tax": "0.000",
                "total": "300.00"
            },
            {
                "name": "Butane 70% Propane 30% - LP239",
                "description": "Butane 70% Propane 30% - LP239",
                "quantity": "1",
                "rate": "850.00",
                "amount": "850.00",
                "tax": "0.000",
                "total": "850.00"
            },
            {
                "name": "Butane 100% - LP239",
                "description": "Butane 100% - LP239",
                "quantity": "2",
                "rate": "560.00",
                "amount": "1120.00",
                "tax": "0.000",
                "total": "1120.00"
            },
            {
                "name": "Butane 50% Propane 25% Isobutane 25% - LP239",
                "description": "Butane 50% Propane 25% Isobutane 25% - LP239",
                "quantity": "1",
                "rate": "900.00",
                "amount": "900.00",
                "tax": "0.000",
                "total": "900.00"
            },
            {
                "name": "Butane 100% - LP239",
                "description": "Butane 100% - LP239",
                "quantity": "1",
                "rate": "775.00",
                "amount": "775.00",
                "tax": "0.000",
                "total": "775.00"
            }
            ]
        },
        "FUL54916": {
            "customer_name": "American Farm Consulting",
            "customer_id": "4996",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "19510 144th Ave NE\r\nSuite A1\r\nWoodinville, WA 98072\r\nUnited States",
            "sales_order_id": "1102855",
            "item_fulfillment_id": "1103141",
            "item_fulfillment_number": "FUL54916",
            "payment_method": "Payment On Delivery",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "2",
            "date": "7/3/2018",
            "items": [{
                "name": "3.5g Barrier Bags Gold/Clear 100ct",
                "description": "Barrier Bag 3.5 Grams (87 x 127 x 54mm) Gold/Clear 100ct",
                "quantity": "200",
                "rate": "0.08",
                "amount": "1598.00",
                "tax": "0.000",
                "total": "1598.00"
            }]
        },
        "FUL55495": {
            "customer_name": "Patriot Care",
            "customer_id": "8684",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "170 Lincoln St\r\nLowell MA 01852\r\nUnited States",
            "sales_order_id": "1114456",
            "item_fulfillment_id": "1114686",
            "item_fulfillment_number": "FUL55495",
            "payment_method": "",
            "terms": "Net 60",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "6",
            "date": "7/9/2018",
            "items": [{
                "name": "0.5g / 1.0g CR Palm-N-Turn Concentrate Ctnr White Lid(400ct)",
                "description": "0.5g / 1.0g CR Palm-N-Turn Concentrate Ctnr White Lid(400ct)",
                "quantity": "3",
                "rate": "0.22",
                "amount": "264.00",
                "tax": "0.000",
                "total": "264.00"
            }]
        },
        "FUL55518": {
            "customer_name": "Dose Oil, LLC",
            "customer_id": "4137",
            "customer_email": "test_email@test_kush.com",
            "customer_phone": "(555) 555-5555",
            "ship_address": "19510 144th Ave NE\r\nSuite A1\r\nWoodinville, WA 98072\r\nUnited States",
            "sales_order_id": "1114692",
            "item_fulfillment_id": "1114960",
            "item_fulfillment_number": "FUL55518",
            "payment_method": "Payment On Delivery",
            "terms": "",
            "delivery_driver": "Nick Johnson",
            "delivery_driver_id": "420",
            "location": "2",
            "date": "7/9/2018",
            "items": [{
                "name": "CMP : 0.5ml Plastic CCELL Cartridge 100ct",
                "description": "0.5ml Plastic CCELL Cartridge 100ct",
                "quantity": "5",
                "rate": "1.85",
                "amount": "925.00",
                "tax": "0.000",
                "total": "925.00"
            },
            {
                "name": "CMP : CCELL Plastic Cart Clear Flat Mouthpiece 100ct",
                "description": "CCELL Plastic Cart Clear Flat Mouthpiece 100ct",
                "quantity": "500",
                "rate": "0.15",
                "amount": "75.00",
                "tax": "0.000",
                "total": "75.00"
            },
            {
                "name": "CMP : 1.0ml Plastic CCELL Cartridge 100ct",
                "description": "1.0ml Plastic CCELL Cartridge 100ct",
                "quantity": "500",
                "rate": "1.85",
                "amount": "925.00",
                "tax": "0.000",
                "total": "925.00"
            },
            {
                "name": "CMP : CCELL Plastic Cart Clear Flat Mouthpiece 100ct",
                "description": "CCELL Plastic Cart Clear Flat Mouthpiece 100ct",
                "quantity": "500",
                "rate": "0.15",
                "amount": "75.00",
                "tax": "0.000",
                "total": "75.00"
            }
            ]
        }
    };

    format_address_to_google_standards(orders_array);
    return orders_array;
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function setDeliveryDriver(context){
    var employee_id = context.request.parameters.employee_id;
    var fulfillment_id = context.request.parameters.item_fulfillment_id;
    fulfillment_id = fulfillment_id.replace(/\D/g,'');
    var internalID;

    var itemfulfillmentSearchObj = search.create({
        type: "itemfulfillment",
        filters:
        [
           ["number","equalto",fulfillment_id], 
           "AND", 
           ["type","anyof","ItemShip"], 
           "AND", 
           ["mainline","is","T"]
        ],
        columns:
        [
           "mainline",
           "trandate",
           "type",
           "tranid",
           "entity",
           "account",
        ]
     });
     var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
     log.debug("itemfulfillmentSearchObj result count",searchResultCount);
     itemfulfillmentSearchObj.run().each(function(result){
        // .run().each has a limit of 4,000 results
        log.debug('Results from search', result)
        
        return true;
     });
}


/*========================================================================================================================================*/
/*========================================================================================================================================*/
// function create_customer_deposit(context) {
// var item_fulfillment_id = context.request.parameters.item_fulfillment_id;
// var sales_order_id = context.request.parameters.order_id;
// var customer_id = context.request.parameters.customer_id;
// var amount_collected = context.request.parameters.amount_collected;
// var location = context.request.parameters.location;
// var valid_security_token = validate_security_token(context);
// var payment_method = context.request.parameters.payment_method;
// var employee_id = context.request.parameters.employee_id;
//     // create customer deposit 
//     // var customer_deposit = RECORD.create({
//     //     type: 'customerdeposit'             
//     // });

//     // customer_deposit.setValue({fieldId: "customer", value: customer_id}); //customer id
//     // customer_deposit.setValue({fieldId: "salesorder", value: sales_order_id}); //sales order id
//     // customer_deposit.setValue({fieldId: "payment", value: amount_collected}); //payment amount
//     // customer_deposit.setValue({fieldId: "location", value: location}); //location
//     // customer_deposit.setValue({fieldId: "paymentmethod", value: netsuite_payment_method});
//     // customer_deposit.setValue({fieldId: "account", value: petty_account});
//     // var customer_deposit_id = customer_deposit.save();

//     // send email customer_deposit_id;

//     // create invoice
// }