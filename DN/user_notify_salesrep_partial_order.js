var SEARCH, EMAIL;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/search", "N/email"], runUserEvent);

function runUserEvent(search, email) {
    SEARCH = search;
    EMAIL = email;

    var returnObj = {};
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}

function afterSubmit(context) {
    log.debug('afterSubmit Triggered');
    log.debug("context.type", context.type);
    var type = context.type;

    if(type != "create" && type != "ship"){
        return;
    }
    var shipstatus = context.newRecord.getValue("shipstatus");
    if(type == "create" && shipstatus == "C"){
        searchItemFulfillment(context);
    }
    if (type == "ship") {
        searchItemFulfillment(context);
    }
    return;
}

function condenseLines(context){
    var currentRecord = context.newRecord;
    var itemCount = currentRecord.getLineCount("item");
    var itemFulObj = {};

    for (var i = 0; i < itemCount; i++) {
        var itemName = currentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemname',
            line: i
        });

        if(!itemFulObj[itemName]){
            itemFulObj[itemName] = { 
                itemId : currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                }),
    
                itemLocation : currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: i
                }),
    
                itemQuantity : currentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                })
            };
        } else {
            //
            itemFulObj[itemName].itemQuantity = parseInt(itemFulObj[itemName].itemQuantity) + parseInt(currentRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            }));
        }
    }

    return itemFulObj;
}

function searchItemFulfillment(context){
    var currentRecord = context.newRecord;
    var soId = currentRecord.getValue("createdfrom");
    var soText = currentRecord.getText("createdfrom").replace("Sales Order #", "");
    var customerName = currentRecord.getText("entity");
    var fulId = currentRecord.id;
    var fulText = currentRecord.getValue("tranid");
    var partialFulfillmentArray = [];
    var itemCount = currentRecord.getLineCount("item");
    var itemFulObj = condenseLines(context);
    log.debug("item count", itemCount);

    // stop entire function is order is a transfer order item fulfillment
    if(currentRecord.getText("createdfrom").indexOf("Transfer Order") > -1 ){
        return;
    }
    
    for (var key in itemFulObj) {
        //not a sample item
        if(key.indexOf("Sample") == -1){
            var itemId = itemFulObj[key].itemId;
            
            var itemLocation = itemFulObj[key].itemLocation;
    
            var itemQuantity = itemFulObj[key].itemQuantity;

            var comparedItem = pullItemFromSO(soId, soText, fulId, fulText, customerName, itemId, itemLocation, itemQuantity);
    
            // quantity does not match
            if(!comparedItem.quantityMatch){
                log.debug(comparedItem);
                partialFulfillmentArray.push(comparedItem.item);
            }
        }
    }

    // for (var i = 0; i < itemCount; i++) {
    //     var itemName = currentRecord.getSublistValue({
    //         sublistId: 'item',
    //         fieldId: 'itemname',
    //         line: i
    //     });

    //     var sampleItem = itemName.indexOf("Sample") > -1;

    //     if(!sampleItem){
    //         var itemId = currentRecord.getSublistValue({
    //             sublistId: 'item',
    //             fieldId: 'item',
    //             line: i
    //         });
    
    //         var itemLocation = currentRecord.getSublistValue({
    //             sublistId: 'item',
    //             fieldId: 'location',
    //             line: i
    //         });
    
    //         var itemQuantity = currentRecord.getSublistValue({
    //             sublistId: 'item',
    //             fieldId: 'quantity',
    //             line: i
    //         });
    
    //         var comparedItem = pullItemFromSO(soId, soText, fulId, fulText, customerName, itemId, itemLocation, itemQuantity);
    
    //         // quantity does not match
    //         if(!comparedItem.quantityMatch){
    //             log.debug(comparedItem);
    //             partialFulfillmentArray.push(comparedItem.item);
    //         }
    //     }
    // }

    if(partialFulfillmentArray.length > 0){
        log.debug("search item fulfullment", partialFulfillmentArray);
        sendNotificationEmail(partialFulfillmentArray);
    }
}

function pullItemFromSO(soId, soText, fulId, fulText, customerName, itemId, itemLocation, itemQuantity) {
    log.debug("pull item from so", {soId: soId, itemId: itemId, itemLocation: itemLocation, itemQuantity: itemQuantity});
    var comparisonObject = {
        quantityMatch: false
    };

    //do a search that takes in SO internal ID, item internal, location id, then compare the quantity
    var salesorderSearchObj = SEARCH.create({
        type: "salesorder",
        filters: [
            ["type", "anyof", "SalesOrd"],
            "AND", ["item", "anyof", itemId],
            "AND", ["internalidnumber", "equalto", soId],
            "AND", ["location", "anyof", itemLocation]
        ],
        columns: [
            SEARCH.createColumn({
                name: "internalid",
                summary: "GROUP"
            }),
            SEARCH.createColumn({
                name: "item",
                summary: "GROUP"
            }),
            SEARCH.createColumn({
                name: "location",
                summary: "GROUP"
            }),
            SEARCH.createColumn({
                name: "quantityuom",
                summary: "SUM"
            }),
            SEARCH.createColumn({
                name: "salesrep",
                summary: "GROUP"
            }),
            SEARCH.createColumn({
                name: "shipmethod",
                summary: "GROUP"
            })
        ]
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    log.debug("salesorderSearchObj result count", searchResultCount);

    salesorderSearchObj.run().each(function (result) {
        var soQuantity = result.getValue({
            name: "quantityuom",
            summary: "SUM"
        });
        
        if (parseFloat(soQuantity) != parseFloat(itemQuantity) && itemQuantity) {
            comparisonObject = {
                quantityMatch: false,
                item: {
                    customerName: customerName,
                    fulId: fulId,
                    fulText: fulText,
                    fulQuantity: itemQuantity,
                    location: result.getText({
                        name: "location",
                        summary: "GROUP"
                    }),
                    name: result.getText({
                        name: "item",
                        summary: "GROUP"
                    }),
                    salesRep: result.getValue({
                        name: "salesrep",
                        summary: "GROUP"
                    }),
                    salesRepName: result.getText({
                        name: "salesrep",
                        summary: "GROUP"
                    }),
                    shipMethod: result.getText({
                        name: "shipmethod",
                        summary: "GROUP"
                    }),
                    soId: result.getValue({
                        name: "internalid",
                        summary: "GROUP"
                    }),
                    soText: soText,
                    soQuantity: result.getValue({
                        name: "quantityuom",
                        summary: "SUM"
                    })
                }
            };
        } else {
            comparisonObject = {
                quantityMatch: true
            };
        }
        return true;
    });

    return comparisonObject;
}

function sendNotificationEmail(partialFulfillmentArray){
    log.debug("send notification email", partialFulfillmentArray);
    var location = partialFulfillmentArray[0].location;
    var soText = partialFulfillmentArray[0].soText;
    var soId = partialFulfillmentArray[0].soId;
    var salesRep = partialFulfillmentArray[0].salesRep;
    var salesRepName = partialFulfillmentArray[0].salesRepName.split(" ")[0];
    var shipMethod = partialFulfillmentArray[0].shipMethod;
    var soLink = '<a href="https://system.netsuite.com/app/accounting/transactions/salesord.nl?id=' + soId + '">' + soText + '</a>';
    var fulText = partialFulfillmentArray[0].fulText;
    var fulId = partialFulfillmentArray[0].fulId;
    var fulLink = '<a href="https://system.netsuite.com/app/accounting/transactions/itemship.nl?whence=&id=' + fulId + '">' + fulText + '</a>';
    var customerName = partialFulfillmentArray[0].customerName;
    var items_row = "";

    for(var i = 0; i < partialFulfillmentArray.length; i++){
        var name = partialFulfillmentArray[i].name;
        var soQuantity = partialFulfillmentArray[i].soQuantity;
        var fulQuantity = partialFulfillmentArray[i].fulQuantity;

        var table_row = 
        '<tr style="color:#606060 !important;">'+
            '<td align="left" colspan="4">'+ name +'</td>'+
            '<td align="right" colspan="4">'+ soQuantity +'</td>'+
            '<td align="right" colspan="4">'+ fulQuantity +'</td>'+
        '</tr>';

        items_row += table_row;
    }

    var email_body = 
    '<p style="padding:0px 0px 0px 0px; text-align:left; font-size:15px; font-family:Helvetica; color:#606060 !important;">'+
        'Hello ' + salesRepName + "," +
        '<br />'+
        '<br />'+
        'This email is to inform you that an order for ' + customerName + ' was partially fulfilled.' +
        '<br />'+
        '<br />Customer: ' + customerName +
        '<br />Sales Order: ' + soLink  + 
        '<br />Item Fulfillment: ' + fulLink +
        '<br />Fulfillment Location: ' + location +
        '<br />Ship Method: ' + shipMethod +
        '<br />' +
        '<br />' +
        '<p>' +
        '<table style="color: #606060 !important;" class="itemtable" style="width: 100%; margin-top: 10px;">'+
        '<thead style="color: #606060;">'+
            '<tr>'+
                '<th align="left" colspan="4">Item</th>'+
                '<th align="right" colspan="4">Quantity Requested</th>'+
                '<th align="right" colspan="4">Quantity Fulfilled</th>'+
            '</tr>'+
        '</thead>'+
        items_row +
        '</table>'+
        '</p>'+
        '<br />' +
        '<br /><span style="color: #606060 !important;">This is only a notification, please review the sales order for more information.</span>'+
    '</p>';
    

    EMAIL.send({
        author: "943918", // no reply at kb 943918
        // recipients: "172124", // dennis for testing
        recipients: salesRep,
        subject: 'Kush Supply Co. - Partial Item Fulfillment Made',
        body: returnEmailBody(email_body)
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
            Kush Bottles TSM/SSS Notification - Item Fulfillment\
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
                border-bottom: 3px solid #2ADB53 !important;\
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
                                        <img align="left" alt="KB Logo" src="https://www.kushsupplyco.com/images/Invoice_KSC-Logo-500px-LongHorizontal-White.png" width="200" style="max-width: 200px;padding-bottom: 0;display: inline !important;vertical-align: bottom;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;" class="mcnImage">\
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
                                        <em style="text-align: center;">Copyright © Kush Supply Co Inc., All rights reserved.</em>\
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