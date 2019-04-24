// Global Variables
{
    var FedEx_UseProd = true;
    var FedEx_ProdURL = 'https://ws.fedex.com:443/web-services/rate';
    var FedEx_TestURL = 'https://wsbeta.fedex.com:443/web-services/rate';

    var FedEx_ProdKey = 'Hh28ltTJ9feCZ5iA';
    var FedEx_ProdPassword = 'bAiAHUX38HNUGxDrOzrxoET5s';
    var FedEx_TestKey = 'SrJG7aXR29K2ryt4';
    var FedEx_TestPassword = 'rkockgheEkj2WqCjdecIcgLx0';

    var FedEx_ProdAccountNumber = '622169487';
    var FedEx_ProdMeterNumber = '110028245';
    var FedEx_TestAccountNumber = '510087127';
    var FedEx_TestMeterNumber = '118676830';

    var Version_ServiceId = 'crs';
    var Version_Major = '20';
    var Version_Intermediate = '0';
    var Version_Minor = '0';

    var Payment_Type = 'SENDER';
    var DropoffType = 'REGULAR_PICKUP';
    var RateRequestType = 'LIST';

    var MaxWeight = 50;
    var MaxWeightFragile = 45;
    var PercentFullThreshold = 0.6; // 60 Percent

    var HazmatShippingUnitCost = 50;

    var LocationsDic = {};
    var LocationsArr = [];
    var PkgDefsArr = [];
    var ShipMethodsDic = {};
    var ShipMethodsArr = [];

    var FedExSoapMsgs = '';
    var PkgsText = '';
    var OrderLinesHTML = '';

    var ShippingCostDialog;
    var SelectingShipMethods = false;

}

function DefineShipMethods() {
    ShipMethodsDic = {};
    var shipMethodObj = {};
    ShipMethodsArr = new Array();

    /*
     var columns = new Array();
     columns[0] = new nlobjSearchColumn('displayname');
     columns[1] = new nlobjSearchColumn('itemid');
     columns[2] = new nlobjSearchColumn('isinactiFve');

     var searchresults = nlapiSearchRecord('shipitem', null, null, columns);
     for (var i = 1; i < searchresults.length; i++)
     {
     var searchresult = searchresults[i];
     var isInActive = searchresult.getValue('isinactive');
     if (isInActive == 'F')
     {
     var itemId = searchresult.getId();
     var shipMethodName = searchresult.getValue('itemid');
     var shipMethodCode = searchresult.getValue('displayname');
     if (shipMethodCode == '') {
     shipMethodCode = shipMethodName;
     }

     var shipMethodObj = {};
     shipMethodObj['id'] = itemId;
     shipMethodObj['cost'] = '0';
     shipMethodObj['name'] = shipMethodName;
     shipMethodObj['code'] = shipMethodCode;
     ShipMethodsDic[shipMethodCode] = shipMethodObj;
     }
     }
     */

    shipMethodObj = {};
    shipMethodObj['id'] = 38;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx 2 Day';
    shipMethodObj['code'] = 'FEDEX_2_DAY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 39;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Express Saver';
    shipMethodObj['code'] = 'FEDEX_EXPRESS_SAVER';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 40;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Ground';
    shipMethodObj['code'] = 'FEDEX_GROUND';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 41;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Home Delivery';
    shipMethodObj['code'] = 'GROUND_HOME_DELIVERY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 5230;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Priority Overnight';
    shipMethodObj['code'] = 'PRIORITY_OVERNIGHT';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 5266;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx Standard Overnight';
    shipMethodObj['code'] = 'STANDARD_OVERNIGHT';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 4776;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx International Economy';
    shipMethodObj['code'] = 'INTERNATIONAL_ECONOMY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);

    shipMethodObj = {};
    shipMethodObj['id'] = 4775;
    shipMethodObj['cost'] = '0';
    shipMethodObj['name'] = 'FedEx International Priority';
    shipMethodObj['code'] = 'INTERNATIONAL_PRIORITY';
    ShipMethodsDic[shipMethodObj['code']] = shipMethodObj;
    ShipMethodsArr.push(shipMethodObj);
}

function DefinePackages() {
    PkgDefsArr = new Array();

    //#1 biggest
    var pkgDef6 = {};
    pkgDef6['id'] = 6;
    pkgDef6['name'] = '18x18x28';
    pkgDef6['height'] = 18;
    pkgDef6['length'] = 18;
    pkgDef6['width'] = 28;
    pkgDef6['dimUnits'] = 'IN';
    pkgDef6['weightUnits'] = 'LB';
    pkgDef6['maxWeight'] = MaxWeight;
    pkgDef6['maxVolume'] = pkgDef6['height'] * pkgDef6['length'] * pkgDef6['width'];
    pkgDef6['maxLinearLength'] = pkgDef6['height'] + pkgDef6['length'] + pkgDef6['width'];

    //#2 biggest
    var pkgDef1 = {};
    pkgDef1['id'] = 1;
    pkgDef1['name'] = '20x20x15';
    pkgDef1['height'] = 20;
    pkgDef1['length'] = 20;
    pkgDef1['width'] = 15;
    pkgDef1['dimUnits'] = 'IN';
    pkgDef1['weightUnits'] = 'LB';
    pkgDef1['maxWeight'] = MaxWeight;
    pkgDef1['maxVolume'] = pkgDef1['height'] * pkgDef1['length'] * pkgDef1['width'];
    pkgDef1['maxLinearLength'] = pkgDef1['height'] + pkgDef1['length'] + pkgDef1['width'];

    //#3 biggest
    var pkgDef5 = {};
    pkgDef5['id'] = 5;
    pkgDef5['name'] = '16x16x16';
    pkgDef5['height'] = 16;
    pkgDef5['length'] = 16;
    pkgDef5['width'] = 16;
    pkgDef5['dimUnits'] = 'IN';
    pkgDef5['weightUnits'] = 'LB';
    pkgDef5['maxWeight'] = MaxWeight;
    pkgDef5['maxVolume'] = pkgDef5['height'] * pkgDef5['length'] * pkgDef5['width'];
    pkgDef5['maxLinearLength'] = pkgDef5['height'] + pkgDef5['length'] + pkgDef5['width'];

    //#4 biggest
    var pkgDef2 = {};
    pkgDef2['id'] = 2;
    pkgDef2['name'] = '20x10x10';
    pkgDef2['height'] = 20;
    pkgDef2['length'] = 10;
    pkgDef2['width'] = 10;
    pkgDef2['dimUnits'] = 'IN';
    pkgDef2['weightUnits'] = 'LB';
    pkgDef2['maxWeight'] = MaxWeight;
    pkgDef2['maxVolume'] = pkgDef2['height'] * pkgDef2['length'] * pkgDef2['width'];
    pkgDef2['maxLinearLength'] = pkgDef2['height'] + pkgDef2['length'] + pkgDef2['width'];

    //#5 biggest
    var pkgDef4 = {};
    pkgDef4['id'] = 4;
    pkgDef4['name'] = '12x12x7';
    pkgDef4['height'] = 12;
    pkgDef4['length'] = 12;
    pkgDef4['width'] = 7;
    pkgDef4['dimUnits'] = 'IN';
    pkgDef4['weightUnits'] = 'LB';
    pkgDef4['maxWeight'] = MaxWeight;
    pkgDef4['maxVolume'] = pkgDef4['height'] * pkgDef4['length'] * pkgDef4['width'];
    pkgDef4['maxLinearLength'] = pkgDef4['height'] + pkgDef4['length'] + pkgDef4['width'];

    //#6 biggest
    var pkgDef3 = {};
    pkgDef3['id'] = 3;
    pkgDef3['name'] = '6x6x6';
    pkgDef3['height'] = 6;
    pkgDef3['length'] = 6;
    pkgDef3['width'] = 6;
    pkgDef3['dimUnits'] = 'IN';
    pkgDef3['weightUnits'] = 'LB';
    pkgDef3['maxWeight'] = MaxWeight;
    pkgDef3['maxVolume'] = pkgDef3['height'] * pkgDef3['length'] * pkgDef3['width'];
    pkgDef3['maxLinearLength'] = pkgDef3['height'] + pkgDef3['length'] + pkgDef3['width'];

    // Place largest pkg first
    PkgDefsArr.push(pkgDef6);
    PkgDefsArr.push(pkgDef1);
    PkgDefsArr.push(pkgDef5);
    PkgDefsArr.push(pkgDef2);
    PkgDefsArr.push(pkgDef4);
    PkgDefsArr.push(pkgDef3);
}

function PadString(pad, str, padLeft) {
    if (typeof str === 'undefined')
        return pad;
    if (padLeft) {
        return (pad + str).slice(-pad.length);
    } else {
        return (str + pad).substring(0, pad.length);
    }
}



//###############With This function we fixed the FedEx popup window.
function BS_Show_FedEx_Popup() {
    if (document.getElementById('bsp_shippingCost_dialog') != null) {
        var containerName = 'behrooz';
        var tent;
        if (document.getElementById(containerName) == null) {
            tent = document.createElement('div');
            tent.setAttribute('id', containerName);
            tent.style.position = 'fixed';
            tent.style.top = '0';
            tent.style.left = '0';
            tent.style.zIndex = 1000;
        } else {
            tent = document.getElementById(containerName);
            tent.innerHTML = '';
        }

        document.getElementById('bsp_shippingCost_dialog').parentElement.style.padding = '3px';
        //debugger;
        document.getElementById('bsp_shippingCost_dialog').parentElement.style.backgroundColor = 'darkgray';
        document.getElementById('bsp_shippingCost_dialog').style.backgroundColor = 'white';
        document.getElementById('bsp_shippingCost_dialog').parentElement.style.padding = '5px';
        var tabArray = document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li');
        for (var x = 0; x < tabArray.length; x++) {
            document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[x].style.backgroundColor = 'lightblue';
            document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[x].style.padding = '5px';
            document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[x].addEventListener('click', function (x) {
                var colorTabArray = document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li');
                for (var ix = 0; ix < colorTabArray.length; ix++) {
                    document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[ix].style.backgroundColor = 'lightblue';
                }
                this.style.backgroundColor = 'white';
            });
            document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[x].getElementsByTagName('a')[0].style.textDecoration = 'none';
            document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[x].style.display = 'inline';
            document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[x].parentElement.style.height = '23px'
        }
        document.getElementById('bsp_shippingCost_dialog').previousElementSibling.getElementsByTagName('span')[0].style.color = 'white';
        document.getElementById('bsp_shippingCost_dialog').previousElementSibling.getElementsByTagName('button')[0].style.borderRadius = '25px';
        document.getElementById('bsp_shippingCost_dialog').previousElementSibling.getElementsByTagName('button')[0].style.backgroundColor = 'white';
        document.getElementById('bsp_shippingCost_dialog').previousElementSibling.getElementsByTagName('button')[0].style.display = 'none';
        document.getElementById('bsp_shippingCost_dialog').previousElementSibling.getElementsByTagName('span')[0].parentElement.style.height = '30px';

        tent.appendChild(document.getElementById('bsp_shippingCost_dialog').parentElement);

        document.body.appendChild(tent);
    }

}
//##############BS_Show

function BSP_FedExRequestRate(salesOrderID, locObj) {
    var shippingRate = '0';
    var defaultShippingCost = 0;

    try {
        var response;
        var headers = BSP_FedExHeader(salesOrderID);
        var body = BSP_FedExBody(salesOrderID, locObj);
        if (body == '') {
            return defaultShippingCost;
        }

        var soapPayload = BSP_FedExSoapEnvelope('RateRequest', headers + body);

        // {"User-Agent-x": "SuiteScript-Call"};
        var soapHead = {};
        soapHead['Content-Type'] = 'text/xml';
        soapHead['SOAPAction'] = 'http://fedex.com/ws/rate/v20/getRates';
        var fedExWSURL = (FedEx_UseProd) ? FedEx_ProdURL : FedEx_TestURL;
        soapPayload = soapPayload.replace(/&/g, '');
        response = nlapiRequestURL(fedExWSURL, soapPayload, soapHead);
        var responseCode = response.getCode();
        if (responseCode == 200) {
            var soapText = response.getBody();
            var soapXML = nlapiStringToXML(soapText);
            var ratesHTML = '';

            FedExSoapMsgs = soapPayload + soapText;

            var rateReply = nlapiSelectNode(soapXML, '//*[name()="RateReply"]');
            var result = nlapiSelectValue(rateReply, '//*[name()="HighestSeverity"]');
            if ((result == 'SUCCESS') || (result == 'WARNING') || (result == 'NOTE')) {
                //RateReplyDetails
                //RatedShipmentDetails
                //ShipmentRateDetail
                //TotalNetChargeWithDutiesAndTaxes
                var notificationsNode = nlapiSelectNode(rateReply, '//*[name()="Notifications"]');
                var messageNode = nlapiSelectNode(notificationsNode, '//*[name()="Message"]');
                var message = nlapiSelectValue(messageNode, '.');

                ratesHTML += '<table width="100%"><tr><td valign="top">';
                ratesHTML += '<h2>Available Shipping Rates:</h2>';

                var rateReplyDetails = nlapiSelectNodes(soapXML, '//*[name()="RateReplyDetails"]');
                for (var i = 0; i < rateReplyDetails.length; i++) {
                    var rateReplyDetailNode = rateReplyDetails[i];
                    var ratedShipmentDetails = nlapiSelectNodes(rateReplyDetailNode, '*[name()="RatedShipmentDetails"]');
                    if (ratedShipmentDetails.length > 0) {
                        var ratedShipmentDetailNode = ratedShipmentDetails[0];
                        var shipmentRateDetailNode = nlapiSelectNode(ratedShipmentDetailNode, '*[name()="ShipmentRateDetail"]');
                        var totalChargesNode = nlapiSelectNode(shipmentRateDetailNode, '*[name()="TotalNetFedExCharge"]');
                        var shippingRateNode = nlapiSelectNode(totalChargesNode, '*[name()="Amount"]');
                        shippingRate = nlapiSelectValue(shippingRateNode, '.');
                        var serviceTypeNode = nlapiSelectNode(rateReplyDetailNode, '*[name()="ServiceType"]');
                        var serviceType = nlapiSelectValue(serviceTypeNode, '.');

                        //Add 5% to shipping rate for non weborders, 25% for web orders
                        var shippingRateMarkedUp = salesOrderID == 1
                            ? parseFloat(shippingRate) * 1.25
                            : parseFloat(shippingRate) * 1.05;
                        var shippingCost = shippingRateMarkedUp + locObj['hazmatShippingCost'];

                        var shipMethodObj = ShipMethodsDic[serviceType];
                        if ((shipMethodObj != null) && (shipMethodObj != undefined)) {
                            var selectedShippingMethodId = nlapiGetFieldValue('shipmethod');
                            if (shipMethodObj['id'] == selectedShippingMethodId) {
                                defaultShippingCost = shippingCost;
                            }
                        }

                        ratesHTML += '<input type="radio" id="' + serviceType + '-' + locObj['id'] + '" name="selShipMethod' + '-' + locObj['id'] + '"';
                        ratesHTML += ' value="' + serviceType + '"';
                        ratesHTML += ' onclick="SelectShipMethod(\'' + serviceType + '\'';
                        ratesHTML += ',\'' + shippingCost.toFixed(2) + '\'';
                        ratesHTML += ',\'' + locObj['id'] + '\');"';
                        ratesHTML += ' >' + serviceType + ': $' + shippingCost.toFixed(2) + '</input><br>';
                    }
                }
            }
            else {
                if (window) {
                    window.console.log(soapText +
                        "\n#####################\n" +
                        soapXML +
                        "\n#####################\n" +
                        result +
                        "\n#####################\n" +
                        rateReply +
                        "\n#####################\n" +
                        result);
                    window.alert('Error: Unable to get real-time rates. Invalid shipping address or missing package weight.');
                }
            }

            ratesHTML += '</td>';
            ratesHTML += '<td valign="top" style="margin-left:20px;">';
            ratesHTML += '<h2>FedEx Notes:</h2><p>' + message + '</p>';
            ratesHTML += '<button type="button" onclick="GetRealTimeShippingRates();">Get Real-time Rates</button>';
            ratesHTML += '</td></tr></table>';
            ratesHTML += '<p>&nbsp;</p>';
            locObj['ratesHTML'] = ratesHTML;

            return defaultShippingCost;
        }
        else {
            var soapText = response.getBody();
            FedExSoapMsgs = soapPayload + soapText;

            if (window) {
                window.alert('Error: Unable to access real-time rates. Response Code: ' + responseCode);
            }

            locObj['ratesHTML'] = '';
            return defaultShippingCost;
        }
    }
    catch (err) {
        try {
            if (window) {
                window.alert('Error: ' + err.message);
                window.console.log(err);
            }
        } catch (e2) {
            //
        }

        locObj['ratesHTML'] = '';
        return defaultShippingCost;
    }
}

function BSP_FedExHeader(salesOrderID) {
    var soapHeader = '';

    soapHeader += '<WebAuthenticationDetail>';
    soapHeader += '<UserCredential>';
    soapHeader += '<Key>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdKey : FedEx_TestKey;
    soapHeader += '</Key>';
    soapHeader += '<Password>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdPassword : FedEx_TestPassword;
    soapHeader += '</Password>';
    soapHeader += '</UserCredential>';
    soapHeader += '</WebAuthenticationDetail>';
    soapHeader += '<ClientDetail>';
    soapHeader += '<AccountNumber>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdAccountNumber : FedEx_TestAccountNumber;
    soapHeader += '</AccountNumber>';
    soapHeader += '<MeterNumber>';
    soapHeader += (FedEx_UseProd) ? FedEx_ProdMeterNumber : FedEx_TestMeterNumber;
    soapHeader += '</MeterNumber>';
    soapHeader += '</ClientDetail>';
    soapHeader += '<TransactionDetail>';
    soapHeader += '<CustomerTransactionId>' + salesOrderID + '</CustomerTransactionId>';
    soapHeader += '</TransactionDetail>';
    soapHeader += '<Version>';
    soapHeader += '<ServiceId>' + Version_ServiceId + '</ServiceId>';
    soapHeader += '<Major>' + Version_Major + '</Major>';
    soapHeader += '<Intermediate>' + Version_Intermediate + '</Intermediate>';
    soapHeader += '<Minor>' + Version_Minor + '</Minor>';
    soapHeader += '</Version>';

    return soapHeader;
}

function GetDefaultRatesHTML() {
    var ratesHTML = '';

    ratesHTML += '<table width="100%"><tr><td valign="top">';
    ratesHTML += '<h2>Available Shipping Rates:</h2>';
    ratesHTML += '</td>';
    ratesHTML += '<td valign="top" style="margin-left:20px;">';
    ratesHTML += '<h2>FedEx Notes:</h2><p>&nbsp;</p>';
    ratesHTML += '<button type="button" onclick="GetRealTimeShippingRates();">Get Real-time Rates</button>';
    ratesHTML += '</td></tr></table>';
    ratesHTML += '<p>&nbsp;</p>';

    return ratesHTML;
}

function ProcessLineItems(salesOrderID) {
    var Field = {
        WEIGHT: 'weight',
        UOM: 'custitem_uom_numeral',
        WEIGHTUNIT: 'weightunit',
        HEIGHT: 'custitem_pkg_height',
        WIDTH: 'custitem_pkg_width',
        LENGTH: 'custitem_pkg_length',
        DESCRIPTION: 'salesdescription',
        UPC_NEW: 'custitem_sku',
        UPC_OLD: 'upccode',
        SHIP_INDIVIDUALLY: 'shipindividually',
        EXCLUDE_FREE_SHIPPING: 'custitem_no_free_shipping',
        NO_REPACKAGING: 'custitem_no_re_packaging',
        STORE_DISPLAY_NAME: 'storedisplayname',
        PARENT: 'parent',
        FRAGILE: 'custitem_fragile_item',
        HAZMAT: 'custitem_hazmat_item'
        //this array exists twice in this file; make sure you update the other one too
    };
    LocationsArr = new Array();
    LocationsDic = {};

    var HazmatShippingTotalCost = 0;

    var OrderLinesHTML = '<table class="item-list" width="100%"><tr class="item-header">';
    OrderLinesHTML += '<th align="left" width="10%">Qty.</th>';
    OrderLinesHTML += '<th align="left">Item</th>';
    OrderLinesHTML += '<th align="right" width="14%">Rate</th>';
    OrderLinesHTML += '<th align="right" width="15%">Amount</th></tr>';

    for (var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
        var hazmatShippingCost = 0;
        var itemLocNum = +nlapiGetLineItemValue('item', 'location', i);//typecast to number
        if (itemLocNum > 0) {
            var itemType = nlapiGetLineItemValue('item', 'itemtype', i);
            if (itemType === 'InvtPart' || itemType === 'Kit' || itemType === 'Assembly' || itemType === 'NonInvtPart') {
                var itemTypeName = 'inventoryitem';
                if (itemType === 'Kit') {
                    itemTypeName = 'kititem';
                } else if (itemType === 'Assembly') {
                    itemTypeName = 'assemblyitem';
                } else if (itemType === 'NonInvtPart') {
                    itemTypeName = 'noninventoryitem';
                }
                var itemId = +nlapiGetLineItemValue('item', 'item', i);
                if (itemId > 0) {
                    var itemFieldNames = [Field.WEIGHT, Field.UOM, Field.WEIGHTUNIT,
                    Field.HEIGHT, Field.WIDTH, Field.LENGTH, Field.DESCRIPTION,
                    Field.UPC_NEW, Field.UPC_OLD, Field.SHIP_INDIVIDUALLY,
                    Field.EXCLUDE_FREE_SHIPPING, Field.NO_REPACKAGING,
                    Field.STORE_DISPLAY_NAME, Field.PARENT,
                    Field.FRAGILE, Field.HAZMAT];

                    var itemRecord = nlapiLookupField(itemTypeName, itemId, itemFieldNames);//
                    if (itemRecord !== null) {
                        var weight = itemRecord[Field.WEIGHT] ? +itemRecord[Field.WEIGHT] : 0;//
                        if (weight > 0 && +itemRecord[Field.UOM] > 1) {
                            weight *= itemRecord[Field.UOM];
                        }//
                        var itemObj = {};
                        itemObj['lineNum'] = i;
                        itemObj['itemId'] = itemId;
                        itemObj['quantity'] = nlapiGetLineItemValue('item', 'quantity', i);
                        itemObj['name'] = nlapiGetLineItemText('item', 'item', i);
                        itemObj['notes'] = '';
                        itemObj['location'] = itemLocNum;

                        if (weight <= 0) {
                            itemObj['shipIndividually'] = '1';
                            itemObj['notes'] = 'Weight not defined'
                        } else {
                            if (itemRecord[Field.SHIP_INDIVIDUALLY] === 'T') {
                                itemObj['shipIndividually'] = '1';
                                itemObj['notes'] = 'Ships separately'
                            } else {
                                itemObj['shipIndividually'] = '0';
                            }
                        }

                        itemObj['noFreeShipping'] = itemRecord[Field.EXCLUDE_FREE_SHIPPING];
                        itemObj['fragileItem'] = itemRecord[Field.FRAGILE] === 'T' ? '1' : '0';

                        if (itemRecord[Field.HAZMAT] === 'T') {
                            hazmatShippingCost = HazmatShippingUnitCost * itemObj['quantity'];
                            itemObj['hazmatItem'] = '1';
                        } else {
                            itemObj['hazmatItem'] = '0';
                        }

                        itemObj['noRePackaging'] = itemRecord[Field.NO_REPACKAGING] === 'T' ? '1' : '0';
                        itemObj['weight'] =
                            itemRecord[Field.WEIGHTUNIT] === '2' ? weight * 0.0625 /* OZ */ :
                                itemRecord[Field.WEIGHTUNIT] === '3' ? weight * 2.2046 /* KG */ :
                                    itemRecord[Field.WEIGHTUNIT] === '4' ? weight * 0.0022 /* G  */ :
                                        weight; /* 1 = LB, no more enums */
                        itemObj['weightUnits'] = 'LB';

                        itemObj['width'] = itemRecord[Field.WIDTH] ? +itemRecord[Field.WIDTH] : 1;
                        itemObj['height'] = itemRecord[Field.HEIGHT] ? +itemRecord[Field.HEIGHT] : 1;
                        itemObj['length'] = itemRecord[Field.LENGTH] ? +itemRecord[Field.LENGTH] : 1;
                        itemObj['desc'] = itemRecord[Field.DESCRIPTION];
                        itemObj['upccode'] = itemRecord[Field.UPC_NEW] ? itemRecord[Field.UPC_NEW] : itemRecord[Field.UPC_OLD];

                        var locObj = {};
                        if (LocationsDic[itemLocNum] === undefined || LocationsDic[itemLocNum] === null) {
                            var locationFieldNames = ['name', 'phone', 'address1', 'address2', 'city', 'state', 'zip', 'country'];//
                            locObj = nlapiLookupField('location', itemLocNum, locationFieldNames);//
                            locObj['id'] = itemLocNum;
                            locObj['shippingCost'] = '0';
                            locObj['hazmatShippingCost'] = 0; //hazmatShippingCost;
                            locObj['items'] = new Array();
                            locObj['pkgs'] = new Array();
                            locObj['pkgsHTML'] = '';
                            locObj['pkgsText'] = '';
                            locObj['ratesHTML'] = GetDefaultRatesHTML();

                            LocationsArr.push(itemLocNum);
                            LocationsDic[itemLocNum] = locObj;
                        }

                        locObj = LocationsDic[itemLocNum];
                        var itemsArray = locObj['items'];
                        itemsArray.push(itemObj);
                        locObj['hazmatShippingCost'] += hazmatShippingCost;

                        var optionsHTML = '';
                        var displayName = itemRecord[Field.STORE_DISPLAY_NAME];
                        var parentId = itemRecord[Field.PARENT];

                        try {
                            var options = nlapiGetLineItemValue('item', 'options', i);
                            if (options != null) {
                                var optionsList = options.split(String.fromCharCode(4));
                                for (var k = 0; k < optionsList.length; k++) {
                                    var optionsVals = optionsList[k];
                                    var optionsValsList = optionsVals.split(String.fromCharCode(3));
                                    if (optionsValsList.length >= 5) {
                                        optionsHTML += optionsValsList[2] + ': ' + optionsValsList[4] + '<br/>';
                                    }
                                }
                            }
                            if (parentId != null && displayName == '') {
                                displayName = nlapiLookupField(itemTypeName, parseInt(parentId, 10), Field.STORE_DISPLAY_NAME); //use store display name of parent, if child display name doesnt exist
                            }
                        }
                        catch (err) {
                            // Nothing todo
                        }

                        OrderLinesHTML += '<tr class="item-line" style="padding-top:10px">';
                        OrderLinesHTML += '<td valign="top" class="item-quantity">' + itemObj['quantity'] + '</td>';
                        OrderLinesHTML += '<td class="item-name"><strong>' + displayName + '</strong><br/>' + optionsHTML + '</td>';
                        OrderLinesHTML += '<td align="right" class="item-rate" valign="top">$' + nlapiGetLineItemValue('item', 'rate', i) + '</td>';
                        OrderLinesHTML += '<td align="right" class="item-amount" valign="top"><strong>$' + nlapiGetLineItemValue('item', 'amount', i) + '</strong></td>';
                        OrderLinesHTML += '</tr>';
                    } else {
                        nlapiLogExecution('ERROR', 'Cannot lookup-- Item Type: Item ID', itemTypeName + ': ' + itemId);
                    }
                }
            }
        }
    }

    OrderLinesHTML += '<tr class="item-subtotal">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Subtotal</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('subtotal') + '</strong></td>';
    OrderLinesHTML += '</tr>';
    nlapiLogExecution('ERROR','orderLinesHtml: ', OrderLinesHTML)
    if (nlapiGetFieldValue('discounttotal') !== '0.00') {
        var discountCode = nlapiGetFieldText('couponcode') || nlapiGetFieldText('discountitem') || '';
        OrderLinesHTML += '<tr class="item-discount">';
        OrderLinesHTML += '<td colspan="2"></td>';
        if (discountCode == "Bundle Discount") {
            OrderLinesHTML += '<td align="right"><strong>Bundle Discount</strong></td>';
        } else {
            OrderLinesHTML += '<td align="right"><strong>Discount</strong><em>(' + discountCode + ')</em></td>';
        }
        OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('discounttotal') + '</strong></td>';
        OrderLinesHTML += '</tr>';
    }

    OrderLinesHTML += '<tr class="item-shipping">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Shipping</strong></td>';

    var bs_lineNumber = nlapiGetLineItemCount('item');
    var bs_lastLineDescription = nlapiGetLineItemValue('item', 'description', bs_lineNumber);
    if (bs_lastLineDescription === 'Free Shipping') {
        OrderLinesHTML += '<td align="right"><strong>$0.00</strong></td>';
    }
    else {
        OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('shippingcost') + '</strong></td>';
    }
    OrderLinesHTML += '</tr>';

    OrderLinesHTML += '<tr class="item-tax">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Sales Tax</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('taxtotal') + '</strong></td>';
    OrderLinesHTML += '</tr>';

    OrderLinesHTML += '<tr class="item-total">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Grand Total</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('total') + '</strong></td>';
    OrderLinesHTML += '</tr>';



    OrderLinesHTML += '</table>';
}


//#########################     UPDATE SHIPMENT
function BS_Update_Hiden_Field_For_Update_Tax(shipaddress,
    shipaddressee,
    shipaddr1,
    shipaddr2,
    shipcity,
    shipstate,
    shipzip,
    shipcountry,
    inpt_shipmethod,
    shipmethod) {
    //####### Update UI
    nlapiSetFieldValue('inpt_shipaddresslist', '');
    nlapiSetFieldValue('indx_shipaddresslist9', 0);
    //####### Update Hiden Field
    nlapiSetFieldValue('shipaddress', shipaddress);

    nlapiSetFieldValue('shipaddressee', shipaddressee);
    nlapiSetFieldValue('shipaddr1', shipaddr1);
    nlapiSetFieldValue('shipaddr2', shipaddr2);
    nlapiSetFieldValue('shipcity', shipcity);
    nlapiSetFieldValue('shipstate', shipstate);
    nlapiSetFieldValue('shipzip', shipzip);
    nlapiSetFieldValue('shipcountry', shipcountry);

    nlapiSetFieldValue('inpt_shipmethod', inpt_shipmethod);
    nlapiSetFieldValue('shipmethod', shipmethod);
}
function BS_Build_Shipping_Table() {
    var LocationAddress = [
        'Kush Supply Co. <br> 4900 Osage Street <br> Suite 500 <br> Denver CO 80221 <br> United States',
        'Kush Bottles <br> 1800 Newport Circle <br> Santa Ana CA 92705 <br> United States',
        'Kush Supply Co. <br> 19510 144th Ave NE <br> Suite A1 <br> Woodinville WA 98072 <br> United States',
        'Kush Supply Co. <br> 15711 Condon Avenue <br> Suite A5 <br> Lawndale CA 90260 <br> United States',
        'Kush Supply Co. <br> 11958 Monarch Street <br> Garden Grove CA 92841 <br> United States',
        'Kush Supply Co. <br> 6480 Cameron St <br> Suite 300 <br> Las Vegas NV 89118 <br> United States',
        'Kush Supply Co. <br> 148 Blackstone River Road <br> Worcester MA 01607 <br> United States'
    ];
    var SaleOrderShippingTemplate = "";
    SaleOrderShippingTemplate = "<div class='shippinginfo'><div class='shippingto' style='width: 100%; float: left;'>";
    SaleOrderShippingTemplate += "<strong><SHIPTITLE></strong><br><SHIPADDRESS></div><div class='billingto' style='width: 100%; float: left;'>";

    var ShippingLocation = nlapiGetFieldText('shipmethod');
    var ShipTo = nlapiGetFieldValue('shipaddress');
    var ship_method = nlapiGetFieldValue('shipmethod');
    if (ship_method == '14724') {
        BS_Update_Hiden_Field_For_Update_Tax('Will Call\n11958 Monarch Street\nGarden Grove CA 92841\nUnited States',
            'Will Call',
            '11958 Monarch Street',
            '',
            'Garden Grove',
            'CA',
            '92841',
            'US',
            'Local Pickup (Garden Grove, CA)',
            14724);
        //###End Tax Section
        SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[4]);
    } else if (ShippingLocation.search('Local Pickup') > -1) {
        SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPTITLE>', 'Pickup Location:');
        if (ShippingLocation.search('Denver') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n4900 Osage Street\nSuite 500\nDenver, CO 80221\nUnited States',
                'Will Call',
                '4900 Osage Street',
                'Suite 500',
                'Denver',
                'CO',
                '80221',
                'US',
                'Local Pickup (Denver, CO)',
                4364);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[0]);
        }
        else if (ShippingLocation.search('Santa') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n1800 Newport Circle\nSanta Ana, CA 92705\nUnited States',
                'Will Call',
                '1800 Newport Circle',
                '',
                'Santa Ana',
                'CA',
                '92705',
                'US',
                'Local Pickup (Santa Ana, CA)',
                42);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[1]);
        }
        else if (ShippingLocation.search('Woodinville') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n19510 144th Ave NE\nSuite A1\nWoodinville, WA 98072\nUnited States',
                'Will Call',
                '19510 144th Ave NE',
                'Suite A1',
                'Woodinville',
                'WA',
                '98072',
                'US',
                'Local Pickup (Woodinville, WA)',
                4365);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[2]);
        }
        else if (ShippingLocation.search('Lawndale') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n15711 Condon Avenue\nSuite A5\nLawndale CA 90260\nUnited States',
                'Will Call',
                '15711 Condon Avenue',
                'Suite A5',
                'Lawndale',
                'CA',
                '90260',
                'US',
                'Local Pickup (Lawndale, CA)',
                6646);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[3]);
        }
        else if (ShippingLocation.search('Garden') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n11958 Monarch Street\nGarden Grove CA 92841\nUnited States',
                'Will Call',
                '11958 Monarch Street',
                '',
                'Garden Grove',
                'CA',
                '92841',
                'US',
                'Local Pickup (Garden Grove, CA)',
                10694);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[4]);
        }
        else if (ShippingLocation.search('Las Vegas') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n6480 Cameron St\nSuite 300\nLas Vegas NV 89118\nUnited States',
                'Will Call',
                '6480 Cameron St',
                'Suite 300',
                'Las Vegas',
                'NV',
                '89118',
                'US',
                'Local Pickup (Las Vegas, CA)',
                14626);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[5]);
        }
        else if (ShippingLocation.search('Worcester') > -1) {
            //###This part set TAX
            BS_Update_Hiden_Field_For_Update_Tax('Will Call\n148 Blackstone River Road\nWorcester MA 92841\nUnited States',
                'Will Call',
                '148 Blackstone River Road',
                '',
                'Worcester',
                'MA',
                '01607',
                'US',
                'Local Pickup (Worcester, MA)',
                14703);
            //###End Tax Section
            SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', LocationAddress[6]);
        }
    } else {
        SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPADDRESS>', ShipTo.replace(/\n/g, '<br>'));
        SaleOrderShippingTemplate = SaleOrderShippingTemplate.replace('<SHIPTITLE>', 'Ship to:');
    }
    nlapiSetFieldValue('custbody_order_billing_shipping_addres', SaleOrderShippingTemplate);
}
//#########################     END SECTION

function UpdateOrderLinesHTML() {
    BS_Build_Shipping_Table();
    var Field = {
        WEIGHT: 'weight',
        UOM: 'custitem_uom_numeral',
        WEIGHTUNIT: 'weightunit',
        HEIGHT: 'custitem_pkg_height',
        WIDTH: 'custitem_pkg_width',
        LENGTH: 'custitem_pkg_length',
        DESCRIPTION: 'salesdescription',
        UPC_NEW: 'custitem_sku',
        UPC_OLD: 'upccode',
        SHIP_INDIVIDUALLY: 'shipindividually',
        EXCLUDE_FREE_SHIPPING: 'custitem_no_free_shipping',
        NO_REPACKAGING: 'custitem_no_re_packaging',
        STORE_DISPLAY_NAME: 'storedisplayname',
        PARENT: 'parent',
        FRAGILE: 'custitem_fragile_item',
        HAZMAT: 'custitem_hazmat_item'
        //this array exists twice in this file; make sure you update the other one too
    };

    var OrderLinesHTML = '<table class="item-list" width="100%"><tr class="item-header">';
    OrderLinesHTML += '<th align="left" width="10%">Qty.</th>';
    OrderLinesHTML += '<th align="left">Item</th>';
    OrderLinesHTML += '<th align="right" width="14%">Rate</th>';
    OrderLinesHTML += '<th align="right" width="15%">Amount</th></tr>';

    for (var i = 1; i <= nlapiGetLineItemCount('item'); i++) {
        var hazmatShippingCost = 0;
        var itemLocNum = +nlapiGetLineItemValue('item', 'location', i);
        if (itemLocNum > 0) {
            var itemType = nlapiGetLineItemValue('item', 'itemtype', i);
            if (itemType === 'InvtPart' || itemType === 'Kit' || itemType === 'Assembly' || itemType === 'NonInvtPart' || itemType === 'Discount') {
                var itemTypeName = 'inventoryitem';
                if (itemType === 'Kit') {
                    itemTypeName = 'kititem';
                } else if (itemType === 'Assembly') {
                    itemTypeName = 'assemblyitem';
                } else if (itemType === 'NonInvtPart') {
                    itemTypeName = 'noninventoryitem';
                } else if (itemType === 'Discount') {
                    itemTypeName = 'discountitem'
                }
                var itemId = +nlapiGetLineItemValue('item', 'item', i);
                if (itemId > 0) {
                    var itemFieldNames = [Field.WEIGHT, Field.UOM, Field.WEIGHTUNIT,
                    Field.HEIGHT, Field.WIDTH, Field.LENGTH, Field.DESCRIPTION,
                    Field.UPC_NEW, Field.UPC_OLD, Field.SHIP_INDIVIDUALLY,
                    Field.EXCLUDE_FREE_SHIPPING, Field.NO_REPACKAGING,
                    Field.STORE_DISPLAY_NAME, Field.PARENT,
                    Field.FRAGILE, Field.HAZMAT];

                    var itemRecord = nlapiLookupField(itemTypeName, itemId, itemFieldNames);//
                    if (itemRecord !== null) {
                        var weight = itemRecord[Field.WEIGHT] ? +itemRecord[Field.WEIGHT] : 0;//
                        if (weight > 0 && +itemRecord[Field.UOM] > 1) {
                            weight *= itemRecord[Field.UOM];
                        }//
                        var optionsHTML = '';
                        var displayName = itemRecord[Field.STORE_DISPLAY_NAME];
                        var parentId = itemRecord[Field.PARENT];

                        try {
                            var options = nlapiGetLineItemValue('item', 'options', i);
                            if (options != null) {
                                var optionsList = options.split(String.fromCharCode(4));
                                for (var k = 0; k < optionsList.length; k++) {
                                    var optionsVals = optionsList[k];
                                    var optionsValsList = optionsVals.split(String.fromCharCode(3));
                                    if (optionsValsList.length >= 5) {
                                        optionsHTML += optionsValsList[2] + ': ' + optionsValsList[4] + '<br/>';
                                    }
                                }
                            }
                            if (parentId != null && displayName == '') {
                                displayName = nlapiLookupField(itemTypeName, parseInt(parentId, 10), Field.STORE_DISPLAY_NAME);
                            }
                        }
                        catch (err) {
                            // Nothing todo
                        }

                        OrderLinesHTML += '<tr class="item-line" style="padding-top:10px">';
                        OrderLinesHTML += '<td valign="top" class="item-quantity">' + nlapiGetLineItemValue('item', 'quantity', i) + '</td>';
                        OrderLinesHTML += '<td class="item-name"><strong>' + displayName + '</strong><br/>' + optionsHTML + '</td>';
                        OrderLinesHTML += '<td align="right" class="item-rate" valign="top">$' + nlapiGetLineItemValue('item', 'rate', i) + '</td>';
                        OrderLinesHTML += '<td align="right" class="item-amount" valign="top"><strong>$' + nlapiGetLineItemValue('item', 'amount', i) + '</strong></td>';
                        OrderLinesHTML += '</tr>';
                    }
                }
            }
        }
    }

    OrderLinesHTML += '<tr class="item-subtotal">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Subtotal</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('subtotal') + '</strong></td>';
    OrderLinesHTML += '</tr>';

    if (nlapiGetFieldValue('discounttotal') !== '0.00') {
        var discountCode = nlapiGetFieldText('couponcode') || nlapiGetFieldText('discountitem') || '';
        OrderLinesHTML += '<tr class="item-discount">';
        OrderLinesHTML += '<td colspan="2"></td>';
        //OrderLinesHTML += '<td align="right"><strong>Discount</strong></td>';
        if (discountCode == "Bundle Discount") {
            OrderLinesHTML += '<td align="right" style="padding-top: 10px !important;"><strong>Bundle Discount</strong></td>';
        } else {
            OrderLinesHTML += '<td align="right" style="padding-top: 10px !important;"><strong>Discount</strong><em>(' + discountCode + ')</em></td>';
        }
        OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('discounttotal') + '</strong></td>';
        OrderLinesHTML += '</tr>';
    }

    OrderLinesHTML += '<tr class="item-shipping">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Shipping</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('shippingcost') + '</strong></td>';
    OrderLinesHTML += '</tr>';

    var bs_lineNumber = nlapiGetLineItemCount('item');
    var bs_lastLineDescription = nlapiGetLineItemValue('item', 'description', bs_lineNumber);
    if (bs_lastLineDescription === 'Free Shipping') {
        OrderLinesHTML += '<tr class="item-shipping">';
        OrderLinesHTML += '<td colspan="2"></td>';
        OrderLinesHTML += '<td align="right"><strong>Shipping Discount</strong></td>';
        OrderLinesHTML += '<td align="right"><strong>- $' + nlapiGetFieldValue('shippingcost') + '</strong></td>';
        OrderLinesHTML += '</tr>';
    }

    OrderLinesHTML += '<tr class="item-tax">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Sales Tax</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('taxtotal') + '</strong></td>';
    OrderLinesHTML += '</tr>';


    OrderLinesHTML += '<tr class="item-total">';
    OrderLinesHTML += '<td colspan="2"></td>';
    OrderLinesHTML += '<td align="right"><strong>Grand Total</strong></td>';
    OrderLinesHTML += '<td align="right"><strong>$' + nlapiGetFieldValue('total') + '</strong></td>';
    OrderLinesHTML += '</tr>';

    OrderLinesHTML += '</table>';

    if (OrderLinesHTML.length < 1000000) {
        nlapiSetFieldValue('custbody_orderlines_html', OrderLinesHTML);
    }

}

function ItemFitsPackage(pkgDef, itemHeight, itemWidth, itemLength) {
    if ((itemHeight <= pkgDef['height']) && (itemWidth <= pkgDef['width']) && (itemLength <= pkgDef['length'])) {
        return true;
    }

    if ((itemHeight <= pkgDef['width']) && (itemWidth <= pkgDef['length']) && (itemLength <= pkgDef['height'])) {
        return true;
    }

    if ((itemHeight <= pkgDef['length']) && (itemWidth <= pkgDef['height']) && (itemLength <= pkgDef['width'])) {
        return true;
    }

    return false;
}

function AddToPackage(pkgsArray, itemObj, pkgDefLevel) {
    var itemQuantity = 1;
    var itemName = itemObj['name'];
    var itemDesc = itemObj['desc'];
    var itemNotes = itemObj['notes'];
    var itemSKU = itemObj['upccode']; //uses UPC_NEW, or UPC_OLD
    var itemWeight = itemObj['weight'];
    var itemWeightUnits = itemObj['weightUnits'];
    var itemId = itemObj['itemId'];
    var itemHeight = itemObj['height'];
    var itemWidth = itemObj['width'];
    var itemLength = itemObj['length'];
    var itemVolume = itemHeight * itemWidth * itemLength;
    var itemLinearLength = itemHeight + itemWidth + itemLength;
    var itemNoRePackaging = itemObj['noRePackaging'];
    var itemFragile = itemObj['fragileItem'];

    var i = 0;
    for (i = 0; i < pkgsArray.length; i++) {
        var pkgObj = pkgsArray[i];
        var pkgDefIndex = pkgObj['pkgDefIndex'];
        var currPkgVolume = pkgObj['currentVolume'];
        var currPkgWeight = pkgObj['currentWeight'];
        var currPkgLinearLength = pkgObj['currentLinearLength'];

        var pkgDef = PkgDefsArr[pkgDefIndex];
        var pkgMaxVolume = pkgDef['maxVolume'];
        var pkgMaxWeight = (pkgObj['fragileItem'] == false) ? pkgDef['maxWeight'] : MaxWeightFragile;
        var pkgMaxLinearLength = pkgDef['maxLinearLength'];
        if (((currPkgVolume + itemVolume) <= pkgMaxVolume) &&
            ((currPkgWeight + itemWeight) <= pkgMaxWeight) /* &&
         ((currPkgLinearLength + itemLinearLength) <= pkgMaxLinearLength) */) {
            //alert('Adding Item to Package...')
            if (ItemFitsPackage(pkgDef, itemHeight, itemWidth, itemLength)) {
                //alert('Item #: ' + itemId + ' Size: ' + itemObj['length'] + 'x' + itemObj['width'] + 'x' + itemObj['height']);
                //alert('Pkg Def: ' + (pkgDefIndex + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
                var itemObj2 = {};
                itemObj2['itemId'] = itemId;
                itemObj2['name'] = itemName;
                itemObj2['desc'] = itemDesc;
                itemObj2['notes'] = itemNotes;
                itemObj2['upccode'] = itemSKU;
                itemObj2['quantity'] = itemQuantity;
                itemObj2['weight'] = itemWeight;
                itemObj2['weightUnits'] = itemWeightUnits;
                itemObj2['height'] = itemHeight;
                itemObj2['width'] = itemWidth;
                itemObj2['length'] = itemLength;
                itemObj2['volume'] = itemVolume;
                itemObj2['shipIndividually'] = '0';
                itemObj2['noRePackaging'] = itemNoRePackaging;
                itemObj2['fragileItem'] = itemFragile;

                var pkgItems = pkgObj['items'];
                pkgItems.push(itemObj2);

                pkgObj['currentVolume'] = currPkgVolume + itemVolume;
                pkgObj['currentWeight'] = currPkgWeight + itemWeight;
                pkgObj['currentLinearLength'] = currPkgLinearLength + itemLinearLength;
                pkgObj['percentFull'] = (currPkgVolume + itemVolume) / pkgMaxVolume;
                if (itemFragile == '1') {
                    pkgObj['fragileItem'] = true;
                }
                return;
            }
            else {
                //alert('Item does not fit package');
            }
        }
    }

    var j = pkgDefLevel;
    for (i = 0; i < PkgDefsArr.length; i++) {
        var pkgDef = PkgDefsArr[j];
        var pkgMaxVolume = pkgDef['maxVolume'];
        var pkgMaxWeight = (itemFragile == '0') ? pkgDef['maxWeight'] : MaxWeightFragile;
        var pkgMaxLinearLength = pkgDef['maxLinearLength'];
        if ((itemVolume <= pkgMaxVolume) &&
            (itemWeight <= pkgMaxWeight) /* &&
         (itemLinearLength <= pkgMaxLinearLength)*/) {
            //alert('Adding Item to Package...')
            if (ItemFitsPackage(pkgDef, itemHeight, itemWidth, itemLength)) {
                //alert('Item #: ' + itemId + ' Size: ' + itemObj['length'] + 'x' + itemObj['width'] + 'x' + itemObj['height']);
                //alert('Pkg Def: ' + (j + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
                var itemObj2 = {};
                itemObj2['itemId'] = itemId;
                itemObj2['name'] = itemName;
                itemObj2['desc'] = itemDesc;
                itemObj2['notes'] = itemNotes;
                itemObj2['upccode'] = itemSKU;
                itemObj2['quantity'] = itemQuantity;
                itemObj2['weight'] = itemWeight;
                itemObj2['weightUnits'] = itemWeightUnits;
                itemObj2['height'] = itemHeight;
                itemObj2['width'] = itemWidth;
                itemObj2['length'] = itemLength;
                itemObj2['volume'] = itemVolume;
                itemObj2['shipIndividually'] = '0';
                itemObj2['noRePackaging'] = itemNoRePackaging;
                itemObj2['fragileItem'] = itemFragile;

                var pkgObj = {};
                var pkgItems = new Array();
                pkgItems.push(itemObj2);
                pkgObj['items'] = pkgItems;
                pkgObj['currentVolume'] = itemVolume;
                pkgObj['currentWeight'] = itemWeight;
                pkgObj['currentLinearLength'] = itemLinearLength;
                pkgObj['percentFull'] = itemVolume / pkgMaxVolume;
                pkgObj['pkgDefIndex'] = j;
                if (itemFragile == '1') {
                    pkgObj['fragileItem'] = true;
                }
                else {
                    pkgObj['fragileItem'] = false;
                }
                pkgsArray.push(pkgObj);
                return;
            }
            else {
                //alert('Item does not fit package');
            }
        }

        j = (j + 1) % PkgDefsArr.length;
    }

    if (pkgDefLevel == 0) {
        itemObj['shipIndividually'] = '1';
        itemObj['notes'] = 'Over-sized Package';
    }
}

function GenerateShippingCostHTML(pkgsArray) {

    PkgsText = '';

    var i = 0;
    var dlgHTML = '';
    dlgHTML += '<style type="text/css">';
    dlgHTML += 'table.gridtable {width: 100%;color:#000000;border-width: 1px;border-color: #666666;border-collapse: collapse; }';
    dlgHTML += 'table.gridtable th {border-width: 1px;padding: 8px;border-style: solid;border-color: #666666; }';
    dlgHTML += 'table.gridtable td {border-width: 1px;padding: 8px;border-style: solid;border-color: #666666;background-color: #ffffff; }';
    dlgHTML += 'table.gridtable2 {width: 100%;color:#333333;border-width: 1px;border-color: #999999;border-collapse: collapse; }';
    dlgHTML += 'table.gridtable2 th {border-width: 1px;padding: 8px;border-style: solid;border-color: #999999;background-color: #607799;color: #ffffff }';
    dlgHTML += 'table.gridtable2 td {border-width: 1px;padding: 8px;border-style: solid;border-color: #999999;background-color: #ffffff; }';
    dlgHTML += 'tr.shipseparate {color: #FF0000; }';
    dlgHTML += 'tr.tableheader {background-color: #dedede;color: #000000 }';
    dlgHTML += '</style>';
    dlgHTML += '<table class="gridtable">';
    dlgHTML += '<tr class="tableheader"><th>Pkg #</th><th>Pkg Weight</th><th>Pkg Dimensions</th><th>Percent Full</th><th>Items included in the Pkg</th></tr>';

    for (i = 0; i < pkgsArray.length; i++) {

        var pkgObj = pkgsArray[i];
        var pkgDefIndex = pkgObj['pkgDefIndex'];
        var pkgDef = {};
        if (pkgDefIndex < 0) {
            var itemsArr = pkgObj['items'];
            var itemObj2 = itemsArr[0];
            var itemHeight = itemObj2['height'];
            var itemLength = itemObj2['length'];
            var itemWidth = itemObj2['width'];

            pkgDef['id'] = 0;
            pkgDef['name'] = itemHeight.toString() + 'x' + itemLength.toString() + 'x' + itemWidth.toString();
            pkgDef['height'] = itemHeight;
            pkgDef['length'] = itemLength;
            pkgDef['width'] = itemWidth;
            pkgDef['dimUnits'] = 'IN';
            pkgDef['weightUnits'] = 'LB';
            pkgDef['maxWeight'] = MaxWeight;
            pkgDef['maxVolume'] = pkgDef['height'] * pkgDef['length'] * pkgDef['width'];
            pkgDef['maxLinearLength'] = pkgDef['height'] + pkgDef['length'] + pkgDef['width'];
        }
        else {
            pkgDef = PkgDefsArr[pkgDefIndex];
        }

        var seqNumber = i + 1;
        var pkgHeight = pkgDef['height'];
        var pkgWidth = pkgDef['width'];
        var pkgLength = pkgDef['length'];
        var pkgDimUnits = pkgDef['dimUnits'];
        var pkgWeightUnits = pkgDef['weightUnits'];

        var pkgWeight = pkgObj['currentWeight'];
        var pkgVolume = pkgObj['currentVolume'];
        var pkgPercentFull = pkgObj['percentFull'] * 100;

        // Update Pkg Dims
        pkgObj['height'] = pkgHeight;
        pkgObj['width'] = pkgWidth;
        pkgObj['length'] = pkgLength;

        var pkgItems = pkgObj['items'];

        var pkgShipSeparate = '0';
        if (pkgItems.length > 0) {
            var itemObj2 = pkgItems[0];
            pkgShipSeparate = itemObj2['shipIndividually'];
        }

        if (pkgShipSeparate == '1') {
            dlgHTML += '<tr class="shipseparate">';
        }
        else {
            dlgHTML += '<tr>';
        }

        PkgsText += '[Pkg #: ' + seqNumber + '] &nbsp;&nbsp;';
        PkgsText += '[Pkg Size: ' + pkgHeight.toString() + 'x' + pkgLength.toString() + 'x' + pkgWidth.toString() + ' ' + pkgDimUnits + '] &nbsp;&nbsp;';
        PkgsText += '[Total Weight: ' + pkgWeight.toFixed(2) + ' ' + pkgWeightUnits + ']\n\n';
        PkgsText += 'Items included in the Package: ' + '\n';
        PkgsText += '-----------------------------------------------------------------------------' + '\n';

        dlgHTML += '<td>' + seqNumber + '</td>';
        dlgHTML += '<td>' + pkgWeight.toFixed(2) + ' ' + pkgWeightUnits + '</td>';
        dlgHTML += '<td>' + pkgHeight.toString() + 'x' + pkgLength.toString() + 'x' + pkgWidth.toString() + ' ' + pkgDimUnits + '</td>';
        dlgHTML += '<td>' + pkgPercentFull.toFixed(2) + '% </td>';
        dlgHTML += '<td>';

        dlgHTML += '<table class="gridtable2">';
        dlgHTML += '<tr><th>SKU</th><th>Name</th><th>Quantity</th><th>Weight</th><th>Dimensions</th><th>Notes</th></tr>';

        var j = 0;
        for (j = 0; j < pkgItems.length; j++) {
            var itemObj = pkgItems[j];
            if ((itemObj != null) && (itemObj != undefined)) {
                var pkgItemQuantity = itemObj['quantity'];
                var pkgItemName = itemObj['name'] || "";
                var pkgItemDesc = itemObj['desc'] || "";
                var pkgItemSKU = itemObj['upccode'];
                var pkgItemWeight = itemObj['weight'];
                var pkgItemWeightUnits = itemObj['weightUnits'];
                var pkgItemHeight = itemObj['height'];
                var pkgItemLength = itemObj['length'];
                var pkgItemWidth = itemObj['width'];
                var pkgItemNotes = itemObj['notes'];

                pkgItemName = pkgItemName.replace(/"/g, 'inch');
                pkgItemDesc = pkgItemDesc.replace(/"/g, 'inch');

                pkgItemName = pkgItemName.replace(/(\r\n|\n|\r)/gm, '');
                pkgItemDesc = pkgItemDesc.replace(/(\r\n|\n|\r)/gm, '');


                pkgItemName = pkgItemName.replace(/&amp;|&/g, "\&");
                pkgItemDesc = pkgItemDesc.replace(/&amp;|&/g, "\&");

                pkgItemName = pkgItemName.replace(/&/g, '\&');
                pkgItemDesc = pkgItemDesc.replace(/&/g, '\&');

                if (pkgShipSeparate == '1') {
                    dlgHTML += '<tr class="shipseparate">';
                }
                else {
                    dlgHTML += '<tr>';
                }
                dlgHTML += '<td>' + pkgItemSKU + '</td>';
                dlgHTML += '<td>' + pkgItemName + '</td>';
                dlgHTML += '<td>' + pkgItemQuantity + '</td>';
                dlgHTML += '<td>' + pkgItemWeight.toFixed(2) + ' ' + pkgItemWeightUnits + '</td>';
                dlgHTML += '<td>' + pkgItemHeight.toString() + 'x' + pkgItemLength.toString() + 'x' + pkgItemWidth.toString() + ' IN</td>';
                dlgHTML += '<td>' + pkgItemNotes + '</td>';
                dlgHTML += '</tr>';

                var itemSeq = j + 1;
                PkgsText += '[Item #: ' + itemSeq.toString() + '] &nbsp;&nbsp;';
                PkgsText += '[SKU: ' + pkgItemSKU + '] &nbsp;&nbsp;';
                PkgsText += '[Qty: ' + pkgItemQuantity + ']\n';
                PkgsText += 'Name: ' + pkgItemName + '\n';
                PkgsText += 'Notes:' + pkgItemNotes + '\n';

                if (itemSeq < pkgItems.length) {
                    PkgsText += '\n';
                }
            }
        }
        dlgHTML += '</table>';
        dlgHTML += '</td></tr>';

        PkgsText += '-----------------------------------------------------------------------------' + '\n\n';
    }

    dlgHTML += '</table>';

    return dlgHTML;
}

function ReorgPackages(pkgsArray, pkgDefLevel) {
    var i = 0;
    for (i = pkgsArray.length - 1; i >= 0; i--) {
        var pkgObj = pkgsArray[i];
        var percentFull = pkgObj['percentFull'];
        var pkgDef = PkgDefsArr[pkgObj['pkgDefIndex']];
        //alert('Pkg #: ' + (i+1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height'] + ' Current % Full: ' + (percentFull * 100));
        if (percentFull <= PercentFullThreshold) {
            var currPkgsCount = pkgsArray.length;
            var itemsArr = pkgObj['items'];
            pkgsArray.splice(i, 1);

            var j = 0;
            for (j = 0; j < itemsArr.length; j++) {
                var itemObj = itemsArr[j];
                var quantity = itemObj['quantity'];

                if (quantity > 0) {
                    var k = 0;
                    for (k = 0; k < quantity; k++) {
                        var shipIndividually = itemObj['shipIndividually'];
                        if (shipIndividually == '0') {
                            AddToPackage(pkgsArray, itemObj, pkgDefLevel);

                            // Force Pkgs to stay at the same count with max utilization
                            if (pkgsArray.length > currPkgsCount) {
                                // Additional Pkg was added. Revert back to old Pkg
                                pkgsArray.pop();
                                pkgsArray.pop();
                                pkgsArray.push(pkgObj);
                                j = itemsArr.length; // break out of outer loop as well
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

function CalcAveragePercentFull(pkgsArray) {
    // Calculate Average Package Percent Full
    var i = 0;
    var count = 0;
    var averagePercentFull = 0;
    for (i = 0; i < pkgsArray.length; i++) {
        var pkgObj = pkgsArray[i];
        var percentFull = pkgObj['percentFull'];
        if (percentFull < PercentFullThreshold) {
            count++;
            averagePercentFull += percentFull;
        }
    }

    if (count > 0) {
        averagePercentFull = averagePercentFull / count;
    }

    return averagePercentFull;
}

function GroupLineItems(pkgsArray) {
    var i = 0;
    var averagePercentFull = 0;
    for (i = 0; i < pkgsArray.length; i++) {
        var pkgObj = pkgsArray[i];
        var itemsArr = pkgObj['items'];
        var grpItemsArr = new Array();
        var grpItemsDic = {};

        var j = 0;
        for (j = 0; j < itemsArr.length; j++) {
            var itemObj = itemsArr[j];
            var quantity = itemObj['quantity'];
            var weight = itemObj['weight'];
            var itemId = itemObj['itemId'];

            if ((grpItemsDic[itemId] == undefined) || (grpItemsDic[itemId] == null)) {
                grpItemsArr.push(itemId);
                grpItemsDic[itemId] = itemObj;
            }
            else {
                var grpItemObj = grpItemsDic[itemId];
                grpItemObj['quantity'] = grpItemObj['quantity'] + quantity;
                grpItemObj['weight'] = grpItemObj['weight'] + weight;
            }
        }

        itemsArr = new Array();
        for (j = 0; j < grpItemsArr.length; j++) {
            var itemId = grpItemsArr[j];
            var grpItemObj = grpItemsDic[itemId];
            itemsArr.push(grpItemObj);
        }

        if (itemsArr.length == 1) {
            var grpItemObj = itemsArr[0];
            var quantity = grpItemObj['quantity'];
            if (quantity == 1) {
                if (grpItemObj['noRePackaging'] == '1') {
                    grpItemObj['notes'] = 'No repackaging necessary';
                    grpItemObj['shipIndividually'] = '1';

                    var itemHeight = grpItemObj['height'];
                    var itemWidth = grpItemObj['width'];
                    var itemLength = grpItemObj['length'];
                    var itemVolume = itemHeight * itemWidth * itemLength;
                    var itemLinearLength = itemHeight + itemWidth + itemLength;

                    pkgObj['currentVolume'] = itemVolume;
                    pkgObj['currentLinearLength'] = itemLinearLength;
                    pkgObj['percentFull'] = itemVolume / itemVolume;
                    pkgObj['pkgDefIndex'] = -1;
                }
            }
        }

        pkgObj['items'] = itemsArr;
    }
}

function CalcPackages(salesOrderID, locObj) {
    var i = 0;
    var selectedPkg;
    var totalWeight = 0;

    var itemsArray = locObj['items'];
    var pkgsArray = locObj['pkgs'];

    for (i = 0; i < itemsArray.length; i++) {
        var itemObj = itemsArray[i];
        var quantity = itemObj['quantity'];

        if (quantity > 0) {
            var j = 0;
            for (j = 0; j < quantity; j++) {
                var shipIndividually = itemObj['shipIndividually'];
                if (shipIndividually == '0') {
                    AddToPackage(pkgsArray, itemObj, 0);
                }

                totalWeight = totalWeight + itemObj['weight'];
            }
        }
    }

    var maxAvgPercentFull = CalcAveragePercentFull(pkgsArray);
    var maxPkgDefLevel = 0;
    for (i = 1; i < PkgDefsArr.length; i++) {
        var pkgDef = PkgDefsArr[i];
        //alert('Pkg Def: ' + (i + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
        ReorgPackages(pkgsArray, i);
        var avgPercentFull = CalcAveragePercentFull(pkgsArray);
        //alert('Avg % Full after Reorg: ' + (avgPercentFull * 100));
        if (avgPercentFull > maxAvgPercentFull) {
            //alert(avgPercentFull + ' > ' + maxAvgPercentFull);
            maxAvgPercentFull = avgPercentFull;
            maxPkgDefLevel = i;
        }
    }
    //alert('Final Reorg - Pkg Def: ' + maxPkgDefLevel);
    ReorgPackages(pkgsArray, maxPkgDefLevel);
    /*
     maxAvgPercentFull = CalcAveragePercentFull(pkgsArray);
     maxPkgDefLevel = 0;
     for (i = 2; i < PkgDefsArr.length; i++) {
     var pkgDef = PkgDefsArr[i];
     alert('Pkg Def: ' + (i + 1) + ' Size: ' + pkgDef['length'] + 'x' + pkgDef['width'] + 'x' + pkgDef['height']);
     ReorgPackages(pkgsArray, i);
     var avgPercentFull = CalcAveragePercentFull(pkgsArray);
     alert('Avg % Full after Reorg: ' + (avgPercentFull * 100));
     if (avgPercentFull > maxAvgPercentFull) {
     alert(avgPercentFull + ' > ' + maxAvgPercentFull);
     maxAvgPercentFull = avgPercentFull;
     maxPkgDefLevel = i;
     }
     }
     alert('Final Reorg - Pkg Def: ' + maxPkgDefLevel);
     ReorgPackages(pkgsArray, maxPkgDefLevel);
     */

    GroupLineItems(pkgsArray);

    for (i = 0; i < itemsArray.length; i++) {
        var itemObj = itemsArray[i];
        var shipIndividually = itemObj['shipIndividually'];
        if (shipIndividually == '1') {
            var notes = itemObj['notes'];
            if (notes.indexOf('Weight not defined') >= 0) {
                var itemWeight = itemObj['weight'];
                var itemHeight = itemObj['height'];
                var itemWidth = itemObj['width'];
                var itemLength = itemObj['length'];
                var itemVolume = itemHeight * itemWidth * itemLength;
                var itemLinearLength = itemHeight + itemWidth + itemLength;

                var pkgObj = {};
                var pkgItems = new Array();
                pkgItems.push(itemObj);
                pkgObj['items'] = pkgItems;
                pkgObj['currentVolume'] = itemVolume;
                pkgObj['currentWeight'] = itemWeight;
                pkgObj['currentLinearLength'] = itemLinearLength;
                pkgObj['percentFull'] = itemVolume / itemVolume;
                pkgObj['pkgDefIndex'] = -1;
                pkgsArray.push(pkgObj);
            }
            else {
                var j = 0;
                var quantity = itemObj['quantity'];
                for (j = 0; j < quantity; j++) {
                    itemObj['quantity'] = 1;
                    var itemWeight = itemObj['weight'];
                    var itemHeight = itemObj['height'];
                    var itemWidth = itemObj['width'];
                    var itemLength = itemObj['length'];
                    var itemVolume = itemHeight * itemWidth * itemLength;
                    var itemLinearLength = itemHeight + itemWidth + itemLength;

                    var pkgObj = {};
                    var pkgItems = new Array();
                    pkgItems.push(itemObj);
                    pkgObj['items'] = pkgItems;
                    pkgObj['currentVolume'] = itemVolume;
                    pkgObj['currentWeight'] = itemWeight;
                    pkgObj['currentLinearLength'] = itemLinearLength;
                    pkgObj['percentFull'] = itemVolume / itemVolume;
                    pkgObj['pkgDefIndex'] = -1;
                    pkgsArray.push(pkgObj);
                }
            }
        }
    }

    locObj['totalWeight'] = totalWeight;
    locObj['pkgsHTML'] = GenerateShippingCostHTML(pkgsArray);
    locObj['pkgsText'] = PkgsText;
}

function BSP_FedExBody(salesOrderID, locObj) {
    var timestamp = new Date();

    var totalWeight = 0;
    var packageCount = 0;
    var seqNumber = 1;
    var groupNumber = 1;
    var groupPkgCount = 1;
    var pkgItemSKU = '';
    var pkgItemName = '';
    var pkgItemQuantity = 0;
    var pkgItemDesc = '';

    var itemsArr = locObj['items'];
    var pkgsArr = locObj['pkgs'];
    //debugger;
    var locationName = locObj['name'];
    var locationPhone = locObj['phone'];
    var locationAddress1 = locObj['address1'];
    var locationAddress2 = locObj['address2'];
    var locationCity = locObj['city'];
    var locationState = locObj['state'];
    var locationZip = locObj['zip'];
    var locationCountry = locObj['country'];

    var shipToContact = nlapiGetFieldValue('shipattention');
    var shipToPhone = nlapiGetFieldValue('shipphone');
    var shipToAddress1 = nlapiGetFieldValue('shipaddr1');
    var shipToAddress2 = nlapiGetFieldValue('shipaddr2');
    var shipToCity = nlapiGetFieldValue('shipcity');
    var shipToState = nlapiGetFieldValue('shipstate');
    var shipToZip = nlapiGetFieldValue('shipzip');
    var shipToCountry = nlapiGetFieldValue('shipcountry');
    if (shipToCountry === 'GB') { shipToState = '' }

    var shipToResidential = '0';
    if (nlapiGetFieldValue('shipisresidential') == 'T') {
        shipToResidential = '1';
    }

    var soapBody = '';
    totalWeight = locObj['totalWeight'];
    if (totalWeight <= 0) {
        return soapBody;
    }

    packageCount = pkgsArr.length;

    soapBody += '<RequestedShipment>';
    soapBody += '<ShipTimestamp>' + timestamp.toISOString() + '</ShipTimestamp>';
    soapBody += '<DropoffType>' + DropoffType + '</DropoffType>';
    soapBody += '<TotalWeight>';
    soapBody += '<Units>LB</Units>';
    soapBody += '<Value>' + totalWeight.toFixed(2) + '</Value>';
    soapBody += '</TotalWeight>';
    soapBody += '<Shipper>';
    soapBody += '<Contact>';
    soapBody += '<CompanyName>' + locationName + '</CompanyName>';
    soapBody += '<PhoneNumber>' + locationPhone + '</PhoneNumber>';
    soapBody += '</Contact>';
    soapBody += '<Address>';
    soapBody += '<StreetLines>' + locationAddress1 + '</StreetLines>';
    soapBody += '<StreetLines>' + locationAddress2 + '</StreetLines>';
    soapBody += '<City>' + locationCity + '</City>';
    soapBody += '<StateOrProvinceCode>' + locationState + '</StateOrProvinceCode>';
    soapBody += '<PostalCode>' + locationZip + '</PostalCode>';
    soapBody += '<CountryCode>' + locationCountry + '</CountryCode>';
    soapBody += '</Address>';
    soapBody += '</Shipper>';
    soapBody += '<Recipient>';
    soapBody += '<Contact>';
    soapBody += '<PersonName>' + shipToContact + '</PersonName>';
    soapBody += '<PhoneNumber>' + shipToPhone + '</PhoneNumber>';
    soapBody += '</Contact>';
    soapBody += '<Address>';
    soapBody += '<StreetLines>' + shipToAddress1 + '</StreetLines>';
    soapBody += '<StreetLines>' + shipToAddress2 + '</StreetLines>';
    soapBody += '<City>' + shipToCity + '</City>';
    soapBody += '<StateOrProvinceCode>' + shipToState + '</StateOrProvinceCode>';
    soapBody += '<PostalCode>' + shipToZip + '</PostalCode>';
    soapBody += '<CountryCode>' + shipToCountry + '</CountryCode>';
    soapBody += '<Residential>' + shipToResidential + '</Residential>';
    soapBody += '</Address>';
    soapBody += '</Recipient>';
    soapBody += '<ShippingChargesPayment>';
    soapBody += '<PaymentType>' + Payment_Type + '</PaymentType>';
    soapBody += '<Payor>';
    soapBody += '<ResponsibleParty>';
    soapBody += '<AccountNumber>';
    soapBody += (FedEx_UseProd) ? FedEx_ProdAccountNumber : FedEx_TestAccountNumber;
    soapBody += '</AccountNumber>';
    soapBody += '</ResponsibleParty>';
    soapBody += '</Payor>';
    soapBody += '</ShippingChargesPayment>';
    soapBody += '<RateRequestTypes>' + RateRequestType + '</RateRequestTypes>';

    soapBody += '<PackageCount>' + packageCount.toString() + '</PackageCount>';

    var i = 0;
    for (i = 0; i < packageCount; i++) {
        var pkgObj = pkgsArr[i];
        var pkgWeight = pkgObj['currentWeight'];
        if (pkgWeight > 0) {
            soapBody += '<RequestedPackageLineItems>';

            seqNumber = i + 1;
            groupNumber = 1;
            groupPkgCount = 1;

            soapBody += '<SequenceNumber>' + seqNumber.toString() + '</SequenceNumber>';
            soapBody += '<GroupNumber>' + groupNumber.toString() + '</GroupNumber>';
            soapBody += '<GroupPackageCount>' + groupPkgCount.toString() + '</GroupPackageCount>';

            var pkgDefIndex = pkgObj['pkgDefIndex'];
            var pkgDef = {};
            if (pkgDefIndex < 0) {
                var itemsArr = pkgObj['items'];
                var itemObj2 = itemsArr[0];
                var itemHeight = itemObj2['height'];
                var itemLength = itemObj2['length'];
                var itemWidth = itemObj2['width'];

                pkgDef['id'] = 0;
                pkgDef['name'] = itemHeight.toString() + 'x' + itemLength.toString() + 'x' + itemWidth.toString();
                pkgDef['height'] = itemHeight;
                pkgDef['length'] = itemLength;
                pkgDef['width'] = itemWidth;
                pkgDef['dimUnits'] = 'IN';
                pkgDef['weightUnits'] = 'LB';
                pkgDef['maxWeight'] = MaxWeight;
                pkgDef['maxVolume'] = pkgDef['height'] * pkgDef['length'] * pkgDef['width'];
                pkgDef['maxLinearLength'] = pkgDef['height'] + pkgDef['length'] + pkgDef['width'];
            }
            else {
                pkgDef = PkgDefsArr[pkgDefIndex];
            }

            var pkgHeight = pkgDef['height'];
            var pkgWidth = pkgDef['width'];
            var pkgLength = pkgDef['length'];
            var pkgDimUnits = pkgDef['dimUnits'];
            var pkgWeightUnits = pkgDef['weightUnits'];

            soapBody += '<Weight>';
            soapBody += '<Units>' + pkgWeightUnits + '</Units>';
            soapBody += '<Value>' + pkgWeight.toFixed(2) + '</Value>';
            soapBody += '</Weight>';
            soapBody += '<Dimensions>';
            soapBody += '<Length>' + pkgLength.toFixed(0) + '</Length>';
            soapBody += '<Width>' + pkgWidth.toFixed(0) + '</Width>';
            soapBody += '<Height>' + pkgHeight.toFixed(0) + '</Height>';
            soapBody += '<Units>' + pkgDimUnits + '</Units>';
            soapBody += '</Dimensions>';

            var j = 0;
            var itemsArr = pkgObj['items'];
            for (j = 0; j < itemsArr.length; j++) {
                var itemObj = itemsArr[j];
                pkgItemQuantity = itemObj['quantity'];
                pkgItemName = itemObj['name'];
                pkgItemDesc = itemObj['desc'];
                pkgItemSKU = itemObj['upccode'];

                pkgItemName = pkgItemName.replace(/"/g, 'inch');
                pkgItemDesc = pkgItemDesc.replace(/"/g, 'inch');

                pkgItemName = pkgItemName.replace(/(\r\n|\n|\r)/g, '');
                pkgItemDesc = pkgItemDesc.replace(/(\r\n|\n|\r)/g, '');


                pkgItemName = pkgItemName.replace(/&amp;|&/g, "");
                pkgItemDesc = pkgItemDesc.replace(/&amp;|&/g, "");

                soapBody += '<ContentRecords>';
                soapBody += '<PartNumber>' + pkgItemSKU + '</PartNumber>';
                soapBody += '<ItemNumber>' + pkgItemName + '</ItemNumber>';
                soapBody += '<ReceivedQuantity>' + pkgItemQuantity.toString() + '</ReceivedQuantity>';
                soapBody += '<Description>' + pkgItemDesc + '</Description>';
                soapBody += '</ContentRecords>';
            }

            soapBody += '</RequestedPackageLineItems>';
        }
    }

    soapBody += '</RequestedShipment>';


    return soapBody;
}

function BSP_FedExSoapEnvelope(requestType, requestBody) {
    var soap = '';
    soap += '<?xml version="1.0" encoding="utf-8"?>\n';
    soap += '<SOAP-ENV:Envelope ';
    soap += 'xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" ';
    soap += 'xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" ';
    soap += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
    soap += 'xmlns:xsd="http://www.w3.org/2001/XMLSchema" ';
    soap += 'xmlns="http://fedex.com/ws/rate/v20" >';
    soap += '<SOAP-ENV:Body>';
    soap += '<' + requestType + '>';
    soap += requestBody;
    soap += '</' + requestType + '>';
    soap += '</SOAP-ENV:Body>';
    soap += '</SOAP-ENV:Envelope>';
    return soap;
}

function SelectShipMethod(shipMethod, shippingCost, itemLoc) {
    if ((ShipMethodsDic[shipMethod] == undefined) || (ShipMethodsDic[shipMethod] == null)) {
        alert('Shipping Method (' + shipMethod + ') not defined in NetSuite.');
    }
    else {
        var shipMethodObj = ShipMethodsDic[shipMethod];
        nlapiSetFieldValue('shipmethod', shipMethodObj['id']);

        var locObj = LocationsDic[itemLoc];
        locObj['shippingCost'] = shippingCost;

        //nlapiSetFieldValue('shippingcost', shipMethodObj['cost']);
    }
}

function GetRealTimeShippingRates() {
    //debugger;
    DefineShipMethods();

    var i = 0;
    var salesOrderID = 0;
    for (i = 0; i < LocationsArr.length; i++) {
        var divTest;
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];
        var shippingCost = BSP_FedExRequestRate(salesOrderID, locObj);
        if (shippingCost == 0) {
            //divTest = document.getElementById('custpage_bsp_divtest_fs');
            //divTest.innerHTML = FedExSoapMsgs;
        }
        //divTest = document.getElementById('custpage_bsp_divtest_fs');
        //divTest.innerHTML = FedExSoapMsgs;
        document.getElementById('bsp_shiprates-' + itemLoc.toString()).innerHTML = locObj['ratesHTML'];
    }

    ShowShippingRatesDialog(true);
    BS_Show_FedEx_Popup();
}

function GetSuggestedPackages(salesOrderID) {
    DefinePackages();
    ProcessLineItems(salesOrderID);

    var i = 0;
    for (i = 0; i < LocationsArr.length; i++) {
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];

        CalcPackages(salesOrderID, locObj);
    }
}

function BSP_UpdateShippingCost() {
    var i = 0;
    var totalShippingCost = 0;
    for (i = 0; i < LocationsArr.length; i++) {
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];
        var shippingCost = parseFloat(locObj['shippingCost']);
        //var hazmatShippingCost = locObj['hazmatShippingCost'];

        totalShippingCost += shippingCost; // + hazmatShippingCost;

        if (shippingCost == 0) {
            alert('Please select the Shipping Method for ' + locObj['name']);
            return;
        }
    }

    nlapiSetFieldValue('shippingcost', totalShippingCost.toFixed(2));
}

function ShowShippingRatesDialog(showDialog) {
    var i = 0;
    var dlgHTML = '';
    var tabHTML = '';
    var tabText = '';

    dlgHTML += '<div id="bsp_shippingCost_dialog" title="Estimated Shipping Cost" style="overflow: auto">';
    dlgHTML += '<div id="bsp_shippingCost_tabs">';

    dlgHTML += '<ul>';
    for (i = 0; i < LocationsArr.length; i++) {
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];
        dlgHTML += '<li><a href="#bsp_sc_tab-' + itemLoc.toString() + '">' + locObj['name'] + '</a></li>';
    }
    dlgHTML += '</ul>';

    nlapiSetFieldValue('custbody_bsp_pkgstext', '');
    nlapiSetFieldValue('custbody_bsp_pkgstext_wa', '');
    nlapiSetFieldValue('custbody_bsp_pkgstext_co', '');

    for (i = 0; i < LocationsArr.length; i++) {
        var itemLoc = LocationsArr[i];
        var locObj = LocationsDic[itemLoc];

        dlgHTML += '<div id="bsp_sc_tab-' + itemLoc.toString() + '">';
        dlgHTML += '<div id="bsp_shiprates-' + itemLoc.toString() + '">';
        dlgHTML += locObj['ratesHTML'];
        dlgHTML += '</div>';
        dlgHTML += '<h2>Suggested Packages Configuration:</h2><p>&nbsp;</p>';
        dlgHTML += locObj['pkgsHTML'];
        dlgHTML += '</div>';

        tabHTML += '<h2>' + locObj['name'] + '</h2><p>&nbsp;</p>';
        tabHTML += locObj['pkgsHTML'];
        tabHTML += '<p>&nbsp;</p>';

        tabText = '-----------------------------------------------------------------------------' + '\n';
        tabText += 'Location: [' + locObj['name'] + ']\n';
        tabText += '-----------------------------------------------------------------------------' + '\n\n';
        tabText += locObj['pkgsText'] + '\n';

        if (tabText.length < 1000000) {
            if (itemLoc == 1) {
                nlapiSetFieldValue('custbody_bsp_pkgstext', tabText);
            }
            else if (itemLoc == 2) {
                nlapiSetFieldValue('custbody_bsp_pkgstext_wa', tabText);
            }
            else if (itemLoc == 3) {
                nlapiSetFieldValue('custbody_bsp_pkgstext_co', tabText);
            }
        }
    }

    dlgHTML += '</div>';
    dlgHTML += '</div>';

    nlapiSetFieldValue('custpage_bsp_shippinghtml', dlgHTML);

    if ((OrderLinesHTML != null) && (OrderLinesHTML != undefined) && (OrderLinesHTML.length < 1000000)) {
        nlapiSetFieldValue('custbody_orderlines_html', OrderLinesHTML);
    }

    var pkgsJSON = JSON.stringify(LocationsDic);
    if ((tabHTML != null) && (tabHTML != undefined) && (tabHTML.length < 1000000) &&
        (pkgsJSON != null) && (pkgsJSON != undefined) && (pkgsJSON.length < 1000000)) {
        nlapiSetFieldValue('custbody_bsp_pkgshtml', tabHTML);
        nlapiSetFieldValue('custbody_bsp_pkgsjson', pkgsJSON);
    }
    else {
        if (showDialog) {
            alert('Warning: The number of packages exceeds the allowed limit.');
        }
    }

    if (showDialog) {
        var dlgWidth = '800px';
        var dlgLeft = '100px';
        var dlgTop = '200px';

        if ((ShippingCostDialog != undefined) && (ShippingCostDialog != null)) {
            dlgWidth = NS.jQuery('.ui-dialog').css('width');
            dlgLeft = NS.jQuery('.ui-dialog').css('left');
            dlgTop = NS.jQuery('.ui-dialog').css('top');
            ShippingCostDialog.dialog('close');
        }

        NS.jQuery('#bsp_shippingCost_tabs').tabs();

        ShippingCostDialog = NS.jQuery('#bsp_shippingCost_dialog').dialog({
            autoOpen: false, height: 450, width: 800, modal: false,
            buttons: {
                "Update Shipping Cost": function () {
                    BSP_UpdateShippingCost();
                },
                "Close": function () {
                    ShippingCostDialog.dialog('close');
                }
            }
        });
        ShippingCostDialog.dialog('open');
        NS.jQuery('.ui-dialog').css({ 'width': dlgWidth, 'left': dlgLeft, 'top': dlgTop });
        //NS.jQuery('.ui-dialog').css({ 'height': '400px', 'overflow': 'auto' });
        NS.jQuery('.ui-dialog').css({ 'font-family': 'Open Sans,Helvetica,sans-serif' });
        NS.jQuery('.ui-dialog').css({ 'font-size': '9pt' });
        NS.jQuery('.ui-widget-header').css({ 'background': '#607799', 'border': '1px solid #607799' });
    }
}

function BSP_UpdatePackages() {

    var i = 0;
    // Get Item Fulfillment Location
    var itemLoc = 0;
    var itemLocNum = 0;
    //itemLoc = nlapiGetLocation(); // Get User Location
    //if ((itemLoc == undefined) || (itemLoc == null) || (itemLoc == '')) {
    for (i = 1; i <= nlapiGetLineItemCount('item'); i++) {
        var itemType = nlapiGetLineItemValue('item', 'itemtype', i);
        if ((itemType == 'InvtPart') || (itemType == 'Kit') || (itemType == 'Assembly') || (itemType == 'NonInvtPart')) {
            var quantity = nlapiGetLineItemValue('item', 'quantity', i);
            var fulfill = nlapiGetLineItemValue('item', 'itemreceive', i);
            if ((fulfill != 'F') && (quantity > 0)) {
                itemLocNum = nlapiGetLineItemValue('item', 'location', i);
                break;
            }
        }
    }
    //}

    if (itemLocNum > 0) {
        itemLoc = Math.floor(itemLocNum);
        // Load Pkgs JSON
        var pkgsJSON = nlapiGetFieldValue('custbody_bsp_pkgsjson');
        if (pkgsJSON == '') {
            return;
        }

        var locDic = JSON.parse(pkgsJSON);

        // Lookup Pkgs for selected location
        var locObj = locDic[itemLoc];
        var pkgsArray = locObj['pkgs'];

        // Add Pkgs to Item Fulfillment
        var j = 0;
        var pkgCount = nlapiGetLineItemCount('packagefedex');
        for (j = 1; j <= pkgCount; j++) {
            nlapiRemoveLineItem('packagefedex', j);
        }

        for (i = 0; i < pkgsArray.length; i++) {
            var pkgObj = pkgsArray[i];
            var pkgHeight = +pkgObj['height'];
            var pkgWidth = +pkgObj['width'];
            var pkgLength = +pkgObj['length'];
            var pkgWeight = parseFloat(parseFloat(pkgObj['currentWeight']).toFixed(2));

            if (pkgWeight > 0) {
                nlapiSelectNewLineItem('packagefedex');
                nlapiSetCurrentLineItemValue('packagefedex', 'admpackagetypefedex', 1);
                nlapiSetCurrentLineItemValue('packagefedex', 'codfreighttypefedex', 'NET_CHARGE');
                nlapiSetCurrentLineItemValue('packagefedex', 'isalcoholfedex', 'F');
                nlapiSetCurrentLineItemValue('packagefedex', 'isnonhazlithiumfedex', 'F');
                nlapiSetCurrentLineItemValue('packagefedex', 'isnonstandardcontainerfedex', 'F');
                nlapiSetCurrentLineItemValue('packagefedex', 'packageheightfedex', pkgHeight);
                nlapiSetCurrentLineItemValue('packagefedex', 'packagelengthfedex', pkgLength);
                nlapiSetCurrentLineItemValue('packagefedex', 'packageweightfedex', pkgWeight);
                nlapiSetCurrentLineItemValue('packagefedex', 'packagewidthfedex', pkgWidth);
                nlapiSetCurrentLineItemValue('packagefedex', 'packagingfedex', 10);
                nlapiSetCurrentLineItemValue('packagefedex', 'priorityalerttypefedex', 'NONESELECTED');
                nlapiSetCurrentLineItemValue('packagefedex', 'signatureoptionsfedex', 4);
                nlapiSetCurrentLineItemValue('packagefedex', 'usecodfedex', 'F');
                nlapiSetCurrentLineItemValue('packagefedex', 'useinsuredvaluefedex', 'F');
                nlapiCommitLineItem('packagefedex');
            }
        }
    }
}

function BSP_FedExCalculateShipping(showDialog) {
    var salesOrderID = 0; //nlapiGetFieldValue('id');

    DefineShipMethods();

    var fedExShipMethod = false;
    var selectedShippingMethodId = nlapiGetFieldValue('shipmethod');
    for (var i = 0; i < ShipMethodsArr.length; i++) {
        var shipMethodObj = ShipMethodsArr[i];
        if (shipMethodObj['id'] == selectedShippingMethodId) {
            fedExShipMethod = true;
        }
    }

    if ((fedExShipMethod) || (showDialog)) {

        GetSuggestedPackages(salesOrderID);

        ShowShippingRatesDialog(showDialog);
        if (showDialog == true) {
            if (document.getElementById('bsp_shippingCost_dialog') !== null) {
                if (document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li').length) {
                    document.getElementById('bsp_shippingCost_dialog').parentElement.getElementsByTagName('li')[0].style.backgroundColor = 'white'
                }
            }
            BS_Show_FedEx_Popup();
        }
    }
    else {

        nlapiSetFieldValue('custbody_bsp_pkgstext', '');
        nlapiSetFieldValue('custbody_bsp_pkgstext_wa', '');
        nlapiSetFieldValue('custbody_bsp_pkgstext_co', '');
        nlapiSetFieldValue('custbody_bsp_pkgshtml', '');
        nlapiSetFieldValue('custbody_bsp_pkgsjson', '');
        nlapiSetFieldValue('custbody_orderlines_html', '');

        UpdateOrderLinesHTML();
    }

    //form.getField('custpage_bsp_shippinghtml').setDisplayType('hidden');
}

function fedEx_tracking_notification() {
    nlapiSetFieldValue('sendshipnotifyemailfedex', true);
}

function BSP_ItemFulfillmentPageInit(type) {

    // Set User Location
    BSP_SalesOrderPageInit(type);

    if (type == 'copy') {
        BSP_UpdatePackages();
    }
}


function BSP_SalesOrderBeforeLoad_Shipping(type, form) {
    if (type == 'create' || type == 'edit') {
        form.addButton('custpage_bsp_shippingfee', 'Estimate Shipping', 'BSP_FedExCalculateShipping(true)');
        form.addField('custpage_bsp_shippinghtml', 'inlinehtml', 'ShippingCostHTML');
        form.getField('custpage_bsp_shippinghtml').setDefaultValue('<div id="bsp_shippingCost_dialog" title="Estimated Shipping Cost"></div>');

        //form.addField('custpage_bsp_divtest', 'inlinehtml', 'ShippingResponseHTML');
        //form.getField('custpage_bsp_divtest').setDisplayType('inline');
    }
    else if (type == 'view') {
        //button added in   BSP_KB_FedExInterface.js
        //script deployed   loader-printProFormaInvoice.js
        //functions set in  action_printProFormaInvoice.js

        // var printProFormaInvoiceClicked = '';
        // printProFormaInvoiceClicked += "if (printProFormaInvoice) { try { printProFormaInvoice(); } catch(error) { console.error(error); alert('Could Not Print'); } }";
        // printProFormaInvoiceClicked += "else { alert('Failed to print. Contact netsuitehelp@kushbottles.com'); }; return false;";
        // form.addButton('custpage_print_proforma_invoice', 'Print Pro Forma Invoice', printProFormaInvoiceClicked);
        //picking ticket
        var onclickEvent = '';
        onclickEvent += "try {";
        onclickEvent += "var loc_id = nlapiGetLocation();\n";
        onclickEvent += "var status = nlapiGetFieldValue('status');\n";
        onclickEvent += "var location_payload = { name: nlapiLookupField('location', loc_id, 'name'), id : loc_id}; \n";
        onclickEvent += "var context = nlapiGetContext(); \n";
        onclickEvent += "var url = (context.environment === 'SANDBOX') ? 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c' : 'https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274&h=60378349ea77b5405c25';\n";
        onclickEvent += "var sales_order_id = nlapiGetRecordId();\n ";
        onclickEvent += "var request = { id: sales_order_id, location : location_payload, status : status}; \n";
        onclickEvent += "var data = { payload: JSON.stringify(request), action: 'print_picking_ticket' }; \n";
        onclickEvent += "var response = nlapiRequestURL(url, data, null, null, 'POST'); \n";
        onclickEvent += "} catch (error) { console.warn('FedEx_Interface onclickEvent Print Picking Ticket action caught'); console.error(error); }\n";
        onclickEvent += "show_preview(nlapiGetFieldValue('id'), true); return false;\n";
        form.addButton('custpage_bsp_pickingticket', 'Print Picking Ticket', onclickEvent);//OMFG
    }
}


function BSP_SalesOrderPageInit(type) {

    var currentContext = nlapiGetContext();
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    var locName = 'KB : Garden Grove, CA'; // Garden Grove Sandbox and Production

    if (execContext != 'webstore') {
        var location = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location"); // Garden Grove Sandbox and Production
        var currUser = currentContext.getUser();
        if ((currUser == undefined) || (currUser == null) || (currUser == '')) {
        }
        else {
            //var userLoc = nlapiLookupField('employee', currUser, 'location');
            var userLoc = nlapiGetLocation();
            if ((userLoc == undefined) || (userLoc == null) || (userLoc == '')) {
            }
            else {
                location = userLoc;
                var userRole = nlapiGetContext().getRole();
                if (userRole == 1006 || userRole == 1044) {
                    nlapiSetFieldDisabled('orderstatus', true);
                    nlapiSetFieldDisabled('salesrep', true);
                    nlapiSetFieldDisabled('terms', true);
                }
            }
        }
        locName = nlapiLookupField('location', location, 'name');
    }

    nlapiSetFieldValue('custbody_user_location', locName);
}


function BSP_UpdateWebOrderShippingCost() {

    var currentContext = nlapiGetContext();
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    if (execContext == 'webstore') {

        DefineShipMethods();

        var i = 0;
        var salesOrderID = 1;
        var totalShippingCost = 0;
        for (i = 0; i < LocationsArr.length; i++) {
            var itemLoc = LocationsArr[i];
            var locObj = LocationsDic[itemLoc];
            var shippingCost = BSP_FedExRequestRate(salesOrderID, locObj);
            //var shippingCost = parseFloat(locObj['shippingCost']);

            totalShippingCost += shippingCost;
        }

        totalShippingCost = parseFloat(totalShippingCost.toFixed(2));
        var currShippingCost = nlapiGetFieldValue('shippingcost');
        var currTotal = nlapiGetFieldValue('total');
        var shippingCostDiff = currShippingCost - totalShippingCost;
        var newTotal = currTotal - shippingCostDiff;
        nlapiSetFieldValue('shippingcost', totalShippingCost.toFixed(2));
        nlapiSetFieldValue('total', newTotal.toFixed(2));
        UpdateOrderLinesHTML();
    }
}

function DN_createOrderLocalPickupHTML() {
    var isLocalPickup = nlapiGetFieldText('shipmethod').indexOf("Local Pickup") > - 1 ? true : false;
    var pickupHTML = "<br/> <p style='padding-right: 20px; padding-bottom: 0px !important; margin-bottom: 0px !important;'> We will send you a confirmation email once your order is ready for pickup.  Orders may take up to 24 hours to prepare. </p>"
    if (isLocalPickup) {
        nlapiSetFieldValue("custbody_localpickuphtml", pickupHTML);
    } else {
        nlapiSetFieldValue("custbody_localpickuphtml", "");
    }

}

/*
* Context:
* The priority of shipping, as defined by the warehouse team.  The value of this field is determined by the Shipping Method.
*   Values are either:  Expedited, Ground, Freight, Will Call, Delivery.
* Instead of 20 different "Ship Via" aka "shipmethod" to select from, we created this list to reclassify those ship methods.
*   This list is intended to make filtering and organizing shipping methods a lot easier in dashboards and searches.
*
* Ground: FedEx Ground, FedEx Home Delivery, and Free Shipping Ground
* Will Call:  All Local Pickups
* Delivery:  Local Delivery and Special Order
* Freight:  Freight/Other
* Expedited:  Everything else
*
* custbody_shipping_priority    https://system.na2.netsuite.com/app/common/custom/bodycustfield.nl?id=2420&e=T
* customlist_shipping_priority  https://system.na2.netsuite.com/app/common/custom/custlist.nl?id=343&e=T&ord=T
*
* shipitem record               https://system.na2.netsuite.com/app/common/item/shipitems.nl?whence=
* */
function DT_set_shippingpriority() {
    //define
    var shipitem_MAP = defineMap_shipitem();
    var shipping_priority_MAP = defineMap_shipping_priority();

    //get
    var SHIPMETHOD = nlapiGetFieldValue('shipmethod');
    var DESCRIPTION = shipitem_MAP[SHIPMETHOD];
    // var description = getDescriptionOf_shipitem(SHIPMETHOD);

    //set
    var shipping_priority = shipping_priority_MAP[DESCRIPTION] || "6";
    nlapiSetFieldValue('custbody_shipping_priority', shipping_priority);

    /** returns an object thats a lookup table of shipmethod(internalid):custbody_shipping_priority(text) */
    function defineMap_shipitem() {
        //UPDATE THIS SHIPPING METHOD TABLE whenever you create a new shipping item in NetSuite
        return {
            37: "GROUND",
            38: "EXPEDITED",
            39: "EXPEDITED",
            40: "GROUND",
            41: "GROUND",
            42: "WILL CALL",
            4364: "WILL CALL",
            4365: "WILL CALL",
            4774: "FREIGHT",
            4775: "EXPEDITED",
            4776: "EXPEDITED",
            5209: "DELIVERY",
            5230: "EXPEDITED",
            5266: "EXPEDITED",
            5382: "OTHER",
            6646: "WILL CALL",
            7987: "GROUND",
            8142: "EXPEDITED",
            8255: "EXPEDITED",
            10694: "WILL CALL",
            12359: "DELIVERY",
            12509: "GROUND",
            12523: "EXPEDITED",
            12524: "EXPEDITED",
            12525: "EXPEDITED",
            12526: "EXPEDITED",
            12527: "EXPEDITED",
            12528: "EXPEDITED",
            14626: "WILL CALL",
            14646: "FREIGHT",
            14703: "WILL CALL"
        }
    }
    /** returns an object thats a lookup table of custbody_shipping_priority(text):customlist_shipping_priority(internalid) */
    function defineMap_shipping_priority() {
        return {
            EXPEDITED: "1",
            GROUND: "2",
            FREIGHT: "3",
            "WILL CALL": "4",
            DELIVERY: "5",
            OTHER: "6"
        }
    }
}

function BSP_SalesOrderBeforeSubmit_Shipping(type) {

    try {
        var context = nlapiGetContext();
        if ((context.getExecutionContext() == 'csvimport')) {
            return;
        }
    } catch (e) {
        //
    }


    if ((type == 'create') || (type == 'edit')) {
        BSP_FedExCalculateShipping(false);
        BSP_UpdateWebOrderShippingCost();
        DN_createOrderLocalPickupHTML();
    }
    DT_set_shippingpriority();

}