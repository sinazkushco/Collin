/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var SAVED_SEARCH_ID = 'customsearch_dcl_process';
define(['N/search', 'N/record', 'N/email', 'N/render', 'N/runtime'],
    function(search, record, email, render, runtime)
    {
        var delivery_confirmation_log_id;
        function getInputData(){
            var mySearch = search.load({
                id: SAVED_SEARCH_ID
            });
            return mySearch;
        }

        function map(context)
        {
            var searchResult = JSON.parse(context.value);
            delivery_confirmation_log_id = searchResult.id;

            // When this map reduce script gets called by the suitelet. this way it doesnt affect scheduled map reduce scripts
            try{
                var suitelet_custom_record_id = runtime.getCurrentScript().getParameter({name:"custscript_delivery_confirmation_log_id"});
                if(suitelet_custom_record_id){
                    if(suitelet_custom_record_id != delivery_confirmation_log_id){
                        return;
                    }
                }
            } catch (err3){
                //
            }


            try {
                var dlcf_json = JSON.parse(searchResult.values.custrecord_dclf_json);

                // create_pdf(dlcf_json);
                submit_delivery(dlcf_json);

                record.submitFields({
                    type: 'customrecord_dc_logging',
                    id: delivery_confirmation_log_id,
                    values: {
                        'custrecorddclf_status': '3'
                    }
                });

            }catch(e){
                record.submitFields({
                    type: 'customrecord_dc_logging',
                    id: delivery_confirmation_log_id,
                    values: {
                        'custrecorddclf_status': '2'
                    }
                });
                record.submitFields({
                    type: 'customrecord_dc_logging',
                    id: delivery_confirmation_log_id,
                    values: {
                        'custrecord_dclf_error_message': e
                    }
                });
            }
        }

        
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/

        function submit_delivery(dlcf_json) {
            var item_fulfillment_id = dlcf_json.item_fulfillment_id;
            var sales_order_id = dlcf_json.order_id;
            var amount_collected = dlcf_json.amount_collected;
            var location = dlcf_json.location;
            var payment_method = dlcf_json.payment_method;
            var delivery_driver_id = dlcf_json.delivery_driver_id;
            var amount_due = dlcf_json.amount_due;
            log.debug("Progress", "Submit Delivery Function Started");
            if (item_fulfillment_id) {
                // update item fulfillment to shipped
                var update_success = record.submitFields({
                    type: "itemfulfillment",
                    id: item_fulfillment_id,
                    values: {
                        "shipstatus": "C"
                    }
                });

                // TODO: ADD CHECK POINT
                log_process("custrecord_dc_process_1");

                log.debug("Progress", item_fulfillment_id + " - Item fulfillment marked shipped;");
                var netsuite_payment_method = "";

                //POD + PAYMENT COLLECTED
                if (payment_method != "Terms - No Payment Required" && payment_method != "No Payment Collected") {
                    if (payment_method == "Cash") {
                        netsuite_payment_method = "1";
                    } else if (payment_method == "Check") {
                        netsuite_payment_method = "2";
                    } else if (payment_method == "Money Order") {
                        netsuite_payment_method = "9";
                    }

                    // removes payment method off sales order
                    clear_payment_method(sales_order_id);

                    log.debug("Progress", "Payment Detected - Payment Method removed from SO to create invoice.");
                }

                var so_payment_method = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: sales_order_id,
                    columns: ['paymentmethod']
                }).paymentmethod;

                if (update_success && so_payment_method.length > 0) {
                    create_sales_receipt({
                        sales_order_id: sales_order_id,
                        email: dlcf_json.customer_email
                    });
                } else if (update_success && so_payment_method.length === 0) {
                    create_invoice_and_payment({
                        sales_order_id: sales_order_id,
                        amount_due: amount_due,
                        // petty_account: petty_account,
                        payment_method: netsuite_payment_method,
                        amount_collected: amount_collected,
                        location: location,
                        delivery_driver_id: delivery_driver_id
                    });

                }
                create_pdf(dlcf_json);

            }

        }
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function create_sales_receipt(params){
            var sales_receipt_record = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: params.sales_order_id,
                toType: record.Type.CASH_SALE,
                isDynamic: true
            });

            if(params.email){
                sales_receipt_record.setValue("tobeemailed", true);
            }

            sales_receipt_record.save();
            // TODO: ADD CHECK POINT
            log_process("custrecord_dc_process_2");
        }
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function clear_payment_method(sales_order_id){
            try{
                log.debug("clearing payment method", "trying to submit field");
                record.submitFields({
                    type: 'salesorder',
                    id: sales_order_id,
                    values: {
                        'paymentmethod': ''
                    }
                });
            } catch (e){
                try{
                    log.debug("clearing payment method", "trying to load and save record");
                    var so_record = record.load({
                        type: record.Type.SALES_ORDER,
                        id: sales_order_id,
                        isDynamic: false                       
                    });

                    so_record.setValue({
                        fieldId: 'paymentmethod',
                        value: ""
                    });

                    so_record.save();
                    log.debug("clearing payment method", "record saved");
                } catch (e2){
                    throw(e2);
                }
            }

        }
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function create_invoice_and_payment(params) {
            log.debug("Progress", "Trying to create invoice");
            var invoice_record = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: params.sales_order_id,
                toType: record.Type.INVOICE,
                isDynamic: true
            });

            invoice_record.setValue({
                fieldId: "location",
                value: params.location
            });

            var invoice_id = invoice_record.save();
            // TODO: ADD CHECK POINT
            log_process("custrecord_dc_process_3");

            log.debug("Progress", invoice_id + " - Invoice Created");
            if(parseFloat(params.amount_collected)) {
                var amount_due = parseFloat(params.amount_due).toFixed(2);
                var true_payment = parseFloat(params.amount_collected).toFixed(2);
                var calculated_payment;
                
                log.debug("payment rounding, amount due - true payment", amount_due + " " + true_payment);

                // basically gets rid of change on the payment record
                if(Math.abs(amount_due - true_payment) < 1) {
                    calculated_payment = params.amount_due;
                } else {
                    calculated_payment = params.amount_collected;
                }

                log.debug("Progress", "Trying to create payment record");
                var payment_record = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: invoice_id,
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
    
                payment_record.setValue({
                    fieldId: "undepfunds",
                    value: "T"
                });
    
                payment_record.setValue({
                    fieldId: "paymentmethod",
                    value: params.payment_method
                });
    
                payment_record.setValue({
                    fieldId: "payment",
                    value: calculated_payment
                });

                payment_record.setValue({
                    fieldId: "location",
                    value: params.location
                });
    
                payment_record.setValue({
                    fieldId: "custbody_deliverydriver",
                    value: params.delivery_driver_id
                });

                var payment_count = payment_record.getLineCount("apply");
    
                for (var i = 0; i < payment_count; i++) {
                    var line_is_checked = payment_record.getSublistValue({
                        sublistId: 'apply',
                        fieldId: 'apply',
                        line: i
                    });
                    log.debug("line is checked", line_is_checked);
                    if (line_is_checked) {
                        payment_record.selectLine({
                            sublistId: 'apply',
                            line: i
                        });
    
                        payment_record.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: false
                        });
    
                        payment_record.setCurrentSublistValue({
                            sublistId: 'apply',
                            fieldId: 'apply',
                            value: true
                        });
    
                        payment_record.commitLine({
                            sublistId: 'apply'
                        });
    
                    }
                }
    
                // set account to undeposited
                // check/recheck the line item
    
                payment_record.save();
                log.debug("Progress", "Payment Record Created");
                // TODO: ADD CHECK POINT
                log_process("custrecord_dc_process_4");

            }

            if (invoice_id) {
                var loaded_invoice_record = record.load({
                    type: record.Type.INVOICE,
                    id: invoice_id,
                    isDynamic: true
                });

                if(loaded_invoice_record.getValue({fieldId: "email"})){
                    loaded_invoice_record.setValue({
                        fieldId: "tobeemailed",
                        value: true
                    });

                    loaded_invoice_record.save();
                }
                return;
            } 
   

        }
        /*========================================================================================================================================*/
        /*========================================================================================================================================*/
        function create_pdf(dlcf_json) {
            var imgUrl = "https://system.na2.netsuite.com/c.4516274/images/logo.png";
            var params = dlcf_json;
            var items = JSON.parse(params.items);
            var items_row = "";
            var amount_collected = "";
            var no_payment_reason = "";
            var displayed_payment_method = "";
            var so_document_number = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: params.order_id,
                columns: ['tranid']
            }).tranid;

            for(var key in items){
                var item_name = items[key].name.replace(/&/g, "&amp;");
                var item_description = items[key].description.replace(/&/g, "&amp;");
                var item_quantity = items[key].quantity;
                // var item_rate = items[key].rate;
                // var item_tax = items[key].tax;
                var item_total = items[key].total;
                var table_row = 
        '<tr>'+
            '<td align="center" colspan="3" line-height="150%">'+ item_quantity +'</td>'+
            '<td colspan="12"><!--<span class="itemname">'+ item_name +'</span>-->'+ item_description +'</td>'+
            // '<td colspan="2">'+ item_tax +'</td>'+
            // '<td align="right" colspan="4">'+ item_rate +'</td>'+
            '<td align="right" colspan="4">'+ item_total +'</td>'+
        '</tr>';

                items_row += table_row;

            }    

            if(params.amount_collected != ""){
                amount_collected = 
        '<td align="right"><b>Customer Paid:</b></td>'+
        '<td align="right">$'+ parseFloat(params.amount_collected).toFixed(2) +'</td>';
            }
            if(params.no_payment_reason != ""){
                no_payment_reason = 
        '<td align="right"><b>No Payment Reason:</b></td>'+
        '<td align="right">'+ params.no_payment_reason +'</td>';
            }
            if(params.payment_method == "No Payment Collected"){
                displayed_payment_method = "No Payment Required on Delivery"; 
            } else {
                displayed_payment_method = params.payment_method;
            }

            var header = 
    '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">' +
    '<pdf>' +
    '<head>' +
    '<#if .locale == "ru_RU">'+
    '<link name="verdana" type="font" subtype="opentype" src="${nsfont.verdana}" src-bold="${nsfont.verdana_bold}" bytes="2" />'+
    '</#if>'+
    '<style type="text/css">table {'+
    '<#if .locale == "zh_CN">'+
    'font-family: stsong, sans-serif;'+
    '<#elseif .locale == "zh_TW">'+
    'font-family: msung, sans-serif;'+
    '<#elseif .locale == "ja_JP">'+
    'font-family: heiseimin, sans-serif;'+
    '<#elseif .locale == "ko_KR">'+
    'font-family: hygothic, sans-serif;'+
    '<#elseif .locale == "ru_RU">'+
    'font-family: verdana;'+
    '<#else>'+
    'font-family: sans-serif;'+
    '</#if>'+
    'font-size: 9pt;'+
    'table-layout: fixed;'+
    '}'+
    'th {'+
    'font-weight: bold;'+
    'font-size: 8pt;'+
    'vertical-align: middle;'+
    'padding: 5px 6px 3px;'+
    'background-color: #e3e3e3;'+
    'color: #333333;'+
    '}'+
    'td {'+
    'padding: 4px 6px;'+
    '}'+
    'b {'+
    'font-weight: bold;'+
    'color: #333333;'+
    '}'+
    'table.header td {'+
    'padding: 0;'+
    'font-size: 9pt;'+
    '}'+
    'table.footer td {'+
    'padding: 0;'+
    'font-size: 8pt;'+
    '}'+
    'table.itemtable th {'+
    'padding-bottom: 10px;'+
    'padding-top: 10px;'+
    '}'+
    'table.body td {'+
    'padding-top: 2px;'+
    '}'+
    'table.total {'+
    'page-break-inside: avoid;'+
    '}'+
    'tr.totalrow {'+
    'background-color: #e3e3e3;'+
    'line-height: 150%;'+
    '}'+
    'td.totalboxtop {'+
    'font-size: 10pt;'+
    'background-color: #e3e3e3;'+
    '}'+
    'td.addressheader {'+
    'font-size: 8pt;'+
    'padding-top: 6px;'+
    'padding-bottom: 2px;'+
    '}'+
    'td.address {'+
    'padding-top: 0;'+
    '}'+
    'td.totalboxmid {'+
    'font-size: 20pt;'+
    'padding-top: 10px;'+
    'background-color: #e3e3e3;'+
    '}'+
    'td.totalboxbot {'+
    'background-color: #e3e3e3;'+
    'font-weight: bold;'+
    '}'+
    'span.title {'+
    'font-size: 28pt;'+
    '}'+
    'span.number {'+
    'font-size: 16pt;'+
    '}'+
    'span.itemname {'+
    'font-weight: bold;'+
    'line-height: 150%;'+
    '}'+
    'hr {'+
    'width: 100%;'+
    'color: #d3d3d3;'+
    'background-color: #d3d3d3;'+
    'height: 1px;'+
    '}'+
    '.terms {'+
    'font-size: 11px;'+
    '}'+
    '</style>'+
    '</head>';
    
            var body = 
    '<body>' +
        '<table class="header" style="width: 100%;font-size: 9pt">'+
            '<tr>'+
                '<td style="padding: 0px 0px 0px 5px;">'+
                    '<img align="left" width="200px" height="50px" src="'+ imgUrl +'" style="position: absolute;"></img>'+
                    '<p style="position: absolute; top: 50;">${companyInformation.mainaddress_text}</p>'+
                '</td>'+
            '</tr>'+
            '<tr>'+
                '<td align="right" style="padding: 0;"><span style="font-size: 16pt;">DC - #'+ params.item_fulfillment_number +'</span></td>'+
            '</tr>'+
            '<tr>'+
                '<td align="right" style="padding: 0;"><span style="font-size: 12pt;">Customer: <b>'+ params.customer_name.replace(/&/g, "&amp;") +'</b></span></td>'+
            '</tr>'+
            '<tr>'+
                '<td align="right" style="padding: 0;"><span>Date: ' + params.timestamp.split(",")[0] + '</span></td>'+
            '</tr>'+
            '<tr>'+
                '<td align="right" style="padding: 0;"><span>Sales Order #: ' + so_document_number + '</span></td>'+
            '</tr>'+
        '</table>'+

        '<table style="width: 100%; margin-top: 10px; padding-top: 40px;">'+
            '<tr>'+
                '<td class="addressheader" colspan="6"><b>Customer Address</b></td>'+
                '<td class="totalboxtop" colspan="5"><b>AMOUNT DUE</b></td>'+
            '</tr>'+
            '<tr>'+
            '<td class="address" colspan="6" rowspan="2">'+ JSON.parse(params.shipping_address).join("<br/>").replace(/&/g, "&amp;") +'</td>'+
            '<td align="right" class="totalboxmid" colspan="5">$'+ params.amount_due +'</td>'+
            '</tr>'+
        '</table>'+
    
        '<table class="body" style="width: 100%; margin-top: 10px;">'+
            '<tr>'+
                '<th>Delivery Driver</th>'+
                '<th>Payment Method</th>'+
                '<th>Delivery Method</th>'+
            '</tr>'+
            '<tr>'+
                '<td>'+ params.driver_name +'</td>'+
                '<td>'+ displayed_payment_method +'</td>'+
                '<td>Local Delivery</td>'+
            '</tr>'+
        '</table>'+
        '<table class="itemtable" style="width: 100%; margin-top: 10px;">'+
            '<thead>'+
                '<tr>'+
                    '<th align="center" colspan="3">Quantity</th>'+
                    '<th colspan="12">Name</th>'+
                    // '<th colspan="2">Unit Tax</th>'+
                    // '<th align="right" colspan="4">Unit Price</th>'+
                    '<th align="right" colspan="4">Total Amount</th>'+
                '</tr>'+
            '</thead>'+
            items_row +
        '</table>'+
        '<hr />'+
        '<table class="total" style="width: 100%; margin-top: 10px;">'+
            '<tr>'+
            amount_collected +
            no_payment_reason +
            '</tr>'+
        '</table>'+
        '<table width="100%" style="margin-left: -7px; margin-right: -7px;">'+
            '<tr>'+
                '<td style="vertical-align: bottom;"><img width="15%" height="15%" src="'+ params.signature +'"></img><br/>'+ params.signature_name.replace(/&/g, "&amp;") +'<br/> <b>Customer Signature</b></td>'+
                '<td style="vertical-align: bottom;">'+ params.timestamp +'<br/> <b>Date and Time</b></td>'+
            '</tr>'+
        '</table>'+

    '</body>'+
    '</pdf>';

            var renderer = render.create();
            renderer.templateContent = header+body;
            var pdfFile = renderer.renderAsPdf();


            pdfFile.name = params.item_fulfillment_number + "_" +params.timestamp.replace(/\D/g,'') + ".pdf";
            pdfFile.folder = "501797";
            var file_id = pdfFile.save();

            record.attach({
                record: {
                    type: 'file',
                    id: file_id
                },
                to: {
                    type: 'salesorder',
                    id: params.order_id
                }
            });

            // TODO: ADD CHECK POINT
            log_process("custrecord_dc_process_5");
            
            // if(parseFloat(params.amount_collected || 0) > parseFloat(params.amount_due || 0)){
                log.debug("customer email", params.customer_email);
                if(params.customer_email){
                    var email_amount_collected;
                    
                    if(params.amount_collected != ""){
                        email_amount_collected = parseFloat(params.amount_collected).toFixed(2);
                    } else {
                        email_amount_collected = "No payment made";
                    }

                    var email_body = 
                    '<p style="padding:0px 0px 0px 0px; text-align:left; font-size:15px; font-family:Helvetica; color:#606060 !important;">'+
                        'This email is to confirm delivery of your recent Kush Bottles order ' + so_document_number + ' by our driver, '+ params.driver_name +
                        '.<br />'+
                        '<br />Accepted by: ' + params.signature_name.replace(/&/g, "&amp;") +
                        '<br />Amount Paid: '+ email_amount_collected + 
                        '<br />' +
                        '<br />' +
                        '<p>' +
                        '<table class="itemtable" style="width: 100%; margin-top: 10px;">'+
                        '<thead>'+
                            '<tr>'+
                                '<th align="center" colspan="3">Qty.</th>'+
                                '<th align="left" colspan="12">Name</th>'+
                                // '<th align="right" colspan="2">Unit Tax</th>'+
                                // '<th align="right" colspan="4">Unit Price</th>'+
                                '<th align="right" colspan="4">Total Amount</th>'+
                            '</tr>'+
                        '</thead>'+
                        items_row +
                        '</table>'+
                        '</p>'+
                        '<br />' +
                        '<br />Thank you for choosing Kush Supply Co.!'+
                    // '<table width="100%" style="width: 100%;">'+
                    // '<tr>'+
                    //     '<td style="vertical-align: bottom;"><img width="5%" height="5%" src="'+ params.signature +'"></img><br/>'+ params.signature_name.replace(/&/g, "&amp;") +'<br/> <b>Customer Signature</b></td>'+
                    //     '<td style="vertical-align: bottom;">'+ params.timestamp +'<br/> <b>Date and Time</b></td>'+
                    // '</tr>'+
                    // '</table>'+
                       '</p>';


                    email.send({
                        author: "943918",
                        recipients: params.customer_email,
                        subject: 'Kush Bottles - Delivery Confirmation PDF',
                        body: 'Please open the attached file to view your confirmation.',
                        attachments: [pdfFile]
                    });

                    // email.send({
                    //     author: "943918",
                    //     recipients: "dennis.nguyen@kushbottles.com",
                    //     subject: 'Kush Bottles - Delivery Confirmation PDF - TEST',
                    //     body: returnEmailBody(email_body),
                    //     attachments: [pdfFile]
                    // });
                }
            // }

        }
        
        function log_process(field_name){
            var values = {};
            values[field_name] = true;

            record.submitFields({
                type: 'customrecord_dc_logging',
                id: delivery_confirmation_log_id,
                values: values
            });            
        }

        function returnEmailBody(email_body) {
            return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\
            <html xmlns="http://www.w3.org/1999/xhtml">\
            \
            <head>\
                    <!-- NAME: 1:2 COLUMN -->\
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">\
                    <title>\
                    Kush Bottles TSM/SSS Notification\
                    </title>\
                \
                    <style type="text/css">\
                    body,\
                    #bodyTable,\
                    #bodyCell {\
                        height: 100% !important;\
                        margin: 0;\
                        padding: 0;\
                        width: 100% !important;\
                }\
                \
                    table {\
                        border-collapse: collapse;\
                }\
                \
                    img,\
                    a img {\
                        border: 0;\
                        outline: none;\
                        text-decoration: none;\
                }\
                \
                    h1,\
                    h2,\
                    h3,\
                    h4,\
                    h5,\
                    h6 {\
                        margin: 0;\
                        padding: 0;\
                }\
                \
                    p {\
                        margin: 1em 0;\
                        padding: 0;\
                }\
                \
                    a {\
                        word-wrap: break-word;\
                }\
                \
                    em {\
                        text-align: center !important;\
                        display: block;\
                }\
                \
                    .ReadMsgBody {\
                        width: 100%;\
                }\
                \
                    .ExternalClass {\
                        width: 100%;\
                }\
                \
                    .ExternalClass,\
                    .ExternalClass p,\
                    .ExternalClass span,\
                    .ExternalClass font,\
                    .ExternalClass td,\
                    .ExternalClass div {\
                        line-height: 100%;\
                }\
                \
                    table,\
                    td {\
                        mso-table-lspace: 0pt;\
                        mso-table-rspace: 0pt;\
                }\
                \
                    #outlook a {\
                        padding: 0;\
                }\
                \
                    img {\
                        -ms-interpolation-mode: bicubic;\
                }\
                \
                    body,\
                    table,\
                    td,\
                    p,\
                    a,\
                    li,\
                    blockquote {\
                        -ms-text-size-adjust: 100%;\
                        -webkit-text-size-adjust: 100%;\
                }\
                \
                    #templatePreheader,\
                    #templateHeader,\
                    #templateBody,\
                    #templateColumns,\
                    .templateColumn,\
                    #templateFooter {\
                        min-width: 100%;\
                }\
                \
                    #bodyCell {\
                        padding: 20px;\
                }\
                \
                    .mcnImage {\
                        vertical-align: bottom;\
                }\
                \
                    .mcnTextContent img {\
                        height: auto !important;\
                }\
                \
                    body,\
                    #bodyTable {\
                        background-color: #F2F2F2;\
                }\
                \
                    #bodyCell {\
                        border-top: 0;\
                }\
                \
                    #templateContainer {\
                        border: 0;\
                }\
                \
                    h1 {\
                        color: #606060 !important;\
                        display: block;\
                        font-family: Helvetica;\
                        font-size: 40px;\
                        font-style: normal;\
                        font-weight: bold;\
                        line-height: 125%;\
                        letter-spacing: -1px;\
                        margin: 0;\
                        text-align: center;\
                        padding: 20px 20px 0 20px;\
                }\
                \
                    h2 {\
                        color: #404040 !important;\
                        display: block;\
                        font-family: Helvetica;\
                        font-size: 26px;\
                        font-style: normal;\
                        font-weight: bold;\
                        line-height: 125%;\
                        letter-spacing: -.75px;\
                        margin: 0;\
                        text-align: left;\
                        padding: 20px 20px 10px 20px;\
                }\
                \
                    h3 {\
                        color: #606060 !important;\
                        display: block;\
                        font-family: Helvetica;\
                        font-size: 15px;\
                        font-style: normal;\
                        font-weight: normal;\
                        line-height: 125%;\
                        letter-spacing: -.5px;\
                        margin: 0;\
                        text-align: left;\
                        padding: 30px 20px 30px 20px;\
                        border-bottom: 1px solid #f2f2f2;\
                }\
                \
                \
                    h4 {\
                        color: #808080 !important;\
                        display: block;\
                        font-family: Helvetica;\
                        font-size: 16px;\
                        font-style: normal;\
                        font-weight: bold;\
                        line-height: 125%;\
                        letter-spacing: normal;\
                        margin: 0;\
                        text-align: left;\
                }\
                \
                    #templatePreheader {\
                        background-color: #FFFFFF;\
                        border-top: 0;\
                        border-bottom: 0;\
                }\
                \
                    .preheaderContainer .mcnTextContent,\
                    .preheaderContainer .mcnTextContent p {\
                        color: #606060;\
                        font-family: Helvetica;\
                        font-size: 11px;\
                        line-height: 125%;\
                        text-align: left;\
                }\
                \
                    .preheaderContainer .mcnTextContent a {\
                        color: #606060;\
                        font-weight: normal;\
                        text-decoration: underline;\
                }\
                \
                    #templateHeader {\
                        background-color: #222222;\
                        border-top: 10px solid #222222;\
                        border-bottom: 10px solid #222222;\
                }\
                \
                    .headerContainer .mcnTextContent,\
                    .headerContainer .mcnTextContent p {\
                        color: #606060;\
                        font-family: Helvetica;\
                        font-size: 15px;\
                        line-height: 150%;\
                        text-align: left;\
                }\
                \
                    .headerContainer .mcnTextContent a {\
                        color: #6DC6DD;\
                        font-weight: normal;\
                        text-decoration: underline;\
                }\
                \
                    #templateBody {\
                        background-color: #FFFFFF;\
                        border-top: 0;\
                        border-bottom: 0;\
                }\
                \
                    .bodyContainer .mcnTextContent,\
                    .bodyContainer .mcnTextContent p {\
                        color: #606060;\
                        font-family: Helvetica;\
                        font-size: 15px;\
                        line-height: 150%;\
                        text-align: left;\
                }\
                \
                    .bodyContainer .mcnTextContent a {\
                        color: #66a9c4;\
                        font-weight: normal;\
                        text-decoration: none;\
                }\
                \
                    #templateColumns {\
                        background-color: #FFFFFF;\
                        border-top: 0;\
                        border-bottom: 0;\
                }\
                \
                    .leftColumnContainer .mcnTextContent,\
                    .leftColumnContainer .mcnTextContent p {\
                        color: #606060;\
                        font-family: Helvetica;\
                        font-size: 15px;\
                        line-height: 150%;\
                        text-align: left;\
                }\
                \
                    .leftColumnContainer .mcnTextContent a {\
                        color: #6DC6DD;\
                        font-weight: normal;\
                        text-decoration: underline;\
                }\
                \
                    .rightColumnContainer .mcnTextContent,\
                    .rightColumnContainer .mcnTextContent p {\
                        color: #606060;\
                        font-family: Helvetica;\
                        font-size: 15px;\
                        line-height: 150%;\
                        text-align: left;\
                }\
                \
                    .rightColumnContainer .mcnTextContent a {\
                        color: #6DC6DD;\
                        font-weight: normal;\
                        text-decoration: underline;\
                }\
                \
                    #templateFooter {\
                        background-color: #FFFFFF;\
                        border-top: 0;\
                        border-bottom: 0;\
                }\
                \
                    .footerContainer .mcnTextContent,\
                    .footerContainer .mcnTextContent p {\
                        color: #606060;\
                        font-family: Helvetica;\
                        font-size: 11px;\
                        line-height: 125%;\
                        text-align: left;\
                }\
                \
                    .footerContainer .mcnTextContent a {\
                        color: #606060;\
                        font-weight: normal;\
                        text-decoration: underline;\
                }\
                    /*MY STYLES*/\
                \
                    .item-list {\
                        font-family: sans-serif !important;\
                        font-size: 12px;\
                }\
                \
                    .item-table {\
                        width: 100%;\
                }\
                \
                    .item-header {\
                        font-weight: bold;\
                }\
                \
                    .item-header th {\
                        padding: 0 0 10px 0;\
                }\
                \
                    .item-subtotal {\
                        border-top: 1px solid #f2f2f2;\
                }\
                \
                    .item-subtotal td {\
                        padding: 10px 0 0 0;\
                }\
                \
                    .item-line td {\
                        padding: 0 0 10px 0;\
                }\
                \
                    .item-shipping td {\
                        padding: 10px 0 0 0;\
                }\
                \
                    .item-tax td {\
                        padding: 10px 0 0 0;\
                }\
                \
                    .item-total td {\
                        padding: 10px 0 0 0;\
                }\
                    /*MY STYLES END*/\
                \
                    @media only screen and (max-width: 480px) {\
                        body,\
                        table,\
                        td,\
                        p,\
                        a,\
                        li,\
                        blockquote {\
                        -webkit-text-size-adjust: none !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        body {\
                        width: 100% !important;\
                        min-width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[id=bodyCell] {\
                        padding: 10px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcnTextContentContainer] {\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        .mcnBoxedTextContentContainer {\
                        max-width: 100% !important;\
                        min-width: 100% !important;\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcpreview-image-uploader] {\
                        width: 100% !important;\
                        display: none !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        img[class=mcnImage] {\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcnImageGroupContentContainer] {\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnImageGroupContent] {\
                        padding: 9px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnImageGroupBlockInner] {\
                        padding-bottom: 0 !important;\
                        padding-top: 0 !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        tbody[class=mcnImageGroupBlockOuter] {\
                        padding-bottom: 9px !important;\
                        padding-top: 9px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcnCaptionTopContent],\
                        table[class=mcnCaptionBottomContent] {\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcnCaptionLeftTextContentContainer],\
                        table[class=mcnCaptionRightTextContentContainer],\
                        table[class=mcnCaptionLeftImageContentContainer],\
                        table[class=mcnCaptionRightImageContentContainer],\
                        table[class=mcnImageCardLeftTextContentContainer],\
                        table[class=mcnImageCardRightTextContentContainer] {\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnImageCardLeftImageContent],\
                        td[class=mcnImageCardRightImageContent] {\
                        padding-right: 18px !important;\
                        padding-left: 18px !important;\
                        padding-bottom: 0 !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnImageCardBottomImageContent] {\
                        padding-bottom: 9px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnImageCardTopImageContent] {\
                        padding-top: 18px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcnCaptionLeftContentOuter] td[class=mcnTextContent],\
                        table[class=mcnCaptionRightContentOuter] td[class=mcnTextContent] {\
                        padding-top: 9px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnCaptionBlockInner] table[class=mcnCaptionTopContent]:last-child td[class=mcnTextContent] {\
                        padding-top: 18px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnBoxedTextContentColumn] {\
                        padding-left: 18px !important;\
                        padding-right: 18px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=columnsContainer] {\
                        display: block !important;\
                        max-width: 600px !important;\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=mcnTextContent] {\
                        padding-right: 18px !important;\
                        padding-left: 18px !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[id=templateContainer],\
                        table[id=templatePreheader],\
                        table[id=templateHeader],\
                        table[id=templateColumns],\
                        table[class=templateColumn],\
                        table[id=templateBody],\
                        table[id=templateFooter] {\
                        max-width: 600px !important;\
                        width: 100% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        h1 {\
                        font-size: 24px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        h2 {\
                        font-size: 20px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        h3 {\
                        font-size: 18px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        h4 {\
                        font-size: 16px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[class=mcnBoxedTextContentContainer] td[class=mcnTextContent],\
                        td[class=mcnBoxedTextContentContainer] td[class=mcnTextContent] p {\
                        font-size: 18px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        table[id=templatePreheader] {\
                        display: block !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=preheaderContainer] td[class=mcnTextContent],\
                        td[class=preheaderContainer] td[class=mcnTextContent] p {\
                        font-size: 14px !important;\
                        line-height: 115% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=headerContainer] td[class=mcnTextContent],\
                        td[class=headerContainer] td[class=mcnTextContent] p {\
                        font-size: 18px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=bodyContainer] td[class=mcnTextContent],\
                        td[class=bodyContainer] td[class=mcnTextContent] p {\
                        font-size: 18px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=leftColumnContainer] td[class=mcnTextContent],\
                        td[class=leftColumnContainer] td[class=mcnTextContent] p {\
                        font-size: 18px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=rightColumnContainer] td[class=mcnTextContent],\
                        td[class=rightColumnContainer] td[class=mcnTextContent] p {\
                        font-size: 18px !important;\
                        line-height: 125% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=footerContainer] td[class=mcnTextContent],\
                        td[class=footerContainer] td[class=mcnTextContent] p {\
                        font-size: 14px !important;\
                        line-height: 115% !important;\
                    }\
                }\
                \
                    @media only screen and (max-width: 480px) {\
                        td[class=footerContainer] a[class=utilityLink] {\
                        display: block !important;\
                    }\
                }\
                </style>\
            </head>\
            \
            <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="margin: 0;padding: 0;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;background-color: #F2F2F2;height: 100% !important;width: 100% !important;">\
                \
                <center>\
                    <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;margin: 0;padding: 20px;background-color: #F2F2F2;height: 100% !important;width: 100% !important;">\
                    <tr>\
                        <td align="center" valign="top" id="bodyCell" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;margin: 0;padding: 20px;border-top: 0;height: 100% !important;width: 100% !important;">\
                        <!-- BEGIN TEMPLATE // -->\
                        <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateContainer" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;border: 0;">\
                            <tr>\
                            <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                <!-- BEGIN PREHEADER // -->\
                                <!-- // END PREHEADER -->\
                        </td>\
                        </tr>\
                            <tr>\
                            <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                <!-- BEGIN HEADER // -->\
                                <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateHeader" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #222222;border-top: 10px solid #222222;border-bottom: 10px solid #222222;">\
                                <tr>\
                                    <td valign="top" class="headerContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnImageBlock" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                        <tbody class="mcnImageBlockOuter">\
                                        <tr>\
                                        <td valign="top" style="padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;" class="mcnImageBlockInner">\
                                            <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                            <tbody>\
                                            <tr>\
                                                <td class="mcnImageContent" valign="top" style="padding-right: 9px;padding-left: 9px;padding-top: 0;padding-bottom: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                \
                \
                                                <img align="left" alt="KB Logo" src="https://www.kushsupplyco.com/Images/Global/logo/KSC_logo_white.png" width="200" style="max-width: 200px;padding-bottom: 0;display: inline !important;vertical-align: bottom;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;" class="mcnImage">\
                \
                \
                                                </td>\
                                        </tr>\
                                        </tbody>\
                                        </table>\
                                    </td>\
                                    </tr>\
                                    </tbody>\
                                </table>\
                                </td>\
                            </tr>\
                            </table>\
                                <!-- // END HEADER -->\
                        </td>\
                        </tr>\
                            <tr>\
                            <td align="left" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                <!-- BEGIN BODY // -->\
                                <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateBody" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
                                <!--PLACE CONTENT HERE---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------->\
                \
                                <tr>\
                                    <td valign="top" class="bodyContainer" style="padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right: 20px; mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                '+ email_body + '\
                                    <p style="padding: 0 20px 20px;border-bottom: 1px solid #f2f2f2">\
                \
                                    </p>\
                                </td>\
                            </tr>\
                                <!--PLACE CONTENT HERE END-->\
                            </table>\
                                <!-- // END BODY -->\
                        </td>\
                        </tr>\
                            <tr>\
                            <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                        </td>\
                        </tr>\
                            <tr>\
                            <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                <!-- BEGIN FOOTER // -->\
                                <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateFooter" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
                                <tr>\
                                    <td valign="top" class="footerContainer" style="padding-bottom: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                \
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                        <tbody class="mcnTextBlockOuter">\
                                        <tr>\
                                        <td valign="top" class="mcnTextBlockInner" style="padding-top: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                            <!--[if mso]>\
                                            <table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">\
                                            <tr>\
                                            <![endif]-->\
                                            <!--[if mso]>\
                                            <td valign="top" width="600" style="width:600px;">\
                                            <![endif]-->\
                                            <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width: 100%;min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;" width="100%" class="mcnTextContentContainer">\
                                            <tbody>\
                                            <tr>\
                \
                                                <td align="center" valign="top" class="mcnTextContent" style="padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 11px;line-height: 125%;text-align: center;">\
                \
                                                <em style="text-align: center;">Copyright © Kush Supply Co., All rights reserved.</em>\
                                                <br>\
                                                <!--<br>\
                                                <strong>Our mailing address is:</strong><br>\
                                                *|HTML:LIST_ADDRESS_HTML|* *|END:IF|*<br>-->\
                                                <br>\
                                            </td>\
                                        </tr>\
                \
                                        </tbody>\
                                        </table>\
                                            <!--[if mso]>\
                                        </td>\
                                            <![endif]-->\
                                            <!--[if mso]>\
                                        </tr>\
                                        </table>\
                                            <![endif]-->\
                                    </td>\
                                    </tr>\
                                    </tbody>\
                                </table>\
                                </td>\
                            </tr>\
                            </table>\
                                <!-- // END FOOTER -->\
                        </td>\
                        </tr>\
                    </table>\
                        <!-- // END TEMPLATE -->\
                    </td>\
                </tr>\
                </table>\
            </center>\
            </body>\
                \
                </html>';
        }

        return {
            getInputData: getInputData,
            map: map
        };
    });