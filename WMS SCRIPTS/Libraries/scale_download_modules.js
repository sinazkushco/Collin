/* eslint-disable indent */
/* Version    Date            Author           Remarks
* 2.00       2018-02-13      Collin          Created Script
*
*/
/**
* @NApiVersion 2.x
* @NModuleScope SameAccount
*/
define(['N/email', 'N/search', 'N/record', './xml_module.js', './scale_constants.js', './scale_utils.js', 'N/log', 'N/url'], function (email, search, record, xml_module, scale_constants, scale_utils, log, url) {
    /**
   * gets json from a queue record search by type and creates a fileobj from that json, 
   * batch id is optional and will reduce search to 1 queue record if used
   * @param {string} XML_TYPE file name
   * @param {batch_id} batch_id xml from file
   * @returns {object} file object
   */

    function getInputData_ByQueueRecord(XML_TYPE, batch_id) {
        var configInformation = scale_utils.getWMSConfig(XML_TYPE);
        var search_id = configInformation.custrecord_queue_record_search[0].value;
        var srchObj = search.load({
            id: search_id
        });
        if (batch_id) {
            var filters = srchObj.filters;
            filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: batch_id //internalidvalue
            }));
            srchObj.filters = filters;
        }

        var results = scale_utils.getAllResults(srchObj);
        return results.map(function (res) {
            var plural_name = scale_constants.WMS_Configs[XML_TYPE.toUpperCase()].plural_name;
            var xml_obj = JSON.parse(res.getValue({ name: 'custrecord_wms_json' }));
            var xml_string = xml_module.json_2_xml(xml_obj).replace(/&(?!amp;)/g, '&amp;').replace('<' + plural_name + '>', '<' + plural_name + ' xmlns="http://www.manh.com/ILSNET/Interface">');
            xml_string = '<?xml version="1.0" encoding="utf-8"?>' + xml_string;
            return {
                name: generateFileName(res.id, res.getValue({ name: 'custrecord_wms_record_type' })),
                text: xml_string,
                batch_id: res.id,
                json: xml_obj
            };
        });
    }

    /**
   * gets json from a queue record search by type and creates a fileobj from that json, 
   * batch id is optional and will reduce search to 1 queue record if used
   * @param {string} XML_TYPE file name
   * @param {batch_id} batch_id xml from file
   * @returns {object} file object
   */
    var createJSONXMLObject = {
        SHIPMENT: function (res, company_map) {
            var orderDate = res.getValue({ name: 'trandate' });
            var scheduledShipDate = res.getValue({ name: 'shipdate' });
            var recordType;
            recordType = (res.getValue({ name: 'customform' }) == 169) ? 'Sample Order' : scale_utils.truncateResult(res.getText({ name: 'type' }), 25);
            if (recordType == 'Transfer Order' && res.getValue({ name: 'custbody_consignment_order' })) {
                recordType = 'Consignment Order';
            }

            var shipmethod_id = res.getValue({ name: 'shipmethod' });
            var tranid = scale_utils.truncateResult(res.getValue({ name: 'tranid' }), 25);
            var subject = '';
            var body = '';
            var scale_ship_reference = scale_utils.get_ship_reference(shipmethod_id);
            if (!scale_ship_reference) {
                log.debug('shipmethod_id', shipmethod_id);
                subject = 'Missing Ship Via Cross Reference';
                body = 'Tran id: ' + tranid + '\n Ship Method Id: ' + shipmethod_id + '\n Please update the Scale Ship Via Cross Reference';
                scale_utils.send_error_email(subject, body);
                scale_ship_reference = scale_utils.get_ship_reference(37);
            }

            var company = scale_utils.truncateResult(company_map[res.getValue({ name: 'subsidiarynohierarchy' })], 25, true) || '';

            // if(!company){
            //     subject = 'Missing Company Reference';
            //     body = 'Tran id: '+ tranid + '\n Company Id: '+ res.getValue({ name: 'subsidiarynohierarchy' }) + '\n Please update the Scale Company Cross Reference';
            //     scale_utils.send_error_email(subject, body)     
            // }

            return {
                Action: 'SAVE',
                UserDef1: tranid,
                UserDef3: scale_utils.truncateResult(res.getText({ name: 'custbody_wms_signature_type' }), 25),
                UserDef5: 'Ful Value',
                UserDef6: scale_utils.truncateResult(res.getText({ name: 'custentity_customer_type', join: 'customerMain' }), 25),
                UserDef7: 1,
                AllocateComplete: 'Y',
                AlternateEmailAddress: scale_utils.truncateResult(res.getValue({ name: 'email' }), 50, true),
                Carrier: {
                    Action: 'NEW',
                    Carrier: scale_utils.truncateResult(scale_ship_reference.getValue({ name: 'custrecord_scale_ship_carrier' }), 25),
                    Service: scale_utils.truncateResult(scale_ship_reference.getValue({ name: 'custrecord_scale_ship_service_level' }), 25)
                },
                Comments: {
                    Comment: {
                        Action: 'SAVE',
                        CommentType: scale_utils.truncateResult('Memo', 25),//25
                        Text: scale_utils.truncateResult(res.getValue({ name: 'memomain' }), 2000)
                    }
                },
                Customer: {
                    Company: company,
                    CustomerAddress: createAddressObject(res, 'bill'),//50
                    Customer: scale_utils.truncateResult(res.getText({ name: 'entity' }), 25),//50
                    CustomerCategories: {
                        Category1: scale_utils.truncateResult(res.getText({ name: 'custbody1' }), 50),
                        Category2: scale_utils.truncateResult(res.getText({ name: 'salesrep' }), 50)
                    },
                    ShipTo: scale_utils.truncateResult(res.getValue({ name: 'shipaddressee' }), 25),
                    ShipToAddress: createAddressObject(res, 'ship'),
                },
                CustomerPO: scale_utils.truncateResult(res.getValue({ name: 'otherrefnum' }), 25),
                ErpOrder: scale_utils.truncateResult(res.id, 25),//25
                OrderDate: orderDate ? scale_utils.format_date(orderDate) : '',
                OrderType: recordType,//25
                ScheduledShipDate: scheduledShipDate ? scale_utils.format_date(scheduledShipDate) : '',
                ShipmentId: 'FUL DOC NUM',
                ShipperCode: scale_ship_reference.getValue({ name: 'custrecord_scale_shipper_code' }),
                UserDef13: scale_utils.truncateResult(res.getValue({ name: 'custbody_expedited_order' }) ? 'Expedited' : '', 25),//25
                Warehouse: scale_utils.truncateResult(res.getValue({ name: 'custrecord_wms_location_reference', join: 'location' }), 25, true),
                ShipmentDetail: {
                    Action: 'SAVE',
                    Comments: {
                        Comment: [
                            {
                                Action: 'SAVE',
                                CommentType: scale_utils.truncateResult('Client SKU', 25),//25
                                Text: scale_utils.truncateResult(res.getValue({
                                    name: 'custcol_client_sku'
                                }), 2000),//2000
                            },
                            {
                                Action: 'SAVE',
                                CommentType: scale_utils.truncateResult('Memo', 25),//25
                                Text: scale_utils.truncateResult(res.getText({
                                    name: 'custitem_vape_filling_instructions',
                                    join: 'item'
                                }), 2000),//2000
                            },
                        ]
                    },
                    ErpOrderLineNum: res.getValue({ name: 'lineuniquekey' }), //{ name: 'linesequencenumber' }),
                    SKU: {
                        Item: scale_utils.truncateResult(res.getValue({ name: 'custitem_sku', join: 'item' }), 25),
                        Quantity: 'quantity'
                    }
                }
            };
        },
        RECEIPT: function (res, company_map) {
            var company = scale_utils.truncateResult(company_map[res.getValue({ name: 'subsidiarynohierarchy' })], 25, true);
            //var closedDate = res.getValue({ name: 'closedate' });
            var receiptDate = res.recordType === search.Type.TRANSFER_ORDER ? res.getValue({ name: 'shipdate' }) : res.getValue({ name: 'duedate' });
            var warehouse = res.recordType === search.Type.TRANSFER_ORDER ? res.getValue({
                name: 'custrecord_wms_location_reference',
                join: 'toLocation'
            }) : res.getValue({ name: 'custrecord_wms_location_reference', join: 'location' });
            var type = scale_utils.truncateResult(res.getText({ name: 'type' }), 25);
            var record_type = '';
            var memo = scale_utils.truncateResult(res.getValue({ name: 'memomain' }), 50);
            var UserDef7 = '';
            var revert_base_unit = res.getValue({ name: 'custitem_base_unit_inverted', join: 'item' });
            var quantity = (Math.abs(res.getValue({ name: 'quantity' })) || 0) - (res.getValue({ name: 'quantityshiprecv' }) || 0);
            // var stock_unit_numeral = {
            //     name: "custitem_stock_unit_numeral",
            //     join: "item"
            // }
            // var purchase_unit_numeral = {
            //     name: "custitem_purchase_unit_numberal",
            //     join: "item"
            // }
            // var sale_unit_numeral = {
            //     name: "custitem_uom_numeral",
            //     join: "item"
            // }
            if (revert_base_unit) {
                var sales_unit = Number(res.getText({ name: 'saleunit', join: 'item' }).match(/\d+/)[0]) || 1;
                quantity = Math.ceil(quantity * sales_unit);
            } else {
                quantity = scale_utils.round(Number(quantity), 5);
            }
            if (type == 'Purchase Order') {
                record_type = 'PO';
            } else if (type == 'Transfer Order') {
                if (res.getValue({ name: 'custbody_consignment_order' })) {
                    record_type = 'Consignment Order';
                } else {
                    record_type = 'TO';
                }
                UserDef7 = 1;
            } else if (type == 'Return Authorization') {
                record_type = 'RMA';
            }
            return {
                Action: 'SAVE',
                UserDef1: memo.substring(0, 25),
                UserDef2: memo.substring(25, 51),
                UserDef7: UserDef7,
                Company: company,
                ErpOrderNum: scale_utils.truncateResult(res.id, 25),
                ReceiptDate: scale_utils.format_date(receiptDate),
                ReceiptId: scale_utils.truncateResult(res.getValue({ name: 'tranid' }), 25),
                ReceiptIdType: record_type,
                Vendor: {
                    Action: 'SAVE',
                    Source: scale_utils.truncateResult(res.getText({ name: 'mainname' }), 25),
                    SourceAddress: {
                        Action: 'SAVE',
                        Name: scale_utils.truncateResult(res.getText({ name: 'mainname' }), 50),
                    }
                },
                Warehouse: scale_utils.truncateResult(warehouse, 25, true),
                ReceiptDetail: {
                    Action: 'SAVE',
                    ErpOrderLineNum: scale_utils.truncateResult(res.getValue({ name: 'line' }), 19),
                    SKU: {
                        Action: 'SAVE',
                        Company: company,
                        Item: scale_utils.truncateResult(res.getValue({ name: 'custitem_sku', join: 'item' }), 25),
                        Quantity: quantity
                    }
                }
            };
        },

        WORKORDER: function (res, company_map) {
            var company = scale_utils.truncateResult(company_map[res.getValue({ name: 'subsidiarynohierarchy' })], 25, true);
            return {
                BuildInstructions: scale_utils.truncateResult(res.getValue({ name: 'custbody_build_instructions' }), 2000),
                Company: company,
                DueDate: scale_utils.format_date(res.getValue({ name: 'enddate' })),
                FinishedItem: scale_utils.truncateResult(res.getValue({ name: 'custbody_assembly_sku' }), 25),
                InterfaceEntity: {
                    Action: 'Save'
                },
                QtyToBeBuilt: scale_utils.round(res.getValue({ name: 'quantity' }), 5),
                QtyUm: 'Eaches',
                Warehouse: scale_utils.truncateResult(res.getValue({
                    name: 'custrecord_wms_location_reference',
                    join: 'location'
                }), 25, true),
                WorkOrderId: scale_utils.truncateResult(res.getValue({ name: 'tranid' }), 25)
            };
        },

        BILLOFMATERIAL: function (res, company_map) {
            var company = scale_utils.truncateResult(company_map[res.getValue({ name: 'subsidiarynohierarchy' })], 25, true);
            return {
                Company: company,
                InterfaceEntity: {
                    Action: 'Save'
                },
                Item: scale_utils.truncateResult(res.getValue({ name: 'custitem_sku' }), 25),
                BillOfMaterialDetail: {
                    Company: company,
                    Item: scale_utils.truncateResult(res.getValue({ name: 'custitem_sku', join: 'memberItem' }) || res.getValue({ name: 'memberitem' }), 25),
                    QtyNeededPerItem: scale_utils.round(res.getValue({ name: 'memberquantity' }), 5),
                    QtyUm: scale_utils.truncateResult('Eaches', 25) //scale_utils.truncateResult(res.getValue({ name: 'purchaseunit', join: 'memberItem' }), 25)
                }
            };
        },

        ITEM: function (res, company_map) {
            var UOMS = {
                UOM: []
            };
            // Hazmat Proper Shipping Name (free form text, can be anything) hazmatshippingname
            // Hazmat ID Number (free form text, always starts with UN/NA, then 4 digits) hazmatid
            // Hazmat Hazard Class (decimal value) hazmathazardclass 
            // Hazmat Packing Group (free form text, a roman numeral) hazmatpackinggroup
            //If Sale UOM == 1, we need accurate EA dims (not weight) so we interface blanks over to SCALE
            //else if EA Treat As Loose == false, we need accurate EA dims (not weight) so we interface blanks over to SCALE
            //else NS interfaces dims (not weight) as 1.00000
            var date_last_pulled_exist = res.getValue({ name: 'custitem_date_last_sent_to_scale' });
            var null_or_blank = date_last_pulled_exist ? 'null' : '';
            var hazmat_values = null_or_blank;
            if (res.getValue({ name: 'custitem_hazmat_proper_shipping_name' }) && res.getValue({ name: 'custitem_hazmat_id_num' }) && res.getValue({ name: 'custitem_hazmat_hazard_class' })) {
                hazmat_values = res.getValue({ name: 'custitem_hazmat_proper_shipping_name' }) + ' / ' + res.getValue({ name: 'custitem_hazmat_id_num' }) + ' / ' + res.getValue({ name: 'custitem_hazmat_hazard_class' });
            }
            var hazmat_packing_group = res.getValue({ name: 'custitem_hazmat_packing_group' }) ? ' / ' + res.getValue({ name: 'custitem_hazmat_packing_group' }) : '';
            var hazmat_combined_values = hazmat_values + hazmat_packing_group;
            var if_sale_unit_is_1 = res.getValue({ name: 'custitem_uom_numeral' }) == 1;
            var treat_as_loose_is_true = res.getValue({ name: 'custitem_ea_treat_as_loose' });
            var zero_or_blank = date_last_pulled_exist ? 0 : '';
            var default_eaches = (!if_sale_unit_is_1 && treat_as_loose_is_true) ? '1.00000' : zero_or_blank;
            var velocity = res.getText({ name: 'custitem_classification' }) || 'A';
            if (res.getValue({ name: 'custitem_ea_qty' })) {
                UOMS.UOM.push({
                    Action: 'SAVE',
                    ConvQty: res.getValue({ name: 'custitem_ea_qty' }) || 1,
                    Height: res.getValue({ name: 'custitem_ea_height' }) || default_eaches,
                    Length: res.getValue({ name: 'custitem_ea_length' }) || default_eaches,
                    MovementClass: velocity,
                    QtyUm: 'Eaches',
                    TreatAsLoose: treat_as_loose(res.getValue({ name: 'custitem_ea_treat_as_loose' })),
                    Weight: scale_utils.round(res.getValue({ name: 'custitem_ea_weight' }), 5) || zero_or_blank,
                    Width: res.getValue({ name: 'custitem_ea_width' }) || default_eaches
                });
            } else {
                UOMS.UOM.push({
                    Action: 'DELETE',
                    ConvQty: 1,
                    Height: 0,
                    Length: 0,
                    MovementClass: 0,
                    QtyUm: 'Eaches',
                    TreatAsLoose: 'Y',
                    Weight: 0,
                    Width: 0
                });
            }

            if (res.getValue({ name: 'custitem_ic_qty' })) {
                UOMS.UOM.push({
                    Action: 'SAVE',
                    ConvQty: res.getValue({ name: 'custitem_ic_qty' }) || zero_or_blank,
                    Height: res.getValue({ name: 'custitem_ic_height' }) || zero_or_blank,
                    Length: res.getValue({ name: 'custitem_ic_length' }) || zero_or_blank,
                    MovementClass: velocity,
                    QtyUm: 'Inner Carton',
                    TreatAsLoose: treat_as_loose(res.getValue({ name: 'custitem_ic_treat_as_loose' })),
                    Weight: scale_utils.round(res.getValue({ name: 'custitem_ic_weight' }), 5) || zero_or_blank,
                    Width: res.getValue({ name: 'custitem_ic_width' }) || zero_or_blank
                });
            } else {
                UOMS.UOM.push({
                    Action: 'DELETE',
                    ConvQty: 1,
                    Height: 0,
                    Length: 0,
                    MovementClass: 0,
                    QtyUm: 'Inner Carton',
                    TreatAsLoose: 'Y',
                    Weight: 0,
                    Width: 0
                });
            }

            if (res.getValue({ name: 'custitem_mc_qty' })) {
                UOMS.UOM.push({
                    Action: 'SAVE',
                    ConvQty: res.getValue({ name: 'custitem_mc_qty' }) || zero_or_blank,
                    Height: res.getValue({ name: 'custitem_mc_height' }) || zero_or_blank,
                    Length: res.getValue({ name: 'custitem_mc_length' }) || zero_or_blank,
                    MovementClass: velocity,
                    QtyUm: 'Master Carton',
                    TreatAsLoose: treat_as_loose(res.getValue({ name: 'custitem_mc_treat_as_loose' })),
                    Weight: scale_utils.round(res.getValue({ name: 'custitem_mc_weight' }), 5) || zero_or_blank,
                    Width: res.getValue({ name: 'custitem_mc_width' }) || zero_or_blank
                });
            } else {
                UOMS.UOM.push({
                    Action: 'DELETE',
                    ConvQty: 1,
                    Height: 0,
                    Length: 0,
                    MovementClass: 0,
                    QtyUm: 'Master Carton',
                    TreatAsLoose: 'Y',
                    Weight: 0,
                    Width: 0
                });
            }

            if (!UOMS.UOM.length) {
                UOMS = '';
            }

            var xref = {
                XRef: [
                    {
                        Action: 'SAVE',
                        XRefItem: scale_utils.truncateResult(res.getValue({ name: 'custitem_old_sku' }), 25) || null_or_blank, //if this is missing delete this one
                        XRefUM: 'Eaches',
                    },
                    {
                        Action: 'SAVE',
                        XRefItem: scale_utils.truncateResult(res.getText({ name: 'custitem_upccode' }), 25) || null_or_blank,  //if this is missing delete this one
                        XRefUM: 'Eaches',
                    }
                ],
            };

            if (!xref.XRef[1].XRefItem) {
                xref.XRef.splice(1, 1);
            }
            if (!xref.XRef[0].XRefItem) {
                xref.XRef.splice(0, 1);
            }
            if (xref.XRef.length == 0) {
                xref = '';
            }

            var netprice = Number(res.getValue({ name: 'formulanumeric' }));
            netprice = (netprice > 0) ? netprice : 0;
            return {
                Action: 'SAVE',
                UserDef1: res.getValue({ name: 'custitem_hazmat_item' }) ? 'Hazardous Material' : null_or_blank,
                UserDef2: res.getValue({ name: 'custitem_npi' }) ? 'New Product' : null_or_blank,
                UserDef3: res.getValue({ name: 'custitem_hot' }) ? 'Hot' : null_or_blank,
                UserDef4: res.getValue({ name: 'custitem2' }) ? 'Custom' : null_or_blank,
                Active: res.getValue({ name: 'isinactive' }) ? 'N' : 'Y',
                Company: scale_utils.truncateResult(company_map[res.getValue({ name: 'subsidiarynohierarchy' })], 25, true) || null_or_blank,
                Department: scale_utils.truncateResult(res.getText({ name: 'classnohierarchy' }), 25) || null_or_blank,
                Desc: scale_utils.truncateResult(res.getValue({ name: 'itemid' }), 100, true) || null_or_blank,
                Item: scale_utils.truncateResult(res.getValue({ name: 'custitem_sku' }), 50, true) || res.id,
                ItemCategories: {
                    Action: 'SAVE',
                    Category1: velocity
                },
                ItemClass: {//not sure if we need this
                    Action: 'SAVE',
                    ItemClass: res.getValue({ name: 'classnohierarchy' }) || null_or_blank,
                },
                InventoryTracking: 'Y',
                LongDesc: hazmat_combined_values || null_or_blank,//scale_utils.truncateResult(res.getValue({ name: 'salesdescription' }), 2000).replace(/\n/g, '').replace(/\r/g, ''), //Consider scrubbing all data
                LotControlled: 'N',//res.getValue({ name: 'custitem_lot_wms' }) ? 'Y' : 'N',
                NetPrice: netprice,//ROUND({averagecost}/{custitem_uom_numeral},5)
                // StorageTemplate: {
                //     Template: 'Default'
                // },
                UOMS: UOMS,
                WebImg: res.getValue({ name: 'custitem_wms_image_url' }).substr(0, 200) || null_or_blank,
                WebThumbnailImg: res.getValue({ name: 'custitem_wms_image_url' }).substr(0, 200) || null_or_blank,
                XRefs: xref
            };
        }
    };

    function createAddressObject(res, prefix) {
        var country = res.getValue({ name: prefix + 'country' });
        var countries_with_states = ['US', 'CA'];
        var us_territories = ['PR']; // 'AS', 'FM', 'GU', 'MH', 'MP', 'PW', 'VI'
        //var countries_that_need_zip = ["PR", "AU", "AT", "BE", "BR", "CN", "CO", "DK", "FI", "FR", "DE", "GR", "IN", "ID", "IT", "JP", "LU", "MY", "MX", "NL", "NO", "PH", "PT", "RU", "SG", "ZA", "KR", "ES", "SE", "CH", "TH", "TR", "GB"];
        var postal_code = '';
        var state = '';
        var is_country_united_states_or_canada = countries_with_states.indexOf(country) != -1;
        //var is_country_that_needs_zip = countries_that_need_zip.indexOf(country) != -1


        if (is_country_united_states_or_canada) {
            state = res.getValue({ name: prefix + 'state' });
            var is_state_united_states_territory = us_territories.indexOf(state) != -1;
            if (country == 'US' && is_state_united_states_territory) {
                country = state;
                state = '';
            }
        }

        postal_code = scale_utils.truncateResult(res.getValue({ name: prefix + 'zip' }), 25);

        var addressObj = {
            Action: 'SAVE',
            Address1: scale_utils.truncateResult(res.getValue({ name: prefix + 'address1' }), 50),
            Address2: scale_utils.truncateResult(res.getValue({ name: prefix + 'address2' }), 50),
            Address3: scale_utils.truncateResult(res.getValue({ name: prefix + 'address3' }), 50),
            City: scale_utils.truncateResult(res.getValue({ name: prefix + 'city' }), 30),
            Country: scale_utils.truncateResult(country, 25),
            Name: scale_utils.truncateResult(res.getValue({ name: prefix + 'addressee' }), 50),
            PhoneNum: scale_utils.truncateResult(res.getValue({ name: prefix + 'phone' }), 50) || '999-999-9999',
            PostalCode: postal_code,
            // ResidentialFlag: res.getValue({ name: 'isshipaddress' }) ? 'Y' : 'N',
            ResidentialFlag: 'N', // Updated 1/30 By Dennis - Max Requested
            State: scale_utils.truncateResult(state, 25)
        };

        return addressObj;
    }

    function mark_batch_status(batch_id, status, error_message) {
        record.submitFields({
            type: 'customrecord_wms_queue_records',
            id: batch_id.toString(),
            values: {
                custrecord_wms_status: status,
                custrecord_error_message: error_message
            },
            options: {
                ignoreMandatoryFields: true
            }
        });
    }

    function create_batches(XML_TYPE, internal_id, more_filters) {
        var batches = [];
        var company_map = scale_utils.get_scale_company_reference_by_netsuite_company_map();
        if (XML_TYPE == 'Shipment' || XML_TYPE == 'Receipt') {
            var wms_warehouses = scale_utils.get_warehouses_with_wms();
            for (var i = 0; i < wms_warehouses.length; i++) {
                batches = batches.concat(create_batches_by_location(XML_TYPE, internal_id, company_map, wms_warehouses[i]));
            }
        } else {
            batches = create_batches_by_location(XML_TYPE, internal_id, company_map, null, more_filters);
        }
        log.debug('batches length', batches.length);
        return batches;
    }

    function create_batches_by_location(XML_TYPE, internal_id, company_map, location, more_filters) {
        var batches;
        var configInformation = scale_utils.getWMSConfig(XML_TYPE);
        var xml_types_with_details = ['SHIPMENT', 'RECEIPT', 'BILLOFMATERIAL'];
        var max_batch_size = configInformation['custrecord_wms_max_batch_size'] || 1;
        var srchObj = search.load({
            id: configInformation['custrecord_wms_rec_save_search'][0].value
        });
        var filters = srchObj.filters;
        if (internal_id) {
            filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: internal_id //internalidvalue
            }));
        }
        if (location) {
            filters.push(search.createFilter({
                name: 'location',
                operator: search.Operator.ANYOF,
                values: location //internalidvalue
            }));
        }
        log.debug('more_filters', more_filters);
        if (more_filters) {
            more_filters.forEach(function (filter) { filters.push(filter); });
        }
        srchObj.filters = filters;

        if (XML_TYPE == 'Shipment') {
            //[['custbody_ship_complete','is','T'],'OR',[['internalidnumber','equalto','12314'],'OR',['internalidnumber','equalto','234']]]
            var ship_complete_filters = create_ship_complete_filters();
            log.debug('ship_complete_filters', ship_complete_filters);
            var filter_expressions = srchObj.filterExpression;
            filter_expressions = filter_expressions.concat(ship_complete_filters);
            log.debug('filter_expressions', filter_expressions);
            srchObj.filterExpression = filter_expressions;
        }

        var searchResultCount = srchObj.runPaged().count;
        log.debug('searchResultCount', searchResultCount);
        if (searchResultCount) {
            var results = scale_utils.getAllResults(srchObj);

            results = results.map(function (res) {
                return createJSONXMLObject[XML_TYPE.toUpperCase()](res, company_map);
            });


            results = groupObjByProp(results, scale_constants.WMS_Configs[XML_TYPE.toUpperCase()].group_by);

            if (xml_types_with_details.indexOf(XML_TYPE.toUpperCase()) != -1) {
                var details_key = '';
                var includeLineNum = false;
                if (XML_TYPE.toUpperCase() == 'BILLOFMATERIAL') {
                    details_key = 'BillOfMaterialDetails';
                }
                formatResults({
                    results: results,
                    type: XML_TYPE,
                    includeLineNum: includeLineNum,
                    details_key: details_key
                });
            }

            cleanseResults(results);
            batches = splitResultsIntoBatches(results, max_batch_size, XML_TYPE);
            if (XML_TYPE.toUpperCase() == 'BILLOFMATERIAL') {
                batches = delete_bom(batches);
                log.debug('batches with delete bom', batches);
            }
        }
        log.debug('batches', batches);
        return batches || [];
    }


    function create_ship_complete_filters() {
        var ship_complete_filters_with_ors = [];
        var ship_complete_ready_orders = get_ship_complete_ready_orders();
        if (ship_complete_ready_orders) {
            var ship_complete_order_filters = scale_utils.create_filters('internalidnumber', 'equalto', ship_complete_ready_orders);
            ship_complete_filters_with_ors = scale_utils.insert_or_filters(ship_complete_order_filters);
            var ship_complete_filters_final = ['AND',
                [['custbody_ship_complete', 'is', 'F'], 'OR', [ship_complete_filters_with_ors]]];
            return ship_complete_filters_final;
        }
        return ['AND', ['custbody_ship_complete', 'is', 'F']];
    }

    function get_ship_complete_ready_orders() {
        var array_of_orders = [];
        var ship_complete_ready_order_search = search.create({
            type: 'salesorder',
            filters:
                [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['custbody_ship_complete', 'is', 'T'],
                    'AND',
                    ['item.type', 'anyof', 'Assembly', 'InvtPart'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['custbody_warehouse_status', 'anyof', '2', '3'],
                    'AND',
                    ['location.isinactive', 'is', 'F'],
                    'AND',
                    ['location.custrecord_scale_enabled', 'is', 'T'],
                    'AND',
                    ['shipmethod', 'noneof', '@NONE@'],
                    'AND',
                    ['shipping', 'is', 'F'],
                    'AND',
                    ['sum(formulanumeric: {quantity}-  NVL({quantitycommitted},0))', 'equalto', '0']
                ],
            columns:
                [
                    search.createColumn({
                        name: 'internalid',
                        summary: 'GROUP',
                        label: 'Internal ID'
                    }),
                    search.createColumn({
                        name: 'tranid',
                        summary: 'GROUP',
                        label: 'Document Number'
                    }),
                    search.createColumn({
                        name: 'quantitycommitted',
                        summary: 'SUM',
                        label: 'Quantity Committed'
                    }),
                    search.createColumn({
                        name: 'quantity',
                        summary: 'SUM',
                        label: 'Quantity'
                    })
                ]
        });
        var searchResultCount = ship_complete_ready_order_search.runPaged().count;
        if (searchResultCount) {
            var results = scale_utils.getAllResults(ship_complete_ready_order_search);
            results.map(function (res) {
                array_of_orders.push(res.getValue({
                    name: 'internalid',
                    summary: 'GROUP',
                    label: 'Internal ID'
                }));
            });
        } else {
            return false;
        }
        return array_of_orders;
    }

    function delete_bom(batches) {
        for (var batch = 0; batch < batches.length; batch++) {

            var array_of_delete = [];
            var items = batches[batch].BillOfMaterials.BillOfMaterial;
            for (var item = 0; item < items.length; item++) {
                var delete_obj =
                {
                    Company: 'Kush Supply Co.',
                    InterfaceEntity: {
                        Action: 'Delete'
                    },
                    Item: items[item].Item
                };
                array_of_delete.push(delete_obj);
            }
            batches[batch].BillOfMaterials.BillOfMaterial = array_of_delete.concat(items);
        }

        return batches;
    }

    function compare_changes(new_record, old_record, fields, sublists) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (new_record.getValue(field) != old_record.getValue(field)) {
                log.debug('field', field);
                log.debug('old value', old_record.getValue(field));
                log.debug('new value', new_record.getValue(field));
                return true;
            }
        }
        for (var sublist_id in sublists) {
            var new_record_line_count = new_record.getLineCount(sublist_id);
            var old_record_line_count = new_record.getLineCount(sublist_id);
            if (new_record_line_count != old_record_line_count) {
                log.debug('line count dont match', 'CHANGED');
                return true;
            }
            var sublist = sublists[sublist_id];
            for (i = 0; i < sublist.length; i++) {
                for (var j = 0; j < old_record_line_count; j++) {
                    var sublist_field = sublist[i];
                    var new_value = new_record.getSublistValue({ sublistId: sublist_id, fieldId: sublist_field, line: j });
                    var old_value = old_record.getSublistValue({ sublistId: sublist_id, fieldId: sublist_field, line: j });
                    if (old_value != new_value) {
                        log.debug('sublist_field', sublist_field);
                        log.debug('old_value', old_value);
                        log.debug('new_value', new_value);
                        return true;
                    }
                }
            }
        }
        return false;
    }
    function treat_as_loose(boolean) {
        return boolean ? 'Y' : 'N';
    }
    function check_required_fields(internal_id, XML_TYPE) {//can refractor this is accept any record, search, required fields
        var missing_fields = [];
        try {
            var configInformation = scale_utils.getWMSConfig(XML_TYPE);
            var srchObj = search.load({
                id: configInformation['custrecord_wms_rec_save_search'][0].value
            });
            var filters = srchObj.filters;
            filters.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: internal_id //internalidvalue
            }));
            srchObj.filters = filters;
            var required_fields = scale_constants.WMS_Configs[XML_TYPE.toUpperCase()].required_fields;
            var searchResultCount = srchObj.runPaged().count;

            if (searchResultCount) {
                srchObj.run().each(function (result) {
                    required_fields.forEach(function (field) {
                        if (!result.getValue({ name: field })) {
                            missing_fields.push(field);
                        }
                    });
                });
            }
            return missing_fields;
        } catch (e) {
            log.error('error at check_required_fields', e);
        }
        return missing_fields;
    }
	/**
 *
 * @param {number} queueRecordTypeId
 */
    function generateFileName(queueRecordId, queueRecordTypeId) {
        var type;
        var extension;

        for (var configType in scale_constants.WMS_Configs) {
            if (scale_constants.WMS_Configs[configType].config_id == queueRecordTypeId) {
                type = scale_constants.WMS_Configs[configType].name;
                extension = scale_constants.WMS_Configs[configType].file_extension;
                break;
            }
        }
        return type + '_' + queueRecordId + extension;
    }



    /**
     *
     * @param {Object} xs
     * @param {string} key
     */
    function groupObjByProp(xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    }

    /**
     * Removes JSON key from object -> remove empty XML nodes
     *
     * @param {Result[]} obj
     */

    function cleanseResults(obj) {
        var delete_parents_obj =
        {
            //Item Fields
            ItemClass: ['ItemClass'],
            ItemCategories: ['Category1'],
            //Receipts Fields
            Vendor: ['Source'],
            //Shipment Fields
            Comment: ['Text'],
            CustomerCategories: ['Category1', 'Category2'],
        };
        Object.keys(obj).forEach(function (key) {
            // Get this value and its type
            var value = obj[key];
            var type = typeof value;
            if (delete_parents_obj.hasOwnProperty(key)) {
                var has_value = false;
                delete_parents_obj[key].forEach(function (field) {
                    if (obj[key][field]) {
                        has_value = true;
                    } else {
                        delete obj[key][field]; //added this
                    }
                });
                if (!has_value) {
                    delete obj[key];
                }
            }
            else if (type === 'object' && value !== null) {
                // Recurse...
                cleanseResults(value);
                // ...and remove if now "empty" (NOTE: insert your definition of "empty" here)
                if (!Object.keys(value).length) {
                    delete obj[key];
                }
            }
            else if (type === 'undefined' || value === '' || value === null) {
                // Undefined, remove it
                delete obj[key];
            }
        });
    }

    /**
     * Takes Object of results grouped by uniqueId,
     * then reformats them to have appropiate line-level detail structure
     *
     * @param {Object} results
     * @param {string} type
     */
    function formatResults(params) {
        var results = params.results;
        var type = params.type;
        var includeLineNum = params.includeLineNum;
        var details_key = params.details_key || 'Details';
        var detailName = type + 'Detail';

        for (var orderId in results) {
            var order_details = results[orderId];
            var order_obj = order_details[0];
            order_obj[details_key] = {};
            order_obj[details_key][detailName] = [];

            for (var i = 0; i < order_details.length; i++) {
                if (includeLineNum) {
                    order_details[i][detailName].ErpOrderLineNum = (i + 1);  //Fixes ErpOrderLine nums sequence being wrong, hidden lines
                }
                order_obj[details_key][detailName].push(order_details[i][detailName]);
            }

            delete order_obj[detailName];

            results[orderId] = order_obj;
        }
    }

    function splitResultsIntoBatches(results, batchSize, type) {
        var pluralType = scale_constants.WMS_Configs[type.toUpperCase()].plural_name;

        var resultIds = Object.keys(results);
        var batches = [];
        //var batchCount = Math.ceil(resultIds/batchSize);

        var LONGTEXT_MAXLENGTH = 100000;
        var batchNum = 0;

        for (var i = 0; i < resultIds.length; i++) {

            var batchExists = batches[batchNum];
            if (!batchExists) {
                batches[batchNum] = {};
                batches[batchNum][pluralType] = {};
                batches[batchNum][pluralType][type] = [];
            }
            //get potential newlength of batch that would exists, plus 1 for comma added
            var newLength = JSON.stringify(batches[batchNum]).length + JSON.stringify(results[resultIds[i]]).length + 1;

            if (newLength < LONGTEXT_MAXLENGTH && batches[batchNum][pluralType][type].length < batchSize) {
                batches[batchNum][pluralType][type].push(results[resultIds[i]]);
            }
            else {
                batchNum++;
                batches[batchNum] = {};
                batches[batchNum][pluralType] = {};
                batches[batchNum][pluralType][type] = [results[resultIds[i]]];
            }
        }

        return batches;
    }

    function release_to_warehouse(payload) {
        var modal = jQuery('<div>').addClass('modal').css({
            display: 'block',
            position: 'fixed',
            'z-index': '1000',
            top: '0',
            left: '0',
            height: '100%',
            width: '100%',
            background: 'rgba( 255 , 255 , 255 , .8) url(\'http://i.stack.imgur.com/FhHRx.gif\') 50% 50% no-repeat'
        });
        try {
            var count;
            var now = new Date();
            var hour = now.getHours();
            var status = '2';
            if (payload.XML_TYPE == 'Shipment') {
                // var missing_fields = check_required_fields(payload.id, payload.XML_TYPE)//TODO:
                // if (missing_fields.length) {
                //     var message = 'Cannot Release, Missing Required Fields:\n'
                //     missing_fields.forEach(function (field) {
                //         message += field + '\n'
                //     })
                //     alert(message)
                //     return
                // }
                var expedited = payload.custbody_expedited_order;
                if (expedited && hour >= 12) {
                    confirm('Warning: this order is marked as expedited, but may not ship today if submitted after 12pm local time');
                }
                count = scale_utils.check_for_backorder.SHIPMENT(payload.id);
                if (count) {
                    alert('Warning: one or more items are on back order.  We will send the committed portion of the order to the warehouse now, and the remaining portion once it is committed');
                }
            } else if (payload.type == 'purchaseorder') {
                var one_day = 24 * 60 * 60 * 1000;
                var today = new Date();
                var recieve_by_date = new Date(payload.duedate);
                var diff_days = Math.round((recieve_by_date.getTime() - today.getTime()) / one_day);
                if (diff_days < 3) {
                    payload.custbody_expedited_order = true;
                    confirm('Warning: this Purchase Order will be sent immediately to the WMS because the Receive By date is less than 3 days in the future');
                }
            } else if (payload.type == 'returnauthorization') {
                payload.custbody_expedited_order = true;
            } else if (payload.type == 'workorder') {
                payload.custbody_expedited_order = true;
                count = scale_utils.check_for_backorder.WORKORDER(payload.id);
                status = '4';
                if (count) {
                    alert('This Work Order cannot be released yet because one or more components is still on back order.');
                    return;
                }
            }
            jQuery('body').append(modal); //create a loading screen model
            var set_warehouse_status_payload = {
                id: payload.id,
                type: payload.type,
                status: status,
                action: 'set_warehouse_status'
            };
            set_warehouse_status_suitelet_release_to_warehouse(set_warehouse_status_payload, payload);


        } catch (e) {
            location.reload();
            scale_utils.send_error_email('ERROR AT RELEASE TO WAREHOUSE', JSON.stringify(e));
        }
    }

    function create_release_to_warehouse_button(XML_TYPE, context) {
        if (context.type == context.UserEventType.VIEW) {
            var scale_enabled = false;
            var wms_warehouses = scale_utils.get_warehouses_with_wms();
            var warehouse_status = context.newRecord.getText({
                fieldId: 'custbody_warehouse_status'
            });
            if (warehouse_status == 'Not Released' || !warehouse_status || warehouse_status == 'Partially Released') {
                var status = context.newRecord.getText({
                    fieldId: 'status'
                }) || '';
                var rec_id = context.newRecord.id;
                var rec_type = context.newRecord.type;
                if (rec_type == 'workorder') {
                    var location = context.newRecord.getValue('location');
                    if (status != 'Released' || wms_warehouses.indexOf(location) == -1) {
                        return;  //STOP if work order location is not wms enabled or not in released status
                    }
                    var buildable = context.newRecord.getValue('committed');
                    var quantity = context.newRecord.getValue('quantity');
                    log.debug('buildable', buildable);
                    log.debug('quantity', quantity);
                    if (buildable != quantity) {
                        log.debug('not buildable', 'omg');
                        return;
                    }
                    scale_enabled = true;
                } else {
                    if (rec_type == 'salesorder' || rec_type == 'transferorder' || rec_type == 'returnauthorization') {
                        if (status == 'Pending Approval' || status == 'Billed' || status == 'Closed' || status == 'Pending Billing' || status == 'Cancelled') {
                            return; //STOP HERE IF PENDING APPROVAL
                        }
                        if (rec_type == 'returnauthorization') {
                            if (context.newRecord.getValue({ fieldId: 'custbody_exempt_return' })) {
                                return;
                            } else if (status == 'Pending Refund' || status == 'Refunded') {
                                return;
                            }
                        }
                    }
                    var line_count = scale_utils.wms_enabled_item_line(rec_id);
                    if (line_count) {
                        scale_enabled = true;
                    } else {
                        if (rec_type != 'salesorder') {
                            return; //STOP BUTTON CREATION IF NO SCALE LINES AND NOT SALES ORDER
                        }
                    }
                }
                var payload = {
                    id: rec_id,
                    type: rec_type,
                    custbody_expedited_order: context.newRecord.getValue('custbody_expedited_order'),
                    duedate: context.newRecord.getValue('duedate') || '',
                    XML_TYPE: XML_TYPE,
                    scale_enabled: scale_enabled
                };

                context.form.clientScriptFileId = '1272432';
                context.form.addButton({
                    id: 'custpage_release_to_warehouse',
                    label: 'Release to Warehouse',
                    functionName: 'release_to_warehouse(' + JSON.stringify(payload) + ')',
                });
            }
        }
    }

    function create_send_receipt_button(XML_TYPE, context) {
        if (context.type == context.UserEventType.VIEW) {
            var tolocation_is_scale_enabled = false;
            var transfer_location = context.newRecord.getValue('transferlocation');
            log.debug('transfer location', transfer_location);
            if (transfer_location) {
                tolocation_is_scale_enabled = search.lookupFields({
                    type: 'location',
                    id: transfer_location,
                    columns: 'custrecord_scale_enabled'
                })['custrecord_scale_enabled']; //boolean
                log.debug('tolocation_is_scale_enabled', tolocation_is_scale_enabled);
            }
            if (!tolocation_is_scale_enabled) {
                return;
            }
            var order_status = context.newRecord.getValue('orderstatus');
            var receipt_in_wms = context.newRecord.getValue('custbody_receipt_in_wms');
            if (order_status == 'F' && !receipt_in_wms) { //Pending Receipt
                var itemFulId;

                var itemfulfillmentSearchObj = search.create({
                    type: 'itemfulfillment',
                    filters:
                        [
                            ['type', 'anyof', 'ItemShip'],
                            'AND',
                            ['createdfrom', 'anyof', context.newRecord.id],
                            'AND',
                            ['mainline', 'is', 'T']
                        ],
                    columns:
                        [
                            'internalid'
                        ]
                });

                var results = itemfulfillmentSearchObj.run().getRange({ start: 0, end: 1000 });
                if (results) {
                    itemFulId = results[0].getValue({ name: 'internalid' });
                }

                if (itemFulId) {
                    var payload = {
                        XML_TYPE: XML_TYPE,
                        toId: context.newRecord.id,
                        itemfulfillment_options: {
                            type: 'itemfulfillment',
                            id: itemFulId
                        },
                        receiptOnly: true
                    };
                    context.form.clientScriptFileId = '1272432';
                    context.form.addButton({
                        id: 'custpage_send_receipt_to_warehouse',
                        label: 'Send Receipt To Warehouse',
                        functionName: 'send_receipt_button(' + JSON.stringify(payload) + ')',
                    });
                }
            }
        }
    }

    function logTransformError(recordId, json, error, status) {
        var errorRecord = record.create({
            type: 'customrecord_transform_record_error'
        });

        if (recordId) {
            errorRecord.setValue('custrecord_tre_record', recordId);
        }
        if (json) {
            if (typeof json == 'object') {
                errorRecord.setValue('custrecord_tre_json', JSON.stringify(json));
            }
        }
        if (error) {
            if (typeof error == 'object') {
                errorRecord.setValue('custrecord_tre_error', JSON.stringify(error));
            }
        }
        if (status) {
            errorRecord.setValue('custrecord_tre_status', status);
        }

        return errorRecord.save();
    }
    function set_warehouse_status_suitelet_release_to_warehouse(set_warehouse_status_payload, payload) {
        var scale_master_suitelet_url = url.resolveScript({
            scriptId: 'customscript_scale_master_suitelet',
            deploymentId: 'customdeploy_scale_master_suitelet',
            returnExternalURL: true
        });
        jQuery.ajax({
            method: 'POST',
            url: scale_master_suitelet_url,
            data: set_warehouse_status_payload,
            dataType: 'json'
        }).done(function () {
            if (payload.scale_enabled) {
                var release_to_warehouse_url = url.resolveScript({
                    scriptId: 'customscript_wms_release_to_warehouse',
                    deploymentId: 'customdeploy_wms_release_to_warehouse',
                    returnExternalURL: true
                });
                jQuery.ajax({
                    method: 'POST',
                    url: release_to_warehouse_url,
                    data: payload,
                    dataType: 'json'
                }).done(function () {
                    location.reload();
                });
            } else {
                location.reload();
            }
            log.debug('set_warehouse_status', 'done');
        });
    }
    return {
        check_required_fields: check_required_fields,
        cleanseResults: cleanseResults,
        compare_changes: compare_changes,
        createJSONXMLObject: createJSONXMLObject,
        create_batches: create_batches,
        formatResults: formatResults,
        generateFileName: generateFileName,
        getInputData_ByQueueRecord: getInputData_ByQueueRecord,
        groupObjByProp: groupObjByProp,
        mark_batch_status: mark_batch_status,
        splitResultsIntoBatches: splitResultsIntoBatches,
        release_to_warehouse: release_to_warehouse,
        create_release_to_warehouse_button: create_release_to_warehouse_button,
        create_send_receipt_button: create_send_receipt_button,
        logTransformError: logTransformError
    };
});
