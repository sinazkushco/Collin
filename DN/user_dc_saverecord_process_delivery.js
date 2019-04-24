var RECORD, LOG, RENDER, EMAIL;
 
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/render', 'N/email'], runUserEvent);
 
function runUserEvent(record, log, render, email) {
    RECORD = record;
    LOG = log;
    RENDER = render;
    EMAIL = email;
 
    var returnObj = {};
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}
 
function afterSubmit(context) {
    var dlcf_json = JSON.parse(context.newRecord.getValue({fieldId: "custrecord_dclf_json"}));
    LOG.debug("dlcf_json", dlcf_json);
    submit_delivery(dlcf_json);
    return;
}

/*========================================================================================================================================*/
/*========================================================================================================================================*/
function submit_delivery(dlcf_json) {
    LOG.debug("submit delivery started", "started");
    var submit_status = {
        status: false
    };
    var item_fulfillment_id = dlcf_json.item_fulfillment_id;
    var sales_order_id = dlcf_json.order_id;
    var amount_collected = dlcf_json.amount_collected;
    var location = dlcf_json.location;
    var payment_method = dlcf_json.payment_method;
    var delivery_driver_id = dlcf_json.delivery_driver_id;
    LOG.debug(dlcf_json.item_fulfillment_id);
    if (item_fulfillment_id) {
        // update item fulfillment to shipped
        var update_success = RECORD.submitFields({
            type: "itemfulfillment",
            id: item_fulfillment_id,
            values: {
                "shipstatus": "C"
            }
        });

        var netsuite_payment_method = "";

        //POD + PAYMENT COLLECTED
        if (payment_method != "Payment In Advance" && payment_method != "No Payment Collected") {
            if (payment_method == "Cash") {
                netsuite_payment_method = "1";
            } else if (payment_method == "Check") {
                netsuite_payment_method = "2";
            } else if (payment_method == "Money Order") {
                netsuite_payment_method = "9";
            }

            // removes payment method off sales order
            RECORD.submitFields({
                type: 'salesorder',
                id: sales_order_id,
                values: {
                    'paymentmethod': ''
                }
            });

        }

        if (update_success) {
            create_invoice({
                sales_order_id: sales_order_id,
                // petty_account: petty_account,
                payment_method: netsuite_payment_method,
                amount_collected: amount_collected,
                location: location,
                delivery_driver_id: delivery_driver_id 
            });

            create_pdf(dlcf_json);
            submit_status.status = true;
        }
    } 

}
/*========================================================================================================================================*/
/*========================================================================================================================================*/
function create_invoice(params) {
    var invoice_record = RECORD.transform({
        fromType: RECORD.Type.SALES_ORDER,
        fromId: params.sales_order_id,
        toType: RECORD.Type.INVOICE,
        isDynamic: true
    });

    var invoice_id = invoice_record.save();

    if(params.amount_collected) {
        var payment_record = RECORD.transform({
            fromType: RECORD.Type.INVOICE,
            fromId: invoice_id,
            toType: RECORD.Type.CUSTOMER_PAYMENT,
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
            value: params.amount_collected
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
    }

   

    // LOG.debug("payment_record", "created");

    // if (payment_success) {
    //     var loaded_invoice_record = RECORD.load({
    //         type: RECORD.Type.INVOICE,
    //         id: invoice_id,
    //         isDynamic: true
    //     });

    //     if(loaded_invoice_record.getValue({fieldId: "email"})){
    //         loaded_invoice_record.setValue({
    //             fieldId: "tobeemailed",
    //             value: true
    //         });
    //     }

    //     loaded_invoice_record.save();
    //     return payment_success;
    // } else {
    //     return false;
    // }

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

    for(var key in items){
        var item_name = items[key].name.replace(/&/g, "&amp;");
        var item_description = items[key].description.replace(/&/g, "&amp;");
        var item_quantity = items[key].quantity;
        var item_rate = items[key].rate;
        var item_tax = items[key].tax;
        var item_total = items[key].total;
        var table_row = 
        '<tr>'+
            '<td align="center" colspan="3" line-height="150%">'+ item_quantity +'</td>'+
            '<td colspan="12"><!--<span class="itemname">'+ item_name +'</span>-->'+ item_description +'</td>'+
            '<td colspan="2">'+ item_tax +'</td>'+
            '<td align="right" colspan="4">'+ item_rate +'</td>'+
            '<td align="right" colspan="4">'+ item_total +'</td>'+
        '</tr>';

        items_row += table_row;

    }    

    if(params.amount_collected != ""){
        amount_collected = 
        '<td align="right"><b>Customer Paid:</b></td>'+
        '<td align="right">$'+ params.amount_collected +'</td>';
    }
    if(params.no_payment_reason != ""){
        no_payment_reason = 
        '<td align="right"><b>No Payment Reason:</b></td>'+
        '<td align="right">'+ params.no_payment_reason +'</td>';
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
                '<td align="right" style="padding: 0;"><span style="font-size: 16pt;">DC#'+ params.item_fulfillment_number +'</span></td>'+
            '</tr>'+
            '<tr>'+
                '<td align="right" style="padding: 0;"><span style="font-size: 12pt;">Customer: <b>'+ params.customer_name +'</b></span></td>'+
            '</tr>'+
            '<tr>'+
                '<td align="right" style="padding: 0;"><span>Date: ' + params.timestamp.split(",")[0] + '</span></td>'+
            '</tr>'+
        '</table>'+

        '<table style="width: 100%; margin-top: 10px; padding-top: 40px;">'+
            '<tr>'+
                '<td class="addressheader" colspan="6"><b>Customer Address</b></td>'+
                '<td class="totalboxtop" colspan="5"><b>AMOUNT DUE</b></td>'+
            '</tr>'+
            '<tr>'+
            '<td class="address" colspan="6" rowspan="2">'+ JSON.parse(params.shipping_address).join("<br/>") +'</td>'+
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
                '<td>'+ params.payment_method +'</td>'+
                '<td>Local Delivery</td>'+
            '</tr>'+
        '</table>'+
        '<table class="itemtable" style="width: 100%; margin-top: 10px;">'+
            '<thead>'+
                '<tr>'+
                    '<th align="center" colspan="3">Quantity</th>'+
                    '<th colspan="12">Name</th>'+
                    '<th colspan="2">Unit Tax</th>'+
                    '<th align="right" colspan="4">Unit Price</th>'+
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
                '<td style="vertical-align: bottom;"><img width="15%" height="15%" src="'+ params.signature +'"></img><br/>'+ params.signature_name +'<br/> <b>Customer Signature</b></td>'+
                '<td style="vertical-align: bottom;">'+ params.timestamp +'<br/> <b>Date and Time</b></td>'+
            '</tr>'+
        '</table>'+

    '</body>'+
    '</pdf>';

    var renderer = RENDER.create();
    renderer.templateContent = header+body;
    var pdfFile = renderer.renderAsPdf();


    pdfFile.name = params.item_fulfillment_number + "_" +params.timestamp.replace(/\D/g,'') + ".pdf";
    pdfFile.folder = "501797";
    var file_id = pdfFile.save();

    RECORD.attach({
        record: {
            type: 'file',
            id: file_id
        },
        to: {
            type: 'salesorder',
            id: params.order_id
        }
    });

 
    if(parseFloat(params.amount_collected || 0) > parseFloat(params.amount_due || 0)){
        LOG.debug("customer email", params.customer_email);
        if(params.customer_email){
            EMAIL.send({
                author: "519",
                recipients: params.customer_email,
                subject: 'Kush Bottles - Delivery Confirmation PDF',
                body: 'Please open the attached file to view your confirmation.',
                attachments: [pdfFile]
            });
        }
    }

}