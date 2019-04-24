/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType plugintypeimpl
 */


//------------------------------------------------------------------------------------------------------------
//Script: 		PRI Record State Manager - Rule Implementation Plugin for Kush
//Description: 
//Developer: 	Alex Fodor
//Date: 		July 2017
//------------------------------------------------------------------------------------------------------------

define(["N/runtime", "N/log", "N/record", "N/search"],
    function (runtime, log, record, search) {

        var scriptName = "K_PL_RSM_Evaluate_Rules.";

        // evaluates a specific rule against a specific record

        function evaluateRule(ruleName, ruleParams, ruleMsg, REC) {

            var funcName = scriptName + "evaluateRule " + REC.type + ":" + REC.id + " | " + ruleName;

            log.debug(funcName, "starting");

            var ruleStatus = {
                notChecked: false,
                notApplicable: false,
                passed: false,
                message: ""
            };

            switch (REC.type.toString().toLowerCase() + "." + ruleName.toLowerCase()) {
            //==========================================================================================
            // Declined Credit Card
            //==========================================================================================
            case "salesorder.declinedcreditcard":
                evaluateDeclinedCreditCard(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Header and Line Discounts
                //==========================================================================================
                //				case "salesorder.headerlinediscounts": 
                //					 evaluateHeaderLineDiscounts(ruleStatus, ruleParams, ruleMsg, REC);
                //					 break;

                //==========================================================================================
                // Overdue Balance
                //==========================================================================================
            case "salesorder.overduebalance":
                evaluateOverdueBalance(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Will Call Payment
                //==========================================================================================
            case "salesorder.willcallpayment":
                evaluateWillCallPayment(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Hold for Approval Payment Method Required 
                //==========================================================================================
            case "salesorder.holdforapproval":
                evaluateHoldForApproval(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Hold for Online Orders 
                //==========================================================================================
            case "salesorder.holdonlineorders":
                evaluateOnlineForApproval(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Payment Method Required 
                //==========================================================================================
            case "salesorder.paymentmethodrequired":
                evaluatePaymentMethodRequired(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Future Ship Date
                //==========================================================================================
                //				case "salesorder.futureshipdate": 
                //					 evaluateFutureShipDate(ruleStatus, ruleParams, ruleMsg, REC);
                //					 break;
                //==========================================================================================
                // No Free Shipping Check
                //==========================================================================================
            case "salesorder.freeshippingcheck":
                freeShippingCheck(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // No Free Shipping Ground
                //==========================================================================================
            case "salesorder.freeshippingground":
                freeShippingGround(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // FedEx Shipping & Shipping Cost is $0.00
                //==========================================================================================
            case "salesorder.fedexshipping":
                fedExShipMethod(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Gross Margin Approval
                //==========================================================================================
            case "salesorder.grossmarginapproval":
                evaluateGrossMarginApproval(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Item Availability Check Function
                //==========================================================================================
            case "salesorder.itemavailabilitycheck":
                itemAvailability(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Invalid Item Use Function
                //==========================================================================================
            case "salesorder.invaliditemuse":
                invalidItemUse(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Non Legal Ship States
                //==========================================================================================
            case "salesorder.nonlegalstates":
                nonLegalStates(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Fraud Check Function
                //==========================================================================================
            case "salesorder.fraudcheck":
                fraudCheck(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Credit Balance Check With Terms
                //==========================================================================================
            case "salesorder.creditbalancecheck":
                checkCreditBalance(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Release order if customer is below credit limit
                //==========================================================================================
            case "salesorder.prepaymentrequired":
                prepaymentRequired(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Payment on Delivery Check
                //==========================================================================================
            case "salesorder.paymentondelivery":
                paymentOnDelivery(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Hazmat Items
                //==========================================================================================
            case "salesorder.hazmatitems":
                evaluateHazmatItems(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // FedEx Phone & Addressee
                //==========================================================================================
            case "salesorder.fedexphonecheck":
                fedExRequiredFields(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Mismatched bill and ship address
                //==========================================================================================
            case "salesorder.mismatchbillandshipaddress":
                mismatch_bill_and_ship_address(ruleStatus, ruleParams, ruleMsg, REC);
                break;

                //==========================================================================================
                // Mismatched bill and ship address
                //==========================================================================================
            case "salesorder.mismatchedccandbilladdress":
                mismatch_bill_and_cc_address(ruleStatus, ruleParams, ruleMsg, REC);
                break;
                //==========================================================================================
                // One Location Will Call
                //==========================================================================================
            case "salesorder.onelocationwillcall":
                oneLocationWillCall(ruleStatus, ruleParams, ruleMsg, REC);
                break;
                //==========================================================================================
                // Active Cannabis License Needed
                //==========================================================================================
            case "salesorder.activecannabislicenseneeded":
                activeCannabisLicenseNeeded(ruleStatus, ruleParams, ruleMsg, REC);
                break;
                //==========================================================================================
                // Minimum Pricing Violation
                //==========================================================================================
            case "salesorder.minimumpricingviolation":
                minimumPricingViolation(ruleStatus, ruleParams, ruleMsg, REC);
                break;
                //==========================================================================================
                // No Samples from SCALE Warehouse
                //==========================================================================================
            case "salesorder.restrictsamplesfromscalewarehouse":
                noSamplesFromScaleEnabledWarehouse(ruleStatus, ruleParams, ruleMsg, REC);
                break;
                //==========================================================================================
                // Minimum Ship Alone Quantity Met Rule
                //==========================================================================================
            case "salesorder.msaqmet":
                msaqmet(ruleStatus, ruleParams, ruleMsg, REC);
                break;
            case "transferorder.msaqmet":
                msaqmet(ruleStatus, ruleParams, ruleMsg, REC);
                break;
                //==========================================================================================
                // Check Zip State by Country
                //==========================================================================================
            case "salesorder.check_zip_state_by_country":
                check_zip_state_by_country(ruleStatus, ruleParams, ruleMsg, REC);
                break;
            } //switch(REC.type.toString().toLowerCase() + "." + ruleName.toLowerCase())

            log.debug(funcName, "Returning ruleStatus: " + ruleStatus);
            return ruleStatus;
        } //function evaluateRule(ruleName, ruleParams, ruleMsg, REC) =======================================



        //==========================================================================================
        // Declined Credit Card
        //==========================================================================================
        function evaluateDeclinedCreditCard(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "evaluateDeclinedCreditCard " + REC.type + ":" + REC.id + " | " + ruleParams;

            var payment = REC.getValue({
                "fieldId": "paymentmethod"
            });

            if (payment) {
                var iscc = search.lookupFields({
                    "type": "paymentmethod",
                    "id": payment,
                    "columns": ["creditcard"]
                }).creditcard;
                if (iscc) {

                    if (!REC.getValue({
                        "fieldId": "ccapproved"
                    })) {
                        // credit card is not approved
                        ruleStatus.passed = false;
                        ruleStatus.message = ruleMsg;
                        return;
                    }
                }
            }


            ruleStatus.passed = true;
        }



        //==========================================================================================
        // Header and Line Discounts
        //==========================================================================================
        //		function evaluateHeaderLineDiscounts(ruleStatus, ruleParams, ruleMsg, REC) {
        //			var funcName = scriptName + "evaluateHeaderLineDiscounts " + REC.type + ":" + REC.id + " | " + ruleParams;
        //
        //	    	var arrColumns  = new Array();
        //	    	var colItem     = search.createColumn({ name:'itemid' });
        //	    	arrColumns[0]   = colItem;
        //	    	
        //	    	var arrFilters     = new Array();
        //	    	var fltrDiscount   = search.createFilter({ name:'type'                            , operator:'IS'  ,values:"Discount" });
        //	    	var fltrSalesOrder = search.createFilter({ name:'internalid' , join:'transaction' , operator:'IS'  ,values:REC.id  });
        //	    	arrFilters[0] = fltrDiscount;
        //	    	arrFilters[1] = fltrSalesOrder;
        //	    	
        //			var objDiscountItemsSearch = search.create({ 'type':'item' ,'filters':arrFilters ,'columns':arrColumns });
        //
        //			var DiscountItemsSearch = objDiscountItemsSearch.run();
        //	        var DiscountItemsSearchResults = DiscountItemsSearch.getRange(0,1000); 
        //
        //			if (DiscountItemsSearchResults.length > 1) {
        //				var DiscountItem = REC.getValue('discountitem');
        //				
        //				if (DiscountItem != "") { 
        //					ruleStatus.passed=false; 
        //					ruleStatus.message = ruleMsg;
        //					return; 
        //					}
        //				
        //			}
        //			
        //			ruleStatus.passed=true;
        //			
        //		} custbody_hold_for_approval


        //==========================================================================================
        // Overdue Balance
        //==========================================================================================
        function evaluateOverdueBalance(ruleStatus, ruleParams, ruleMsg, REC) {
            var funcName = scriptName + "evaluateOverdueBalance " + REC.type + ":" + REC.id + " | " + ruleParams;


            var CustomerId = REC.getValue("entity");
            var objCustomerFields = search.lookupFields({
                type: "customer",
                id: CustomerId,
                columns: ["overduebalance"]
            });
            var OverdueBalance = objCustomerFields.overduebalance;
            log.debug(funcName, "Processing rule,  OverdueBalance: " + OverdueBalance);
            if (OverdueBalance <= 100) {
                ruleStatus.passed = true;
                return;
            }
            //if (OverdueBalance <= 0) { ruleStatus.passed=true; return; } //5/1/2018 changing RSM to only trigger if overdue balance is over $100


            ruleMsg = ruleMsg.replace("{amount}", OverdueBalance);
            ruleStatus.passed = false;
            ruleStatus.message = ruleMsg;
        }

        //==========================================================================================
        // Will Call Payment
        //==========================================================================================
        function evaluateWillCallPayment(ruleStatus, ruleParams, ruleMsg, REC) {
            var funcName = scriptName + "evaluateWillCallPayment " + REC.type + ":" + REC.id + " | " + ruleParams;

            var SearchShipMethod = "/" + REC.getValue("shipmethod").toString() + "/";

            if (ruleParams.indexOf(SearchShipMethod) >= 0) {
                log.debug(funcName, "Rule further evaluated based on ShipMethod  " + SearchShipMethod + ",   ruleParams: " + ruleParams);
                var PaymentMethod = REC.getText("paymentmethod");
                PaymentMethod = PaymentMethod.toLowerCase();
                var paymentOnDelivery = REC.getValue("custbody_payment_on_delivery");

                log.debug(funcName, "PaymentMethod  " + PaymentMethod);
                if (PaymentMethod == "cash") {
                    ruleStatus.passed = true;
                    return;
                }

                //no payment method
                if (PaymentMethod == "" && paymentOnDelivery === false) {
                    var Terms = REC.getText("terms");
                    Terms = Terms.toLowerCase();
                    log.debug(funcName, "Terms  " + Terms);

                    //if there are terms on sales order
                    if (Terms > "") {

                        //terms are NOT pay in advance and due on receipt = pass
                        if ((Terms != "pay in advance") && (Terms != "due on receipt")) {
                            ruleStatus.passed = true;
                            return;
                        }

                    } // if (Terms > '')				

                } // if (PaymentMethod == '')

            } // if (   ruleParams.indexOf(SearchShipMethod) >= 0   )
            else {
                ruleStatus.passed = true;
                return;
            }

            ruleStatus.passed = false;
            ruleStatus.message = ruleMsg;
            return;

        }

        //==========================================================================================
        // Hold For Approval
        //==========================================================================================
        function evaluateHoldForApproval(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "evaluateHoldForApproval " + REC.type + ":" + REC.id + " | " + ruleParams;

            var HoldForApproval = REC.getValue("custbody_k_hold_for_approval");

            if (HoldForApproval) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
        }
        //==========================================================================================
        // Fraud Check
        //==========================================================================================
        function fraudCheck(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "fraudCheck " + REC.type + ":" + REC.id + " | " + ruleParams;

            var customerId = REC.getValue("entity");

            var boxChecked = search.lookupFields({
                type: "customer",
                id: customerId,
                columns: ["custentity_fraud_check_box"]
            }).custentity_fraud_check_box;

            if (boxChecked) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
        }
        //==========================================================================================
        // Hold For Approval For All Online Orders
        //==========================================================================================
        function evaluateOnlineForApproval(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "evaluateOnlineForApproval " + REC.type + ":" + REC.id + " | " + ruleParams;

            var orderSource = REC.getText("custbody1").split(" ")[0];

            if (orderSource == "Online") {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
        }

        //==========================================================================================
        // Payment Method Required
        //==========================================================================================
        function evaluatePaymentMethodRequired(ruleStatus, ruleParams, ruleMsg, REC) {
            var funcName = scriptName + "evaluateOverdueBalance " + REC.type + ":" + REC.id + " | " + ruleParams;

            // if payment hold is true
            var paymentHoldForBackorder = REC.getValue("custbody_payment_hold_backorder");
            if (paymentHoldForBackorder) {
                ruleStatus.passed = true;
                return;
            }

            // if total bill is $0.00 - rule pass
            var totalBill = parseFloat(REC.getValue("total"));
            if (totalBill === 0) {
                ruleStatus.passed = true;
                return;
            }

            // if customer deposit exist
            var depositAmount = REC.getValue({
                fieldId: "custbody_deposit_amount"
            });
            var total = REC.getValue({
                fieldId: "total"
            });

            if (Number(depositAmount) >= Number(total)) {
                ruleStatus.passed = true;
                return;
            }

            //dennis testing
            var creditMemoToApply = REC.getValue("custbody_creditmemo_to_apply");

            if (creditMemoToApply) {
                ruleStatus.passed = true;
                return;
            } else {
                log.debug("Credit Memo to apply value is false", "credit memo is false");
            }

            var SearchShipMethod = "/" + REC.getValue("shipmethod").toString() + "/";

            if (ruleParams.indexOf(SearchShipMethod) >= 0) {
                ruleStatus.passed = true;
                return;
            }

            var PaymentMethod = REC.getText("paymentmethod");
            var paymentOnDelivery = REC.getValue("custbody_payment_on_delivery");
            log.debug(funcName, "PaymentMethod  " + PaymentMethod);

            //no payment method
            if (PaymentMethod == "" && paymentOnDelivery === false) {

                var Terms = REC.getText("terms");
                Terms = Terms.toLowerCase();
                log.debug(funcName, "Terms  " + Terms);

                //terms exist on sales order
                if (Terms > "") {

                    if ((Terms != "pay in advance") && (Terms != "due on receipt")) {
                        ruleStatus.passed = true;
                        return;
                    }

                } else {

                    //check terms on customer
                    var custID = REC.getValue("entity");
                    var custTerms = search.lookupFields({
                        type: "customer",
                        id: custID,
                        columns: ["terms"]
                    });


                    if (custTerms.terms.length === 0) {
                        ruleStatus.passed = true;
                        return;
                    } else {
                        if ((custTerms.terms[0].text.toLowerCase() != "pay in advance") && (custTerms.terms[0].text.toLowerCase() != "due on receipt")) {
                            ruleStatus.passed = true;
                            return;
                        }
                    }

                }


                // if (Terms > '')				

            } // if (PaymentMethod == '')
            else {
                ruleStatus.passed = true;
                return;
            }

            ruleStatus.passed = false;
            ruleStatus.message = ruleMsg;
        }
        //==========================================================================================
        // Payment on Delivery Check
        //==========================================================================================
        function paymentOnDelivery(ruleStatus, ruleParams, ruleMsg, REC) {
            //var funcName = scriptName + "evaluateOverdueBalance " + REC.type + ":" + REC.id + " | " + ruleParams;
            ruleStatus.passed = true;

            var PaymentMethod = REC.getValue("paymentmethod");
            var PaymentOnDeliveryCB = REC.getValue("custbody_payment_on_delivery");

            //var PaymentMethod = REC.getText('paymentmethod');
            var LocalPickup = REC.getText("shipmethod").indexOf("Local") > -1 || REC.getText("shipmethod").indexOf("Special Order") > -1 ? true : false;

            if (PaymentOnDeliveryCB && LocalPickup === false) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }

            if (PaymentMethod == "23" && LocalPickup === false) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
        }
        //==========================================================================================
        // Future Ship Date
        //==========================================================================================
        //		function evaluateFutureShipDate(ruleStatus, ruleParams, ruleMsg, REC) {
        //			var funcName = scriptName + "evaluateFutureShipDate " + REC.type + ":" + REC.id + " | " + ruleParams;
        //			
        //			var ShipDate     = REC.getValue('shipdate');
        //			var objShipDate  = new Date(ShipDate);
        //			var objDateToday = new Date();
        //			
        //			var nbrShipdate = objShipDate.getTime();
        //			var nbrToday    = objDateToday.getTime();
        //			
        //			if (nbrToday >= nbrShipdate) { ruleStatus.passed=true; return; }
        //			
        //			var ShippingMethod = REC.getValue('shipmethod');
        //			
        //			if (ShippingMethod == 5382) { ruleStatus.passed=true; return; }
        //			
        //			ruleStatus.passed=false;
        //			ruleStatus.message = ruleMsg;
        //		}


        //==========================================================================================
        // Item Availability Check
        //==========================================================================================
        function itemAvailability(ruleStatus, ruleParams, ruleMsg, REC) {
            var funcName = scriptName + "item availability function " + REC.type + ":" + REC.id + " | " + ruleParams;
            var ItemWithQuantityException = false;
            var MsgLines = "";
            var comma = "";

            // if payment hold for backorder is true
            var paymentHoldForBackorder = REC.getValue("custbody_payment_hold_backorder");
            if (paymentHoldForBackorder) {
                ruleStatus.passed = true;
                return;
            }

            var lineCount = REC.getLineCount({
                sublistId: "item"
            });

            if (lineCount > 0) {
                for (var ix = 0; ix < lineCount; ix++) {

                    var createWO = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "createwo",
                        line: ix
                    });

                    var createPO = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "createpo",
                        line: ix
                    });

                    var amountOrdered = parseFloat(REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        line: ix
                    }));

                    var amountAvailable = parseFloat(REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "quantityavailable",
                        line: ix
                    }));

                    log.debug(funcName, "Before Conditional: Ordered: " + amountOrdered + ",   Available: " + amountAvailable + " ,createWo: " + createWO + " ,createPO: " + createPO);

                    if (amountOrdered && !isNaN(amountAvailable) && !createWO && !createPO) {
                        log.debug(funcName, "Ordered: " + amountOrdered + ",   Available: " + amountAvailable);
                        if (amountOrdered > amountAvailable) {
                            ItemWithQuantityException = true;
                            var linesequencenumber = ix + 1;
                            MsgLines = MsgLines + comma + linesequencenumber.toString();
                            comma = ", ";
                        }
                    }

                } // for (var ix = 0; ix < ItemsSearchResults.length; ix++)
            } // if (ItemsSearchResults.length > 0)

            if (ItemWithQuantityException) {
                ruleStatus.passed = false;
                ruleMsg = ruleMsg.replace("{lines}", MsgLines);
                ruleStatus.message = ruleMsg;
                return;
            }

            ruleStatus.passed = true;

        }

        //==========================================================================================
        // Non Legal States
        //==========================================================================================
        function nonLegalStates(ruleStatus, ruleParams, ruleMsg, REC) {
            //var funcName = scriptName + "invalidShipStates " + REC.type + ":" + REC.id + " | " + ruleParams;
            var invalidShipStates = ["NE", "KS", "ID", "IN", "TN", "GA", "WI", "VA", "IA", "AL", "SC", "MS", "KY", "WY"];

            if (ruleParams) {
                invalidShipStates = ruleParams.split(",");
            }

            var currentShipState = REC.getValue("shipstate");

            if (invalidShipStates.indexOf(currentShipState) > -1) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }

            ruleStatus.passed = true;
            return;
        }


        //==========================================================================================
        // Invalid Item Use Function
        //==========================================================================================
        function invalidItemUse(ruleStatus, ruleParams, ruleMsg, REC) {
            var ItemWithPricingException = false;
            var MsgLines = "";
            var comma = "";

            var excludedItemsArray = ruleParams.split(",");

            var lineCount = REC.getLineCount({
                sublistId: "item"
            });

            if (lineCount > 0) {
                for (var ix = 0; ix < lineCount; ix++) {

                    // Service, NonInvtPart, OthCharge

                    var itemId = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "item",
                        line: ix
                    });

                    var excludedItem = excludedItemsArray.indexOf(itemId) > -1;

                    var itemType = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "itemtype",
                        line: ix
                    });

                    var itemTypeMatch = itemType == "Service" || itemType == "NonInvtPart" || itemType == "OthCharge";

                    var itemIsFulfillable = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "fulfillable",
                        line: ix
                    }) == "T";

                    var itemHasCost = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "amount",
                        line: ix
                    });

                    var createWO = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "createwo",
                        line: ix
                    });

                    var createPO = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "createpo",
                        line: ix
                    });

                    // log.debug("item type match", itemTypeMatch);
                    // log.debug("itemIsFulfillable", itemIsFulfillable);
                    // log.debug("itemHasCost", itemHasCost);
                    // log.debug("!createWO", !createWO);
                    // log.debug("!createPO", !createPO);

                    if (!excludedItem && itemTypeMatch && itemIsFulfillable && itemHasCost && !createWO && !createPO) {
                        ItemWithPricingException = true;
                        var linesequencenumber = ix + 1;
                        MsgLines = MsgLines + comma + linesequencenumber.toString();
                        comma = ", ";
                    }

                } // for (var ix = 0; ix < ItemsSearchResults.length; ix++)
            } // if (ItemsSearchResults.length > 0)

            if (ItemWithPricingException) {
                ruleStatus.passed = false;
                ruleMsg = ruleMsg.replace("{lines}", MsgLines);
                ruleStatus.message = ruleMsg;
                return;
            }

            ruleStatus.passed = true;

        }

        //==========================================================================================
        // Gross Margin Approval
        //==========================================================================================
        function evaluateGrossMarginApproval(ruleStatus, ruleParams, ruleMsg, REC) {
            var funcName = scriptName + "evaluateGrossMarginApproval " + REC.type + ":" + REC.id + " | " + ruleParams;

            // var EstGrossMargin = REC.getValue("estgrossprofitpercent");

            var objRuleParams = JSON.parse(ruleParams);

            var arrColumns = new Array();
            var colMemo = search.createColumn({
                name: "memo"
            });
            var colGrossProfit = search.createColumn({
                name: "estgrossprofitpct"
            });
            var colLineSequenceNumber = search.createColumn({
                name: "linesequencenumber"
            });
            var colItemType = search.createColumn({
                name: "type",
                join: "item"
            });
            var colPriceLevel = search.createColumn({
                name: "pricelevel"
            });
            arrColumns[0] = colMemo;
            arrColumns[1] = colGrossProfit;
            arrColumns[2] = colLineSequenceNumber;
            arrColumns[3] = colItemType;
            arrColumns[4] = colPriceLevel;

            var arrFilters = new Array();
            var fltrSalesOrder = search.createFilter({
                name: "internalidnumber",
                operator: "EQUALTO",
                values: REC.id
            });
            arrFilters[0] = fltrSalesOrder;

            var objItemsSearch = search.create({
                "type": "salesorder",
                "filters": arrFilters,
                "columns": arrColumns
            });


            var ItemsSearch = objItemsSearch.run();
            var ItemsSearchResults = ItemsSearch.getRange(0, 1000);

            var ItemWithGrossMarginException = false;
            var MsgLines = "";
            var comma = "";

            if (ItemsSearchResults.length > 0) {
                for (var ix = 0; ix < ItemsSearchResults.length; ix++) {
                    var ItemType = ItemsSearchResults[ix].getText({
                        name: "type",
                        join: "item"
                    });
                    ItemType = ItemType.toLowerCase();

                    //automatically pass rule if pricing level is not custom, custom price level value is -1
                    var priceLevel = ItemsSearchResults[ix].getValue({
                        name: "pricelevel"
                    });
                    if (((ItemType == "inventory item") && (priceLevel == "-1")) || ((ItemType == "assembly/bill of materials") && (priceLevel == "-1"))) {

                        var GrossProfitPct = ItemsSearchResults[ix].getValue({
                            name: "estgrossprofitpct"
                        });
                        var str = GrossProfitPct.substring(0, GrossProfitPct.length - 1);
                        var numGrossProfitPct = parseFloat(str);

                        if (numGrossProfitPct < objRuleParams.percentage) {
                            ItemWithGrossMarginException = true;
                            var linesequencenumber = ItemsSearchResults[ix].getValue({
                                name: "linesequencenumber"
                            });
                            MsgLines = MsgLines + comma + linesequencenumber.toString() + "(" + GrossProfitPct + ")";
                            comma = ", ";
                            log.debug(funcName, "Low Margin  " + GrossProfitPct + ",   ruleParams: " + ruleParams);
                        }

                    } // if (ItemType == 'inventory item')

                } // for (var ix = 0; ix < ItemsSearchResults.length; ix++)
            } // if (ItemsSearchResults.length > 0)

            if (ItemWithGrossMarginException) {
                ruleStatus.passed = false;
                ruleMsg = ruleMsg.replace("{percent}", objRuleParams.percentage.toString());
                ruleMsg = ruleMsg.replace("{lines}", MsgLines);
                ruleStatus.message = ruleMsg;
                return;
            }

            ruleStatus.passed = true;

            //if (EstGrossMargin >= objRuleParams.percentage) { ruleStatus.passed=true; return; }
        }


        //==========================================================================================
        // Credit Balance Check With Terms
        //==========================================================================================
        function checkCreditBalance(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "creditBalanceCheck " + REC.type + ":" + REC.id + " | " + ruleParams;


            //dennis testing
            var creditMemoToApply = REC.getValue("custbody_creditmemo_to_apply");
            var paymentMethod = REC.getValue("paymentmethod");
            var paymentOnDelivery = REC.getValue("custbody_payment_on_delivery");
            var terms;

            if (creditMemoToApply) {
                ruleStatus.passed = true;
                return;
            } else {
                log.debug("Credit Memo to apply value is false", "credit memo is false");
            }

            var customerId = REC.getValue("entity");

            var custInfo = search.lookupFields({
                type: "customer",
                id: customerId,
                columns: ["terms", "creditlimit"]
            });

            // var terms = custRecord.getValue("terms");

            if (custInfo.terms.length > 0) {
                terms = custInfo.terms[0].value;
            } else {
                terms = false;
            }


            if (terms && (terms != "4" && terms != "8")) { //4 = Due On Receipt, 8 = Pay In Advance
                // log.debug("credit check progress :  (terms)", terms)

                var currentBalance = +REC.getValue("balance");
                var currentOrderTotal = +REC.getValue("total");
                var creditLimit = +custInfo.creditlimit;
                //log.debug("credit check progress :  (currentOrderTotal + currentBalance > creditLimit)", currentOrderTotal + " " + currentBalance + " " + creditLimit);

                // temp - if credit limit is not set/false - pass the rule
                if (!creditLimit) {
                    ruleStatus.passed = true;
                    return;
                }

                if (!paymentMethod && paymentOnDelivery === false) {
                    if (currentOrderTotal + currentBalance > creditLimit) {
                        ruleStatus.passed = false;
                        currentBalance = currentBalance + currentOrderTotal - creditLimit;
                        ruleMsg = ruleMsg.replace("{amount}", currentBalance.toFixed(2));
                        ruleStatus.message = ruleMsg;
                        return;
                    }
                } else {
                    if (currentBalance > creditLimit) {
                        ruleStatus.passed = false;
                        currentBalance = currentBalance - creditLimit;
                        ruleMsg = ruleMsg.replace("{amount}", currentBalance.toFixed(2));
                        ruleStatus.message = ruleMsg;
                        return;
                    }
                }


            }

            ruleStatus.passed = true;

        }

        //==========================================================================================
        // Free Shipping Check
        //==========================================================================================
        function freeShippingCheck(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "freeShippingFound " + REC.type + ":" + REC.id + " | " + ruleParams;

            var arrColumns = new Array();
            var colMemo = search.createColumn({
                name: "memo"
            });
            var colAmount = search.createColumn({
                name: "amount"
            });
            var colLineSequenceNumber = search.createColumn({
                name: "linesequencenumber"
            });
            var colItemType = search.createColumn({
                name: "type",
                join: "item"
            });
            var colPriceLevel = search.createColumn({
                name: "pricelevel"
            });
            var colNoFreeShippingBox = search.createColumn({
                name: "custitem_hazmat_item",
                join: "item"
            });
            arrColumns[0] = colMemo;
            arrColumns[1] = colAmount;
            arrColumns[2] = colLineSequenceNumber;
            arrColumns[3] = colItemType;
            arrColumns[4] = colPriceLevel;
            arrColumns[5] = colNoFreeShippingBox;

            var arrFilters = new Array();
            var fltrSalesOrder = search.createFilter({
                name: "internalidnumber",
                operator: "EQUALTO",
                values: REC.id
            });
            arrFilters[0] = fltrSalesOrder;

            var objItemsSearch = search.create({
                "type": "salesorder",
                "filters": arrFilters,
                "columns": arrColumns
            });


            var ItemsSearch = objItemsSearch.run();
            var ItemsSearchResults = ItemsSearch.getRange(0, 1000);

            var customPricingArr = []; //items with custom pricing
            var noFreeShippingArr = []; //items excluded from free shipping
            var shippingCost = REC.getValue("shippingcost");
            var discountAmount = 0;
            var sampleOrder = REC.getValue("custbody_sample_order");

            // if sample order - automatically pass rule
            if (sampleOrder) {
                ruleStatus.passed = true;
                return;
            }

            if (ItemsSearchResults.length > 0) {
                for (var ix = 0; ix < ItemsSearchResults.length; ix++) {
                    var ItemType = ItemsSearchResults[ix].getText({
                        name: "type",
                        join: "item"
                    });
                    ItemType = ItemType.toLowerCase();

                    var priceLevel = ItemsSearchResults[ix].getValue({
                        name: "pricelevel"
                    });
                    var noFreeShipping = ItemsSearchResults[ix].getValue({
                        name: "custitem_hazmat_item",
                        join: "item"
                    });
                    var itemName = ItemsSearchResults[ix].getValue({
                        name: "memo"
                    });
                    var linesequencenumber = ItemsSearchResults[ix].getValue({
                        name: "linesequencenumber"
                    });

                    //if custom item
                    if (((ItemType == "inventory item") && (priceLevel == "-1")) || ((ItemType == "assembly/bill of materials") && (priceLevel == "-1"))) {
                        customPricingArr.push(linesequencenumber);
                    }

                    //excluded from free shipping item
                    if (((ItemType == "inventory item") && (noFreeShipping == true)) || ((ItemType == "assembly/bill of materials") && (noFreeShipping == true))) {
                        noFreeShippingArr.push(linesequencenumber);
                        log.debug("pushing into exluded shipping array");
                    }

                    //free shipping exist
                    if (itemName == "Free Shipping") {
                        discountAmount = ItemsSearchResults[ix].getValue({
                            name: "amount"
                        });
                    }

                } // for (var ix = 0; ix < ItemsSearchResults.length; ix++)
            } // if (ItemsSearchResults.length > 0)

            if (discountAmount) {
                if (parseFloat(shippingCost) + parseFloat(discountAmount) == 0) {
                    if (customPricingArr.length > 0) {
                        ruleStatus.passed = false;
                        ruleStatus.message = "Items with custom pricing not eligible for free shipping. See line(s) " + customPricingArr.join(",") + ".";
                        return;
                    } else if (noFreeShippingArr.length > 0) {
                        ruleStatus.passed = false;
                        ruleStatus.message = "Item not eligible for free shipping. See line(s) " + noFreeShippingArr.join(",") + ".";
                        return;
                    }
                }
            }
            ruleStatus.passed = true;
        }

        //==========================================================================================
        // No Free Shipping Ground
        //==========================================================================================
        function freeShippingGround(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "freeShippingGround " + REC.type + ":" + REC.id + " | " + ruleParams;

            var shipMethod = REC.getValue("shipmethod");

            if (shipMethod == "37") {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
        }

        //==========================================================================================
        // FedEx Ship Method & Free Shipping
        //==========================================================================================
        function fedExShipMethod(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "fedExShipMethod " + REC.type + ":" + REC.id + " | " + ruleParams;

            var shipMethod = REC.getText("shipmethod");

            var shippingCost = REC.getValue("shippingcost");

            if (shipMethod.indexOf("FedEx") > -1 && shippingCost <= 0) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
        }


        //==========================================================================================
        // Hazmat Items
        //==========================================================================================
        function evaluateHazmatItems(ruleStatus, ruleParams, ruleMsg, REC) {
            var funcName = scriptName + "evaluateHazmatItems " + REC.type + ":" + REC.id + " | " + ruleParams;


            var SearchShipMethod = "/" + REC.getValue("shipmethod").toString() + "/";



            //if ship method is not in the params, pass it
            if (ruleParams.indexOf(SearchShipMethod) == -1) {
                log.debug(funcName, "Rule passed based on ShipMethod  " + SearchShipMethod + ",   ruleParams: " + ruleParams);
                ruleStatus.passed = true;
                return;
            }

            var arrColumns = new Array();
            var colItem = search.createColumn({
                name: "itemid"
            });
            var colLineSeq = search.createColumn({
                name: "linesequencenumber",
                join: "transaction"
            });
            arrColumns[0] = colItem;
            arrColumns[1] = colLineSeq;

            var arrFilters = new Array();
            var fltrDiscount = search.createFilter({
                name: "custitem_hazmat_item",
                operator: "IS",
                values: true
            });
            var fltrSalesOrder = search.createFilter({
                name: "internalid",
                join: "transaction",
                operator: "IS",
                values: REC.id
            });
            arrFilters[0] = fltrDiscount;
            arrFilters[1] = fltrSalesOrder;

            var objHazmatItemsSearch = search.create({
                "type": "item",
                "filters": arrFilters,
                "columns": arrColumns
            });


            log.debug(funcName, "objHazmatItemsSearch: " + JSON.stringify(objHazmatItemsSearch));


            var HazmatItemsSearch = objHazmatItemsSearch.run();

            var HazmatItemsSearchResults = HazmatItemsSearch.getRange(0, 1000);
            log.debug(funcName, "HazmatItemsSearchResults: " + JSON.stringify(HazmatItemsSearchResults));

            if (HazmatItemsSearchResults.length > 0) {
                var comma = "";
                var Msg = "Refer to items on lines: ";
                for (var ix = 0; ix < HazmatItemsSearchResults.length; ix++) {

                    log.debug(funcName, "ix: " + ix + "  " + HazmatItemsSearchResults[ix].getValue({
                        name: "linesequencenumber",
                        join: "transaction"
                    }));
                    //log.debug(funcName,"ix: " + ix + "  " + HazmatItemsSearchResults[ix].getValue("transaction.linesequencenumber" ));

                    Msg = Msg + comma + HazmatItemsSearchResults[ix].getValue({
                        name: "linesequencenumber",
                        join: "transaction"
                    });
                    comma = ", ";
                }

                log.debug(funcName, "Msg: " + Msg);

                ruleStatus.message = Msg;
                ruleStatus.passed = false;
                return;
            }

            ruleStatus.passed = true;
        }



        /* ======================================================================================================================================== */

        // determines whether this record has been fully processed, and doesn't need to be evaluated any further
        //	return TRUE or FALSE
        function checkComplete(REC) {
            var funcName = scriptName + "checkComplete " + REC.type + ":" + REC.id;
            log.debug(funcName, "Checking complete");

            switch (REC.type.toString().toLowerCase()) {

            case "salesorder":
                return false;
            case "transferorder":
                return false;

                break;

                var arrColumns = new Array();
                var colInternalId = search.createColumn({
                    name: "internalid"
                });
                var colTranId = search.createColumn({
                    name: "tranid"
                });
                arrColumns[0] = colInternalId;
                arrColumns[1] = colTranId;

                var arrFilters = new Array();
                var fltrItemShip = search.createFilter({
                    name: "type",
                    operator: "ANYOF",
                    values: ["ItemShip"]
                });
                var fltrCreatedFrom = search.createFilter({
                    name: "internalidnumber",
                    join: "createdfrom",
                    operator: "EQUALTO",
                    values: REC.id
                });
                arrFilters[0] = fltrCreatedFrom;
                arrFilters[1] = fltrItemShip;

                var objItemFulfillmentSearch = search.create({
                    "type": "itemfulfillment",
                    "filters": arrFilters,
                    "columns": arrColumns
                });

                log.debug(funcName, "objItemFulfillmentSearch: " + JSON.stringify(objItemFulfillmentSearch));

                var ItemFulfillmentSearch = objItemFulfillmentSearch.run();
                var ItemFulfillmentSearchResults = ItemFulfillmentSearch.getRange(0, 1000);
                log.debug(funcName, "ItemFulfillmentSearchResults: " + JSON.stringify(ItemFulfillmentSearchResults));

                if (ItemFulfillmentSearchResults.length > 0) {
                    return true;
                }

                return false;

                break;

            default:
                log.error(funcName, "script not ready for this record type");
                return true;
            }

        }

        /* ======================================================================================================================================== */

        // called when all rules have passed (eg passed, overridden, or inapplicable)
        //	this function should then perform whatever action needs to be done, and/or otherwise mark the record complete so that the "checkComplete" function 
        //	will know to return TRUE on the next invocation
        function markComplete(REC) {
            var funcName = scriptName + "markComplete " + REC.type + ":" + REC.id;

            switch (REC.type.toString().toLowerCase()) {
            default:
                log.error(funcName, "script not ready for this record type");
            }
        }


        /* ======================================================================================================================================== */

        // called whenever the RSM engine moves one of the status fields to another state
        //	this function may not need to do anything ... it depends on the context
        function changeStatus(REC, statusField, currentStatus, nextStatus, ultimateStatus) {
            var funcName = scriptName + "changeStatus " + REC.type + "/" + REC.id + " | " + statusField + " | " + oldStatus + " | " + newStatus + " | " + finalStatus;

        }


        /* ======================================================================================================================================== */

        // called whenever the RSM engine has been asked to manually override a rule; the engine will first call this function, and if the function 
        //		returns TRUE, then RSM will NOT do anythiing (in other words, it will assume that this function has performed the necessary "override"
        //		by changing the underlying data (cleared a checkbox, etc.); 
        //		otherwise (if this function returns anything equivalent to FALSE), RSM will override the rule
        function manualOverride(REC, ruleName) {
            var funcName = scriptName + "manualOverride " + REC.type + ":" + REC.id + " | " + ruleName;

            log.debug(funcName, "Default Implementation");
        }


        /* ======================================================================================================================================== */

        function prepaymentRequired(ruleStatus, ruleParams, ruleMsg, REC) {
            var paymentType = REC.getValue({
                fieldId: "paymentmethod"
            });
            var orderTotal = REC.getValue({
                fieldId: "total"
            });
            var depositAmount = REC.getValue({
                fieldId: "custbody_deposit_amount"
            });

            if (paymentType == "1" || paymentType == "2" || paymentType == "22") {
                if (orderTotal != depositAmount) {
                    ruleStatus.passed = false;
                    ruleStatus.message = ruleMsg;
                    return;
                }
            }
            ruleStatus.passed = true;
        }



        //==========================================================================================
        // FedEx Ship Method & Required Fields
        //==========================================================================================
        function fedExRequiredFields(ruleStatus, ruleParams, ruleMsg, REC) {
            // var funcName = scriptName + "fedExRequiredFields " + REC.type + ":" + REC.id + " | " + ruleParams;

            var shipMethod = REC.getText("shipmethod");
            var shippingPhone = REC.getText("custbody_shipphone");
            var shipAddressee = search.lookupFields({
                type: "salesorder",
                id: REC.id,
                columns: ["shipaddressee"]
            }).shipaddressee;
            if (shipMethod.indexOf("FedEx") > -1) {
                if (!shippingPhone && !shipAddressee) {
                    ruleStatus.passed = false;
                    ruleStatus.message = "Ship to Addressee & Customer phone are missing";
                    return;
                } else if (!shippingPhone) {
                    ruleStatus.passed = false;
                    ruleStatus.message = "'Ship to Phone' or Customer Phone missing";
                    return;
                } else if (!shipAddressee) {
                    ruleStatus.passed = false;
                    ruleStatus.message = "Ship to Addressee missing";
                    return;
                }
            }
            ruleStatus.passed = true;
        }

        //==========================================================================================
        // One Location Will Call 
        //==========================================================================================
        function oneLocationWillCall(ruleStatus, ruleParams, ruleMsg, REC) {
            //will call location mismatch multiple locations
            // var funcName = scriptName + "willCallOneLocationfunction " + REC.type + ":" + REC.id + " | " + ruleParams;

            var differentLocationsFound = false;
            var localPickup = REC.getText("shipmethod").indexOf("Local Pickup") > -1 ? true : false;

            if (localPickup) {
                var lineCount = REC.getLineCount({
                    sublistId: "item"
                });
                var setLocation = "";

                if (lineCount > 0) {
                    for (var ix = 0; ix < lineCount; ix++) {

                        // var itemHasQuantity = REC.getSublistValue({
                        //     sublistId: "item",
                        //     fieldId: "quantity",
                        //     line: ix
                        // });

                        var inventoryItem = REC.getSublistValue({
                            sublistId: "item",
                            fieldId: "itemtype",
                            line: ix
                        }) == "InvtPart";

                        var lineLocation = REC.getSublistValue({
                            sublistId: "item",
                            fieldId: "location",
                            line: ix
                        });

                        if (!setLocation && inventoryItem) {
                            setLocation = lineLocation;
                        }

                        if (lineLocation != setLocation && inventoryItem) {
                            // var combinedLocation = checkIfCombinedLocation(lineLocation, setLocation);
                            // if(!combinedLocation){
                            differentLocationsFound = true;
                            // }  
                        }
                    }
                }

            }
            if (differentLocationsFound) {
                ruleStatus.passed = false;
                ruleStatus.message = ruleMsg;
                return;
            }
            ruleStatus.passed = true;
            return;
        }



        //==========================================================================================
        // Mismatched bill and ship address
        //==========================================================================================

        function mismatch_bill_and_ship_address(ruleStatus, ruleParams, ruleMsg, REC) {

            //check if it is a first time customer
            var customer_id = REC.getValue("entity");
            var billaddress = REC.getValue("billaddress");
            var serviced_by = REC.getValue("custbody1") == "4926";
            ruleStatus.passed = true;
            if (customer_id && billaddress && serviced_by) {
                var transactionSearchObj = search.create({ //check if customer has had a previous order
                    type: "transaction",
                    filters: [
                        ["type", "anyof", "CashSale", "CustInvc"],
                        "AND",
                        ["customer.internalidnumber", "equalto", customer_id]
                    ],
                    columns: [
                        "tranid"
                    ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;

                if (searchResultCount == 0) {
                    var shipzip = REC.getValue("shipzip");
                    if (shipzip) {
                        if (!billaddress.match(shipzip)) {
                            ruleStatus.passed = false;
                            ruleStatus.message = ruleMsg;
                        }
                    }
                }

            }
            return;
        }

        //==========================================================================================
        // Mismatched bill and ship address
        //==========================================================================================
        function mismatch_bill_and_cc_address(ruleStatus, ruleParams, ruleMsg, REC) {
            var customer_id = REC.getValue("entity");
            var ccavsstreetmatch = REC.getValue("ccavsstreetmatch");
            var ccavszipmatch = REC.getValue("ccavszipmatch");
            var ccsecuritycodematch = REC.getValue("ccsecuritycodematch");
            var billaddress = REC.getValue("billaddress");
            var serviced_by = REC.getValue("custbody1") == "4926";
            ruleStatus.passed = true;
            if (customer_id && ccavsstreetmatch && ccavszipmatch && ccsecuritycodematch && billaddress && serviced_by) {
                var transactionSearchObj = search.create({ //check if customer has had a previous order
                    type: "transaction",
                    filters: [
                        ["type", "anyof", "CashSale", "CustInvc"],
                        "AND",
                        ["customer.internalidnumber", "equalto", customer_id]
                    ],
                    columns: [
                        "tranid"
                    ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;

                if (searchResultCount == 0) {
                    if (ccavsstreetmatch == "N" || ccavszipmatch == "N" || ccsecuritycodematch != "Y") {
                        ruleStatus.passed = false;
                        ruleStatus.message = ruleMsg;
                    }
                }

            }
            return;
        }

        //==========================================================================================
        // Minimum Pricing Violation
        //==========================================================================================
        function minimumPricingViolation(ruleStatus, ruleParams, ruleMsg, REC) {
            /*
                This rule message logic could be refactored to push items to an array,
                then check if the array has a length to pass/fail the RSM rule,
                and the rule fails/there is an array length, join them with a ","
                but we are reusing previous logic for consistency. 
            */

            var minimumPricingVioloation = false;
            var MsgLines = "";
            var comma = "";

            ruleStatus.passed = true;

            var numberOfItems = REC.getLineCount("item");
            var isSampleOrder = REC.getValue("custbody_sample_order");

            /**
             * Exceptions
             *  1. Is a sample order
             *  2. Price is 0
             */
            if (isSampleOrder) {
                return;
                // for(var line=0; line < numberOfItems; line++) {
                //     var unitPrice = parseFloat(REC.getSublistValue({ 
                //         sublistId: 'item',
                //         fieldId: 'rate',
                //         line: line
                //     }));

                //     var quantity = parseFloat(Rec.getSublistValue({
                //         sublistId: 'item',
                //         fieldId: 'quantity',
                //         line: line
                //     }));

                //     if (unitPrice !== 0 && quantity !== 0 ) {
                //         var linesequencenumber = line +1;
                //         minimumPricingVioloation = true;
                //         MsgLines = MsgLines + comma + linesequencenumber.toString();
                //         comma = ', ';
                //     } else {
                //         continue
                //     }
                // }
            } else {
                for (var line = 0; line < numberOfItems; line++) {
                    var priceLevel = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "price_display",
                        line: line
                    });

                    var unitPrice = parseFloat(REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "rate",
                        line: line
                    }));

                    // Only check items that have a custom price
                    if (priceLevel == "Custom") {
                        var minimumPrice = parseFloat(REC.getSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_minimum_price",
                            line: line
                        }));

                        // Check if unit price is below minimum pricing and fails RSM rule
                        if (
                            !isNaN(minimumPrice) &&
                            (unitPrice < minimumPrice)
                        ) {
                            // Fail RSM rule and add it to a list of failed items.
                            var linesequencenumber = line + 1;
                            minimumPricingVioloation = true;
                            MsgLines = MsgLines + comma + linesequencenumber.toString();
                            comma = ", ";
                        }
                    }
                }
            }

            if (minimumPricingVioloation) {
                ruleStatus.passed = false;
                ruleMsg = ruleMsg.replace("{lines}", MsgLines);
                ruleStatus.message = ruleMsg;
            }
        }
        //==========================================================================================
        // Active Cannabis License Needed
        //==========================================================================================
        function activeCannabisLicenseNeeded(ruleStatus, ruleParams, ruleMsg, REC) {
            log.audit("activeCannabisLicenseNeeded", "function ran");
            var KushEnergyProductFound = false;

            var lineCount = REC.getLineCount({
                sublistId: "item"
            });

            if (lineCount > 0) {
                for (var ix = 0; ix < lineCount; ix++) {

                    var itemClass = REC.getSublistText({
                        sublistId: "item",
                        fieldId: "class",
                        line: ix
                    });
                    log.audit("item class", itemClass);
                    if (itemClass.indexOf("Kush Energy") > -1) {
                        KushEnergyProductFound = true;
                    }

                }
            }

            if (KushEnergyProductFound) {
                var customerId = REC.getValue("entity");

                var customerLicenseStatus = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customerId,
                    columns: ["custentity_active_license", "custentity_cannabis_license_expiration"]
                });

                var licenseExpirationDate = customerLicenseStatus.custentity_cannabis_license_expiration;
                var activeLicense = customerLicenseStatus.custentity_active_license;

                log.audit("active license & date", activeLicense + " " + licenseExpirationDate);

                if (activeLicense && licenseExpirationDate) {
                    // comparison
                    var now = new Date();
                    now.setHours(0, 0, 0, 0);
                    var expirationDate = new Date(licenseExpirationDate);
                    log.debug("now and expiration date", now + " " + expirationDate);
                    if (now > expirationDate) { //means expired
                        ruleStatus.passed = false;
                        ruleStatus.message = ruleMsg;
                        return;
                    }

                } else {
                    ruleStatus.passed = false;
                    ruleStatus.message = ruleMsg;
                    return;
                }
            }

            ruleStatus.passed = true;
            return;
        }

        function noSamplesFromScaleEnabledWarehouse(ruleStatus, ruleParams, ruleMsg, REC) {


            var lineCount = REC.getLineCount({
                sublistId: "item"
            });

            var scaleEnabled;

            for (var i = 0; i < lineCount; i++) {
                var itemId = REC.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: i
                });

                var itemLocation = REC.getSublistValue({
                    sublistId: "item",
                    fieldId: "location",
                    line: i,
                });
                log.debug(itemId);
                if (itemId == "6039" || itemId == "9729") {
                    log.debug("entered conditional", itemId);
                    var locationSearchObj = search.create({
                        type: "location",
                        filters: [
                            ["internalidnumber", "equalto", itemLocation]
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC
                            }),
                            "phone",
                            "city",
                            "state",
                            "country",
                            "custrecord_scale_enabled"
                        ]
                    });


                    locationSearchObj.run().each(function (result) {

                        scaleEnabled = result.getValue({
                            name: "custrecord_scale_enabled"
                        });
                        log.audit("SCALE ENABLED: ", scaleEnabled);
                    });

                    if (scaleEnabled) {
                        ruleStatus.passed = false;
                        ruleStatus.message = ruleMsg;
                        return;
                    }
                }
            }

            ruleStatus.passed = true;
            return;
        }

        function msaqmet(ruleStatus, ruleParams, ruleMsg, REC){


            //TODO: CHECK ITEM TYPE?
            // var funcName = scriptName + "item availability function " + REC.type + ":" + REC.id + " | " + ruleParams;
            var msaqMisMatchMsg = "";
            var msaqMisMatchFound = false;
            var msaqMisMatchComma = "";
            var invalidFreightMsg = "Please submit a ticket through the Operations Service Desk to configure the shipping information for line(s): ";
            // Item Line(s) not configured for Freight Shipping:
            var invalidFreightItemFound = false;
            var invalidItemcomma = "";
            
            var shipMethod = REC.getValue("shipmethod");
            if(shipMethod != "4774"){ // This rule only applies to Freight
                ruleStatus.passed = true;
                return;
            }

            var lineCount = REC.getLineCount({
                sublistId: "item"
            });

            if (lineCount > 0) {
                for (var ix = 0; ix < lineCount; ix++) {
                    var scaleEnabled = false;
                    log.debug(REC.type);
                    var itemLocation;
                    if(REC.type == "transferorder"){
                        itemLocation = REC.getValue("location");
                    } else {
                        itemLocation = REC.getSublistValue({
                            sublistId: "item",
                            fieldId: "location",
                            line: ix,
                        });
                    }
                  

                    scaleEnabled = search.lookupFields({
                        type: record.Type.LOCATION,
                        id: itemLocation,
                        columns: ["custrecord_scale_enabled"]
                    }).custrecord_scale_enabled;

                    if(!scaleEnabled){
                        continue;
                    }


                    var itemType = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "itemtype",
                        line: ix
                    });

                    if (itemType == "InvtPart"){
                        itemType = record.Type.INVENTORY_ITEM;
                    } else if(itemType == "Assembly") {
                        itemType = record.Type.ASSEMBLY_ITEM;
                    } else {
                        continue;
                    }

                    var units = REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "units_display",
                        line: ix
                    }) || 1;

                    var quantity = parseFloat(REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "quantity",
                        line: ix
                    }));

                    quantity = Number(quantity) * Number(units);

                    var msaq = Number(REC.getSublistValue({
                        sublistId: "item",
                        fieldId: "custcol_msaq",
                        line: ix
                    }));

                    if(!msaq){
                        var itemId = REC.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: ix
                        });

                        msaq = search.lookupFields({
                            type: itemType,
                            id: itemId,
                            columns: ["custitem_msaq"]
                        }).custitem_msaq || -1;//look up field on the item

                    }

                    var linesequencenumber;
                    var remainder = quantity % msaq;
                    if(remainder != 0){
                        linesequencenumber = ix + 1;
                        msaqMisMatchFound = true;
                        if(quantity < msaq) { 
                            var quantyToFix = msaq/units;
                            msaqMisMatchMsg = msaqMisMatchMsg + msaqMisMatchComma + "Please increase line " + linesequencenumber.toString() + " quantity to " + quantyToFix +" to pass rule.";
                        } else { //Quantity: 100 MSAQ:200 Remainder:100 MSAQ:2400
                            log.debug("remainder, quantity, units", remainder + " " + quantity + " " + units);
                            var quantyToFixIncrease = ((quantity - remainder) + msaq)/units; //400
                            var quantyToFixDecrease = (quantity - remainder)/units; //200
                            msaqMisMatchMsg = msaqMisMatchMsg + msaqMisMatchComma + "Please increase line " + linesequencenumber.toString() + " quantity to " + quantyToFixIncrease + " or decrease quantity to " + quantyToFixDecrease + " to pass rule.";
                        }

                        msaqMisMatchComma = " ";
                    }
                    if(msaq == -1){
                        invalidFreightItemFound = true;
                        linesequencenumber = ix + 1;
                        invalidFreightMsg = invalidFreightMsg + invalidItemcomma + linesequencenumber.toString();
                        invalidItemcomma = ", ";
                    }


                }
            } 


            if(invalidFreightItemFound){
                ruleStatus.passed = false;
                ruleStatus.message = invalidFreightMsg;
            } else if (msaqMisMatchFound){
                ruleStatus.passed = false;
                ruleStatus.message = msaqMisMatchMsg;
            } else {
                ruleStatus.passed = true;
            }

            return;

        }

        function check_zip_state_by_country(ruleStatus, ruleParams, ruleMsg, REC) {
            if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
                try {
                    // eslint-disable-next-line no-global-assign
                    alert = alert || function alert() {};
                    var billzip;
                    var billstate;
                    var billcountry;
                    var shipzip = REC.getValue("shipzip");
                    var shipstate = REC.getValue("shipstate");
                    var shipcountry = REC.getValue("shipcountry");
                    var bill_address_fields = search.lookupFields({
                        type: search.Type.SALES_ORDER,
                        id: REC.id,
                        columns: ["billzip", "billstate", "billcountry"]
                    });

                    billzip = bill_address_fields.billzip;
                    billstate = bill_address_fields.billstate;
                    billcountry = bill_address_fields.billcountry[0].value;

                    if (shipcountry == "US" && shipstate == "PR") {
                        shipcountry == "PR";
                        shipstate == "";
                    }
                    if (billcountry == "US" && billstate == "PR") {
                        billcountry == "PR";
                        billstate == "";
                    }
                    var countries_that_need_zip = ["PR", "US", "CA"];
                    var countries_that_need_state = ["US", "CA"];
                    if (countries_that_need_zip.indexOf(shipcountry) != -1 || countries_that_need_zip.indexOf(billcountry) != -1) {
                        if (!shipzip || !billzip) {
                            //console.log('missing zip')
                            ruleStatus.message = "Address Requires Zip";
                            ruleStatus.passed = false;
                            return;
                        }
                    }

                    if (countries_that_need_state.indexOf(shipcountry) != -1 || countries_that_need_state.indexOf(billcountry) != -1) {
                        if (!shipstate || !billstate) {
                            //console.log('missing state')
                            ruleStatus.message = "Address Requires State";
                            ruleStatus.passed = false;
                            return;
                        }
                    }

                    if ((!shipzip && !shipstate) || (!billzip && !billstate)) {
                        //console.log('missing state and zip')
                        ruleStatus.message = "Missing both Zip and State";
                        ruleStatus.passed = false;
                        return;
                    }
                } catch (e) {
                    log.error("error at validate address", e);
                    //console.log(e)
                }
            }
            ruleStatus.passed = true;
            return;
        }


        return {
            evaluateRule: evaluateRule,
            checkComplete: checkComplete,
            markComplete: markComplete,
            changeStatus: changeStatus,
            manualOverride: manualOverride
        };
    });