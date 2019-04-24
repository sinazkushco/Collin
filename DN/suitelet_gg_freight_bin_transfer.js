/**
 * @NApiVersion 2.0
 * @NScriptType suitelet
 */

define(["N/ui/serverWidget", "N/record", "N/redirect", "N/search"], function (serverWidget, record, redirect, search) {
    function onRequest(context) {
        if (context.request.method === "GET") {

            var location = context.request.parameters.location || false;
            var includeTomorrow = context.request.parameters.includetomorrow || false;
            var startDate = context.request.parameters.startdate || false;
            var form = createForm(location, includeTomorrow, startDate);
            addDataToForm(form, location, includeTomorrow, startDate);
            context.response.writePage(form);

        } else {

            var itemsForTransfer = gatherPostData(context);
            var binTransferId = createBinTransfer(itemsForTransfer);

            if (binTransferId) {
                redirect.toRecord({
                    type: "bintransfer",
                    id: binTransferId
                });
            }
        }
    }

    //HELPER FUNCTIONS
    function createForm(location, includeTomorrow, startDate) {
        var form = serverWidget.createForm({
            title: "Freight - Garden Grove Bin Transfer Form"
        });

        form.clientScriptModulePath = "./client_gg_freight_bin_transfer.js"; // TODO: Confirm with production

        var bodyAreaField = form.addField({
            id: "custpage_bodyareafield",
            type: serverWidget.FieldType.INLINEHTML,
            label: "Body Area Field"
        });

        bodyAreaField.defaultValue = "<style> h1 {color: crimson !important;}</style>";

        form.addSubmitButton({
            label: "Transfer to Freight Staging Area"
        });

        form.addButton({
            id: "refreshbtn",
            label: "Refresh Page",
            functionName: "refreshPage"
        });

        form.addButton({
            id: "printbtn",
            label: "Print Page",
            functionName: "printPage"
        });

        form.addPageLink({
            type: serverWidget.FormPageLinkType.CROSSLINK,
            title: "Bin Transfer Form",
            url: "https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=797&deploy=1"
        });

        var binLocationField = form.addField({
            id: "custpage_bin_location",
            label: "Bin Location",
            type: serverWidget.FieldType.SELECT,
            source: "302" // TODO: Make list on production
        });

        var startDateField = form.addField({
            id: "custpage_start_date",
            label: "Start Date",
            type: serverWidget.FieldType.DATE
        });

        var includeTomorrowField = form.addField({
            id: "custpage_include_tomorrow",
            label: "Include Tomorrow's Orders",
            type: serverWidget.FieldType.CHECKBOX
        });

        if (location) {
            binLocationField.defaultValue = location;
        }

        if (includeTomorrow) {
            includeTomorrowField.defaultValue = "T";
        }

        if (startDate) {
            startDateField.defaultValue = startDate;
        }

        var addSublist = form.addSublist({
            id: "bin_sublist",
            type: serverWidget.SublistType.LIST,
            label: "Inventory Items"
        });

        // check box
        var check = addSublist.addField({
            id: "custpage_checkmark",
            label: "Check",
            type: serverWidget.FieldType.CHECKBOX
        });

        check.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY
        });

        // sku field
        var skuField = addSublist.addField({
            id: "custpage_item_sku",
            label: "SKU",
            type: serverWidget.FieldType.TEXT
        });

        skuField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        // item field
        var itemField = addSublist.addField({
            id: "custpage_item",
            label: "Item",
            type: serverWidget.FieldType.SELECT,
            source: "inventoryitem"
        });

        itemField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        // quantity field
        var quantityField = addSublist.addField({
            id: "custpage_item_quantity",
            label: "Item Quantity",
            type: serverWidget.FieldType.INTEGER
        });

        quantityField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.ENTRY
        });

        return form;

    }

    function addDataToForm(form, location, includeTomorrow, startDate) {
        var binObj = get_data(includeTomorrow, startDate);
        if (location == "1") { // Chapman
            binObj = binObj["1003"];
        } else if (location == "2") { // Monarch
            binObj = binObj["1002"];
        } else {
            return;
        }

        // Set Sublist data
        var sublist = form.getSublist({
            id: "bin_sublist"
        });

        Object.keys(binObj).forEach(function (itemNumber, i) {
            var itemSku = binObj[itemNumber].sku;
            var itemQuantity = binObj[itemNumber].quantity;

            sublist.setSublistValue({
                id: "custpage_item_sku",
                line: i,
                value: itemSku
            });

            sublist.setSublistValue({
                id: "custpage_item",
                line: i,
                value: itemNumber
            });

            sublist.setSublistValue({
                id: "custpage_item_quantity",
                line: i,
                value: Math.round(itemQuantity).toString()
            });

        });

    }

    function gatherPostData(context) {
        var readyToTransferObj = {
            frombin: "",
            items: []
        };
        var binParam = context.request.parameters.custpage_bin_location;

        //TODO: Update with Production Values
        if (binParam == "1") { // Chapman
            readyToTransferObj.frombin = "1003";
        } else if (binParam == "2") { // Monarch
            readyToTransferObj.frombin = "1002";
        } else {
            return false;
        }

        var lineCount = context.request.getLineCount({
            group: "bin_sublist"
        });

        for (var i = 0; i < lineCount; i++) {

            var checkMarked = context.request.getSublistValue({
                group: "bin_sublist",
                name: "custpage_checkmark",
                line: i
            });

            if (checkMarked == "T") {
                var itemId = context.request.getSublistValue({
                    group: "bin_sublist",
                    name: "custpage_item",
                    line: i
                });

                var itemQuantity = context.request.getSublistValue({
                    group: "bin_sublist",
                    name: "custpage_item_quantity",
                    line: i
                });

                readyToTransferObj.items.push({
                    itemId: itemId,
                    itemQuantity: itemQuantity
                });

            }

        }
        return readyToTransferObj;
    }

    function createBinTransfer(binTransferObj) {
        if (binTransferObj.items.length != 0) {

            var binTransfer = record.create({
                type: "bintransfer",
                isDynamic: true
            });

            binTransfer.setValue({
                fieldId: "subsidiary",
                value: "1" // Kush Bottles US TODO: Update to production value.
            });

            binTransfer.setValue({
                fieldId: "location",
                value: "6" // Garden Grove, CA (Consolidated) TODO: Update to production value.
            });

            for (var i = 0; i < binTransferObj.items.length; i++) {
                binTransfer.selectNewLine({
                    sublistId: "inventory"
                });

                binTransfer.setCurrentSublistValue({
                    sublistId: "inventory",
                    fieldId: "item",
                    value: binTransferObj.items[i].itemId
                });

                binTransfer.setCurrentSublistValue({
                    sublistId: "inventory",
                    fieldId: "quantity",
                    value: binTransferObj.items[i].itemQuantity
                });

                var invDetail = binTransfer.getCurrentSublistSubrecord({
                    sublistId: "inventory",
                    fieldId: "inventorydetail"
                });

                invDetail.selectNewLine({
                    sublistId: "inventoryassignment"
                });

                invDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "binnumber",
                    value: binTransferObj.frombin
                });

                invDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "tobinnumber",
                    value: "1005" // TODO: Picking Bin ID - Update with Production
                });

                invDetail.setCurrentSublistValue({
                    sublistId: "inventoryassignment",
                    fieldId: "quantity",
                    value: binTransferObj.items[i].itemQuantity
                });

                invDetail.commitLine({
                    sublistId: "inventoryassignment"
                });

                binTransfer.commitLine({
                    sublistId: "inventory"
                });

            }

            var binTransferId = binTransfer.save();
            return binTransferId;

        } else {
            return false;
        }
    }


    function get_data(todayOrTomorrow, startDate) {
        todayOrTomorrow = todayOrTomorrow ? "tomorrow" : "today";
        startDate = startDate || "today";

        var filters = [
            ["type", "anyof", "SalesOrd"],
            "AND",
            ["mainline", "is", "F"],
            "AND",
            ["status", "anyof", "SalesOrd:B", "SalesOrd:D", "SalesOrd:E"],
            "AND",
            ["item.type", "anyof", "Assembly", "InvtPart"],
            "AND",
            ["quantitycommitted", "isnotempty", ""],
            "AND",
            ["quantitycommitted", "greaterthan", "0"],
            "AND",
            ["shipdate", "onorafter", startDate],
            "AND",
            ["shipdate", "onorbefore", todayOrTomorrow],
            "AND",
            ["formulanumeric: ({quantity}-{quantitypacked})/{custcol_qty_uom}", "greaterthan", "0"],
            "AND",
            ["shipmethod", "anyof", "4774"],
            "AND",
            ["location", "anyof", "6"], // TODO: CONFIRM WITH PRODUCTION
            "AND",
            ["custbody_payment_hold_backorder","is","F"]
        ];

        var quantity_to_fulfill_by_location = search.create({
            type: "salesorder",
            filters: filters,
            columns: [
                search.createColumn({
                    name: "item",
                    summary: "GROUP",
                    label: "Item"
                }),
                search.createColumn({
                    name: "custitem_sku",
                    join: "item",
                    summary: "GROUP",
                    label: "SKU"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "({quantity}-{quantitypacked})/{custcol_qty_uom}",
                    label: "Quantity Committed"
                })
            ]
        });
        var items_to_fulfill = [];
        quantity_to_fulfill_by_location.run().each(function (result) {
            var result_obj = result.getAllValues();
            var item_obj = {};
            item_obj.id = result_obj["GROUP(item)"][0].value;
            item_obj.name = result_obj["GROUP(item)"][0].text;
            item_obj.sku = result_obj["GROUP(item.custitem_sku)"];
            item_obj.committed = Number(result_obj["SUM(formulanumeric)"]);
            items_to_fulfill.push(item_obj);
            return true;
        });

        //INVENTORY IN GARDEN GROVE BINS
        var inventory_in_gg_bins = search.create({
            type: "item",
            filters: [
                ["inventorydetail.binnumber", "anyof", "1002", "1003"],
                "AND",
                ["inventorydetail.location", "anyof", "6"],
                "AND",
                ["binonhand.binnumber", "anyof", "1002", "1003"]
            ],
            columns: [
                search.createColumn({
                    name: "quantityavailable",
                    join: "binOnHand"
                }),
                search.createColumn({
                    name: "binnumber",
                    join: "binOnHand"
                })
            ]
        });

        var bin_inventory = {};

        inventory_in_gg_bins.run().each(function (result) {
            var result_obj = result.getAllValues();
            var bin_number = result_obj["binOnHand.binnumber"][0].value;
            if (!bin_inventory[result.id]) {
                bin_inventory[result.id] = {};
            }
            bin_inventory[result.id][bin_number] = Number(result_obj["binOnHand.quantityavailable"]);
            return true;
        });

        //PICKING INVENTORY
        var picking_inventory_search = search.create({
            type: "item",
            filters: [
                ["inventorydetail.binnumber", "anyof", "1005"],
                "AND",
                ["inventorydetail.location", "anyof", "6"], // TODO: Prod Values
                "AND",
                ["binonhand.binnumber", "anyof", "1005"]
            ],
            columns: [
                "custitem_sku",
                search.createColumn({
                    name: "binnumber",
                    join: "binOnHand"
                }),
                search.createColumn({
                    name: "quantityonhand",
                    join: "binOnHand"
                })
            ]
        });
        var picking_inventory = {};
        picking_inventory_search.run().each(function (result) {
            var result_obj = result.getAllValues();
            picking_inventory[result.id] = Number(result_obj["binOnHand.quantityonhand"]);
            return true;
        });

        function cross_reference_inventory(bin_inventory, items_to_fulfill, picking_inventory) {
            var items_to_pick = {
                "1003": {},
                "1002": {}
            };
            for (var i = 0; i < items_to_fulfill.length; i++) {
                var item_id = items_to_fulfill[i].id;
                var quantity_committed = Number(items_to_fulfill[i].committed);
                var sku = items_to_fulfill[i].sku;
                //check if item is already in picking bin and then subtract from commited
                //if commited is above 0 pull see which warehouse can fulfill the whole amount
                var quantity_needed = 0;
                if (picking_inventory[item_id]) {
                    var bin_item_quantity = Number(picking_inventory[item_id]);
                    if (bin_item_quantity < quantity_committed) {
                        quantity_needed = quantity_committed - bin_item_quantity;
                    }
                } else {
                    quantity_needed = quantity_committed;
                }
                var bins_selected = pick_bin(item_id, quantity_needed, bin_inventory);
                if (bins_selected["1002"]) {
                    items_to_pick["1002"][item_id] = {
                        quantity: bins_selected["1002"],
                        sku: sku
                    };
                }
                if (bins_selected["1003"]) {
                    items_to_pick["1003"][item_id] = {
                        quantity: bins_selected["1003"],
                        sku: sku
                    };
                }
            }
            return items_to_pick;
        }

        function pick_bin(item_id, quantity_needed, bin_inventory) {
            var bins_selected = {};
            if (bin_inventory[item_id]) {
                var chapman_inventory = Number(bin_inventory[item_id]["1002"]);
                var monarch_inventory = Number(bin_inventory[item_id]["1003"]);
                if (chapman_inventory > quantity_needed) {
                    bins_selected = {
                        "1002": quantity_needed
                    };
                } else if (monarch_inventory > quantity_needed) {
                    bins_selected = {
                        "1003": quantity_needed
                    };
                } else {
                    if (chapman_inventory > 0) {
                        bins_selected["1002"] = chapman_inventory;
                        quantity_needed = quantity_needed - chapman_inventory;
                    }
                    if (monarch_inventory > 0) {
                        if (monarch_inventory > quantity_needed) {
                            bins_selected["1003"] = quantity_needed;
                        } else {
                            bins_selected["1003"] = monarch_inventory;
                        }
                    }
                }
            }
            return bins_selected; // {monach : 3 , chapman: 5}
        }
        return cross_reference_inventory(bin_inventory, items_to_fulfill, picking_inventory);
    }

    return {
        onRequest: onRequest
    };

});