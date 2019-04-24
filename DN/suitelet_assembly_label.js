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
    function gatherItemData(itemId) {
        // lookup field, returns: obtains newsku, oldsku, itemname, special instructions
        var itemObj = {};

        var fieldLookUp = search.lookupFields({
            type: search.Type.ASSEMBLY_ITEM,
            id: itemId,
            columns: ["custitem_old_sku", "salesdescription", "custitem_hazmat_item", "custitem_customer", "custitem_sku", "subsidiary"]
        });

        itemObj.hazmat = fieldLookUp.custitem_hazmat_item ? "Hazardous" : "Non-Hazardous";

        if (fieldLookUp.custitem_customer.length > 0) {
            itemObj.customer = fieldLookUp.custitem_customer[0].text;
        }

        if (fieldLookUp.custitem_sku) {
            itemObj.newSku = fieldLookUp.custitem_sku;
        }

        if (fieldLookUp.custitem_old_sku) {
            itemObj.oldSku = fieldLookUp.custitem_old_sku;
        }

        if (fieldLookUp.salesdescription) {
            itemObj.itemName = fieldLookUp.salesdescription;
        }

        if (fieldLookUp.subsidiary.length > 0) {

            var companyInfo = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: fieldLookUp.subsidiary[0].value,
                columns: ["custrecord_display_name", "address1", "address2", "address3", "city", "state", "country", "zip"]
            });

            itemObj.companyInfo = JSON.stringify(companyInfo);

            itemObj.company = companyInfo.custrecord_display_name;

        }

        return itemObj;
    }

    function createForm(itemInfo) {
        var form = serverWidget.createForm({
            title: "Item Label Form"
        });

        form.clientScriptModulePath = "./client_assembly_label.js"; // TODO: Confirm with production

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

        var customerNameField = form.addField({
            id: "custpage_customer",
            label: "Customer",
            type: serverWidget.FieldType.TEXT
        });

        customerNameField.defaultValue = itemInfo.customer || null;

        customerNameField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var companyField = form.addField({
            id: "custpage_company",
            label: "Company",
            type: serverWidget.FieldType.TEXT
        });

        companyField.defaultValue = itemInfo.company || null;

        companyField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var hazmatField = form.addField({
            id: "custpage_hazmat",
            label: "Hazmat",
            type: serverWidget.FieldType.TEXT
        });

        hazmatField.defaultValue = itemInfo.hazmat || null;

        hazmatField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        var companyInfoField = form.addField({
            id: "custpage_companyinfo",
            label: "Company Info",
            type: serverWidget.FieldType.TEXT
        });

        companyInfoField.defaultValue = itemInfo.companyInfo || null;

        companyInfoField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        // ~~ Preset Fields End ~~

        var soField = form.addField({
            id: "custpage_so",
            label: "Sales Order",
            type: serverWidget.FieldType.TEXT
        });

        var instructionsField = form.addField({
            id: "custpage_instructions",
            label: "Special Instructions",
            type: serverWidget.FieldType.TEXT
        });

        instructionsField.maxLength = 43;

        var uomField = form.addField({
            id: "custpage_uom",
            label: "UOM",
            type: serverWidget.FieldType.INTEGER
        });

        uomField.isMandatory = true;

        var woField = form.addField({
            id: "custpage_wo",
            label: "Work Order",
            type: serverWidget.FieldType.TEXT
        });

        var numberOfCasesField = form.addField({
            id: "custpage_number_of_cases",
            label: "Number Of Cases",
            type: serverWidget.FieldType.INTEGER
        });

        return form;

    }

    function gatherPostData(context) {

        log.debug("context params", context.request.parameters);

        var requestParams = context.request.parameters;

        var postObj = {};
        postObj.itemName = requestParams.custpage_item_name.replace(/&/g, "&amp;") || "";
        postObj.uom = requestParams.custpage_uom.replace(/&/g, "&amp;") || "";
        postObj.customer = requestParams.custpage_customer.replace(/&/g, "&amp;") || "";
        postObj.hazmat = requestParams.custpage_hazmat.replace(/&/g, "&amp;") || "";
        postObj.instructions = requestParams.custpage_instructions.replace(/&/g, "&amp;") || "";
        postObj.newSku = requestParams.custpage_new_sku.replace(/&/g, "&amp;") || "";
        postObj.oldSku = requestParams.custpage_old_sku.replace(/&/g, "&amp;") || "";
        postObj.company = requestParams.custpage_company.replace(/&/g, "&amp;") || "";
        postObj.so = requestParams.custpage_so.replace(/&/g, "&amp;") || "";
        postObj.wo = requestParams.custpage_wo.replace(/&/g, "&amp;") || "";
        postObj.numberOfCases = requestParams.custpage_number_of_cases.replace(/&/g, "&amp;") || 1;
        postObj.companyInfo = requestParams.custpage_companyinfo.replace(/&/g, "&amp;") || "";

        log.debug("post obj", postObj);
        return postObj;

    }

    function generatePDF(data) {

        if(data.companyInfo){
            data.companyInfo = JSON.parse(data.companyInfo);
            data.address = "";
            if (data.companyInfo.address1){
                data.address += data.companyInfo.address1;
            }
            if (data.companyInfo.address2){
                data.address += ", " + data.companyInfo.address2;
            }
            if (data.companyInfo.address3){
                data.address += ", " + data.companyInfo.address3;
            }
            if (data.companyInfo.city){
                data.address += "<br/>" + data.companyInfo.city;
            }
            if (data.companyInfo.state.length > 0){
                data.address += ", " + data.companyInfo.state[0].value;
            }
            if (data.companyInfo.zip){
                data.address += ", " + data.companyInfo.zip;
            }
            if (data.companyInfo.country.length > 0){
                data.address += ", " + data.companyInfo.country[0].value;
            }

            // log.debug("address", data.address);
        }

        if (data.instructions) {
            data.instructions = "<p style='text-align:right; line-height: .2;'>Special Instructions: </p>" + data.instructions;
        }

        var label = "";

        for(var i = 0; i < data.numberOfCases ; i++){
            if (i != 0) {
                label += "<div style=\"page-break-before:always\">&nbsp;</div>";
            }

            label += "<table font-family='Helvetica, san-serif' font-size='12px' width='5in' height='3in'>";
            label += "<colgroup><col width='50%'></col><col width='50%'></col></colgroup>";
            label += "<tr><td colspan='1' align='left' style='margin-left: -10px;'><barcode height='25' codetype='code128' showtext='false' value='" + data.newSku + "'/></td><td align='right' colspan='1'><span style='font-size: 28px; font-weight: bold;'>" + data.newSku + "</span></td></tr>";
            label += "<tr><td colspan='2'><span style='font-size: 16px; font-weight: bold;'>" + data.itemName + "</span></td></tr>";
            label += "<tr><td colspan='1'>" + data.customer + "</td><td align='right' colspan='1' style='margin-right: -10px;'>" + data.oldSku + "</td></tr>";
            label += "<tr><td colspan='1'>" + data.so + "</td><td align='right' colspan='1' style='margin-right: -10px;'>" + data.wo + "</td></tr>";
            label += "<tr><td colspan='1'>" + data.hazmat + "</td><td align='right' colspan='1' style='margin-right: -10px;'>UOM: " + data.uom + "</td></tr>";
            label += "<tr><td colspan='1'>" + data.company + "<br/>" + data.address + "</td><td align='right' colspan='1' style='margin-right: -10px;'>" + data.instructions + "</td></tr>";
            label += "<tr><td colspan='1'>" + "<br/> Case "+ (i + 1) + " of " + data.numberOfCases + "</td><td align='right' colspan='1' style='margin-right: -10px;'>Operator <br/> <div width='50px' height='30px' style='margin-right: 10px; border: 1px solid black;'><p>&nsbp;</p></div></td></tr>";
            label += "</table>";
        }

        var xmlStr = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n<head>";
        xmlStr += "<style>td{padding:10px;},body{font-family: arial, san-serif;}</style>";
        xmlStr += "</head>\n<body size=\"A5-landscape\" width=\"6in\" height=\"4in\" font-size=\"12\">\n" + label + "\n</body>\n</pdf>";
        var pdfFile = render.xmlToPdf({
            xmlString: xmlStr
        });

        return pdfFile;
    }

    return {
        onRequest: onRequest
    };

});