// 2.0 - Fluent
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @appliedtorecord salesorders
 */
define(["N/record", "N/log", "N/email", "N/search", "N/runtime", "../Library/moment"], function (record, log, email, search, runtime, moment) {
    function notifyTSM(context) {

        log.debug("Progress Check: ", "Function is being called");
        try {
            if (runtime.executionContext === runtime.ContextType.WEBSTORE) {
                log.debug("Context Check", runtime.executionContext + " " + runtime.ContextType.WEBSTORE);
                var newRecord = context.newRecord;
                var internalId = newRecord.id;
                var recordType = newRecord.type;
                var emailRecipients = [];
                var customer_support_id;
                var environment = runtime.envType;
                if (environment == runtime.EnvType.SANDBOX) {
                    customer_support_id = '1110470';
                } else {
                    customer_support_id = '1179758';
                }

                var loadedRecord = record.load({
                    type: recordType,
                    id: internalId,
                    isDynamic: false,
                    defaultValues: null
                });

                //if not serviced by Online (KB.com) - stop function
                if (loadedRecord.getValue("custbody1") != "4926") {
                    return;
                }

                var transaction = {
                    customerName: loadedRecord.getValue("entityname"),
                    customerId: loadedRecord.getValue("entity"),
                    billAddress: loadedRecord.getValue("billaddress").replace(/\n/g, "<br />"),
                    shipAddress: loadedRecord.getValue("shipaddress").replace(/\n/g, "<br />"),
                    ordersHtml: loadedRecord.getValue("custbody_orderlines_html"),
                    zipcode: loadedRecord.getValue("shipzip"),
                    orderNumber: loadedRecord.getValue("memo"),
                    soNumber: loadedRecord.getValue("tranid"),
                    recordId: loadedRecord.getValue("id"),
                    shipMethod: loadedRecord.getText("shipmethod"),
                    paymentMethod: loadedRecord.getText("paymentmethod"),
                    shipCountry: loadedRecord.getValue("shipcountry"),
                    salesrep: loadedRecord.getText("salesrep"),
                    salesrepId: loadedRecord.getValue("salesrep"),
                    amount: loadedRecord.getValue("total")
                };


                var newCustHTML = "";
                var accountManagerfieldLookUp = search.lookupFields({
                    type: "customer",
                    id: transaction.customerId,
                    columns: ["salesrep"]
                });

                if (accountManagerfieldLookUp.salesrep[0].value == customer_support_id) { //exit if customer support team
                    return;
                }
                //TSM FOR CUSTOMER EXIST
                if (accountManagerfieldLookUp.salesrep[0].value != "1179758") {

                    //FIND SSS
                    var SSS = search.lookupFields({
                        type: "employee",
                        id: accountManagerfieldLookUp.salesrep[0].value,
                        columns: ["custentity_sss"]
                    });

                    emailRecipients.push(accountManagerfieldLookUp.salesrep[0].value); //TSM

                    if (SSS.custentity_sss.length > 0) {
                        emailRecipients.push(SSS.custentity_sss[0].value); //SSS
                    }


                    email.send({
                        author: 4926,
                        recipients: emailRecipients,
                        bcc: ["172124", "onlineorders@kushbottles.com"], //CC - Dennis for testing
                        subject: "Notification: Order was made in your territory.",
                        body: returnEmailBody()
                    });

                    return;

                }


                //if Canada
                if (transaction.shipCountry == "CA") {
                    log.debug("Progress Check: ", "Canada Conditional Met, ship country is Canada");

                    //update transaction sales rep w/ TSM
                    record.submitFields({
                        type: "salesorder",
                        id: internalId,
                        values: {
                            salesrep: "36250"
                        }
                    });

                    //update customer record sales rep w/ TSM
                    if (accountManagerfieldLookUp.salesrep[0].value == "1179758") {
                        newCustHTML = "<span style='color: red;'>(First Time Customer)</span>";
                        record.submitFields({
                            type: "customer",
                            id: transaction.customerId,
                            values: {
                                salesrep: "36250"
                            }
                        });

                        transaction.salesrep = "Ryan Lorenzen";
                    }

                    email.send({
                        author: 4926,
                        recipients: ["36250", "9176"], //Ryan Lorenzen and Reed Longstreth
                        bcc: ["172124", "onlineorders@kushbottles.com"], //CC - Dennis for testing
                        subject: "KB Notification: Order was made in your territory.",
                        body: returnEmailBody()
                    });
                    return;
                }

                //if shipping method is local pick up - loads customer, gets their shipzip - which is their default, billzip does not populate
                if (transaction.shipMethod.indexOf("Local Pickup") > -1) {
                    var customerRecord = record.load({
                        type: "customer",
                        id: transaction.customerId,
                        isDynamic: false,
                        defaultValues: null
                    });

                    transaction.zipcode = customerRecord.getValue("shipzip");
                    log.debug("Progress Check: ", "Local Pickup Conditional Met, zip code found is " + transaction.zipcode);
                }

                //if zipcode starts with a 0, remove the 0. Netsuite truncates starting 0s from Zipcodes.
                if (transaction.zipcode && transaction.zipcode[0] == "0") {
                    log.debug("Progress Check: ", "Zipcode Truncate Conditional Met");
                    transaction.zipcode = transaction.zipcode.substring(1);
                }

                //converts long zipcodes to short ones for US - Example 95762-3713 to 95762
                if (transaction.zipcode.indexOf("-") > -1 && transaction.shipCountry == "US") {
                    transaction.zipcode = transaction.zipcode.split("-")[0];
                    log.debug("Progress Check: ", "Converting Long Zip code: New zip is " + transaction.zipcode);
                }

                var tsmInfo = findTSM(transaction.zipcode);
                log.debug('transaction.amount', transaction.amount);
                log.debug('tsmInfo.threshold', tsmInfo.threshold);
                if (+transaction.amount > +tsmInfo.threshold) {
                    if (accountManagerfieldLookUp.salesrep[0].value == "519") {
                        var updatedTSM = tsmInfo.tsm;
                        var updatedSSS = tsmInfo.sss;
                        newCustHTML = "<span style='color: red;'>First Time Customer</span>";

                        if (updatedTSM) {

                            var tsmLookup = search.lookupFields({
                                type: "employee",
                                id: updatedTSM,
                                columns: ["entityid", "custentity_sss"]
                            });

                            if (tsmLookup.custentity_sss.length > 0) {
                                emailRecipients.push(tsmLookup.custentity_sss[0].value);
                            }

                            if (emailRecipients.indexOf(updatedTSM) == -1) {
                                emailRecipients.push(updatedTSM);
                            }
                            var updateSuccess = record.submitFields({
                                type: "customer",
                                id: transaction.customerId,
                                values: {
                                    salesrep: updatedTSM,
                                    custentity_customer_type: "3",
                                }
                            });

                            if (updateSuccess) {
                                updateEmployeeLeadDate(updatedTSM);
                            }

                            //update transaction sales rep w/ TSM
                            record.submitFields({
                                type: "salesorder",
                                id: internalId,
                                values: {
                                    salesrep: updatedTSM
                                }
                            });

                            transaction.salesrep = tsmLookup.entityid;
                        }
                        if (updatedSSS) {
                            if (emailRecipients.indexOf(updatedSSS) == -1) {
                                emailRecipients.push(updatedSSS);
                            }
                        }
                    } else {
                        var tsmRecord = search.lookupFields({
                            type: "employee",
                            id: accountManagerfieldLookUp.salesrep[0].value,
                            columns: ["entityid", "custentity_sss"]
                        });

                        transaction.salesrep = tsmRecord.entityid;

                        //add SSS to email list
                        if (tsmRecord.custentity_sss.length > 0) {
                            emailRecipients.push(tsmRecord.custentity_sss[0].value);
                        }

                        //add customers tsm to email list
                        if (emailRecipients.indexOf(accountManagerfieldLookUp.salesrep[0].value) == -1) {
                            emailRecipients.push(accountManagerfieldLookUp.salesrep[0].value);
                        }
                    }
                    // no TSM/SSS found in search - stop function
                    if (emailRecipients.length == 0) {
                        log.debug("Progress Check: ", "Conditional , no email recips found. Zip Code is " + transaction.zipcode + ". Sending email to Scott");
                        record.submitFields({
                            type: "customer",
                            id: transaction.customerId,
                            values: {
                                salesrep: "27997", //Mary Bumatai - 5/21/2018
                                custentity_customer_type: "3",
                            }
                        });
                        record.submitFields({
                            type: "salesorder",
                            id: internalId,
                            values: {
                                salesrep: "27997" //Mary Bumatai - 5/21/2018
                            }
                        });
                        transaction.salesrep = "Mary Bumatai"; // 5/21/2018
                        noTsmFound();
                        return;
                    } else {
                        log.debug("Progress Check: ", "Conditional , email recips found. Zip Code is " + transaction.zipcode + " and recips are " + emailRecipients);
                        email.send({
                            author: 4926,
                            recipients: emailRecipients,
                            bcc: ["172124", "onlineorders@kushbottles.com"], //CC - Dennis for testing
                            subject: "KB Notification: Order was made in your territory.",
                            body: returnEmailBody()
                        });
                        log.debug("Progress Check: ", "Email Sent: Zipcode is " + transaction.zipcode + " and recips are " + emailRecipients);

                    }
                } else { //if less than 5000 assign SO and customer to customer support team
                    //OMFG
                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: transaction.customerId,
                        values: {
                            salesrep: customer_support_id,
                            custentity_customer_type: "1",
                        }
                    });
                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: transaction.recordId,
                        values: {
                            salesrep: customer_support_id
                        }
                    });
                }
                //customer record shows that sales rep is House


            }
        } catch (e) {
            log.debug("error", e);
        }


        function findTSM(zipcode) {
            var updatedTSM = "";
            var updatedSSS = "";
            var customrecord_geolocationSearchObj = search.create({
                type: "customrecord_geolocation",
                filters: [
                    ["custrecord_zip", "is", zipcode]
                ],
                columns: [
                    "custrecord_zip",
                    "custrecord_tsm",
                    "custrecord_sss",
                    "custrecord_geo_threshold"
                ]
            });
            var threshold;
            customrecord_geolocationSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                threshold = result.getValue({
                    name: "custrecord_geo_threshold"
                });

                updatedTSM = result.getValue({
                    name: "custrecord_tsm"
                });
                // updatedSSS = result.getValue({
                //     name: "custrecord_sss"
                // });

                // updatedTSM = tsmId;
                // // emailRecipients.push(tsmId);

                // updatedSSS = sssId;

                return false;
            });

            if (updatedTSM.split(",").length == 1) {
                return {
                    threshold: threshold,
                    tsm: updatedTSM,
                    sss: updatedSSS
                };
            } else {
                updatedTSM = pickTSM(updatedTSM.split(","));
            }

            return {
                threshold: threshold,
                tsm: updatedTSM,
                sss: updatedSSS
            };

        }

        function pickTSM(tsmList) {
            log.debug("pickedtsm", "function called");
            var filtersArray = [];
            var pickedTSM = "";

            for (var i = 0; i < tsmList.length; i++) {
                if (i < tsmList.length - 1) {
                    filtersArray.push(["internalidnumber", "equalto", tsmList[i]]);
                    filtersArray.push("OR");
                } else {
                    filtersArray.push(["internalidnumber", "equalto", tsmList[i]]);
                }

            }

            var employeeSearchObj = search.create({
                type: "employee",
                filters: filtersArray,
                columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "custentity_last_lead_added_date",
                        sort: search.Sort.DESC,
                        label: "Last Lead Added Date"
                    })
                ]
            });

            employeeSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                pickedTSM = result.getValue({
                    name: "internalid"
                });
                var lastLeadDate = result.getValue({
                    name: "custentity_last_lead_added_date"
                });
                if (!lastLeadDate) {
                    return false;
                }
                log.debug("picked tsm", pickedTSM);
                return true;
            });
            return pickedTSM;
        }

        function updateEmployeeLeadDate(employeeId) {
            log.debug("updateEmployeeLeadDate", "function called");
            var now = new Date();
            var formattedDate = moment(now).format("MM/DD/YYYY hh:mm:ss A");
            log.debug("time", formattedDate);
            record.submitFields({
                type: "employee",
                id: employeeId,
                values: {
                    "custentity_last_lead_added_date": formattedDate
                }
            });
        }

        function noTsmFound() {
            email.send({
                author: 4926,
                recipients: ["27997"], //Mary Bumatai - 5/21/2018
                bcc: ["172124", "onlineorders@kushbottles.com"], //CC - Dennis for testing
                subject: "KB Notification: Order was made and territory not found.",
                body: returnEmailBody()
            });
        }

        function returnEmailBody() {
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
								<table border="0" cellpadding="0" cellspacing="0" width="600" id="templatePreheader" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
								<tr>\
									<td valign="top" class="preheaderContainer" style="padding-top: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
									<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
										<tbody class="mcnTextBlockOuter">\
										<tr>\
										<td valign="top" class="mcnTextBlockInner" style="padding-top: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
											<!--[if mso]>\
											<table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">\
											<tr>\
				\
				\
									</td>\
										<![endif]-->\
				\
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
												<img align="left" alt="Your order number' + transaction.soNumber + 'has been received." src="https://www.kushsupplyco.com/Images/Global/logo/KSC_logo_white.png" width="200" style="max-width: 200px;padding-bottom: 0;display: inline !important;vertical-align: bottom;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;" class="mcnImage">\
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
									<td valign="top" class="bodyContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
									<p style="padding:20px 20px 0 20px; text-align:left; font-size:15px; font-family:Helvetica; color:#606060 !important;">\
										You are being notified because an order was placed in your territory.\
										<br />\
										<br />The order number <span style="color:#00da5f;">' + transaction.soNumber + '</span> has been received.\
										<br />\
										<br />\
										Account Manager: <span style="color: black;text-decoration:none;text-transform:uppercase; font-weight: bold; font-family:Helvetica;font-size:14px" >' + transaction.salesrep + '</span>\
										<br />\
										<br />\
										Sales Order: <a style="color:#00adff;text-decoration:none;text-transform:uppercase; font-family:Helvetica;font-size:14px" href="https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id=' + transaction.recordId + '&whence=">' + transaction.soNumber + '</a>\
										<br />\
										<br />\
										Customer: <a style="color:#00adff;text-decoration:none;text-transform:uppercase; font-family:Helvetica;font-size:14px" href="https://system.na2.netsuite.com/app/common/entity/custjob.nl?id=' + transaction.customerId + '&whence=">' + transaction.customerName + '</a> ' + newCustHTML + '\
										<br />\
								</p>\
									<p style="padding: 0 20px 20px;border-bottom: 1px solid #f2f2f2">\
				\
									</p>\
								</td>\
							</tr>\
				\
								<!-- 2 Even Columns : BEGIN -->\
								<tr>\
									<td align="center" height="100%" valign="top" width="100%" style="padding-bottom: 20px; border-bottom:1px solid #f2f2f2">\
									<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="left" width="100%" style="max-width:580px;">\
										<tr>\
										<!--COLUMN 1-->\
										<td id="testText" align="left" valign="top" width="50%">\
										\
											<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size: 12px;text-align: left;">\
											<tr>\
												<td id="shipto" style="text-align: left;font-family: sans-serif; font-size: 12px; mso-height-rule: exactly; line-height: 20px; color: #555555; padding: 20px 10px 0px 20px;" class="stack-column-center">\
												<div class="shippinginfo"><div class="shippingto" style="width: 100%; float: left;">\
												<strong>Ship to:</strong><br />\
												' + transaction.shipAddress + '\
												<br /> <br /> <strong>Shipping Method:</strong> ' + transaction.shipMethod + '\
												<div class="billingto" style="width: 100%; float: left;">\
												</td>\
										</tr>\
										</table>\
									</td>\
										<!--COLUMN 2-->\
										<td align="left" valign="top" width="50%">\
											<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size: 14px;text-align: left;">\
											<tr>\
												<td style="text-align: left;font-family: sans-serif; font-size: 12px; mso-height-rule: exactly; line-height: 20px; color: #555555; padding: 20px 10px 0px 20px" class="stack-column-center">\
												<strong>Bill To:</strong><br />\
												<!-- <NLBILLADDRESS> -->\
														' + transaction.billAddress + '\
														<br /> <br /> <strong>Payment Method:</strong> ' + transaction.paymentMethod + '\
												</div>\
											</td>\
										</tr>\
										</table>\
									</td>\
									</tr>\
								</table>\
								</td>\
							</tr>\
								<!-- Two Even Columns : END -->\
				\
				\
				\
				\
				\
								<tr>\
									<td style="padding:20px 20px 20px 20px;">\
									<!--Purchased Product List-->\
									<span class="email-prod-list">\
													' + transaction.ordersHtml + '\
											</span>\
									<!--Purchased Product List END-->\
								</td>\
							</tr>\
								<!--/BILLING METHOD-->\
								<!--PLACE CONTENT HERE END-->\
							</table>\
								<!-- // END BODY -->\
						</td>\
						</tr>\
							<tr>\
							<td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
								<!-- BEGIN COLUMNS // -->\
								<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateColumns" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
								<tr>\
									<td align="left" valign="top" class="columnsContainer" width="50%" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
									<table border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;">\
										<tr>\
										<td valign="top" class="leftColumnContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;"></td>\
									</tr>\
								</table>\
								</td>\
									<td align="left" valign="top" class="columnsContainer" width="50%" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
									<table border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;">\
										<tr>\
										<td valign="top" class="rightColumnContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;"></td>\
									</tr>\
								</table>\
								</td>\
							</tr>\
							</table>\
								<!-- // END COLUMNS -->\
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
												<td valign="top" class="mcnTextContent" style="padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 11px;line-height: 125%;text-align: left;">\
				\
												<em style="text-align: center;">Copyright @ Kush Supply Co., All rights reserved.</em>\
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

    }

    return {
        afterSubmit: notifyTSM
    };
});