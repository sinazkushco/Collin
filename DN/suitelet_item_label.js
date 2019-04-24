/**
 * @NApiVersion 2.0
 * @NScriptType suitelet
 */

define(["N/ui/serverWidget", "N/record", "N/redirect", "N/search", "N/render"], function (serverWidget, record, redirect, search, render) {
    function onRequest(context) {
        if (context.request.method === "GET") {

            var itemid = context.request.parameters.itemid || false;
            var itemInfo = gatherItemData(itemid);
            var form = createForm(itemInfo);
            // addDataToForm(form, location, includeTomorrow, startDate, shipType);
            context.response.writePage(form);

        } else {
            var pdfDataObj = gatherPostData(context);
            var pdf = generatePDF(pdfDataObj);
            context.response.writeFile({
                file: pdf,
                isInline: true
            });

        }
    }

    //HELPER FUNCTIONS
    function gatherItemData(itemId){
        // lookup field, returns: obtains newsku, oldsku, itemname, special instructions
        var itemObj = {};

        var fieldLookUp = search.lookupFields({
            type: search.Type.ITEM,
            id: itemId,
            columns: ["custitem_old_sku", "salesdescription", "custitem_vape_filling_instructions", "custitem_upccode", "custitem_sku"]
        });

        if(fieldLookUp.custitem_vape_filling_instructions.length > 0){
            itemObj.instructions = fieldLookUp.custitem_vape_filling_instructions[0].text;
        }

        if(fieldLookUp.custitem_upccode.length > 0){
            itemObj.upccode = fieldLookUp.custitem_upccode[0].text;
        }

        if(fieldLookUp.custitem_sku) {
            itemObj.newSku = fieldLookUp.custitem_sku;
        }

        if(fieldLookUp.custitem_old_sku) {
            itemObj.oldSku = fieldLookUp.custitem_old_sku ;
        }

        if(fieldLookUp.salesdescription) {
            itemObj.itemName = fieldLookUp.salesdescription;
        }

        return itemObj;
    }


    function createForm(itemInfo) {
        var form = serverWidget.createForm({
            title: "Item Label Form"
        });

        // form.clientScriptModulePath = "./client_gg_bin_transfer.js"; // TODO: Confirm with production

        form.addButton({
            id: "refreshbtn",
            label: "Refresh Page",
            functionName: "refreshPage"
        });

        form.addSubmitButton({
            label: "Generate Label"
        });

        // ~~ Preset Fields Start ~~

        var newSkuField = form.addField({
            id: "custpage_new_sku",
            label: "SKU",
            type: serverWidget.FieldType.TEXT
        });

        newSkuField.defaultValue = itemInfo.newSku || null;

        newSkuField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var oldSkuField = form.addField({
            id: "custpage_old_sku",
            label: "Old SKU",
            type: serverWidget.FieldType.TEXT
        });

        oldSkuField.defaultValue = itemInfo.oldSku || null;

        oldSkuField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var itemNameField = form.addField({
            id: "custpage_item_name",
            label: "Item",
            type: serverWidget.FieldType.TEXT
        });

        itemNameField.defaultValue = itemInfo.itemName || null;

        itemNameField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var instructionsField = form.addField({
            id: "custpage_instructions",
            label: "Instructions",
            type: serverWidget.FieldType.TEXT
        });

        instructionsField.defaultValue = itemInfo.instructions || null;
        
        instructionsField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var upcCodeField = form.addField({
            id: "custpage_upc_code",
            label: "UPC Code",
            type: serverWidget.FieldType.TEXT
        });

        upcCodeField.defaultValue = itemInfo.upccode || null;

        upcCodeField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        // ~~ Preset Fields End ~~

        var poField = form.addField({
            id: "custpage_po",
            label: "Purchase Order",
            type: serverWidget.FieldType.TEXT
        });

        var lotField = form.addField({
            id: "custpage_lot",
            label: "Lot",
            type: serverWidget.FieldType.TEXT
        });

        var manufactureDateField = form.addField({
            id: "custpage_manufacture_date",
            label: "Manufacture Date",
            type: serverWidget.FieldType.DATE
        });

        var expirationDateField = form.addField({
            id: "custpage_expiration_date",
            label: "Expiration Date",
            type: serverWidget.FieldType.DATE
        });

        var uomField = form.addField({
            id: "custpage_uom",
            label: "UOM",
            type: serverWidget.FieldType.INTEGER
        });

        uomField.isMandatory = true;

        var measurementsField1 = form.addField({
            id: "custpage_measurements1",
            label: "LENGTH (CM)",
            type: serverWidget.FieldType.INTEGER
        });

        measurementsField1.updateLayoutType({
            layoutType : serverWidget.FieldLayoutType.STARTROW
        });

        var measurementsField2 = form.addField({
            id: "custpage_measurements2",
            label: "WIDTH (CM)",
            type: serverWidget.FieldType.INTEGER
        });

        measurementsField2.updateLayoutType({
            layoutType : serverWidget.FieldLayoutType.MIDROW
        });

        var measurementsField3 = form.addField({
            id: "custpage_measurements3",
            label: "HEIGHT (CM)",
            type: serverWidget.FieldType.INTEGER
        });

        measurementsField3.updateLayoutType({
            layoutType : serverWidget.FieldLayoutType.ENDROW
        });

        var nwField = form.addField({
            id: "custpage_nw",
            label: "N.W (KG)",
            type: serverWidget.FieldType.TEXT
        });

        nwField.updateLayoutType({
            layoutType : serverWidget.FieldLayoutType.STARTROW
        });

        var gwField = form.addField({
            id: "custpage_gw",
            label: "G.W (KG)",
            type: serverWidget.FieldType.INTEGER
        });

        gwField.updateLayoutType({
            layoutType : serverWidget.FieldLayoutType.MIDROW
        });

        var cbmField = form.addField({
            id: "custpage_cbm",
            label: "CBM",
            type: serverWidget.FieldType.INTEGER
        });

        cbmField.updateLayoutType({
            layoutType : serverWidget.FieldLayoutType.STARTROW
        });

        var madeInField = form.addField({
            id: "custpage_madein",
            label: "Made In",
            type: serverWidget.FieldType.TEXT
        });

        // madeInField.updateLayoutType({
        //     layoutType : serverWidget.FieldLayoutType.MIDROW
        // });


        return form;

    }

    function gatherPostData(context) {

        log.debug("context params", context.request.parameters);

        var requestParams = context.request.parameters;

        var postObj = {};
        postObj.itemName = requestParams.custpage_item_name.replace(/&/g, "&amp;") || "";
        postObj.uom = requestParams.custpage_uom.replace(/&/g, "&amp;") || "";
        postObj.manufactureDate = requestParams.custpage_manufacture_date.replace(/&/g, "&amp;") || "";
        postObj.expirationDate = requestParams.custpage_expiration_date.replace(/&/g, "&amp;") || "";
        postObj.instructions = requestParams.custpage_instructions.replace(/&/g, "&amp;") || "";
        postObj.newSku = requestParams.custpage_new_sku.replace(/&/g, "&amp;") || "";
        postObj.oldSku = requestParams.custpage_old_sku.replace(/&/g, "&amp;") || "";
        postObj.upccode = requestParams.custpage_upc_code.replace(/&/g, "&amp;") || "";
        postObj.po = requestParams.custpage_po.replace(/&/g, "&amp;") || "";
        postObj.lot = requestParams.custpage_lot.replace(/&/g, "&amp;") || "";
        postObj.length = requestParams.custpage_measurements1.replace(/&/g, "&amp;") || "";
        postObj.width = requestParams.custpage_measurements2.replace(/&/g, "&amp;") || "";
        postObj.height = requestParams.custpage_measurements3.replace(/&/g, "&amp;") || "";
        postObj.nw = requestParams.custpage_nw.replace(/&/g, "&amp;") || "";
        postObj.gw = requestParams.custpage_gw.replace(/&/g, "&amp;") || "";
        postObj.cbm = requestParams.custpage_cbm.replace(/&/g, "&amp;") || "";
        postObj.madeIn = requestParams.custpage_madein.replace(/&/g, "&amp;") || "";

        log.debug("post obj", postObj);
        return postObj;

    }

    function generatePDF(data) {

        if (data.lot) {
            data.lot = "<barcode height='20' codetype='code128' showtext='false' value='" + data.lot +"'/>" + "Lot: " + data.lot  + "&nbsp;&nbsp;&nbsp;";
        }
        if (data.instructions) {
            data.instructions = "Special Instructions: <br/>" + data.instructions;
        }
        if (data.expirationDate) {
            data.expirationDate =  "<barcode height='20' codetype='code128' showtext='false' value='" + data.expirationDate.replace(/\D/g,"") +"'/>" + " <br/> Expires: " + data.expirationDate + "&nbsp;&nbsp;&nbsp;";
        }
        if (data.manufactureDate) {
            data.manufactureDate = "<barcode height='20' codetype='code128' showtext='false' value='" + data.manufactureDate.replace(/\D/g,"") +"'/>" + "Manufactured: " + data.manufactureDate + "&nbsp;&nbsp;&nbsp;";
        }
        if(data.upccode) {
            data.upccode = "<barcode height='20' codetype='code128' showtext='false' value='" + data.upccode +"'/>" + "UPC Code: " + data.upccode + "&nbsp;&nbsp;&nbsp;";
        }

        if(data.length || data.width || data.height){
            data.measurements = "Measurements: (" + data.length + " x " + data.width  + " x " + data.height + ") CM";
        }

        if(data.nw){
            data.nw = "N.W: " + data.nw + " KG";
            if(data.measurements){
                data.measurements = data.measurements + "<br/>" + data.nw;
            } else {
                data.measurements = data.nw;
            }
        }
        if(data.gw){
            data.gw = "G.W: " + data.gw + " KG";
            if(data.measurements){
                data.measurements = data.measurements + "<br/>" + data.gw;
            } else {
                data.measurements = data.gw;
            }
        }
        if(data.cbm){
            data.cbm = "CBM: " + data.cbm;
            if(data.measurements){
                data.measurements = data.measurements + "<br/>" + data.cbm;
            } else {
                data.measurements = data.cbm;
            }
        }
        if(data.madeIn){
            data.madeIn = "MADE IN " + data.madeIn;
            if(data.measurements){
                data.measurements = data.measurements + "<br/>" + data.madeIn;
            } else {
                data.measurements = data.madeIn;
            }
        }


        var label = "<table font-family='Helvetica, san-serif' font-size='12px' width='5in' height='3in' style='margin: 0;'>";
        label += "<colgroup><col width='50%'></col><col width='50%'></col></colgroup>";
        label += "<tr><td colspan='1' align='left' style='margin-left: -10px;'><barcode height='25' codetype='code128' showtext='false' value='" + data.newSku +"'/></td><td align='right' colspan='1'><span style='font-size: 28px; font-weight: bold;'>" + data.newSku + "</span></td></tr>";
        label += "<tr><td colspan='2'><span style='font-size: 16px; font-weight: bold;'>" + data.itemName + "</span></td></tr>";
        label += "<tr><td colspan='1'>" + data.po + "</td><td align='right' colspan='1' style='line-height: 1px; margin-right: -10px;'>" + data.manufactureDate + "</td></tr>";
        label += "<tr><td colspan='1' style='font-size: 18px;'>" + data.oldSku + "</td><td align='right' colspan='1' style='line-height: 1px; margin-right: -10px;'>" + data.expirationDate + "</td></tr>";
        label += "<tr><td colspan='1'>" + data.instructions + "</td><td align='right' colspan='1' style='line-height: 1px; margin-right: -10px;'>" + data.lot + "</td></tr>";
        label += "<tr><td colspan='1'><span style='font-size: 12px;'>" + data.measurements +"</span></td><td align='right' colspan='1' style='line-height: 1px; margin-right: -10px;'>" + data.upccode + "</td></tr>";
        label += "<tr><td colspan='1'><span style='font-size: 18px; font-weight: 500;'>" + data.uom +" ea. </span></td><td align='right' colspan='1' style='line-height: 1px; margin-right: -10px;'></td></tr>";
        label += "<tr><td colspan='2' align='center' style='padding-top: 0px;'><span style='font-size: 1px;'>" + "<img width='50%' height='50%' src='https://system.na2.netsuite.com/c.4516274/images/prop65warning.png'/>" + "</span></td></tr>";
        label += "</table>";
        var xmlStr = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n<head>";
        xmlStr += "<style>td{padding:10px;},body{font-family: arial, san-serif;}</style>";
        xmlStr += "</head>\n<body size=\"A5-landscape\" width=\"6in\" height=\"4in\" font-size=\"12\" style=\"padding: 5px 30px 0px 30px;\">\n" + label + "\n</body>\n</pdf>";
        var pdfFile = render.xmlToPdf({
            xmlString: xmlStr
        });

        return pdfFile;
    }

    return {
        onRequest: onRequest
    };

});