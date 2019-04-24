/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 2.00       2018-02-13      Dennis           Created Script
 * 2.01       2019-02-18      Donald           Added Inventory Transaction
 *
 */
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(["N/email", "N/search", "N/record", "./scale_utils.js", "N/log", "../../UOM Base Unit/UOM_base_unit.js"],
    /**
     * Module params:
     * @param {email} email
     * @param {search} search
     * @param {record} record
     * @param {scale_utils} scale_utils
     * @param {runtime} log
     */
    function (email, search, record, scale_utils, log, uomBaseUnit) {

        //==========================================================================================
        // Main Functions
        //==========================================================================================

        /**
         * Executes when an XML gets sent to Azure.
         * @param {Object} batchParam - Holds XML data from SCALE that has been converted to a JSON.
         * @returns {string|boolean} Internal ID as a string or false.
         */
        function createItemFulfillment(batchParam) {
            var batch = batchParam.Shipments.Shipment[0];
            var orderType = batch.OrderType;
            var isExpedited = batch.UserDef13 == "Expedited";
            var recordType = record.Type.SALES_ORDER;
            var shipmentArray = [];
            var totalFulCost = 0;

            if (orderType == "Transfer Order" || orderType == "Consignment Order") {
                recordType = record.Type.TRANSFER_ORDER;
            }

            var salesOrderId = batch.ErpOrder;

            var newItemFulfillment = record.transform({
                fromId: salesOrderId,
                fromType: recordType,
                toType: record.Type.ITEM_FULFILLMENT,
                isDynamic: true
            });

            ///////////////////////////////////
            //  CHOOSES CORRECT LOCATION ID  //
            //////////////////////////////////

            var locationId;

            if (batch.OrderType == "Sample Order") {
                locationId = findWarehouseId(batch.Warehouse, newItemFulfillment.getValue("subsidiary"), "W-Samples");

            } else {
                locationId = findWarehouseId(batch.Warehouse, newItemFulfillment.getValue("subsidiary"));

            }

            if (!locationId) {
                throw "Could not find location id for warehouse provided.";
            }

            ///////////////////////////////////
            //  Begin Loop Over Items on IF //
            //////////////////////////////////

            var itemCount = newItemFulfillment.getLineCount("item");

            for (var i = 0; i < itemCount; i++) {
                log.debug("entering item loop to select lines");
                newItemFulfillment.selectLine({
                    sublistId: "item",
                    line: i
                });

                var itemId = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item"
                });

                var itemType = newItemFulfillment.getCurrentSublistValue({ // InvtPart, NonInvtPart, Assembly
                    sublistId: "item",
                    fieldId: "itemtype"
                });

                if(itemType == "InvtPart"){
                    itemType = record.Type.INVENTORY_ITEM;
                } else if (itemType == "Assembly") {
                    itemType = record.Type.ASSEMBLY_ITEM;
                } else if (itemType == "NonInvtPart") { // If item is non-invt - continue to next item
                    continue;
                }

                var commentArray = [];

                var itemLocationId = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "location"
                });

                var scaleEnabled = isLocationScaleEnabled(itemLocationId, batch.Warehouse);

                log.debug("isScaleEanbled", scaleEnabled);

                if (!scaleEnabled) {
                    continue;
                }

                ///////////////////////////////////
                // Check if Location matches XML //
                //////////////////////////////////

                if (locationId != itemLocationId) { //if location doesn't match - skip to next line item
                    continue;
                }

                var orderLineNum = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "orderline"
                });

                //////////////////////////////////////////
                // Determine Correct Quantity - Eaches //
                /////////////////////////////////////////

                var quantity = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantitybase"
                });
                log.debug("quantity in item loop", quantity);

                quantity = Math.floor(Number(quantity)); // Rounds down decimals

                if (!quantity) {
                    continue;
                }

                var uom = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "unitsdisplay"
                }) || 1;

                quantity = quantity * Number(uom); // Quantity in eaches

                var shipMethod = newItemFulfillment.getValue("shipmethod");

                if(shipMethod == "4774") { // If Freight - Make sure it meets mininum ship alone quantity
                    
                    var msaq = Number(newItemFulfillment.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_msaq"
                    })); 

                    if(!msaq){
                        msaq = Number(search.lookupFields({
                            type: itemType,
                            id: itemId,
                            columns: ["custitem_msaq"]
                        }).custitem_msaq);
                    }
                    
                    quantity = quantity - (quantity%msaq);

                    if(msaq == -1 || quantity < 1){ //MSAQ -1 = Never to be sent with Freight || Quantity less than a whole unit.
                        continue;
                    }
                } 

                //TODO: CHANGE SKU TO THIS AFTER ALL OLD ITEM FULFILLMENTS ARE GONE
                // var sku = newItemFulfillment.getCurrentSublistValue({
                //     sublistId: "item",
                //     fieldId: "custcol_item_sku",
                //     line: i
                // });


                //////////////////////////////////////////
                // Set Line Values on Item Fulfillment //
                /////////////////////////////////////////

                var itemUnitRate = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_item_unit_rate"
                }) || 0;


                var clientSku = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_client_sku"
                });


                var vapeInstructions = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_vape_filling_instructions"
                });

                var sku = search.lookupFields({
                    type: search.Type.INVENTORY_ITEM,
                    id: itemId,
                    columns: ["custitem_sku"]
                }).custitem_sku;

                if (!sku) {
                    sku = search.lookupFields({
                        type: search.Type.ASSEMBLY_ITEM,
                        id: itemId,
                        columns: ["custitem_sku"]
                    }).custitem_sku;
                }
                var uomType = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_units_type"
                });

                newItemFulfillment.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "units",
                    value: uomBaseUnit.uomJson[uomType] || ""
                });

                newItemFulfillment.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "itemreceive",
                    value: true
                });

                newItemFulfillment.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    value: quantity,
                    ignoreFieldChange: true
                });

                var isDropShip = newItemFulfillment.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "isdropshipline"
                });

                isDropShip = isDropShip === "T" || isDropShip === true ? true : false; // NetSuite

                if (!isDropShip) {
                    changeInventoryDetailStatus(newItemFulfillment, 0, 1, quantity);

                }

                newItemFulfillment.commitLine({
                    sublistId: "item"
                });

                /////////////////////////////////////////
                // Create New XML Info for Line Items //
                ////////////////////////////////////////

                var totalLineCost = quantity * Number(itemUnitRate);
                totalFulCost += totalLineCost;

                var itemObj;

                if (clientSku) {
                    commentArray.push({
                        Action: "SAVE",
                        CommentType: truncateResult("Client Sku", 25), //25
                        Text: truncateResult(clientSku, 2000), //2000
                    });
                }
                if (vapeInstructions) {
                    commentArray.push({
                        Action: "SAVE",
                        CommentType: truncateResult("Vape Filling Instructions", 25), //25
                        Text: truncateResult(vapeInstructions, 2000), //2000
                    });
                }

                if (commentArray.length > 0) {

                    if (commentArray.length == 1) {
                        commentArray = commentArray[0];
                    }

                    itemObj = {
                        Action: "SAVE",
                        Comments: {
                            Comment: commentArray
                        },
                        ErpOrderLineNum: orderLineNum,
                        SKU: {
                            Item: truncateResult(sku, 25),
                            Quantity: quantity
                        }
                    };
                } else {
                    itemObj = {
                        Action: "SAVE",
                        ErpOrderLineNum: orderLineNum,
                        SKU: {
                            Item: truncateResult(sku, 25),
                            Quantity: quantity
                        }
                    };
                }


                shipmentArray.push(itemObj);
            }


            //////////////////////////////////////////
            // Update Item Fulfillment Body Fields //
            /////////////////////////////////////////

            newItemFulfillment.setValue("generateintegratedshipperlabel", false);
            newItemFulfillment.setValue("shipstatus", "A"); // Sets to ready to be picked

            var newItemFulfillmentId = newItemFulfillment.save();

            if (isExpedited) {
                record.submitFields({
                    id: salesOrderId,
                    type: recordType,
                    values: {
                        custbody_expedited_order: false
                    }
                });
            }

            //////////////////////////////////////////
            // Modify XML Line Items with new info //
            /////////////////////////////////////////

            if (newItemFulfillmentId) {
                batch.Details.ShipmentDetail = shipmentArray;
                batch.UserDef5 = Number(totalFulCost).toFixed(2);
                batch.UserDef7 = newItemFulfillmentId;
                batch.ShipmentId = obtainDocumentNumber("itemfulfillment", newItemFulfillmentId);
                return newItemFulfillmentId;
            } else {
                return false;
            }

        }

        /**
         * Executes when a Receipt XML gets consumed into NetSuite.
         * @param {Object} fileTextObj - Holds XML data from SCALE that has been converted to a JSON.
         * @returns {string} Internal ID.
         */
        function createItemReceipt(fileTextObj) {
            //TODO : Validate if always sending 1 Receipt Object per Upload file, or potentially array of Receipts per file
            var headerObj = fileTextObj.WMWDATA.WMFWUpload.Receipts.Receipt;

            var recordId = headerObj.ErpOrderNum;
            var recordType = headerObj.ReceiptIdType;
            recordType = recordType === "PO" ? record.Type.PURCHASE_ORDER : recordType === "TO" || recordType === "Consignment Order" ? record.Type.TRANSFER_ORDER : record.Type.RETURN_AUTHORIZATION;

            if (!headerObj.ReceiptContainers && headerObj.ClosedDate) { //Cancel Receipt
                try {
                    if (recordType == record.Type.TRANSFER_ORDER) {
                        record.submitFields({
                            id: recordId,
                            type: recordType,
                            values: {
                                custbody_receipt_in_wms: false
                            }
                        });
                    } else {
                        record.submitFields({
                            id: recordId,
                            type: recordType,
                            values: {
                                custbody_warehouse_status: "1"
                            }
                        });
                    }
                    return recordId;
                } catch (err2) {
                    throw err2;
                }
            }

            var detailsArr = headerObj.ReceiptContainers.ReceiptContainer;

            detailsArr = detailsArr instanceof Array ? detailsArr : [detailsArr];

            detailsArr = combineSplitOrderLines(detailsArr);

            var itemReceipt = record.transform({
                fromId: recordId,
                fromType: recordType,
                toType: record.Type.ITEM_RECEIPT,
                isDynamic: true
            });

            var itemReceiptLines = itemReceipt.getLineCount({
                sublistId: "item"
            });

            for (var i = 0; i < itemReceiptLines; i++) {

                itemReceipt.selectLine({
                    sublistId: "item",
                    line: i
                });

                var itemLine = itemReceipt.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "orderline"
                });

                // if (recordType == record.Type.TRANSFER_ORDER) { //Adjusting that IR for TO has a different order line number
                //     itemLine = itemLine - 1;
                // }


                log.debug("item line", itemLine);
                var detailObj = getReceiptDetailObj(detailsArr, itemLine, null);

                if (detailObj) {
                    log.debug("detail obj");
                    var correctedQuantity = Number(detailObj.Qty);

                    var uomType = itemReceipt.getCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_units_type"
                    });

                    itemReceipt.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "units",
                        value: uomBaseUnit.uomJson[uomType] || ""
                    });

                    itemReceipt.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "itemreceive",
                        value: true
                    });

                    itemReceipt.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        value: correctedQuantity.toFixed(8),
                        ignoreFieldChange: true
                    });

                    if (recordType == record.Type.PURCHASE_ORDER) {
                        var rate = itemReceipt.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "rate"
                        });

                        var conversionRate = parseInt(itemReceipt.getCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "unitconversion"
                        }), 10) || 1;

                        var correctedRate = rate / conversionRate;

                        itemReceipt.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "rate",
                            value: correctedRate,
                            ignoreFieldChange: true
                        });
                    }

                    for (var k = 0; k < detailObj.DispCode.length; k++) {
                        var invDetailQty = Number(detailObj.DispCode[k].quantity).toFixed(8);
                        changeInventoryDetailStatus(itemReceipt, k, detailObj.DispCode[k].itemStatus, invDetailQty);
                    }

                    itemReceipt.commitLine({
                        sublistId: "item"
                    });

                }

            }

            var receiptID = itemReceipt.save({
                ignoreMandatoryFields: true
            });

            if (headerObj.ClosedDate) {
                var recStatus = search.lookupFields({
                    type: recordType,
                    id: recordId,
                    columns: ["status"]
                }).status[0].text;

                if (recStatus == "Received" || recStatus == "Pending Refund" || "Pending Billing") { //TO, RA, PO - RECEIVED IN FULL
                    updateWarehouseStatus(recordType, recordId);
                } else {
                    try {
                        if (recordType == record.Type.TRANSFER_ORDER) {
                            record.submitFields({
                                id: recordId,
                                type: recordType,
                                values: {
                                    custbody_receipt_in_wms: false
                                }
                            });
                        } else {
                            record.submitFields({
                                id: recordId,
                                type: recordType,
                                values: {
                                    custbody_warehouse_status: "1"
                                }
                            });
                        }
                        return receiptID;
                    } catch (err2) {
                        throw err2;
                    }
                }
            } else {
                updateWarehouseStatus(recordType, recordId);
            }


            return receiptID;
        }

        /**
         * Executes when a Shipment XML gets consumed into NetSuite.
         * @param {Object} fileTextObj - Holds XML data from SCALE that has been converted to a JSON.
         * @returns {string} Internal ID.
         */
        function updateItemFulfillment(fileTextObj) {
            var isOrderedCancelled = checkIfCancelled(fileTextObj);
            var headerObj = fileTextObj.WMWDATA.WMFWUpload.Shipments.Shipment;
            var recordType = headerObj.OrderType;
            recordType = recordType === "Sales Order" || recordType === "Sample Order" ? record.Type.SALES_ORDER : record.Type.TRANSFER_ORDER;
            var createdFromId = headerObj.ErpOrder;
            var updateShipMethod = false;
            var recordId = parseInt(headerObj.UserDef7, 10);

            ///////////////////////////////////
            // CHECKS IF ORDER IS CANCELLED //
            //////////////////////////////////
            if (isOrderedCancelled.deleted) {
                //false delete
                if(isOrderedCancelled.statusChange){
                    //true delete

                    record.submitFields({
                        type: recordType,
                        id: createdFromId,
                        values: {
                            "custbody_warehouse_status": "1" // Not Released
                        }
                    });

                    if (isOrderedCancelled.SamplesTransfer.exists) {
                        return isOrderedCancelled.SamplesTransfer.success;
                    }
                }
                return createdFromId;
            }

            ///////////////////////////////////
            //        SET SHIP METHOD        //
            //////////////////////////////////
            var serviceLevel = "";
            if (headerObj.Carrier.Service) {
                serviceLevel = headerObj.Carrier.Service;
            }

            var shipmethod = findNetSuiteShipVia(headerObj.ShipperCode, headerObj.Carrier.Carrier, serviceLevel);
            if (!shipmethod) {
                throw "Shipping Method cannot be found in NetSuite.";
            }

            var oldShipMethod = search.lookupFields({
                type: "itemfulfillment",
                id: recordId,
                columns: ["shipmethod"]
            }).shipmethod[0].value;

            if (oldShipMethod != shipmethod) {
                var oldShipmethodLabel = search.lookupFields({
                    type: "shipItem",
                    id: oldShipMethod,
                    columns: ["isshipperintegrated"]
                }).isshipperintegrated;

                var newShipmethodLabel = search.lookupFields({
                    type: "shipItem",
                    id: shipmethod,
                    columns: ["isshipperintegrated"]
                }).isshipperintegrated;

                if (oldShipmethodLabel == newShipmethodLabel) {
                    updateShipMethod = true;
                } else if (oldShipmethodLabel == true && newShipmethodLabel == false) {
                    record.submitFields({
                        type: "itemfulfillment",
                        id: recordId,
                        values: {
                            "shipmethod": null
                        }
                    });
                    updateShipMethod = true;
                }
            }


            ///////////////////////////////////
            //        SET SHIP LINES         //
            //////////////////////////////////
            var linesUpdated = false;

            var detailsArr = headerObj.Details.ShipmentDetail;
            detailsArr = detailsArr instanceof Array ? detailsArr : [detailsArr];

            var itemFul = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: recordId,
                isDynamic: true
            });

            var itemFulLines = itemFul.getLineCount({
                sublistId: "item"
            });

            for (var i = 0; i < itemFulLines; i++) {

                itemFul.selectLine({
                    sublistId: "item",
                    line: i
                });

                var orderLineNum = itemFul.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "orderline"
                });

                var quantity = Number(itemFul.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity"
                }));

                var uom = Number(itemFul.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "unitsdisplay"
                })) || 1;

                var shipmentObj = getDetailObj(detailsArr, orderLineNum);

                if (shipmentObj) {
                    //set save here
                    var shipmentObjQty = Number(shipmentObj.ShippedQty);

                    if (shipmentObjQty == 0) {
                        itemFul.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "itemreceive",
                            value: false
                        });
                        continue;
                    }
                    // var correctedQuantity = shipmentObjQty / uom;
                    log.debug("corrected quan, quan, uom", shipmentObjQty + " " + quantity + " " + uom);
                    if (shipmentObjQty != quantity) {
                        itemFul.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: shipmentObjQty.toFixed(8),
                            ignoreFieldChange: true
                        });

                        var invDetail = itemFul.getCurrentSublistSubrecord({
                            sublistId: "item",
                            fieldId: "inventorydetail"
                        });

                        invDetail.selectLine({
                            sublistId: "inventoryassignment",
                            line: 0
                        });

                        invDetail.setCurrentSublistValue({
                            sublistId: "inventoryassignment",
                            fieldId: "inventorystatus",
                            value: 1,
                            ignoreFieldChange: true
                        });

                        invDetail.setCurrentSublistValue({
                            sublistId: "inventoryassignment",
                            fieldId: "quantity",
                            value: shipmentObjQty,
                            ignoreFieldChange: true
                        });

                        invDetail.commitLine({
                            sublistId: "inventoryassignment"
                        });

                        itemFul.commitLine({
                            sublistId: "item"
                        });

                        linesUpdated = true;

                    }

                    shipmentObj.ShippedQty = shipmentObjQty; //This will update the quantity to the "correct" quantity for updating the TO.

                } else {
                    itemFul.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "itemreceive",
                        value: false,
                        ignoreFieldChange: true
                    });

                    itemFul.commitLine({
                        sublistId: "item"
                    });

                }

            }

            // Sets Ship Method
            if (updateShipMethod) {
                itemFul.setValue("shipmethod", shipmethod);
            }

            itemFul.setValue("shipstatus", "C"); // Needs to be done before setting tracking.

            ///////////////////////////////////
            //        SET TRACKING #        //
            //////////////////////////////////

            // Tries to set tracking number
            var shippingContainer = headerObj.Containers.ShippingContainer;

            shippingContainer = shippingContainer instanceof Array ? shippingContainer : [shippingContainer];
            for (var index = 0; index < shippingContainer.length; index++) {
                var trackingNumber;
                var packageWeight;

                try {
                    trackingNumber = shippingContainer[index].TrackingNumber;
                    packageWeight = Number(shippingContainer[index].TotalWeight);
                } catch (e) {
                    trackingNumber = false;
                }
                if (trackingNumber) {
                    var sublistId = "package";
                    var weightFieldId = "packageweight";
                    var trackingNumFieldId = "packagetrackingnumber";
                    var currentShipRequiresLabel = search.lookupFields({
                        type: "shipItem",
                        id: itemFul.getValue("shipmethod"),
                        columns: ["isshipperintegrated"]
                    }).isshipperintegrated;

                    if (currentShipRequiresLabel) {
                        sublistId = "packagefedex";
                        weightFieldId = "packageweightfedex";
                        trackingNumFieldId = "packagetrackingnumberfedex";
                    }

                    if (index == 0) {
                        itemFul.selectLine({
                            sublistId: sublistId,
                            line: index
                        });
                    } else {
                        itemFul.selectNewLine({
                            sublistId: sublistId
                        });
                    }

                    itemFul.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: weightFieldId,
                        value: packageWeight
                    });
                    itemFul.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: trackingNumFieldId,
                        value: trackingNumber
                    });
                    itemFul.commitLine({
                        sublistId: sublistId
                    });

                }
            }

            itemFul.setValue("generateintegratedshipperlabel", false);

            var itemFulId = itemFul.save({
                ignoreMandatoryFields: true
            });


            if (linesUpdated) {
                //run function that fixes inv detail
                updateInvDetailOnItemLines(itemFulId);
                // if (recordType == record.Type.TRANSFER_ORDER) {
                //     // updateToLines(fileTextObj);
                // }

            }

            updateWarehouseStatus(recordType, createdFromId);
            return itemFulId;

            function findNetSuiteShipVia(shippercode, carrier, service) {
                var serviceFilter;
                if (service) {
                    serviceFilter = ["custrecord_scale_ship_service_level", "is", service];
                } else {
                    serviceFilter = ["custrecord_scale_ship_service_level", "isempty", ""];
                }

                var netsuiteShipVia = false;

                var customrecord_scale_ship_cross_referenceSearchObj = search.create({
                    type: "customrecord_scale_ship_cross_reference",
                    filters: [
                        ["custrecord_scale_shipper_code", "is", shippercode],
                        "AND",
                        [serviceFilter, "OR", ["custrecord_scale_ship_service_level", "isempty", ""]],
                        "AND",
                        [
                            ["custrecord_scale_ship_carrier", "is", carrier], "OR", ["custrecord_scale_ship_carrier", "is", "Freight"]
                        ],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        "custrecord_upload_nsshipvia",
                        "custrecord_scale_ship_carrier"
                    ]
                });

                var searchResultCount = customrecord_scale_ship_cross_referenceSearchObj.runPaged().count; //2

                customrecord_scale_ship_cross_referenceSearchObj.run().each(function (result) {
                    netsuiteShipVia = result.getValue("custrecord_upload_nsshipvia");
                    var scaleCarrier = result.getValue("custrecord_scale_ship_carrier");

                    if (searchResultCount == 1) { //Freight Default
                        return false;
                    } else if (searchResultCount > 1 && scaleCarrier != "Freight") { //Fedex
                        return false;
                    }
                    return true;
                });

                return netsuiteShipVia;
            }
        }

        /**
         *
         * @param {object} json
         * @param {number} mainQueueRecordId
         * @param {boolean} reprocess   used to allow the search to use completed STRs when determining waiting
         * @return {{success: boolean, data: {}}}
         */
        function process_inventorytransaction_STR(json, mainQueueRecordId, reprocess) {
            var output = {
                success: false,
                data: {}
            };
            if (!json) {
                if (mainQueueRecordId) {
                    json = search.lookupFields({
                        type: "customrecord_wms_queue_records",
                        id: mainQueueRecordId,
                        columns: ["custrecord_wms_json"]
                    })["custrecord_wms_json"];
                } else {
                    throw "SCALE Transaction Record ID and JSON not supplied";
                }
            }

            try {

                var header = json.WMWDATA.WMFWUpload;
                var transactions = header.TransHistories.TransactionHistory;
                transactions = transactions instanceof Array ? transactions : [transactions];

                //checks if data actually exists
                if (transactions && transactions.length) {
                    var transaction = transactions[0];
                    var referenceID =
                        transaction.ReferenceID ?
                            transaction.ReferenceID :
                            transaction.UserDef4 ?
                                transaction.UserDef4 :
                                "NO REFERENCE ID";

                    //update the Queue Record with the current references
                    var queueRecordValues = {};
                    queueRecordValues["custrecord_scale_reference_id"] = referenceID;
                    queueRecordValues["custrecord_wms_rec_id"] = transaction.InternalID;
                    queueRecordValues["custrecord_wms_status"] = "1"; //for reprocessing

                    //only update the groups if needed, to prevent clutter.
                    //flow is to scale_utils.updateQueueRecord with initial data, process the data, and update the queue record during end of processing function running
                    var total_records_needed = Number(header.NumGroups);
                    if (total_records_needed < 2) {
                        var add_refid_to_one_of_a_oneToOne = scale_utils.updateQueueRecord(mainQueueRecordId, "UPDATE", queueRecordValues);
                        var one_to_one_options = generateInventoryTransactionOptions(transaction.ReferenceType, mainQueueRecordId, { processtype: "one to one" });
                        var one_to_one = process_transaction_to_NS(transactions, one_to_one_options);

                        output.success = one_to_one.success;
                        output.data = one_to_one.data;
                    } else {
                        //add more information to the Queue Record
                        queueRecordValues["custrecord_scale_group_index"] = header.GroupIndex;
                        queueRecordValues["custrecord_scale_group_total"] = total_records_needed;
                        queueRecordValues["custrecord_scale_group_batch"] = transaction.UploadInterfaceBatch;
                        //TODO: add ProcessStamp and or DateTimeStamp
                        var add_refid_to_one_of_a_manyToOne = scale_utils.updateQueueRecord(mainQueueRecordId, "UPDATE", queueRecordValues);

                        var many_STRs = get_map_of_all_STR_in_a_UploadInterfaceBatch(queueRecordValues, reprocess);
                        if (many_STRs instanceof Array) {
                            var many_to_one = process_many_STR_to_NS(many_STRs, mainQueueRecordId);

                            output.success = !many_to_one.ERROR_OCCURRED;
                            output.data = many_to_one.results;
                        } else if (typeof many_STRs === "number") {
                            var SO_AM_I_STILL_WAITING = "WAITING: Need " + many_STRs + " more XMLs for customrecord_wms_queue_records:" + mainQueueRecordId;
                            var FOR_THIS_WORLD_TO_STOP_HATING = scale_utils.updateQueueRecord(mainQueueRecordId, "WAITING", SO_AM_I_STILL_WAITING);

                            output.success = true;
                            output.data = SO_AM_I_STILL_WAITING;
                        } else {
                            var CANT_FIND_A_GOOD_REASON = {
                                title: "FATALERROR: what reason did this error?",
                                details: many_STRs
                            };
                            var CANT_FIND_HOPE_TO_BELIEVE_IN = scale_utils.updateQueueRecord(mainQueueRecordId, "ERROR", CANT_FIND_A_GOOD_REASON);

                            log.error(CANT_FIND_A_GOOD_REASON);
                            output.data = CANT_FIND_A_GOOD_REASON;
                        }
                    }
                    return output;

                } else {
                    throw "XML Data contained no transactions";
                }
            } catch (error) {
                var error_caught = scale_utils.updateQueueRecord(mainQueueRecordId, "ERROR", error);
            }


            /**
             * @param { {custrecord_scale_group_batch: string, custrecord_scale_group_total: number} } queueRecordValues
             * @param {boolean} reprocess   used to allow the search to use completed STRs when determining waiting
             * @return { number | [{referenceid: string, internalid: string]}   if yes, then returns Array of objects.  else returns integer
             */
            function get_map_of_all_STR_in_a_UploadInterfaceBatch(queueRecordValues, reprocess) {
                var internalid_col = search.createColumn({
                        name: "internalid",
                        summary: "MAX",
                        label: "Internal ID"
                    }),
                    groupindex_col = search.createColumn({
                        name: "custrecord_scale_group_index",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "SCALE Group Index"
                    }),
                    grouptotal_col = search.createColumn({
                        name: "custrecord_scale_group_total",
                        summary: "GROUP",
                        label: "SCALE Group Total"
                    }),
                    referenceid_col = search.createColumn({
                        name: "custrecord_scale_reference_id",
                        summary: "GROUP",
                        label: "SCALE Reference ID"
                    });
                var columns = [internalid_col, groupindex_col, grouptotal_col, referenceid_col];

                function create_and_run_search(columns, reprocess) {
                    var statuses = ["custrecord_wms_status", "anyof", "1", "2", "5"]; //open, needs review, waiting

                    if (reprocess) {
                        statuses.push("3"); //completed
                    }

                    return search.create({
                        type: "customrecord_wms_queue_records",
                        filters: [
                            ["custrecord_wms_record_type", "anyof", "9"],
                            "AND",
                            statuses,
                            "AND",
                            ["custrecord_scale_group_batch", "is", queueRecordValues["custrecord_scale_group_batch"]]
                        ],
                        columns: columns
                    }).run().getRange({
                        start: 0,
                        end: 1000
                    });
                }

                var results_unprocessed = create_and_run_search(columns);
                var we_consumed_all_XMLs = results_unprocessed.length && results_unprocessed.length === queueRecordValues["custrecord_scale_group_total"];

                if (reprocess) {
                    var reprocess_results = create_and_run_search(columns, reprocess);
                    we_consumed_all_XMLs = reprocess_results.length && reprocess_results.length === queueRecordValues["custrecord_scale_group_total"];
                }


                if (results_unprocessed.length && we_consumed_all_XMLs) {

                    //we have all the data, lets output them in the correct order
                    var output = [];
                    results_unprocessed.forEach(function (result) {
                        var groupindex = result.getValue(groupindex_col);
                        output[groupindex] = {
                            internalid: result.getValue(internalid_col),
                            referenceid: result.getValue(referenceid_col)
                        };
                    });

                    output.filter(function (id) {
                        return id;
                    });
                    return output;
                } else {
                    return queueRecordValues["custrecord_scale_group_total"] - results_unprocessed.length;
                }

            }

            /**
             *
             * @param { {referenceid: string, internalid: string}[] } array_of_all_STR
             * @param { number }    mainQueueRecordId
             * @return { {ERROR_OCCURRED: boolean, results: { success: boolean, data: {[error]: string} }[] } }
             */
            function process_many_STR_to_NS(array_of_all_STR, mainQueueRecordId) {
                var output = {
                    ERROR_OCCURRED: false,
                    results: []
                };
                var current = {
                    processtype: ""
                };

                var transactions_groupedBy_referenceid = {};
                array_of_all_STR.forEach(function (STR) {
                    var groupBy_referenceid_array = transactions_groupedBy_referenceid[STR.referenceid] instanceof Array ? transactions_groupedBy_referenceid[STR.referenceid] : [];
                    groupBy_referenceid_array.push(STR.internalid);
                    transactions_groupedBy_referenceid[STR.referenceid] = groupBy_referenceid_array;
                });
                var example_transactions_groupedBy_referenceid = {
                    "WO312": ["12345", "12346", "12347"],
                    "307": ["12349", "12350"],
                    "Transfer": ["54321", "54320", "54322", "54325", "54323"],
                    "NO REFERENCE ID": ["12444", "12445", "12446", "12447", "12448", "12449"]
                };

                //ignore all transactions that do not have a legitimate referenceid
                if (transactions_groupedBy_referenceid["NO REFERENCE ID"]) {
                    var ignore_transactions_without_referenceid = transactions_groupedBy_referenceid["NO REFERENCE ID"];
                    ignore_transactions_without_referenceid.forEach(function (oneQueueRecordId) {
                        var ignoreOneQueueRecord = scale_utils.updateQueueRecord(oneQueueRecordId, "IGNORE", "Ignored during the pre-process step");
                    });
                    delete transactions_groupedBy_referenceid["NO REFERENCE ID"];
                }

                var outerloop = Object.keys(transactions_groupedBy_referenceid).length;
                log.debug("transactions_groupedBy_referenceid " + outerloop, transactions_groupedBy_referenceid);
                for (var referenceid in transactions_groupedBy_referenceid) {
                    try {
                        current.processtype = "many to one";
                        current.referenceid = referenceid;
                        var array_of_STR_internalIDs = transactions_groupedBy_referenceid[referenceid];
                        var internalids_of_unprocessed_transfers = array_of_STR_internalIDs;
                        var unrecognized_type = true;

                        var array_of_TXNmetadata_from_many_STR = combine_TXNmetadata_of_many_STR(array_of_STR_internalIDs); //TODO NOW returns [{internalid:.., transaction:..}, ...] instead of [{transaction}]
                        current.array_of_STR_internalIDs = array_of_STR_internalIDs.map(function (internalid_of_STR) {
                            return {
                                customrecord_wms_queue_records: Number(internalid_of_STR)
                            };
                        });
                        var FIRST_ReferenceType = array_of_TXNmetadata_from_many_STR[0].transactions.ReferenceType; //deprecated
                        var many_to_one_options = generateInventoryTransactionOptions(FIRST_ReferenceType, mainQueueRecordId, current);
                        if (many_to_one_options.multipleXMLs) {
                            //this means process everything together as one, such as assemblybuild from Work Orders
                            var all_transactionsJSON_of_many_to_one = array_of_TXNmetadata_from_many_STR.map(function (metadata) {
                                return metadata.transactions;
                            });
                            //FIXME go into netsuite reason codes and set transfers multipleXMLs to No https://4516274-rp.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=373

                            var MANY_TO_ONE = process_transaction_to_NS(all_transactionsJSON_of_many_to_one, many_to_one_options);
                            output.results.push(MANY_TO_ONE);

                        } else {
                            current.processtype = "many to many";
                            delete current.array_of_STR_internalIDs;

                            /*
                             * within each referenceid, resort by ReferenceType to make an array of arrays
                             *   for status change array, put it at the end of the outer array
                             *   all reference type arrays except status change unshift to the beginning of the outer array
                             *   for transfer array, resort putaways to be at the end of the inner array
                             */
                            var object_of_NSRecordTypes = {};
                            array_of_TXNmetadata_from_many_STR.forEach(function (metadata) {
                                var ONE_transactions = metadata.transactions;
                                var transactions = ONE_transactions instanceof Array ? ONE_transactions : [ONE_transactions];
                                var transaction = transactions[0];
                                var referencetype = transaction.ReferenceType;
                                var crossref = scale_utils.lookup_internalID_or_more({
                                    TYPE: "customrecord_scale_reason_code_cross_ref",
                                    FIELD: "custrecord_scale_reason_code",
                                    VALUE: referencetype
                                },
                                ["custrecord_trans_type"]
                                );
                                if (!crossref) {
                                    unrecognized_type = true;
                                    throw "many to many - couldnt find cross ref for " + referencetype;
                                } else {
                                    var transactiontype = crossref["custrecord_trans_type"].text;
                                    var formatted_recordtype = transactiontype.replace(/[ ]/g, "_").toUpperCase(); // "Inventory Status Change" => "INVENTORY_STATUS_CHANGE"
                                    var recordtype = record.Type[formatted_recordtype];

                                    object_of_NSRecordTypes[recordtype] = object_of_NSRecordTypes[recordtype] instanceof Array ? object_of_NSRecordTypes[recordtype] : [];
                                    object_of_NSRecordTypes[recordtype].push(metadata);
                                }
                            });
                            var log_rectypes = {};
                            for (var rectype in object_of_NSRecordTypes) {
                                var recarray = object_of_NSRecordTypes[rectype];
                                var mapped_recarray = recarray.map(function (metadata) {
                                    return {
                                        internalid: metadata.internalid,
                                        transaction: metadata.DateTimeStamp
                                    };
                                });
                                log_rectypes[rectype] = mapped_recarray;
                            }
                            log.debug("object_of_NSRecordTypes " + referenceid, log_rectypes);

                            //now that it has been reorganized, filter some things out of the transfer array
                            var processArray_of_TXNmetadata_arrays = [];
                            for (var recordtype in object_of_NSRecordTypes) {
                                var current_TXNmetadata_array = object_of_NSRecordTypes[recordtype];
                                if (recordtype === record.Type.INVENTORY_STATUS_CHANGE) {
                                    //status change always goes last within the same referenceid group
                                    processArray_of_TXNmetadata_arrays.push(current_TXNmetadata_array);
                                } else {
                                    //everything else always goes first within the same referenceid group
                                    if (recordtype === record.Type.INVENTORY_TRANSFER) {
                                        //putaway needs to be last within the inner array within the same referenceid group
                                        var putaways = [];
                                        var transfers = [];
                                        current_TXNmetadata_array.forEach(function (metadata) {
                                            var ONE_transactions = metadata.transactions;
                                            var transactions = ONE_transactions instanceof Array ? ONE_transactions : [ONE_transactions];
                                            var transaction = transactions[0];
                                            if (transaction.TransactionTypeDescription === "Putaway confirmation") {
                                                putaways.push(metadata);
                                            } else {
                                                transfers.push(metadata);
                                            }
                                        });
                                        if (transfers.length === 2) {
                                            var first = transfers[0];
                                            var second = transfers[1];
                                            var transactions = [first.transactions, second.transactions];
                                            var internalids = {
                                                array_of_STR_internalIDs: [first.internalid, second.internalid]
                                            };
                                            if (check_if_work_is_not_complete(transactions)) { //work creation
                                                // FIXME Samples Transfer without Work is also being filtered out.  why is a Samples Transfer no longer Work?  There's no way to differentiate creation
                                                var ignore_transfers_in_the_beginning = updateAllQueueRecords(internalids, "IGNORE", "Skipping Inventory Transfer work creation at the start");
                                                if (ignore_transfers_in_the_beginning) {
                                                    transfers.shift();
                                                    transfers.shift();

                                                    var transfers_ignored = true;
                                                    internalids.array_of_STR_internalIDs.forEach(remove_processed_STR_from, internalids_of_unprocessed_transfers);
                                                    output.results.push({
                                                        success: true,
                                                        data: {
                                                            transferSTRs_ignored: internalids.array_of_STR_internalIDs
                                                        },
                                                        processtype: current.processtype
                                                    });
                                                    log.debug("ignored transfers", internalids.array_of_STR_internalIDs);
                                                }
                                            }
                                        }
                                        current_TXNmetadata_array = transfers.concat(putaways);
                                    }
                                    processArray_of_TXNmetadata_arrays.unshift(current_TXNmetadata_array);
                                }
                            }
                            log.debug("array of arrays of txn metadata " + referenceid + " " + processArray_of_TXNmetadata_arrays.length, processArray_of_TXNmetadata_arrays);

                            /* if transfer,
                             *   if three transfer
                             *       look for putaway, ignore the other two, process putaway
                             *   if two transfer
                             *       ignore when the onhands are the same
                             *       process them when the onhands are different and let your function do the rest
                             *   if one transfer
                             *       process it and let your prep function do the rest
                             * if status change
                             *   search for same referenceid and find duplicates aka ignored transfers
                             *   if any duplicate exist
                             *       ignore this status change as well cuz you wait for putaway
                             *   no duplicates
                             *       process this status change
                             * */

                            //process my filtered data
                            processArray_of_TXNmetadata_arrays.forEach(function (TXNmetadata_array) {
                                delete current.array_of_STR_internalIDs;
                                //process arrays together since they are already organized by different type already
                                if (!TXNmetadata_array.length) {
                                    return;
                                }
                                var ONE_metadata = TXNmetadata_array[0]; //this is intentionally hardcoded since ive already grouped
                                var ONE_transactions = ONE_metadata.transactions;
                                var transactions = ONE_transactions instanceof Array ? ONE_transactions : [ONE_transactions];
                                var transaction = transactions[0];
                                var ONE_referenceType = transaction.ReferenceType;
                                var ONE_queueRecordId = ONE_metadata.internalid;

                                var many_records_options = generateInventoryTransactionOptions(ONE_referenceType, ONE_queueRecordId, current);

                                if (many_records_options.recordtype === record.Type.INVENTORY_TRANSFER) {
                                    current.processtype = "many to many transfers";

                                    var putaways_to_process_individually = [];
                                    var transfers_to_process_all_at_once = [];

                                    TXNmetadata_array.forEach(function (ONE_metadata) {
                                        var ONE_transactions = ONE_metadata.transactions;
                                        var transactions = ONE_transactions instanceof Array ? ONE_transactions : [ONE_transactions];
                                        var transaction = transactions[0];
                                        var IS_PUTAWAY = transaction.TransactionTypeDescription === "Putaway confirmation";

                                        if (IS_PUTAWAY) {
                                            putaways_to_process_individually.push(ONE_metadata);
                                        } else {
                                            transfers_to_process_all_at_once.push(ONE_metadata);
                                        }
                                    });

                                    //submit all the putaways individually
                                    if (putaways_to_process_individually.length) {
                                        var putaway_counter = 0;
                                        putaways_to_process_individually.forEach(function (ONE_metadata) {
                                            putaway_counter++;
                                            current.processtype = "many to many transfers - putaway " + putaway_counter + " of " + putaways_to_process_individually.length;

                                            var ONE_transactions = ONE_metadata.transactions;
                                            var transactions = ONE_transactions instanceof Array ? ONE_transactions : [ONE_transactions];
                                            var transaction = transactions[0];
                                            var ONE_referenceType = transaction.ReferenceType;
                                            var ONE_queueRecordId = ONE_metadata.internalid;
                                            var ONE_putaway_options = generateInventoryTransactionOptions(ONE_referenceType, ONE_queueRecordId, current);
                                            var ONE_PUTAWAY_RESULT = process_transaction_to_NS(transactions, ONE_putaway_options);

                                            remove_processed_STR_from(ONE_queueRecordId, internalids_of_unprocessed_transfers);
                                            output.results.push(ONE_PUTAWAY_RESULT);
                                            log.debug("processed many to many transfers - putaway " + putaway_counter + " of " + putaways_to_process_individually.length, ONE_PUTAWAY_RESULT);
                                        });
                                    }

                                    //submit all the rest together in 1 array of jsons
                                    if (transfers_to_process_all_at_once.length) {
                                        var array_of_STR_internalIDs = transfers_to_process_all_at_once.map(function (metadata) {
                                            return metadata.internalid;
                                        });
                                        current.processtype = "many to many transfers - all non-putaway";
                                        current.array_of_STR_internalIDs = array_of_STR_internalIDs.map(function (internalid_of_STR) {
                                            return {
                                                customrecord_wms_queue_records: Number(internalid_of_STR)
                                            };
                                        });

                                        var one_transfer_internalid = array_of_STR_internalIDs[0];
                                        var many_transfer_transactions = transfers_to_process_all_at_once.map(function (metadata) {
                                            return metadata.transactions;
                                        });
                                        var many_transfer_referenceType = many_transfer_transactions[0].ReferenceType;

                                        var many_transfer_options = generateInventoryTransactionOptions(many_transfer_referenceType, one_transfer_internalid, current);
                                        var TRANSFER_RESULTS = process_transaction_to_NS(many_transfer_transactions, many_transfer_options);

                                        array_of_STR_internalIDs.forEach(remove_processed_STR_from, internalids_of_unprocessed_transfers);
                                        output.results.push(TRANSFER_RESULTS);
                                        log.debug("processed many to many transfers - all non-putaway " + referenceid, TRANSFER_RESULTS);
                                    }
                                } //inventory transfer part
                                else if (many_records_options.recordtype === record.Type.INVENTORY_STATUS_CHANGE && transfers_ignored) {
                                    var ignoreStatusChange_of_xfer_with_work = scale_utils.updateQueueRecord(ONE_queueRecordId, "IGNORE", "Transfer With Work - Ignoring Status Change");
                                    if (ignoreStatusChange_of_xfer_with_work) {
                                        var status_result = {
                                            success: true,
                                            data: {
                                                statuschangeSTR_ignored: ONE_queueRecordId
                                            },
                                            processtype: current.processtype
                                        };

                                        remove_processed_STR_from(ONE_queueRecordId, internalids_of_unprocessed_transfers);
                                        output.results.push(status_result);
                                        log.debug("status change ignored " + referenceid, status_result);
                                    } else {
                                        throw "Failed to update Queue Record? " + ONE_queueRecordId;
                                    }
                                } //inventory status part
                                else {
                                    var count = 1;
                                    var total = TXNmetadata_array.length;
                                    log.debug("processing MANY_TO_MANY_but_one_at_a_time " + referenceid, total);
                                    TXNmetadata_array.forEach(function (ONE_metadata) {
                                        current.processtype = "many to many ";
                                        var ONE_transactions = ONE_metadata.transactions;
                                        var transactions = ONE_transactions instanceof Array ? ONE_transactions : [ONE_transactions];
                                        var transaction = transactions[0];
                                        var ONE_referenceType = transaction.ReferenceType;
                                        var ONE_queueRecordId = ONE_metadata.internalid;

                                        var MANY_TO_MANY_options = generateInventoryTransactionOptions(ONE_referenceType, ONE_queueRecordId, current);
                                        var MANY_TO_MANY_but_one_at_a_time = process_transaction_to_NS(transactions, MANY_TO_MANY_options);

                                        remove_processed_STR_from(ONE_queueRecordId, internalids_of_unprocessed_transfers);
                                        output.results.push(MANY_TO_MANY_but_one_at_a_time);
                                        log.debug("processed many to many " + ONE_referenceType + ", " + count + " of " + total, MANY_TO_MANY_but_one_at_a_time);
                                    });
                                    log.debug("processed MANY_TO_MANY_but_one_at_a_time " + referenceid, output.results);
                                }

                            }); //for each on outer array of arrays

                        } //if many to one or many to many

                    } catch (error) {
                        output.ERROR_OCCURRED = true;
                        current.error = error;
                        log.error("UNCAUGHT error creating many STR", current);

                        if (internalids_of_unprocessed_transfers.length) {
                            var ERROR_or_IGNORE = unrecognized_type ? "IGNORE" : "ERROR";
                            updateAllQueueRecords({
                                array_of_STR_internalIDs: internalids_of_unprocessed_transfers
                            }, ERROR_or_IGNORE, current);
                        }

                        output.results.push(current);
                    }
                } //for in referenceid
                return output;
            }

            /**
             * Performs the logic to process the transaction in 3 steps:  prep the record, submit the record, log the results
             * @param {Array}  transactions
             * @param { {customrecord_wms_queue_records: number, recordtype: string, adjustmentaccount: string, multipleXMLs: boolean, processtype: string, [array_of_STR_internalIDs]: Array, ReferenceType: string} }  options
             * @returns { {success: boolean, data: {[error]: string} } }
             */
            function process_transaction_to_NS(transactions, options) {
                //figure out what type of transaction this is
                var output = {
                    success: false,
                    data: {},
                    processtype: options.processtype
                };

                if (options.recordtype) {
                    var preparation = prepare_inventorytransaction(transactions, options);
                    log.debug("post-preparation results", {
                        success: preparation.success,
                        error: preparation.error,
                        nothinghappened: preparation.nothinghappened,
                        record: !!preparation.record
                    });
                    var success = submit_inventorytransaction(preparation, options);

                    if (success) {
                        output.success = true;
                        output.data[options.recordtype] = success;
                    } else {
                        output.data.error = preparation.error;
                    }
                } else {
                    output.data.error = "process_txn_to_NS - Could not find lookup of the record type via reference type | " + options.ReferenceType;
                    output.data.options = options;
                    updateAllQueueRecords(options, "IGNORE", output);
                }
                return output;
            }

            /**
             * @param {string[]} array_of_STR_internalIDs
             * @return { {internalid: string, transaction: object}[] }
             */
            function combine_TXNmetadata_of_many_STR(array_of_STR_internalIDs) {
                var combined_transactions = [];

                array_of_STR_internalIDs.forEach(function (internalid) {
                    combined_transactions.push({
                        internalid: internalid,
                        transactions: get_transactions_from_STR(internalid)
                    });
                });

                return combined_transactions;
            }

            function get_transactions_from_STR(internalid) {
                var str_string = search.lookupFields({
                    type: "customrecord_wms_queue_records",
                    id: internalid,
                    columns: ["custrecord_wms_json"]
                })["custrecord_wms_json"];
                var str_json = JSON.parse(str_string);
                var str_transactions = str_json.WMWDATA.WMFWUpload.TransHistories.TransactionHistory;
                return str_transactions;
            }

            /**
             * Determines which Inventory Transaction record to create, and generates parameters
             *
             * @param {string} referenceType
             * @param {number} queueRecordId
             * @param { {processtype: string } }  params
             * @returns { {recordtype: string, adjustmentaccount: string, customrecord_wms_queue_records: number, multipleXMLs: boolean, ReferenceType: string, processtype: string} }
             */
            function generateInventoryTransactionOptions(referenceType, queueRecordId, params) {
                var output = {
                    recordtype: "",
                    adjustmentaccount: "",
                    customrecord_wms_queue_records: queueRecordId,
                    multipleXMLs: false,
                    ReferenceType: referenceType,
                    processtype: ""
                };
                for (var key in params) {
                    if (params.hasOwnProperty(key))
                        output[key] = params[key];
                }

                try {

                    var default_adjustmentaccount = "246"; //Defaults at 5021 Cost of Goods Sold : COGS-OTHER : Cycle Count Adjustments

                    var Fields = {
                        ACCOUNT: "custrecord_ns_account",
                        TRANSTYPE: "custrecord_trans_type",
                        MULTIPLEXML: "custrecord_multiple_xmls"
                    };

                    //grab all the values defined in Fields above
                    var crossref = scale_utils.lookup_internalID_or_more({
                        TYPE: "customrecord_scale_reason_code_cross_ref",
                        FIELD: "custrecord_scale_reason_code",
                        VALUE: referenceType
                    },
                    [Fields.ACCOUNT, Fields.TRANSTYPE, Fields.MULTIPLEXML]
                    );
                    if (crossref) {

                        //set recordtype
                        var transactiontype = crossref[Fields.TRANSTYPE].text;
                        if (transactiontype) {
                            var formatted_recordtype = transactiontype.replace(/[ ]/g, "_").toUpperCase(); // "Inventory Status Change" => "INVENTORY_STATUS_CHANGE"
                            output.recordtype = record.Type[formatted_recordtype];
                        }

                        //set adjustmentaccount
                        output.adjustmentaccount = crossref[Fields.ACCOUNT].value || default_adjustmentaccount;

                        //determine if multiple xmls are needed
                        output.multipleXMLs = crossref[Fields.MULTIPLEXML].value;
                    } else {
                        output.message = "generateOptions - could not find crossref record for " + referenceType;
                        var strid_of_reftype_not_found = output.array_of_STR_internalIDs ? output.array_of_STR_internalIDs : output.customrecord_wms_queue_records;
                        log.debug(output.message, output);

                        updateAllQueueRecords(strid_of_reftype_not_found, "IGNORE", output);
                    }

                } catch (error) {
                    log.error({
                        title: "Could not generate Inventory Transaction Options",
                        details: error
                    });
                }

                log.debug("pre-preparation options generated", output);
                return output;
            }

            /**
             * Prepares the Inventory Transaction Record. Part 1 of 3 steps: preps the record data, submits the record, logs the results
             *
             * @param {Array} transactions fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
             * @param { {recordtype: string, [adjustmentaccount]: string, [array_of_STR_internalIDs]: string[]} } options
             * @returns { {success: boolean, [error]: object, [record]: object, [nothinghappened]: boolean } }
             */
            function prepare_inventorytransaction(transactions, options) {

                //create the record and set all the values, but not submit yet.  saving the record is done during the error handling.
                var result = {
                    success: false, //ALWAYS PRESENT
                    error: null, //ONLY PRESENT WHEN SUCCESS FALSE
                    record: null //ONLY PRESENT WHEN SUCCESS TRUE
                };

                switch (options.recordtype) {
                case "inventoryadjustment":
                    return prepare_inventoryadjustment(transactions, options.adjustmentaccount);
                case "inventorystatuschange":
                    return prepare_inventorystatuschange(transactions);
                case "inventorytransfer":
                    return prepare_inventorytransfer(transactions);
                case "assemblybuild":
                    return prepare_assemblybuild(transactions, options);
                default:
                    result.error = {
                        title: options.recordtype,
                        details: "Record Type sent from SCALE is not supported by NetSuite interface"
                    };
                    return result;
                }

            }

            /**
             * Submits the Inventory Transaction Record and logs results. Part 2 and 3 of 3 steps: preps the record data, submits the record, logs the results
             *
             * @param { {success: boolean, [error]: object, [record]: object, [nothinghappened]: boolean} } preparation
             * @param { {customrecord_wms_queue_records: number, recordtype: string, adjustmentaccount: string, multipleXMLs: boolean, processtype: string, [array_of_STR_internalIDs]: Array}} options
             */
            function submit_inventorytransaction(preparation, options) {

                //error handling starts here, as well as the record submit
                var error_on_save_record = null;
                var inventorytransactionid = null;

                if (!preparation.success) {
                    //error occurred during prepare phase

                    if (preparation.nothinghappened) {
                        var do_not_process = updateAllQueueRecords(options, "IGNORE", preparation.error);
                        return "IGNORED";
                    } else {
                        log.audit(preparation.error);
                        var prepare_failed = updateAllQueueRecords(options, "ERROR", preparation.error);
                    }

                    return false; //break out of function
                } else {
                    //prepping data was fine. now time to save the created record
                    try {
                        //every inventory transaction record created needs to reference the STR for easy resubmit/update/debug/reference

                        var records = preparation.record instanceof Array ? preparation.record : [].concat(preparation.record);
                        var record = records[0];
                        inventorytransactionid = saveRecord_and_log(record);

                        // //turn this on if you need to process a one-to-many with only 1 child, like a transfer then a status
                        // if (inventorytransactionid && records[1]){
                        //     //only come in here when we need to create both an inventorytransfer and an inventorystatuschange
                        //
                        //     //YES WE ARE HARDCODING to create a new status change record.  sorry future developer
                        //     var successful_inventory_transfer = updateAllQueueRecords(options, "COMPLETE", inventorytransactionid);
                        //     var dependent_record = record[1];
                        //     var child_inventorytransactionid = saveRecord_and_log(dependent_record);
                        //     if (child_inventorytransactionid){
                        //         record.submitFields({
                        //             type: options.recordtype,
                        //             id: inventorytransactionid,
                        //             values: {
                        //                 custbody_associated_inventorystatus: child_inventorytransactionid
                        //             }
                        //         })
                        //     } else {
                        //         error_on_save_record = "Uncaught on creating the Inventory Status Change record"
                        //     }
                        // }

                    } catch (error) {
                        error_on_save_record = error;
                    }
                }

                if (!error_on_save_record && inventorytransactionid) {
                    //record created and saved successfully
                    var successful_creation = updateAllQueueRecords(options, "COMPLETE", inventorytransactionid);

                    return inventorytransactionid; //YAY HAPPY PATH
                } else {

                    //record created via code, but failed to record.save()
                    log.audit({
                        title: "FAILED to save " + options.recordtype,
                        details: error_on_save_record
                    });
                    preparation.error = error_on_save_record;
                    var save_failed = updateAllQueueRecords(options, "ERROR", error_on_save_record);

                    return false;
                }

                function saveRecord_and_log(record) {
                    var inventorytransactionid = null;
                    record.setValue({
                        fieldId: "custbody_scale_transaction",
                        value: options.customrecord_wms_queue_records
                    });
                    inventorytransactionid = record.save();
                    log.audit({
                        title: "SUCCESS",
                        details: options.recordtype + ":" + inventorytransactionid
                    });
                    return inventorytransactionid;
                }

            }

            function updateAllQueueRecords(options, ACTION, DATA) {
                var one_internalID = options.customrecord_wms_queue_records;
                var all_internalIDs = options.array_of_STR_internalIDs;
                if (all_internalIDs) {
                    all_internalIDs = all_internalIDs.map(function (internalid) {
                        if (typeof internalid === "object") {
                            return internalid.customrecord_wms_queue_records;
                        } else {
                            return internalid;
                        }
                    });
                }

                var counter = 0;
                var queueRecordsToUpdate = all_internalIDs ? all_internalIDs : [one_internalID];
                queueRecordsToUpdate.forEach(function (oneQueueRecordID) {
                    var updateOneQueueRecord = scale_utils.updateQueueRecord(oneQueueRecordID, ACTION, DATA);
                    if (updateOneQueueRecord) {
                        counter++;
                    }
                });
                return counter === queueRecordsToUpdate.length;
            }


            function remove_processed_STR_from(processed_internalid, array_to_remove_from) {
                if (array_to_remove_from instanceof Array) {
                    //used when called on straight up
                    var processed_internalid_index = array_to_remove_from.indexOf(processed_internalid);
                    if (processed_internalid_index > -1) {
                        array_to_remove_from.splice(processed_internalid_index, 1);
                    }
                } else if (typeof processed_internalid === "string" || typeof processed_internalid === "number") {
                    //used as helper function in Array.forEach
                    processed_internalid_index = this.indexOf(processed_internalid);
                    if (processed_internalid_index > -1) {
                        this.splice(processed_internalid_index, 1);
                    }
                }
            }


            /**
             * Processes a SCALE Inventory Adjustment of one location to create a NS Adjustment with 1 line item.
             * @param {Array}   transactions    fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
             * @param {string} adjustmentaccount  GL account that the invadj posts to.  Configured in the SCALE Reason Code Xref
             * @returns { {success: boolean, [record]: record.Record, [error]: {title: string, details: any}} }  returns record on success, error on fail
             */
            function prepare_inventoryadjustment(transactions, adjustmentaccount) {
                var output = {
                    success: false
                };

                if (check_if_work_is_not_complete(transactions)) { //adjustment
                    output.error = "Skipping Inventory Adjustment creation:  No quantities changed";
                    output.nothinghappened = true;
                    return output;
                }
                try {
                    var transaction = transactions[0];

                    //grab all required netsuite values from the XML, and set to variables
                    var Company = scale_utils.get_netsuite_company_code_reference(transaction.Company);
                    var WorkZone_or_Warehouse = get_warehouse_id(transaction.Warehouse, Company, transaction.WorkZone);

                    var ToWarehouse_or_Warehouse = transaction.ToWarehouse || transaction.Warehouse;
                    var ToCompany_or_Company = transaction.ToCompany || transaction.Company;
                    var ToWorkZone_or_Warehouse = get_warehouse_id(ToWarehouse_or_Warehouse, ToCompany_or_Company, transaction.WorkZone);

                    var item_lookup = scale_utils.lookup_internalID_or_more({
                        VALUE: transaction.Item,
                        FIELD: "custitem_sku",
                        TYPE: "item"
                    }, ["custitem_uom_numeral", "unitstype"]);
                    var Item = item_lookup.id;

                    var unitstype = item_lookup["unitstype"].value;
                    if (unitstype) {
                        var Units = uomBaseUnit.uomJson[unitstype];
                    }

                    var direction = transaction.Direction;
                    var sign = direction === "From" ? -1 : 1; // Direction "To" means it will be positive, such as 1234 | Direction "From" means it will be negative, such as -29
                    var Quantity_from_xml = transaction.Quantity;
                    var Quantity_formatted = parseInt(Quantity_from_xml, 10) * sign;
                    var Quantity_in_baseunit = parseInt(Quantity_formatted, 10);

                    // var UOM = item_lookup['custitem_uom_numeral'].value;
                    // var qty_corrected = Quantity_in_baseunit / UOM;
                    // var qty_adjusted = qty_corrected * sign;
                    // var Quantity_in_saleunit = Number(qty_corrected.toFixed(8));

                    var inventorystatus_from_xml = transaction.AfterSts || transaction.BeforeSts;
                    var AfterSts_or_BeforeSts = scale_utils.lookup_internalID_or_more({
                        TYPE: "inventorystatus",
                        FIELD: "name",
                        VALUE: inventorystatus_from_xml
                    });

                    //put all required body fields inside the BODY object, sublist in SUBLIST object, for the function to loop through
                    var REQUIRED_INVENTORYADJUSTMENT_FIELDS = {
                        BODY: {
                            subsidiary: Company,
                            adjlocation: WorkZone_or_Warehouse,
                            account: adjustmentaccount // 5021 Cost of Goods Sold : COGS-OTHER : Cycle Count Adjustments
                        },
                        SUBLIST: {
                            inventory: [{
                                item: Item,
                                location: ToWorkZone_or_Warehouse,
                                units: Units,
                                adjustqtyby: Quantity_in_baseunit,
                                inventorydetail: {
                                    inventorystatus: AfterSts_or_BeforeSts,
                                    quantity: Quantity_in_baseunit
                                }
                            }]
                        }
                    };
                    if (!Units) {
                        delete REQUIRED_INVENTORYADJUSTMENT_FIELDS.SUBLIST.inventory[0].units;
                    }


                    var inventoryadjustment_options = {
                        recordtype: "inventoryadjustment",
                        isDynamic: true
                    };
                    return prepare_netsuite_record(inventoryadjustment_options, REQUIRED_INVENTORYADJUSTMENT_FIELDS);

                } catch (adjustment_error) {
                    output.error = {
                        title: "Prepare Inventory Adjustment Error",
                        input: REQUIRED_INVENTORYADJUSTMENT_FIELDS,
                        details: adjustment_error
                    };
                }

                return output;

            }

            /**
             * Processes a SCALE Status Change of one location in the Warehouse.
             * XML is generated on a Status Change, or an Inventory Transfer where the destination location status is different than the original
             * @param {Array} transactions fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
             * @returns { {success: boolean, [record]: record.Record, [error]: {title: string, details: any}} }  returns record on success, error on fail
             */
            function prepare_inventorystatuschange(transactions) {
                var output = {
                    success: false
                };
                try {
                    var transaction = transactions[0];

                    //grab all required netsuite values from the XML, and set to variable
                    var Company = scale_utils.get_netsuite_company_code_reference(transaction.Company);
                    var WorkZone_or_Warehouse = get_warehouse_id(transaction.Warehouse, Company, transaction.WorkZone);
                    var BeforeSts = scale_utils.lookup_internalID_or_more({
                        TYPE: "inventorystatus",
                        FIELD: "name",
                        VALUE: transaction.BeforeSts
                    });
                    var AfterSts = scale_utils.lookup_internalID_or_more({
                        TYPE: "inventorystatus",
                        FIELD: "name",
                        VALUE: transaction.AfterSts
                    });
                    var Item = scale_utils.lookup_internalID_or_more({
                        TYPE: "item",
                        FIELD: "custitem_sku",
                        VALUE: transaction.Item
                    });
                    var Quantity = parseInt(transaction.Quantity, 10);
                    //var ActivityDateTime = new Date(transaction.ActivityDateTime);

                    //put all required body fields inside the BODY object, sublist in SUBLIST object, for the function to loop through
                    var REQUIRED_INVENTORYSTATUS_FIELDS = {
                        BODY: {
                            subsidiary: Company,
                            location: WorkZone_or_Warehouse,
                            previousstatus: BeforeSts,
                            revisedstatus: AfterSts
                        },
                        SUBLIST: {
                            inventory: [{
                                item: Item,
                                quantity: Quantity
                                //TODO units not set here. if netsuite changes code and no longer always uses baseunit, add itemunits
                            }]
                        }
                    };

                    var inventorystatuschange_options = {
                        recordtype: "inventorystatuschange",
                        isDynamic: false
                    };
                    output = prepare_netsuite_record(inventorystatuschange_options, REQUIRED_INVENTORYSTATUS_FIELDS);
                } catch (statuschange_error) {
                    output.error = {
                        title: "Could not prepare Inventory Status Change Record",
                        input: REQUIRED_INVENTORYSTATUS_FIELDS,
                        details: statuschange_error
                    };
                }

                return output;

            }

            /**
             * Processes two XMLs of an inventory transfer from one location to another.
             * or Processes one XML on Work Unit End to create an Inventory Transfer to/from one NS location to another via SCALE workzone.
             * or ignores the two XMLs
             * @param {Array} transactions fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
             * @returns { {success: boolean, [record]: record.Record, [error]: {title: string, details: any}} }  returns record on success, error on fail
             */
            function prepare_inventorytransfer(transactions) {
                var output = {
                    success: false
                };

                if (check_if_invalid_transfertype(transactions)) {
                    output.error = "Skipping Inventory Transfer creation:  Unrecognized Transaction Type";
                    output.nothinghappened = true;
                    return output;
                }

                if (check_if_work_is_not_complete(transactions) && transactions.length > 1) { //transfer
                    output.error = "Skipping Inventory Transfer creation:  XML is generated during Work Creation";
                    output.nothinghappened = true;
                    return output;
                }

                try {
                    var result = get_transfer_data_from_JSON(transactions);
                    if (result.success) {
                        var inventorytransferoptions = {
                            recordtype: result.recordtype,
                            isDynamic: result.isDynamic
                        };
                        return prepare_netsuite_record(inventorytransferoptions, result.prep); //transfer
                    } else {
                        if (result.nothinghappened) {
                            output.nothinghappened = result.nothinghappened;
                            output.error = result.error;
                        }
                    }


                } catch (transfer_error) {
                    output.success = false;

                    output.error = {
                        title: "Prepare Inventory Transfer Error Caught",
                        input: result.prep,
                        details: transfer_error
                    };
                }

                return output;

                /**
                 * Used to skip XMLs of a type where the code does not know how to process the XML keys format
                 * @param {Array} transactions fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
                 * @return {boolean}
                 */
                function check_if_invalid_transfertype(transactions) {
                    var transactiontype_is_invalid = false;
                    var valid_descriptions = {
                        "PUTAWAY CONFIRMATION": true,
                        "INVENTORY TRANSFER": true,
                        "WORK INSTRUCTION DELETE": false,
                        "WORK UNIT START": false, //wont send because these dont have a ReferenceType, they have a WorkType
                        "PICK CONFIRMATION": false,
                        "WORK UNIT END": false,
                        "every other unknown type will become": false
                    };

                    transactions.forEach(function (transaction) {
                        var description_from_XML = transaction.TransactionTypeDescription || "";
                        description_from_XML = description_from_XML.toUpperCase();
                        if (!valid_descriptions[description_from_XML]) {
                            transactiontype_is_invalid = true;
                        }
                    });

                    return transactiontype_is_invalid;
                }

                /**
                 * Takes XML data and returns it in a JSON to process into NetSuite in the prepare_netsuite_record function
                 * @param {Array} transactions fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
                 * @return { {recordtype: string, isDynamic: boolean, [nothinghappened]: boolean, [error]: any, prep: {BODY: {subsidiary: string, location: string, transferlocation: string}, [SUBLIST]: {inventory: [{item: string, adjustqtyby: number, inventorydetail: {inventorystatus: string, toinventorystatus: string, quantity: number} }]} } } }
                 */
                function get_transfer_data_from_JSON(transactions) {
                    var output = {};
                    output.success = false;

                    var TRANSFER_WITHOUT_WORK = transactions.length === 2;
                    var TRANSFER_WITH_WORK = transactions.length === 1;

                    if (TRANSFER_WITHOUT_WORK) {
                        var transaction_from = transactions[0].Direction === "From" ? transactions[0] : transactions[1];
                        var transaction_to = transactions[0].Direction === "To" ? transactions[0] : transactions[1];
                    } else if (TRANSFER_WITH_WORK) {
                        transaction_from = transactions[0];

                        var description = transaction_from.TransactionTypeDescription || "";

                        var PUTAWAY = description.toUpperCase() === "PUTAWAY CONFIRMATION";
                        var CUSTOM_PUTAWAY =
                            transaction_from.UserDef1 || //workzone from
                            transaction_from.UserDef2 || //workzone to
                            transaction_from.UserDef3 || //from location that isnt used cuz this is a scale location
                            transaction_from.UserDef4; //reference ID to join to the Work Creation

                        if (PUTAWAY) {
                            if (CUSTOM_PUTAWAY) {
                                //we in our custom endpoint! LETS GOOOOOOOOOOOOO
                            } else {
                                output.success = false;
                                output.nothinghappened = true;
                                output.error = "Transfer with Work? - Only 1 XML received, but it is not our custom exit point for 'Putaway confirmation'";
                                return output;
                            }
                        } else {
                            //these arent the droids youre looking for.  move along
                        }
                    }

                    var Company = scale_utils.get_netsuite_company_code_reference(transaction_from.Company);

                    var item_lookup = scale_utils.lookup_internalID_or_more({
                        VALUE: transaction_from.Item,
                        FIELD: "custitem_sku",
                        TYPE: "item"
                    }, ["custitem_uom_numeral", "unitstype"]);
                    var Item = item_lookup.id;

                    var Quantity_from_xml = transaction_from.Quantity;
                    var Quantity_in_baseunit = parseInt(Quantity_from_xml, 10);

                    var unitstype = item_lookup["unitstype"].value;
                    if (unitstype) {
                        var Units = uomBaseUnit.uomJson[unitstype];
                    }

                    // var UOM = item_lookup['custitem_uom_numeral'].value;
                    // var qty_corrected = Quantity_in_baseunit / UOM;
                    // var Quantity_in_saleunit = Number(qty_corrected.toFixed(8));

                    var BeforeSts = scale_utils.lookup_internalID_or_more({
                        VALUE: transaction_from.BeforeSts,
                        FIELD: "name",
                        TYPE: "inventorystatus"
                    }); //use for xfer, both sts
                    var after_sts = TRANSFER_WITHOUT_WORK ? transaction_to.AfterSts : transaction_from.AfterSts;
                    var AfterSts = scale_utils.lookup_internalID_or_more({
                        VALUE: after_sts,
                        FIELD: "name",
                        TYPE: "inventorystatus"
                    }); //use for status change only

                    var location_from = TRANSFER_WITHOUT_WORK ?
                        get_warehouse_id(transaction_from.Warehouse, Company, transaction_from.WorkZone) :
                        get_warehouse_id(transaction_from.Warehouse, Company, transaction_from.UserDef1);
                    var location_to = TRANSFER_WITHOUT_WORK ?
                        get_warehouse_id(transaction_to.Warehouse, Company, transaction_to.WorkZone) :
                        get_warehouse_id(transaction_from.Warehouse, Company, transaction_from.UserDef2);

                    if (TRANSFER_WITHOUT_WORK) {
                        var WorkZone_from = location_from;
                        var WorkZone_to = location_to;
                    } else {
                        var UserDef1 = location_from;
                        var UserDef2 = location_to;
                    }

                    var turn_on_logs_for_this_function = true;
                    var logger = {
                        from: location_from,
                        to: location_to,
                        work: TRANSFER_WITH_WORK,
                        without: TRANSFER_WITHOUT_WORK,
                        BeforeSts: BeforeSts,
                        AfterSts: AfterSts
                    };

                    if (location_from !== location_to) {
                        //diff location
                        if (TRANSFER_WITHOUT_WORK) {
                            //same onhandqty already filtered out and skipped earlier
                            var REQUIRED_FIELDS_INVENTORYTRANSFER_WITHOUT_WORK = {
                                BODY: {
                                    subsidiary: Company,
                                    location: WorkZone_from,
                                    transferlocation: WorkZone_to
                                },
                                SUBLIST: {
                                    inventory: [{
                                        item: Item,
                                        adjustqtyby: Quantity_in_baseunit, //no longer Quantity_in_saleunit
                                        units: Units,
                                        inventorydetail: {
                                            inventorystatus: BeforeSts,
                                            toinventorystatus: BeforeSts, //this is intentional as it allows us to process the status separately
                                            quantity: Quantity_in_baseunit
                                        }
                                    }]
                                }
                            };
                            if (!Units) {
                                delete REQUIRED_FIELDS_INVENTORYTRANSFER_WITHOUT_WORK.SUBLIST.inventory[0].units;
                            }

                            output.success = true;
                            output.recordtype = "inventorytransfer";
                            output.prep = REQUIRED_FIELDS_INVENTORYTRANSFER_WITHOUT_WORK;
                            logger.title = "diff location, without work";
                        } else if (TRANSFER_WITH_WORK) {
                            var REQUIRED_FIELDS_INVENTORYTRANSFER_WITH_WORK = {
                                BODY: {
                                    subsidiary: Company,
                                    location: UserDef1,
                                    transferlocation: UserDef2
                                },
                                SUBLIST: {
                                    inventory: [{
                                        item: Item,
                                        adjustqtyby: Quantity_in_baseunit,
                                        units: Units,
                                        inventorydetail: {
                                            inventorystatus: BeforeSts,
                                            toinventorystatus: AfterSts, //this is intentional as we need to set the status within this transfer
                                            quantity: Quantity_in_baseunit
                                        }
                                    }]
                                }
                            };
                            if (!Units) {
                                delete REQUIRED_FIELDS_INVENTORYTRANSFER_WITH_WORK.SUBLIST.inventory[0].units;
                            }

                            output.success = true;
                            output.recordtype = "inventorytransfer";
                            output.prep = REQUIRED_FIELDS_INVENTORYTRANSFER_WITH_WORK;
                            logger.title = "diff location, with work";
                        }
                    } else {
                        //same location
                        if (BeforeSts !== AfterSts) {
                            //different status, same location
                            if (TRANSFER_WITH_WORK) {
                                //different status, same location, with work
                                var REQUIRED_INVENTORYSTATUS_FIELDS = {
                                    BODY: {
                                        subsidiary: Company,
                                        location: UserDef2,
                                        previousstatus: BeforeSts,
                                        revisedstatus: AfterSts
                                    },
                                    SUBLIST: {
                                        inventory: [{
                                            item: Item,
                                            quantity: Quantity_in_baseunit
                                            //TODO units not set here. if netsuite changes code and no longer always uses baseunit, add itemunits
                                        }]
                                    }
                                };

                                output.success = true;
                                output.recordtype = "inventorystatuschange";
                                output.prep = REQUIRED_INVENTORYSTATUS_FIELDS;
                                logger.title = "different status, same location, with work";
                            } else {
                                //different status, same location, without work
                                //https://docs.google.com/spreadsheets/d/1wG5d8fODYJu9EcbDuNORk6wI2zDMbNd3w1FqVE6AX4Q/edit#gid=1321355946

                                //impossible, should have been taken care of since onhandqty is same before and after
                                output.success = false;
                                output.nothinghappened = true;
                                output.error = "Transfer without Work - Skipping TRANSFER, status change came in separately";
                                logger.title = "different status, same location, without work";
                            } //compare status
                        } else {
                            //same status, same location
                            if (TRANSFER_WITH_WORK) {
                                //with work
                                output.success = false;
                                output.nothinghappened = true;
                                output.error = "Transfer with Work - Skipping TRANSFER and STATUS CHANGE:  Same warehouse, same status";
                                logger.title = "same location, same status, with work";
                            } else {
                                //without work

                                //impossible, should have been taken care of since onhandqty is same before and after
                                output.success = false;
                                output.nothinghappened = true;
                                output.error = "Transfer without Work - Skipping TRANSFER and STATUS CHANGE:  Same warehouse, same status";
                                logger.title = "same location, same status, without work";
                            }
                        }
                    }
                    logger.output = output;
                    turn_on_logs_for_this_function ? log.debug(logger.title, logger) : false;

                    var DYNAMIC_MODES = {
                        inventorytransfer: true,
                        inventorystatuschange: false
                    };
                    output.isDynamic = DYNAMIC_MODES[output.recordtype] || false;

                    return output;
                }

            }

            /**
             * Used to skip XMLs that should not be processed.
             * these XMLs generally have a different SuspenseQty, but the same OnHandQty
             * @param { [{BeforeOnHandQty: string, AfterOnHandQty: string}] }    transactions
             * @return {boolean}    true when nothing happened in the XML, false if we should process the XML
             */
            function check_if_work_is_not_complete(transactions) {
                var work_not_complete = false;

                transactions.forEach(function (transaction) {
                    if (transaction["BeforeOnHandQty"] && transaction["AfterOnHandQty"]) {
                        if (transaction["BeforeOnHandQty"] === transaction["AfterOnHandQty"]) {
                            work_not_complete = true;
                        }
                    }
                });
                return work_not_complete;
            }

            /**
             * Processes a SCALE Work Order build complete to generate a NetSuite Assembly Build from an unspecified amount of XMLs
             * There are as many XMLs as there are components plus one; one XML for the finished good, one XML per component item
             * @param {Array} transactions fileTextObj.WMWDATA.WMFWUpload.TransHistories.TransactionHistory
             * @param { {recordtype: string, adjustmentaccount: string, customrecord_wms_queue_records: number, multipleXMLs: boolean, ReferenceType: string, processtype: string} } original_options
             * @returns { {success: boolean, [record]: record.Record, [error]: {title: string, details: any}} }  returns record on success, error on fail
             */
            function prepare_assemblybuild(transactions, original_options) {
                var output = {
                    success: false
                };
                var headerObj = transactions[0];
                var referenceID = headerObj.ReferenceID;
                var internalId = findWoInternalId(referenceID);

                try {
                    var finalQuantity = determineFinalBuildQuantity(transactions);
                    if (finalQuantity) {
                        if (!internalId) {
                            throw "Couldn't find WO to transform: " + referenceID;
                        }

                        var assemblyRec = record.transform({
                            fromType: record.Type.WORK_ORDER,
                            fromId: internalId,
                            toType: record.Type.ASSEMBLY_BUILD,
                            isDynamic: false
                        });

                        assemblyRec.setValue("quantity", finalQuantity);


                        var bodyInvDetail = assemblyRec.getSubrecord("inventorydetail");

                        bodyInvDetail.setSublistValue({
                            sublistId: "inventoryassignment",
                            fieldId: "inventorystatus",
                            line: 0,
                            value: 1 //Available
                        });

                        bodyInvDetail.setSublistValue({
                            sublistId: "inventoryassignment",
                            fieldId: "quantity",
                            line: 0,
                            value: finalQuantity
                        });
                    } else if (!finalQuantity) {
                        var first_two_letters_of_referenceID = referenceID.toString().substring(0,2);
                        if (!internalId && first_two_letters_of_referenceID !== "WO") {
                            //now need to process -WO Component as an Inventory Adjustment.
                            var new_referenceType = "__ Component Adjustment __";
                            var new_params = {};
                            var old_keys_to_take_from_original_options = ["processtype", "referenceid", "array_of_STR_internalIDs"];
                            old_keys_to_take_from_original_options.forEach(function(key){
                                if (original_options[key]){
                                    new_params[key] = original_options[key];
                                }
                            });

                            var adjustment_options = generateInventoryTransactionOptions(new_referenceType, original_options.customrecord_wms_queue_records, new_params);
                            var adjustment_result = prepare_inventoryadjustment(transactions, adjustment_options.adjustmentaccount);
                            return adjustment_result;

                        } else {
                            output.error = "Ignoring -WO Component that come in alone without their +WO Finished Good and without WO#";
                            output.nothinghappened = true;
                        }
                    }

                } catch (assemblybuild_error) {
                    output.error = {
                        title: "Could not prepare Assembly Build Record",
                        details: assemblybuild_error
                    };
                }

                if (!output.error) {
                    output.success = true;
                    output.record = assemblyRec;
                }

                return output;


                function findWoInternalId(docNumber) {
                    var internalId = false;

                    var workorderSearchObj = search.create({
                        type: "workorder",
                        filters: [
                            ["numbertext", "is", docNumber],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["type", "anyof", "WorkOrd"]
                        ],
                        columns: [
                            "internalid"
                        ]
                    });

                    workorderSearchObj.run().each(function (result) {
                        internalId = result.getValue("internalid");
                        return false;
                    });

                    return internalId;
                }

                function determineFinalBuildQuantity(transArray) {
                    //array of objs ReferenceType
                    var finalQuantity = false;

                    function finishedGood(transObj) {
                        return transObj.ReferenceType === "+ WO Finished Good";
                    }

                    var filteredArray = transArray.filter(finishedGood);

                    if (filteredArray.length === 1) {
                        finalQuantity = filteredArray[0].Quantity;
                    }
                    finalQuantity = parseInt(finalQuantity, 10);

                    return finalQuantity;
                }

            }

            function findItemUOM(itemId) {
                var UOM = 1;
                var fieldLookUp = search.lookupFields({
                    type: search.Type.INVENTORY_ITEM,
                    id: itemId,
                    columns: ["custitem_uom_numeral"]
                });


                if (fieldLookUp.custitem_uom_numeral) {
                    UOM = Number(fieldLookUp.custitem_uom_numeral);
                }

                return UOM;
            }

            function findItemId(sku) {
                var itemId = false;

                var itemSearchObj = search.create({
                    type: "item",
                    filters: [
                        ["custitem_sku", "is", sku],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        "internalid"
                    ]
                });

                itemSearchObj.run().each(function (result) {
                    itemId = result.getValue("internalid");
                    return false;
                });

                return itemId;
            }

            /**
             *
             * @param {string} warehouse
             * @param {string} subsidiary
             * @param {string} workzone
             * @return {boolean|string}
             */
            function get_warehouse_id(warehouse, subsidiary, workzone) {
                var subsidiary_value = subsidiary.toString().length > 2 ? scale_utils.get_netsuite_company_code_reference(subsidiary) : subsidiary;
                //line above breaks when there are 100 subsidiaries or more

                var workzoneId = false;
                var warehouseId = false;

                var locationSearchObj = search.create({
                    type: "location",
                    filters: [
                        ["custrecord_wms_location_reference", "is", warehouse],
                        "AND",
                        ["subsidiary", "is", subsidiary_value],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        "internalid",
                        "custrecord_wms_workzone"
                    ]
                });

                locationSearchObj.run().each(function (result) {
                    var searchWorkzone = result.getValue("custrecord_wms_workzone");
                    var locationInternalId = result.getValue("internalid");
                    if (workzone == searchWorkzone) { //Workzone Match - Lets stop here
                        workzoneId = locationInternalId;
                        return false;
                    } else if (!searchWorkzone) { //If workzone is ever empty on a location - This means this is a main location EX: "KB: Garden Grove, CA"
                        warehouseId = locationInternalId;
                        //we continue looping because if many locations have the same reference, we need to keep looping until we can potentially find one.
                        //example:  4 NS locations with "CA-GG" for GG Celeritas, GG Samples, GG New, GG Old.  We loop through until we can find a Sample location, or default to the Warehouse.
                    }
                    return true;
                });

                if (workzoneId) {
                    return workzoneId;
                } else {
                    return warehouseId;
                }
            }

        }

        //==========================================================================================
        // Helper Functions
        //==========================================================================================

        /**
         * Creates a NetSuite record according to a JSON that is in the format of the record.  isDynamic initializes false
         * @param { {recordtype: string, [isDynamic]: boolean } } options
         * @param { {BODY: {}, [SUBLIST]: {} } } REQUIREDFIELDS
         *
         * @returns {{success: boolean, [record]: record.Record, [error]: {title: string, details: any} }}
         */
        function prepare_netsuite_record(options, REQUIREDFIELDS) {
            log.debug({
                title: options.recordtype,
                details: REQUIREDFIELDS
            });

            var output = {
                success: false
            };

            var rec = record.create({
                type: options.recordtype,
                isDynamic: options.isDynamic || false
            });
            var MISSINGFIELDS = {
                BODY: [],
                SUBLIST: {}
            };
            var missing_required_fields = false;

            //loops through all body fields
            for (var bodyfield in REQUIREDFIELDS.BODY) {

                //set body values one-by-one
                var bodyvalue = REQUIREDFIELDS.BODY[bodyfield];
                if (bodyvalue) {
                    rec.setValue({
                        fieldId: bodyfield,
                        value: bodyvalue
                    });
                } else {
                    //log any fields that are missing
                    missing_required_fields = true;
                    MISSINGFIELDS.BODY.push(bodyfield);
                }
            } //for in loop, body fields

            //loops through all sublist columns
            for (var sublistname in REQUIREDFIELDS.SUBLIST) {
                //we are inside a sublist.  if there is more than one sublist, the next sublist would start back up here.
                if (sublistname) {
                    //example:  inventory
                    //there could be many lineitems per sublist. only go forward if we have any lineitems to parse
                    var sublist = REQUIREDFIELDS.SUBLIST[sublistname];
                    if (sublist.length) {
                        for (var lineitem = 0; lineitem < sublist.length; lineitem++) {
                            //object within the sublist array

                            //select lineitem
                            var row = sublist[lineitem];
                            var inventorydetail = false;

                            if (options.isDynamic) {
                                rec.selectLine({
                                    sublistId: sublistname,
                                    line: lineitem
                                });
                            }

                            for (var columnname in row) {
                                //loop through each lineitem column and set values
                                //example:  item, quantity

                                var columnvalue = row[columnname];

                                //skip inventory detail, until later
                                if (columnname === "inventorydetail") {
                                    inventorydetail = columnvalue;
                                    continue;
                                }

                                //check if column values are provided
                                if (columnvalue) {
                                    //set column values one-by-one
                                    if (options.isDynamic) {
                                        rec.setCurrentSublistValue({
                                            sublistId: sublistname,
                                            fieldId: columnname,
                                            value: columnvalue
                                        });
                                    } else {
                                        rec.setSublistValue({
                                            sublistId: sublistname,
                                            line: lineitem,
                                            fieldId: columnname,
                                            value: columnvalue
                                        });
                                    }

                                } else {
                                    missing_required_fields = true;
                                    var missing_sublist_fields = MISSINGFIELDS.SUBLIST[sublistname];
                                    if (!(missing_sublist_fields instanceof Array)) {
                                        missing_sublist_fields = [];
                                        MISSINGFIELDS.SUBLIST[sublistname] = missing_sublist_fields;
                                    }
                                    missing_sublist_fields.push(columnname);
                                } //if column has value, set it!

                            } //for in loop, lineitems have columns

                            //check inventory detail and set it
                            if (inventorydetail && sublistname === "inventory") {

                                //get the subrecord so we can set the values
                                if (options.isDynamic) {
                                    var inventorydetail_subrecord = rec.getCurrentSublistSubrecord({
                                        sublistId: sublistname,
                                        fieldId: "inventorydetail"
                                    });
                                    inventorydetail_subrecord.selectLine({
                                        sublistId: "inventoryassignment",
                                        line: 0
                                    });
                                } else {
                                    inventorydetail_subrecord = rec.getSublistSubrecord({
                                        sublistId: sublistname,
                                        line: lineitem,
                                        fieldId: "inventorydetail"
                                    });
                                }
                                for (var detail_fieldname in inventorydetail) {
                                    var detail_fieldvalue = inventorydetail[detail_fieldname];

                                    //set the values in the subrecord
                                    if (detail_fieldvalue) {
                                        if (options.isDynamic) {
                                            inventorydetail_subrecord.setCurrentSublistValue({
                                                sublistId: "inventoryassignment",
                                                fieldId: detail_fieldname,
                                                value: detail_fieldvalue
                                            });
                                        } else {
                                            inventorydetail_subrecord.setSublistValue({
                                                sublistId: "inventoryassignment",
                                                line: lineitem,
                                                fieldId: detail_fieldname,
                                                value: detail_fieldvalue
                                            });
                                        }
                                    } else {
                                        missing_required_fields = true;
                                        var missing_detail_parent = MISSINGFIELDS.SUBLIST[sublistname];
                                        if (!(missing_detail_parent instanceof Array)) {
                                            missing_detail_parent = [];
                                            MISSINGFIELDS.SUBLIST[sublistname] = missing_detail_parent;
                                        }
                                        var missing_detail_fields = missing_detail_parent["inventorydetail"];
                                        if (!(missing_detail_fields instanceof Array)) {
                                            missing_detail_fields = [];
                                            missing_detail_parent["inventorydetail"] = missing_detail_fields;
                                        }
                                        missing_detail_fields.push(detail_fieldname);
                                    }
                                }
                                if (options.isDynamic && inventorydetail_subrecord) {
                                    inventorydetail_subrecord.commitLine({
                                        sublistId: "inventoryassignment"
                                    });
                                }

                            } // setting inventorydetail

                            if (options.isDynamic) {
                                //commit line items
                                rec.commitLine({
                                    sublistId: sublistname
                                });
                            }

                        } //for in loop, lineitems
                    } //for in loop, sublist has lineitems

                } //example:  inventory
            } //for in loop, sublist

            //if any required fields were not found, we fail it and set an error
            if (missing_required_fields) {
                output.error = {
                    title: "Missing some required fields",
                    details: MISSINGFIELDS
                };
            } else {

                //happy path!  lets return our data
                output.success = true;
                output.record = rec;

            }

            return output;


            function pop_key_from_object(key, object) {
                var output = object[key];
                delete object[key];
                return output;
            }
        }

        /**
         * Provides Document Number of a record.
         * @param {string} docType - Record Type.
         * @param {string|number} docId - Record Id.
         * @returns {string} Record Document Number.
         */
        function obtainDocumentNumber(docType, docId) {
            return search.lookupFields({
                // type: search.Type.ITEM_FULFILLMENT,
                type: docType,
                id: docId,
                columns: ["tranid"]
            }).tranid;
        }

        /**
         * Finds location record that matches the Warehouse ID
         * @param {string} wmsReference - The Company reference from Scale.
         * @param {string} company - Subsidiary like Kush Bottles US.
         * @returns {string} Record Document Number.
         */
        function findWarehouseId(wmsReference, company, workzone) {
            var netsuiteId = "";

            var filters = [
                ["custrecord_wms_location_reference", "is", wmsReference],
                "AND",
                ["custrecord_wms_workzone", "isempty", ""],
                "AND",
                ["custrecord_scale_enabled", "is", "T"],
                "AND",
                ["isinactive", "is", "F"]
            ];

            if (workzone) {

                filters = [
                    ["custrecord_wms_location_reference", "is", wmsReference],
                    "AND",
                    ["custrecord_wms_workzone", "is", workzone],
                    "AND",
                    ["custrecord_scale_enabled", "is", "T"],
                    "AND",
                    ["isinactive", "is", "F"]
                ];

            }

            if (company) {
                filters.push("AND", ["subsidiary", "is", company]);
            }

            var locationSearchObj = search.create({
                type: "location",
                filters: filters,
                columns: [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC
                    })
                ]
            });
            //  var searchResultCount = locationSearchObj.runPaged().count;
            //  log.debug("locationSearchObj result count",searchResultCount);
            locationSearchObj.run().each(function (result) {
                netsuiteId = result.id;
                return false;
            });

            return netsuiteId;
        }

        /**
         * Updates Inventory Detail Record.
         * @param {object} mainRecord - The record object from NetSuite.
         * @param {string|number} recordLineNum - The Line number on the main record.
         * @param {string|number} invDetailLineNum - Line number on the inv detail record.
         * @param {string|number} invStatus - Inv status internal id.
         * @param {string|number} invQuantity - Inv quantity.
         */
        function changeInventoryDetailStatus(mainRecord, invDetailLineNum, invStatus, invQuantity) {
            //in order to change status, need to update inventory detail subrecord sublist status value manually
            var invDetailSubrec = mainRecord.getCurrentSublistSubrecord({
                sublistId: "item",
                fieldId: "inventorydetail"
            });

            // invDetailSubrec.selectNewLine({
            //     sublistId: "inventoryassignment"
            // });

            // if(invDetailLineNum == 0) {
            //     invDetailSubrec.selectLine({
            //         sublistId: "inventoryassignment",
            //         line: invDetailLineNum
            //     });
            // }

            // invDetailSubrec.selectNewLine({
            //     sublistId: "inventoryassignment"
            // });

            invDetailSubrec.selectLine({
                sublistId: "inventoryassignment",
                line: invDetailLineNum
            });

            invDetailSubrec.setCurrentSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "inventorystatus",
                value: invStatus
            });
            invDetailSubrec.setCurrentSublistValue({
                sublistId: "inventoryassignment",
                fieldId: "quantity",
                value: Number(invQuantity)
            });

            invDetailSubrec.commitLine({
                sublistId: "inventoryassignment"
            });
        }

        function truncateResult(str, len, keep_special_char) {
            keep_special_char = keep_special_char || false;
            try {
                str = (str || "").substring(0, len);
                if (!keep_special_char) {
                    str = str.replace(/[^\w\s-]/gi, "");
                }
                return str;
            } catch (e) {
                log.error("str at truncate result", JSON.stringify(str));
                log.error("error", e);
            }
        }

        /**
         * Checks if the NetSuite location record is enabled for Scale.
         * @param {string} locationId - NetSuite location Internal ID.
         * @param {string} scaleReferenceCode - Scale Location Reference like CA-GG.
         * @returns {boolean}
         */
        function isLocationScaleEnabled(locationId, scaleReferenceCode) {
            var lookup = search.lookupFields({
                type: "location",
                id: locationId,
                columns: ["custrecord_wms_location_reference"]
            }).custrecord_wms_location_reference;

            if (lookup == scaleReferenceCode) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * Updates the Warehouse Status Field on the record.
         * @param {string} type - NetSuite Record Type.
         * @param {string|number} id - Internal ID of the record.
         * @returns {boolean}
         */
        function updateWarehouseStatus(type, id) {
            //lookup field on statuss
            var recordStatus = search.lookupFields({
                type: type,
                id: id,
                columns: ["status"]
            }).status[0].text;

            if (type == record.Type.PURCHASE_ORDER) {
                processPurchaseOrderStatus(recordStatus, type, id);
                return;
            }

            if (type == record.Type.RETURN_AUTHORIZATION) {
                processReturnAuthStatus(recordStatus, type, id);
                return;
            }

            if (recordStatus == "Pending Approval" || !recordStatus) {
                submitUpdate(type, id, "1"); //Not Released
                return;
            }

            var isComplete = checkComplete(recordStatus);
            if (isComplete) {
                submitUpdate(type, id, "5"); //Complete
                return;
            }

            var isPendingRelease = checkPendingRelease(id); //Pending Release
            if (isPendingRelease) {
                submitUpdate(type, id, "2");
                return;
            }

            var isFullyReleased = checkFullyReleased(type, id);
            if (isFullyReleased) {
                submitUpdate(type, id, "4"); //Fully Released
            } else {
                submitUpdate(type, id, "3"); //Partial
            }
            return;

            function checkFullyReleased(type, id) {
                var fullyReleased = true;
                var searchType = (type == "transferorder") ? "TrnfrOrd" : "SalesOrd";
                var filter = [
                    ["internalidnumber", "equalto", id],
                    "AND",
                    ["cogs", "is", "F"],
                    "AND",
                    ["type", "anyof", searchType],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["shipping", "is", "F"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["quantity", "greaterthan", "0"]
                ];

                if (type == "transferorder") {
                    filter.push("AND", ["transactionlinetype", "anyof", "SHIPPING"]);
                }

                var transactionSearchObj = search.create({
                    type: type,
                    filters: filter,
                    columns: [
                        "quantity",
                        "quantitypicked"
                    ]
                });

                transactionSearchObj.run().each(function (result) {
                    var soQty = Math.abs(result.getValue("quantity")); //TO QTY COMES OUT NEGATIVE
                    var fulQty = result.getValue("quantitypicked");

                    if (soQty != fulQty) { //SO QTY DOES NOT MATCH FUL QTY
                        fullyReleased = false;
                    }
                    if (fullyReleased === false) {
                        return false;
                    }
                    return true;
                });

                return fullyReleased;
            }

            function checkComplete(recordStatus) {
                if (recordStatus != "Pending Fulfillment" && recordStatus != "Pending Approval" && recordStatus != "Partially Fulfilled" && recordStatus != "Pending Billing/Partially Fulfilled" && recordStatus != "Pending Receipt/Partially Fulfilled") {
                    return true;
                } else {
                    return false;
                }
            }

            function checkPendingRelease(id) {
                //search used to find all item fulfillments for current record.  Pass in scale_warehouse locations
                var itemfulfillmentSearchObj = search.create({
                    type: "itemfulfillment",
                    filters: [
                        ["type", "anyof", "ItemShip"],
                        "AND",
                        ["createdfrom", "anyof", id],
                        "AND",
                        ["cogs", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["status", "noneof", "ItemShip:C"]
                    ],
                    columns: [
                        "statusref",
                        "item",
                        "quantity"
                    ]
                });

                var fulfillmentItemCount = itemfulfillmentSearchObj.runPaged().count;

                //IF there are no item fulfillment records associated with the order, move to Pending Release.
                if (!fulfillmentItemCount) {
                    return true;
                } else {
                    return false;
                }
            }

            function submitUpdate(type, id, status) {
                record.submitFields({
                    type: type,
                    id: id,
                    values: {
                        "custbody_warehouse_status": status //Complete
                    }
                });
            }

            function processReturnAuthStatus(recordStatus, type, id) {
                if (recordStatus == "Pending Refund" || recordStatus == "Refunded") {
                    submitUpdate(type, id, "5"); //Complete
                } else if (recordStatus == "Pending Receipt" || recordStatus == "Partially Received/Pending Refund" || recordStatus == "Partially Received") {
                    submitUpdate(type, id, "4"); //Fully Released
                }
            }

            function processPurchaseOrderStatus(recordStatus, type, id) {
                if (recordStatus == "Pending Bill" || recordStatus == "Fully Billed") {
                    submitUpdate(type, id, "5"); //Complete
                }
            }

        }

        /**
         * Matches Item Objects between NetSuite and Scale.
         * @param {Array.<Object>} detailsArr - NetSuite Record Type.
         * @param {string|number} itemLine - Item order line number of the item.
         * @returns {object|boolean}
         */
        function getDetailObj(detailsArr, itemLine) {
            for (var i = 0; i < detailsArr.length; i++) {
                var detailObj = detailsArr[i];
                var detailObjLine = detailObj.ErpOrderLineNum;

                if (itemLine == parseInt(detailObjLine, 10)) {
                    return detailObj;
                }
            }

            return false;
        }

        /**
         * Matches Item Objects between NetSuite and Scale for Receipts only.
         * @param {Array.<Object>} type - NetSuite Record Type.
         * @param {string|number} itemLine - Item order line number of the item.
         * @returns {object|boolean}
         */
        function getReceiptDetailObj(detailsArr, itemLine) {
            for (var i = 0; i < detailsArr.length; i++) {
                var detailObj = detailsArr[i];
                var detailObjLine = detailObj.ReceiptDetail.ErpOrderLineNum;

                if (itemLine == parseInt(detailObjLine, 10)) {
                    return detailObj;
                }
            }

            return false;
        }

        /**
         * Checks if the NetSuite order was cancelled on Scale.
         * @param {object} fileTextObj - Scale XML as a JSON.
         * @returns {{deleted: boolean, statusChange: boolean, SamplesTransfer: {error: null|object, success: string, exists: boolean}}}
         */
        function checkIfCancelled(fileTextObj) {
            var headerObj = fileTextObj.WMWDATA.WMFWUpload.Shipments.Shipment;
            var itemFulId = parseInt(headerObj.UserDef7, 10);
            var returnObj = {
                "deleted": false,
                "statusChange": true,
                SamplesTransfer: {
                    error: null,
                    success: "",
                    exists: false
                }
            };

            if ((headerObj.Deleted && headerObj.Deleted == "Y") && (headerObj.TotalLines && headerObj.TotalLines == "0")){ //false delete
                returnObj["deleted"] = true;
                returnObj["statusChange"] = false;
                return returnObj;
            }

            if ((headerObj.Deleted && headerObj.Deleted == "Y") || (!headerObj.Containers)) {
                //any delete, could be false
                var fulNotShipped = search.lookupFields({
                    type: search.Type.ITEM_FULFILLMENT,
                    id: itemFulId,
                    columns: ["status"]
                }).status[0].text != "Shipped";
                
                if(fulNotShipped) {
                    //true delete

                    //FIXME: if sample order, intercept to create a transfer

                    var OrderType = headerObj.OrderType;
                    if (OrderType === "Sample Order"){
                        returnObj.SamplesTransfer.exists = true;

                        var inventorytransferoptions = {
                            recordtype: record.Type.INVENTORY_TRANSFER,
                            isDynamic: true
                        };
                        try {
                            var SO_docnum = headerObj.UserDef1;
                            var REQUIRED_FIELDS_SAMPLES_TRANSFER = getRequiredFieldsForSamplesTransfer_from_ItemFulfillment(itemFulId, SO_docnum);
                            var prep = prepare_netsuite_record(inventorytransferoptions, REQUIRED_FIELDS_SAMPLES_TRANSFER);
                        } catch (error_on_prep){
                            var reason_prep_threw = "Sample Order delete confirm - Error thrown preparing the inventory transfer record with the given data";
                            returnObj.SamplesTransfer.error = {reason: reason_prep_threw, error: error_on_prep};
                        }

                        if (returnObj.SamplesTransfer.error === null){
                            try {
                                if (prep.success) {
                                    returnObj.SamplesTransfer.success = prep.record.save();
                                } else {
                                    var reason_prep_failed = "Sample Order delete confirm - Missing some Required fields...? how?";
                                    returnObj.SamplesTransfer.error = {reason: reason_prep_failed, error: prep.error};
                                }
                            } catch (error_on_save){
                                var reason_save_failed = "Sample Order Delete confirm - Inventory Transfer record failed to save";
                                returnObj.SamplesTransfer.error = {reason: reason_save_failed, error: error_on_save};
                            }
                        }

                    }
                    if (returnObj.SamplesTransfer.error === null){
                        record.delete({
                            type: record.Type.ITEM_FULFILLMENT,
                            id: itemFulId
                        });
                    } else {
                        throw returnObj.SamplesTransfer.error; //caught outside in azure_shipment_upload or suitelet_str_reprocessing
                    }
                } else {
                    returnObj["statusChange"] = false;
                }
                returnObj["deleted"] = true;
            }

            return returnObj;

            function getRequiredFieldsForSamplesTransfer_from_ItemFulfillment(itemfullfillment_id, SO_docnum){
                var itemfulfillment = record.load({ type: "itemfulfillment", id: itemfullfillment_id });
                var subsidiary = itemfulfillment.getValue({ fieldId: "subsidiary" });
                var FUL_docnum = itemfulfillment.getValue({ fieldId: "tranid" });
                var HARDCODED_location = "66";
                var HARDCODED_samples_location = "13";

                var REQUIRED_FIELDS_SAMPLES_TRANSFER = {
                    BODY: {
                        subsidiary: subsidiary,
                        location: HARDCODED_samples_location,
                        transferlocation: HARDCODED_location,
                        memo: FUL_docnum + " for " + SO_docnum + " was deleted in SCALE."
                    },
                    SUBLIST: {
                        inventory: []
                    }
                };


                var lines = itemfulfillment.getLineCount("item");

                for (var line = 0; line < lines; line++) {
                    REQUIRED_FIELDS_SAMPLES_TRANSFER.SUBLIST.inventory.push(
                        new LineItem_for_inventorytransfer_from_itemfullfillment(itemfulfillment, line)
                    );
                }

                return REQUIRED_FIELDS_SAMPLES_TRANSFER;

                function LineItem_for_inventorytransfer_from_itemfullfillment(itemfulfillment, line){
                    var item = itemfulfillment.getSublistValue({sublistId: "item", fieldId: "item", line: line});
                    var quantity_in_baseunit = itemfulfillment.getSublistValue({sublistId: "item", fieldId: "quantity", line: line});
                    var units = itemfulfillment.getSublistValue({sublistId: "item", fieldId: "units", line: line});
                    var HARDCODED_inventorystatus = "1"; //Available, cuz why would you fulfill damaged samples to customers?

                    var output = {
                        item: item,
                        adjustqtyby: quantity_in_baseunit,
                        units: units,
                        inventorydetail: {
                            inventorystatus: HARDCODED_inventorystatus,
                            toinventorystatus: HARDCODED_inventorystatus,
                            quantity: quantity_in_baseunit
                        }
                    };
                    if (!units) {
                        delete output.units;
                    }

                    return output;
                }
            }

        }

        /**
         * Updates Transfer Order item lines if Scale says theres a change.
         * @param {object} fileTextObj - Scale XML as a JSON.
         */
        function updateToLines(fileTextObj) {
            var headerObj = fileTextObj.WMWDATA.WMFWUpload.Shipments.Shipment;
            var detailsArr = headerObj.Details.ShipmentDetail;
            detailsArr = detailsArr instanceof Array ? detailsArr : [detailsArr];

            var recordId = parseInt(headerObj.ErpOrder, 10);

            var transferOrder = record.load({
                type: record.Type.TRANSFER_ORDER,
                id: recordId,
                isDynamic: true
            });

            var itemToLines = transferOrder.getLineCount({
                sublistId: "item"
            });

            for (var i = 0; i < itemToLines; i++) {
                transferOrder.selectLine({
                    sublistId: "item",
                    line: i
                });

                var orderLineNum = Number(transferOrder.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "line"
                })) + 1;

                var quantity = Number(transferOrder.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity"
                }));

                var shipmentObj = getDetailObj(detailsArr, orderLineNum);

                if (shipmentObj) {
                    var correctedQuantity = Number(shipmentObj.ShippedQty);

                    if (correctedQuantity != quantity) {
                        transferOrder.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: correctedQuantity,
                            ignoreFieldChange: true
                        });

                        transferOrder.commitLine({
                            sublistId: "item"
                        });
                    }
                } else {
                    transferOrder.removeLine({
                        sublistId: "item",
                        line: i,
                        ignoreRecalc: true
                    });

                    i--;
                    itemToLines--;
                }

            }

            transferOrder.save({
                ignoreMandatoryFields: true
            });
        }

        /**
         * Updates Inventory Detail Sub-Record on line items.
         * @param {object} fileTextObj - Scale XML as a JSON.
         */
        function updateInvDetailOnItemLines(itemFulId) {
            var itemFul = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: itemFulId,
                isDynamic: false
            });

            var itemFulLines = itemFul.getLineCount({
                sublistId: "item"
            });

            for (var i = 0; i < itemFulLines; i++) {

                var isDropShip = itemFul.getSublistValue({
                    sublistId: "item",
                    fieldId: "isdropshipline",
                    line: i
                });

                isDropShip = isDropShip === "T" || isDropShip === true ? true : false; // NetSuite

                var quantity = itemFul.getSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    line: i
                });

                if (!isDropShip) {
                    var invDetailSubrec = itemFul.getSublistSubrecord({
                        sublistId: "item",
                        fieldId: "inventorydetail",
                        line: i
                    });

                    invDetailSubrec.setSublistValue({
                        sublistId: "inventoryassignment",
                        fieldId: "quantity",
                        line: 0,
                        value: quantity
                    });
                }


            }

            itemFul.save({
                ignoreMandatoryFields: true
            });

        }

        /**
         * Combines objects with the same ErpOrderLineNum (Combines Quantity)
         * @param {object} detailsArray - An array of JSON objects.
         * @returns {array}
         */
        function combineSplitOrderLines(detailsArray) {
            var output = [];

            detailsArray.forEach(function (item) {
                var existing = output.filter(function (v) {
                    return v.ReceiptDetail.ErpOrderLineNum == item.ReceiptDetail.ErpOrderLineNum;
                });

                var itemStatus = 1;
                if (item.DispCode) {
                    var itemStatusLookUp = scale_utils.lookup_internalID_or_more({
                        TYPE: "customrecord_scale_disposition_cross_ref",
                        FIELD: "custrecord_scale_disposition_code",
                        VALUE: item.DispCode
                    }, ["custrecord_inventory_status_ref"]);

                    if (!itemStatusLookUp) {
                        itemStatus = 6; // Defaults to Quarantine
                    } else {
                        itemStatus = itemStatusLookUp.custrecord_inventory_status_ref.value;
                    }
                }

                if (existing.length) {
                    var existingIndex = output.indexOf(existing[0]);
                    var existingQty = Number(output[existingIndex].Qty);
                    output[existingIndex].Qty = existingQty + Number(item.Qty);
                    output[existingIndex].DispCode.push({
                        itemStatus: itemStatus,
                        quantity: item.Qty
                    });
                } else {
                    item.DispCode = [{
                        itemStatus: itemStatus,
                        quantity: item.Qty
                    }];
                    item.value = [item.value];
                    output.push(item);
                }
            });

            return output;
        }

        return {
            createItemFulfillment: createItemFulfillment,
            createItemReceipt: createItemReceipt,
            updateItemFulfillment: updateItemFulfillment,
            process_inventorytransaction_STR: process_inventorytransaction_STR
        };
    });