/* eslint-disable quotes */
function generate(request, response)
{
    var type = request.getMethod();
    if (type == "GET") {
        var action = request.getParameter("action") || "";
        var id = request.getParameter('id');
        if (action == "clearSOW") {
            clearSOW(id);
            response.write("success");
        } else {
            var template;
            var estimate = false;
            var project = nlapiLoadRecord("job", id);
            var projectId = project.getFieldValue("entityid").split(" ")[0];
            var customer = nlapiLoadRecord("customer", project.getFieldValue("parent"));
            var estimateId = project.getFieldValue("custentity_pm_estimate_record");
            var salesOrderId = project.getFieldValue("custentity_pm_sales_order_record");
            var designTime = grabDesignHours(project);
            var designRate = 100;
            var designCost = designTime * designRate;

            if (salesOrderId) {
                estimate = nlapiLoadRecord("salesorder", salesOrderId); //random estimate to work off of
            } else if (estimateId) {
                estimate = nlapiLoadRecord("estimate", estimateId); //random estimate to work off of
            }

            var today = getDate();

            var renderer = nlapiCreateTemplateRenderer();
            //var foundImages = getImages(id); TODO: temp disabled - 5/30/2018 until further notice
            var imgUrl = "https://system.na2.netsuite.com/c.4516274/images/ksclogo.png";
            var header = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'+
            '<pdf>'+
                '<head>'+
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
            var page1 = '<body>'+
            
                '<div style="width: 100%;">'+
                    '<p align="right">'+
                        today + "<br/>"+
                        '${project.companyname} <br/>'+
                        projectId +
                    '</p>'+
                '</div>'+
        
                '<img width="40%" height="40%" vertical-align="center" align="center" src="https://system.na2.netsuite.com/c.4516274/images/ksclogobottom.png"/>'+
                
                // '<div>'+
                //     '<p>${companyInformation.mainaddress_text}</p>'+
                // '</div>'+ 
                '<p></p>'+    
                '<p></p>'+               
                '<p></p>'+  
                '<p></p>'+    
                '<p></p>'+               
                '<p></p>'+        
                '<div>'+
                '<h2 align="center">Summary</h2>'+
                '<table width="100%" style="margin-left: -7px; margin-right: -7px;">'+
                    // '<tr>'+
                    //     '<td style="align: center;">${customer.defaultaddress}</td>'+
                    //     '<td style="align: center;">Kush Supply Co. LLC <br/> ${companyInformation.mainaddress_text}</td>'+
                    // '</tr>'+
                    // '<tr>'+
                    //     '<td style="align: center;">${customer.defaultaddress}</td>'+
                    //     '<td style="align: center;">Kush Supply Co. LLC <br/> ${companyInformation.mainaddress_text}</td>'+
                    // '</tr>'+
                    '<tr>'+
                        '<td align="right">Customer Address:</td>'+
                        '<td>${estimate.billaddress}</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right">Company Address:</td>'+
                        '<td>Kush Supply Co. LLC <br/> ${companyInformation.mainaddress_text}</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right">Kush Supply Co. LLC Sales Rep:</td>'+
                        '<td>${project.custentity_pm_tsm}</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right">Project Manager:</td>'+
                        '<td>${project.custentity_pm_project_manager}</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right">Project Type:</td>'+
                        '<td>${project.jobtype}</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right">Project Product:</td>'+
                        '<td>${project.custentitypm_product}</td>'+
                    '</tr>'+
                '</table>'+
                // '<p>${companyInformation.mainaddress_text}</p>'+
                // '<p>${customer.defaultaddress}</p>'+
                // '<div style="page-break-before:always">&nbsp;</div>'+
                // '<img vertical-align="center" align="center" src="https://system.na2.netsuite.com/core/media/media.nl?id=566763&amp;c=4516274&amp;h=ca69405e6b66ad79397c"/>'+
                 
                
                // '<img vertical-align="center" align="center" src="https://system.na2.netsuite.com/core/media/media.nl?id=521912&amp;c=4516274&amp;h=87e5e3d048629665a640"/>'+
                //'<img vertical-align="center" align="center" src="https://system.na2.netsuite.com/core/media/media.nl?id=566777&amp;c=4516274&amp;h=58943ef15775246b5db8"/>'+
                
                // '<div style="page-break-before:always">&nbsp;</div>'+ 
                // '<img vertical-align="center" align="center" src="https://system.na2.netsuite.com/core/media/media.nl?id=566770&amp;c=4516274&hamp;=e7202e8ab34eeeddd6d3"/>'+
                 
                '</div>'+
                '';
                    
            var page2 = '<div style="page-break-before:always">&nbsp;</div>'+
                
                '<div style="width: 100%;">'+
                    '<img align="left" width="200px" height="50px" style="position: absolute;" src="'+ imgUrl +'"></img>'+
                    '<p align="right">'+
                        today + "<br/>"+
                        '${project.companyname} <br/>'+
                        projectId +
                    '</p>'+
                '</div>';
        
            var page3 = '<div style="page-break-before:always">&nbsp;</div>'+

                '<table class="header" style="width: 100%;font-size: 9pt">'+
                    '<tr>'+
                        '<td style="padding: 0px 0px 0px 5px;">'+
                            '<img align="left" width="200px" height="50px" src="'+ imgUrl +'" style="position: absolute;"></img>'+
                            '<p style="position: absolute; top: 50;">${companyInformation.mainaddress_text}</p>'+
                        '</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right" style="padding: 0;"><span style="font-size: 16pt;">#${estimate.tranid}</span></td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right" style="padding: 0;"><span style="font-size: 12pt;">Customer: <b>${estimate.entity}</b></span></td>'+
                    '</tr>'+
                    '<tr>'+
                        '<td align="right" style="padding: 0;"><span>Date: ${estimate.trandate}</span></td>'+
                    '</tr>'+
                '</table>'+
        
                '<table style="width: 100%; margin-top: 10px; padding-top: 40px;">'+
                    '<tr>'+
                        '<td class="addressheader" colspan="6"><b>${estimate.billaddress@label}</b></td>'+
                        '<td class="totalboxtop" colspan="5"><b>${estimate.total@label?upper_case}</b></td>'+
                    '</tr>'+
                    '<tr>'+
                    '<td class="address" colspan="6" rowspan="2">${estimate.billaddress}</td>'+
                    '<td align="right" class="totalboxmid" colspan="5">${estimate.total}</td>'+
                    '</tr>'+
                    '<tr>'+
                    '<td align="right" class="totalboxbot" colspan="5"><b>${estimate.duedate@label}</b> ${estimate.duedate}</td>'+
                    '</tr>'+
                '</table>'+
            
                '<table class="body" style="width: 100%; margin-top: 10px;">'+
                    '<tr>'+
                        '<th>${estimate.duedate@label}</th>'+
                        '<th>${estimate.salesrep@label}</th>'+
                        '<th>${estimate.shipmethod@label}</th>'+
                        '<#if estimate.fob?has_content><th>${estimate.fob@label}</th></#if>'+
                    '</tr>'+
                    '<tr>'+
                        '<td>${estimate.duedate}</td>'+
                        '<td>${estimate.salesrep}</td>'+
                        '<td>${estimate.shipmethod}</td>'+
                        '<#if estimate.fob?has_content><td>${estimate.fob}</td></#if>'+
                    '</tr>'+
                '</table>'+
                '<#if estimate.item?has_content>'+
                    '<table class="itemtable" style="width: 100%; margin-top: 10px;"><!-- start items --><#list estimate.item as item><#if item_index==0>'+
                        '<thead>'+
                            '<tr>'+
                                '<th align="center" colspan="3">${item.quantity@label}</th>'+
                                '<th colspan="12">${item.item@label}</th>'+
                                '<th colspan="1">${item.istaxable@label}</th>'+
                                '<th align="right" colspan="4">${item.rate@label}</th>'+
                                '<th align="right" colspan="4">${item.amount@label}</th>'+
                            '</tr>'+
                        '</thead>'+
                        '</#if><tr>'+
                            '<td align="center" colspan="3" line-height="150%">${item.quantity}</td>'+
                            '<td colspan="12"><!--<span class="itemname">${item.item}</span>-->${item.description}</td>'+
                            '<td colspan="1">${item.istaxable}</td>'+
                            '<td align="right" colspan="4">${item.rate?string["0.00##"]}</td>'+
                            '<td align="right" colspan="4">${item.amount}</td>'+
                        '</tr>'+
                        '</#list><!-- end items --></table>'+
            
                '<hr /></#if>'+
                    '<table class="total" style="width: 100%; margin-top: 10px;"><tr>'+
                        '<td colspan="4">&nbsp;</td>'+
                        '<td align="right"><b>${estimate.subtotal@label}</b></td>'+
                        '<td align="right">${estimate.subtotal}</td>'+
                    '</tr>'+
                    '<#if estimate.shippingcost?has_content>'+
                        '<tr>'+
                            '<td colspan="4">&nbsp;</td>'+
                            '<td align="right"><b>${estimate.shippingcost@label}</b></td>'+
                            '<td align="right">${estimate.shippingcost}</td>'+
                        '</tr>'+
                    '</#if>'+
                    '<#if estimate.discounttotal != 0.00>'+
                        '<tr>'+
                            '<td colspan="4">&nbsp;</td>'+
                            '<td align="right" style="font-weight: bold; color: #333333;">Discount</td>'+
                            '<td align="right">${estimate.discounttotal}</td>'+
                        '</tr>'+
                    '</#if>'+
                    '<tr>'+
                        '<td colspan="4">&nbsp;</td>'+
                        '<td align="right"><b>${estimate.taxtotal@label} (${estimate.taxrate}%)</b></td>'+
                        '<td align="right">${estimate.taxtotal}</td>'+
                    '</tr>'+
                    '<tr class="totalrow">'+
                        '<td background-color="#ffffff" colspan="4">&nbsp;</td>'+
                        '<td align="right"><b>${estimate.total@label}</b></td>'+
                        '<td align="right">${estimate.total}</td>'+
                    '</tr> </table>';
            var page4 = '<div style="page-break-before:always">&nbsp;</div>'+
                '<div style="width: 100%;">'+
                    '<img width="15%" height="15%" style="position: absolute; left: 185;" src="https://system.na2.netsuite.com/c.4516274/images/ksclogobottom.png"/>'+
                    '<p align="right" width="250px">'+
                        today + "<br/>"+
                        '${project.companyname} <br/>'+
                        projectId +
                    '</p>'+
                '</div>'+
                //'<img width="25%" height="25%" align="center" src="https://system.na2.netsuite.com/c.4516274/images/KushBottles-LogosBottom.png"/>'+
                '<p align="center" style="font-size: 12px; margin: 0px; font-weight: bold; text-decoration: underline;">BASIC PURCHASE ORDER TERMS AND CONDITIONS</p>'+
                '<p class="terms">'+ 
                    'The undersigned (“Customer”) agrees to the following terms and conditions of acceptance and payment for all goods and services provided (including any Schedules and Exhibits attached hereto) (the “Agreement”) by KUSH SUPPLY CO. LLC, a Nevada limited liability company and its respective subsidiaries and affiliates (collectively, the “Company”). Customer shall purchase the goods and services from Company at the prices set forth on the purchase order (the “Purchase Order”) attached hereto. The Company shall provide to Customer a final rendering (the “Master Proof”) of the design of the goods pursuant to the Purchase Order.<br/>'+
                '</p>'+
                '<p align="center" style="font-size: 12px; margin: 0px; font-weight: bold; text-decoration: underline;">PAYMENT TERMS</p>'+
                '<p class="terms">'+ 
                    '<b>Payment: </b>'+
                    'Customer shall make payment in full in United States Dollars to the Company. Unless otherwise specified herein, Customer shall make all payments hereunder by wire transfer, personal check, cashier’s check or as otherwise agreed to by the Company.  <br/><br/>'+
                    '<b>Deposit: </b>'+
                    'Customer shall pay a deposit, if any, as set forth on the written notice from a Company representative which shall be equal to a percentage of the total amount due pursuant to the Purchase Order. Customer shall pay, and Company shall receive, the remaining balance of the total amount due pursuant to the Purchase Order prior to any shipment of the products identified on the Purchase Order.<br/><br/>'+
                    '<b>Shipping Costs: </b>'+
                    'Shipping charges are additional and are shown on the Purchase Order as estimates only and are subject to change without prior notice.<br/><br/>'+
                    '<b>Taxes: </b>'+
                    'All prices set forth on the Purchase Order are exclusive of, and Customer is solely responsible for, and shall pay, and shall hold Company harmless from, all taxes, with respect to, or measured by, the manufacture, sale, shipment, use or price of the goods and services (including interest and penalties thereon). Any orders delivered are taxable unless the Company receives a copy of your signed resale certificate. Taxable orders will be taxed at the current rate for Orange County, California regardless of their ultimate destination.<br/><br/>'+
                    '<b>Customs/Tariffs Charges: </b>'+
                    'All prices set forth on the Purchase Order are exclusive of certain reasonable tariff and variable tariff and customs costs, which may be charged (in whole or in part) to Customer at Company’s sole discretion unless otherwise agreed upon in writing. <br/><br/>'+
                    '<b>Late Payment: </b>'+
                    'Customer shall pay interest on all late payments at the lesser of the rate of 5% per month or the highest rate permissible under applicable law, calculated daily and compounded monthly. Customer shall reimburse the Company for all costs incurred in collecting any late payments, including, without limitation, attorneys\' fees. The Company may, in its sole discretion, without liability or penalty, cancel any Purchase Order, if the Company determines that the Customer is in violation of its payment obligations or is in breach of this Agreement.  <br/>'+
                '</p>'+    
                '<p align="center" style="font-size: 12px; margin: 0px; font-weight: bold; text-decoration: underline;">DESIGN/PRINTING</p>'+
                '<p class="terms">'+
                    '<b>Customer Intellectual Property: </b>'+
                    'The Customer may provide the Company with certain trademarks, trade names, trade labels, trade dress, packaging and other intellectual property trademarked and/or copyrighted materials of the Customer (the “Customer Intellectual Property”), which shall remain the property of Customer.  Customer represents, warrants and covenants to Company that Customer owns all right, title, and interest in, or otherwise has full right and authority to permit the use of the Customer Intellectual Property and to the best of Customer’s knowledge, the Customer Intellectual Property does not infringe the rights of any third party, and use of the Customer Intellectual Property does not and will not violate the rights of any third parties.  Customer hereby grants to Company a non-exclusive, non-transferable license to use, reproduce, and modify the Customer Intellectual Property in connection with Company’s performance of any design and/or services or production of any goods pursuant to this Agreement.  <br/><br/>'+
                    '<b>Third Party Materials: </b>'+
                    'All third-party materials provided to the Company or the Customer shall remain the exclusive property of their respective owners. The Company may inform Customer of third-party materials that may be incorporated into any design or goods or services pursuant to this Agreement. Under such circumstances, the Customer may be required to execute any and all applicable licenses or agreements in order to utilize such third-party materials.  <br/><br/>'+
                    '<b>Artwork Accuracy: </b>'+
                    'The Master Proof is used to produce the tooling and set-up for the Customer’s project.  The Company will use commercially reasonable efforts to incorporate all information furnished by the Customer with regard to size, feature location, artwork, colors, and other pertinent data applicable to the Customer’s project. The Master Proof supersedes all prior proof versions, emails, verbal directions, digital files, and any other written or verbal communications pertaining to the design of the goods.<br/><br/>'+
                    '<b>Errors and Omissions: </b>'+
                    'It is the Customer’s responsibility to review and approve all information on the Master Proof, including without limitation, artwork, type, plate count, material specifications and die line features.  Any barcodes generated must be verified by the Customer. If applicable, the Company can only confirm that the barcode provided by the Customer scans and cannot confirm the accuracy or registration status of such barcode.  In no event shall the Company be responsible for the adherence to regulations set forth by third-party agencies regarding product claims, editorial content and graphic design.<br/><br/>'+
                    '<b>Color Matching: </b>'+
                    'The Master Proof will represent approximated process and/or spot colors via inkjet print on paper stock or via red-green-blue pixels on a monitor. Cyan-magenta-yellow-black printing may produce minor color variations. To specify a color match document other than the Master Proof, please inform the Company in writing. Pantone Matching System (“PMS”) colors printed on film may look different than PMS colors printed on paper stock. White ink is not opaque. Ergo, the color represented on the Master Proof may differ from actual ink on film. Material film and lamination can also impact the final printed color. The Master Proof is not for color matching.  At Customer’s request, the Company, in its sole and absolute discretion, may provide the Customer with press proof at an additional charge to Customer.<br/><br/>'+
                    '<b>Production Tolerance: </b>'+
                    'Dimensions and feature location of the print on the goods may vary by +/- 1/16 of an inch. <br/><br/>'+
                    '<b>Prototypes, Drawings, Tooling and Fixtures: </b>'+
                    'All designs, drawings, renderings and blueprints are the exclusive property of the Company. Subject to and conditioned upon full payment of all fees, costs and out-of-pocket expenses due to the Company pursuant to this Agreement, the Company may upon written notice assign to Customer joint ownership rights, including any copyrights or intellectual property, in and to any artworks or designs created by Company for use by Customer. <br/><br/>'+
                    '<b>Changes: </b>'+
                    'Any changes to the design of goods or scope of services pursuant to this Agreement are subject to the Company’s acceptance and may result in price changes and/or loss of lead time and may be billed at a minimum of 30 minutes per iteration. If the Master Proof contains any misinformation and/or if there is information missing, please make a note on the Master Proof and indicate ‘not approved’.<br/>'+
                '</p>'+
                '<p align="center" style="font-size: 12px; margin: 0px; font-weight: bold; text-decoration: underline;">TIMING AND SHIPMENT</p>'+
                '<p class="terms">'+ 
                    '<b>Production Time: </b>'+
                    'Production times are estimates and may vary depending on seasonality, holidays and other factors outside the Company’s control.  Please note, the Company will not commence production of any goods or services until the Company receives an executed copy of this Agreement, written approval of the Master Proof and any deposit required herein. <br/><br/>'+
                    '<b>Shipment: </b>'+
                    'Shipping dates provided by the Company to the Customer are estimates only. The Company is not responsible for any delays, loss or damage that occurs during shipping. The Company is not liable for delays or product seizures by U.S. Customs and Border Protection or any related government entity.  <br/><br/>'+
                    '<b>Partial Shipment or Non-Delivery: </b>'+
                    'The Company may, in its sole discretion, without liability or penalty, make partial shipments of goods to Customer. Each shipment will constitute a separate sale, and Customer shall pay for the units shipped whether such shipment is in whole or partial fulfilment of a Purchase Order. The quantity of any installment of goods as recorded by the Company on dispatch from the Company’s place of business is conclusive evidence of the quantity received by the Customer on delivery unless the Customer can provide conclusive evidence proving the contrary. The Company shall not be liable for any non-delivery of any goods or services pursuant to the Purchase Order (even if caused by the Company’s negligence) unless Customer gives written notice to the Company of the non-delivery within five (5) calendar days of the date when such goods or services pursuant to the Purchase Order would in the ordinary course of events have been received. Any liability of the Company, and the Customer’s sole remedy therefor, for non-delivery of the goods or services pursuant to the Purchase Order shall be limited to Company delivering such goods and/or services within a reasonable time or adjusting the Purchase Order respecting such goods or services to reflect the actual quantity delivered.<br/><br/>'+
                    '<b>Title and Risk of Loss: </b>'+
                    'Title and risk of loss to all goods ordered by the Customer from the Company shall pass to Customer upon tendering of the goods to the applicable carrier at the Company’s facility. As collateral security for the payment of the purchase price of the goods, Customer hereby grants to the Company a lien on and security interest in and to all of the right, title and interest of Customer in, to and under the goods, wherever located, and whether now existing or hereafter arising or acquired from time to time, and in all accessions thereto and replacements or modifications thereof, as well as all proceeds (including insurance proceeds) of the foregoing.  The security interest granted under this provision constitutes a purchase money security interest under the California Uniform Commercial Code.<br/><br/>'+
                    '<b>Quantity: </b>'+
                    'If the Company delivers to the Customer a quantity of goods of up to 10% more or less than the quantity set forth on the Purchase Order, Customer shall not be entitled to object to or reject such goods or any portion of them by reason of the surplus or shortfall and shall pay for such goods for the price set forth on the Purchase Order adjusted pro rata.<br/>'+
                '</p>'+
                '<p align="center" style="font-size: 12px; margin: 0px; font-weight: bold; text-decoration: underline;">MISCELLANEOUS</p>'+
                '<p class="terms">'+  
                    '<b>Limited Warranties: </b>'+
                    '<b>THE COMPANY MAKES NO WARRANTY WHATSOEVER, EXPRESS OR IMPLIED WITH RESPECT TO THE GOODS AND ANY SERVICES PROVIDED HEREIN, INCLUDING ANY (A) WARRANTY OF MERCHANTABILITY; (B) WARRANTY OF FITNESS FOR A PARTICULAR PURPOSE; (C) WARRANTY OF TITLE; (D) WARRANTY AGAINST INFRINGEMENT OF INTELLECTUAL PROPERTY RIGHTS OF A THIRD PARTY; WHETHER EXPRESS OR IMPLIED BY LAW, COURSE OF DEALING, COURSE OF PERFORMANCE, USAGE OF TRADE OR OTHERWISE; OR (D) ANY CHANGES IN APPLICABLE LAW.</b> <br/><br/>'+
                    '<b>Limitation of Liability: </b>'+
                    '<b>IN NO EVENT SHALL THE COMPANY BE LIABLE FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR ENHANCED DAMAGES, LOST PROFITS OR REVENUES OR DIMINUTION IN VALUE, ARISING OUT OF, OR RELATING TO, OR IN CONNECTION WITH ANY BREACH OF THIS AGREEMENT, REGARDLESS OF (A) WHETHER SUCH DAMAGES WERE FORESEEABLE, (B) WHETHER OR NOT THE COMPANY WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, (C) THE LEGAL OR EQUITABLE THEORY (CONTRACT, TORT OR OTHERWISE) UPON WHICH THE CLAIM IS BASED, AND (D) THE FAILURE OF ANY AGREED OR OTHER REMEDY OF ITS ESSENTIAL PURPOSE.  IN NO EVENT SHALL THE COMPANY’S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, WHETHER ARISING OUT OF OR RELATED TO BREACH OF CONTRACT, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, EXCEED THE TOTAL OF THE AMOUNTS PAID TO THE COMPANY FOR THE PRODUCTS AND SERVICES SOLD HEREUNDER.</b><br/><br/>'+
                    '<b>Compliance: </b>'+
                    '<b>THE CONTENTS OF THE MASTER PROOF, DESIGN, DRAWINGS OR RENDERINGS ARE FOR INFORMATIONAL PURPOSES ONLY AND NOT FOR THE PURPOSE OF PROVIDING ANY LEGAL ADVICE.  CUSTOMER SHOULD CONTACT THE CUSTOMER’S ATTORNEY TO OBTAIN ADVICE WITH RESPECT TO ANY QUESTION, ISSUE OR PROBLEM, INCLUDING WITHOUT LIMITATION, ANY COMPLIANCE INQUIRY. THE COMPANY CANNOT GUARANTEE THE CURRENT STATUS, ACCURACY AND COMPLETENESS OF ANY COMPLIANCE RELATED ISSUE IN CONNECTION WITH THE GOODS OR SERVICES SET FORTH HEREIN OR ANY INQUIRES OR QUESTIONS RELATED THEREIN.  USE OF AND ACCESS TO THE MASTER PROOF OR ANY LINKS CONTAINED HEREIN DO NOT CREATE AN ATTORNEY-CLIENT RELATIONSHIP. THE COMPANY DOES NOT REPRESENT OR WARRANT THAT ANY DESIGNS, DRAWINGS, RENDERINGS OR PHYSICAL GOODS OR SERVICES PURCHASED ARE COMPLIANT WITH APPLICABLE LAW.</b><br/><br/>'+
                    '<b>Compliance with Law: </b>'+
                    'Customer affirms that it is in compliance with and shall comply with all applicable laws, regulations and ordinances, including compliance and cooperation with IRS Form 8300, Report of Cash Payments Over $10,000 Received in a Trade or Business. The Customer expressly consents to the Company filing all applicable IRS documents, including without limitation IRS Form 8300, with regard to this Purchase Order or any future Purchase Orders. Customer has and shall maintain in effect all the licenses, permissions, authorizations, consents and permits that it needs to carry out its obligations under this agreement.<br/><br/>'+
                    '<b>Choice of Law: </b>'+
                    'This Agreement, including all exhibits, schedules, attachments and appendices attached hereto and all matters arising out of or relating to this Agreement, are governed by, and construed in accordance with, the laws of the State of California, without regard to the conflict of laws provisions thereof to the extent such principles or rules would require or permit the application of the laws of any jurisdiction other than those of the State of California.<br/><br/>'+
                    '<b>Choice of Forum: </b>'+
                    'Each party irrevocably and unconditionally agrees that it will not commence any action, litigation or proceeding of any kind whatsoever against the other party in any way arising from or relating to this Agreement, including all exhibits, schedules, attachments and appendices attached to this Agreement, in any forum other than the courts of the State of California sitting in Orange County, and any appellate court from any thereof. Each party irrevocably and unconditionally submits to the exclusive jurisdiction of such courts and agrees to bring any such action, litigation or proceeding only in the courts of the State of California sitting in Orange County, California.  Each party agrees that a final judgment in any such action, litigation or proceeding is conclusive and may be enforced in other jurisdictions by suit on the judgment or in any other manner provided by law.<br/><br/>'+
                    '<b>WAIVER OF JURY TRIAL: </b>'+
                    '<b>EACH PARTY ACKNOWLEDGES AND AGREES THAT ANY CONTROVERSY THAT MAY ARISE UNDER THIS AGREEMENT, INCLUDING EXHIBITS, SCHEDULES, ATTACHMENTS AND APPENDICES ATTACHED TO THIS AGREEMENT, IS LIKELY TO INVOLVE COMPLICATED AND DIFFICULT ISSUES AND, THEREFORE, EACH SUCH PARTY IRREVOCABLY AND UNCONDITIONALLY WAIVES ANY RIGHT IT MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY LEGAL ACTION ARISING OUT OF OR RELATING TO THIS AGREEMENT, INCLUDING ANY EXHIBITS, SCHEDULES, ATTACHMENTS OR APPENDICES ATTACHED TO THIS AGREEMENT, ANY PURCHASE ORDERS ACCEPTED BY SELLER OR THE TRANSACTIONS CONTEMPLATED HEREBY.</b><br/><br/>'+
                    '<b>Indemnification: </b>'+
                    'Customer shall indemnify, defend and hold harmless the Company and its officers, directors, employees, agents, affiliates, parent, subsidiary, successors and permitted assigns (collectively, "Indemnified Party") against any and all losses, damages, liabilities, deficiencies, claims, actions, judgments, settlements, interest, awards, penalties, fines, costs, or expenses of whatever kind, including attorneys\' fees, fees and the costs of enforcing any right to indemnification under this Agreement, including without limitation  any goods or services set forth in the Purchase Order, and the cost of pursuing any insurance providers, incurred by Indemnified Party, relating to or resulting from any claim of a third party or arising out of or occurring in connection with this Agreement and/or the goods and services set forth in the Purchase Order from the Company or Customer’s negligence, willful misconduct or breach of this Agreement.  Customer shall not enter into any settlement without the Company or Indemnified Party\'s prior written consent.<br/><br/>'+
                    '<b>Relationship of the Parties: </b>'+
                    'Company is an independent contractor and not an employee of Customer or any company affiliated with Customer. Company may provide certain services to Customer and under the general direction of Customer pursuant to this Agreement, but Company shall determine the manner and means by which such services are accomplished. In no event shall this Agreement create a partnership or joint venture, and neither Company or Customer is authorized to act as agent or bind the other party, except as expressly stated in this Agreement. Company and any goods or services (including any custom design work) prepared by Company shall not be deemed a work for hire as that term is defined under copyright law. All rights, if any, granted to Customer are contractual in nature and are wholly defined by the express written agreement of the Company and Customer and the various terms and conditions of this Agreement.<br/><br/>'+
                    '<b>No Exclusivity: </b>'+
                    'Customer and the Company expressly acknowledge that this Agreement does not create an exclusive relationship between the Customer and the Company. Customer is free to engage others to perform services of the same or similar nature to those provided by Company, and Company shall be entitled to offer and provide goods and design services to others, solicit other clients and otherwise advertise the services offered by Company.<br/><br/>'+
                    '<b>Authority: </b>'+
                    'If Customer executes this Agreement as a partnership, corporation or limited liability company, then Customer and the persons and/or entities executing this Agreement on behalf of the Customer represent and warrant that: (a) Customer is a duly organized and existing partnership, corporation or limited liability company, as the case may be, and is qualified to do business in the state in which the Customer’s business is located; (b) such persons and/or entities executing this Agreement are duly authorized to execute and deliver this Agreement on Customer’s behalf; and (c) this Agreement is binding upon Customer in accordance with its terms.<br/><br/>'+
                    '<b>Publication: </b>'+
                    'Upon approval by the Customer of the Master Proof, the Company shall have the right to post, share, list or otherwise use, including, without limitation, in connection with the Company’s website, social media, print and marketing materials (collectively, “Use”) any images depicting the design and engineering process and the Master Proofs without further consent from the Customer.<br/><br/>'+
                    '<b>Electronic Signature: </b>'+
                    'Signatures and initials required in this document may be executed via “wet” original handwritten signature or initials, or via electronic signature or mark, which shall be binding on the parties as originals, and the executed signature pages may be delivered using pdf or similar file type transmitted via electronic mail, cloud based server, e-signature technology or other similar electronic means, and any such transmittal shall constitute delivery of the executed document for all purposes of this Agreement.<br/><br/>'+
                    '<b>Unless otherwise agreed upon by the parties, this Agreement when signed by both parties shall constitute the sole contractual agreement for the manufacture and delivery of the goods and services described herein.</b>'+
                '</p>';
            var page5_design_contract = 
                '<p style="font-size: 12px; margin: 0px;">Section A.2</p>'+    
                '<p class="terms"><b>Intellectual Property Provisions:</b> Client Content, including all pre-existing Trademarks and copyright  material,  shall  remain the sole property of Client, and Client shall be the sole owner of all rights in connection therewith. Client hereby grants to Kush Supply Co. LLC a nonexclusive, nontransferable license to use, reproduce, and modify the Client Content solely in connection with Kush Supply Co. LLC’ performance of the Designer’s Services and the production of the Deliverables.<br />'+
                '<b>Third Party Materials:</b> All Third Party Materials are the exclusive property of their respective owners. Kush Supply Co. LLC shall inform Client of all Third Party Materials that may be required to perform the Design Services or otherwise integrated into the Final Art. Under such circumstances, Kush Supply Co. LLC shall inform Client of any need to license.<br />'+
                '<b>Assignment of Copyrights:</b> Upon completion of the Services and conditioned upon full payment of all fees, costs and out-of-pocket expenses due, Kush Supply Co. LLC shall assign to Client all ownership rights, including any copyrights, in and to any artworks or designs comprising the works created by Kush Supply Co. LLC as part of the Final Art and Final Deliverables for use by Client. Kush Supply Co. LLC shall cooperate with Client and shall execute any additional documents reasonably requested by Client to evidence all such assignments of intellectual property.<br />'+
                '<b>Assignment of Final Art:</b> Upon completion of the Design Services, and subject to full payment of all fees, costs and expenses due, Kush Supply Co. LLC hereby assigns to Client all right, title and interest, including without limitation, copyright and other intellectual property rights, in and to the Final Deliverables and the Final Art. Kush Supply Co. LLC agrees to reasonably cooperate with Client and shall execute any additional documents reasonably necessary to evidence such assign <br />'+
                '<b>Fees:</b> In consideration of the Services to be performed by Kush Supply Co. LLC, Client shall pay to Kush Supply Co. LLC fees in the amounts and according to the Payment Terms and Schedule, as set forth in Schedule A, attached hereto and incorporated herein by reference.<br />'+
                '<b>Timing and Acceptance:</b> Kush Supply Co. LLC shall prioritize performance of the Services as may be necessary or as agreed upon by the Parties, and will undertake commercially reasonable efforts to perform the Services. Client agrees to review Deliverables within the time identified for such reviews and to promptly either, (i) approve and accept the Deliverables in writing (which will then become the Final Deliverables) or (ii) provide written comments and/or corrections sufficient to identify the Client’s concerns, objections or corrections to Kush Supply Co. LLC.<br />'+
                '<b>Acceptance:</b> Client, within 24 hours of receipt of each Deliverable, shall notify Kush Supply Co. LLC, in writing, of any failure of such Deliverable to comply with the specifications as agreed upon by the Parties, or of any other objections, corrections, changes or amendments Client wishes made to such Deliverable. Any such written  notice shall be sufficient to identify with clarity any objection, correction or change or amendment, and Kush Supply Co. LLC shall undertake to make the same in a commercially timely manner. Any and all objections, corrections, changes or amendments shall be subject to the terms and conditions of this Agreement. In the absence of such notice from Client within said stated time period, the Deliverable shall be deemed accepted.<br />'+
                '<b>Client Responsibilities:</b> Client acknowledges that he shall be responsible for performing the following in a reasonable and timely manner: <br/>'+
                    'Coordination of any decision-making with parties other than the Kush Supply Co. LLC;<br/>'+
                    'Provision of Client Content in a form suitable for reproduction or incorporation into the Deliverables without further preparation.'+
                '<br />'+
                '<b>Recognition:</b> Kush Supply Co. LLC retains the right to reproduce, publish and display the Final Deliverables in its portfolios and websites, and in galleries, design periodicals and other media or exhibits for the sole purposes of recognition of creative excellence or professional advancement, and to be credited with authorship of the Final Deliverables in connection with such uses. Either Party, subject to the other’s written approval, may include a link to the other Party’s website.<br />'+
                '<b>Relationship of the Parties:</b> Independent Contractor. Kush Supply Co. LLC is an independent contractor, not an employee of Client or any company affiliated with Client. Kush Supply Co. LLC shall provide the Services under the general direction of Client, but Kush Supply Co. LLC shall determine the manner and means by which the Services are accomplished. This Agreement does not create a partnership or joint venture, and neither Party is authorized to act as agent or bind the other Party, except as expressly stated in this Agreement.<br/>'+
                    'Kush Supply Co. LLC and the Deliverables prepared by Kush Supply Co. LLC shall not be deemed a work for hire as that term is defined under Copyright Law. All rights, if any, granted to Client are contractual in nature and are wholly defined by the express written agreement of the Parties and the various terms and conditions of this Agreement.'+
                '<br />'+
                '<b>No Exclusivity:</b> The Parties expressly acknowledge that this Agreement does not create an<br/>'+
                    'exclusive relationship between the Parties. Client is free to engage others to perform services of the same or similar nature to those provided by Kush Supply Co. LLC, and Kush Supply Co. LLC shall be entitled to offer and provide design services to others, solicit other clients and otherwise advertise the services offered by Kush Supply Co. LLC.'+
                '<br />'+
                '<b>Design Warranties and Representations:</b> By Client. Client represents, warrants and covenants to Kush Supply Co. LLC that Client owns all right, title, and interest in, or otherwise has full right and authority  to permit the  use  of  the Client Content; and, to the best of Client’s knowledge, the Client Content does not infringe the rights of any third party, and use of the Client Content as well as any Trademarks in connection with the Project does not and will not     violate the rights of any third parties. By Kush Supply Co. LLC. Kush Supply Co. LLC hereby represents, warrants and covenants to Client that Kush Supply Co. LLC will  provide  Designer’s Services and produce the Deliverables as identified in the Agreement in a professional and workmanlike manner and in accordance with all reasonable professional standards for such services. Kush Supply Co. LLC further represents, warrants and covenants to Client that the Final deliverables shall be the original work of Kush Supply Co. LLC; and, to the best of Kush Supply Co. LLC’ knowledge, the Final Art provided by Kush Supply Co. LLC does not infringe the  rights of any party, and use of same in connection with the Project will not violate the rights of any third parties.<br />'+
                '<b>Scope of Work:</b> The Design Work Deliverables will consist of the following:</p>'+
                '<p style="font-size: 12px;">${project.custentity_pm_scope_of_work}</p>'+
                '<p class="terms"><b>Design Fee Agreement:</b></p>'+
                '<p class="terms"><span style="font-size:12px; font-weight: bold;"> Estimated Design Time for this project:' + designTime + ' hours at $' + designRate + ' per hour. Total estimated design cost is $' + designCost + '</span>. Client is to pay Kush Supply Co. LLC the full payment of the estimated total Design Fee prior to starting any design work. Revisions to Design Work are billed at the standard hourly rate as indicated in this agreement, and will  be billed at a minimum of 30 minutes per iteration.<br/>'+
                    'Should additional time beyond the Estimated Design Time indicated above be required to complete the project, Client will be provided an updated Design Time Estimate and must approve of the updated proposal before further work is completed and billed.'+
                '</p>'+
                '<p></p>';
            var signaturePage = '<div style="page-break-before:always">&nbsp;</div>'+
            '<div style="width: 100%;">'+
            '<img width="15%" height="15%" style="position: absolute; left: 185;" src="https://system.na2.netsuite.com/c.4516274/images/ksclogobottom.png"/>'+
                '<p align="right" width="250px">'+
                    today + "<br/>"+
                    '${project.companyname} <br/>'+
                    projectId +
                '</p>'+
            '</div>'+
            '<h4>What Next?</h4>'+
            '<p>After you sign, you’ll receive a confirmation email with instructions on when you’ll receive your final artwork proof, how to submit your deposit and more information on lead times.</p>'+
            '<p>Thank you for your business and we’re excited to work with you!</p>'+
            '<div>'+
            '<table width="100%" style="margin-left: -7px; margin-right: -7px;">'+
                '<tr>'+
                    '<td style="vertical-align:bottom; height: 60px;">Client Name: ${customer.entityid}</td>'+
                    '<td style="vertical-align:bottom; height: 60px;">Email: ${customer.email}</td>'+
                '</tr>'+
                '<tr>'+
                    '<td style="vertical-align:bottom; height: 60px;">Signature:</td>'+
                    '<td style="vertical-align:bottom; height: 60px;">Date:</td>'+
                '</tr>'+
                '<tr>'+
                    '<td style="vertical-align:bottom; height: 60px;">Kush Supply Co. LLC Rep: ${project.custentity_pm_tsm}</td>'+
                    '<td style="vertical-align:bottom; height: 60px;">Email: ${project.custentity_pm_tsm.email}</td>'+
                '</tr>'+
                '<tr>'+
                    '<td style="vertical-align:bottom; height: 60px;">Signature: <img width="30%" height="30%" style="display:inline;" src="https://system.na2.netsuite.com/c.4516274/images/KSC_PM_SIGNATURE.jpg"></img> </td>'+
                    '<td style="vertical-align:bottom; height: 60px;">Date: '+ today +'</td>'+
                '</tr>'+
            
            '</table>'+
            '</div>';
            var footer = '</body> </pdf>';
        
            // if(foundImages){ // TODO: temp disabled - 5/30/2018 until further notice add images to page 2
            //     page2 = page2 + foundImages;
            // } else {
            //     page2 = "";
            // }
        
            page2 = "";
            if(salesOrderId || estimateId){ //include estimate
                template = header + page1 + page2 + page3 + page4;
            } else if (!salesOrderId && !estimateId){ //do not include estimate
                template = header + page1 + page2 + page4;
            }
            //if(designTime){
              //  template = template + page5_design_contract;
            //}
        
            template = template + signaturePage + footer;
        
            renderer.setTemplate(template); // Passes in raw string of template to be transformed by FreeMarker
        
            renderer.addRecord('project', project); // Binds the project record object to the variable used in the template
            renderer.addRecord('customer', customer); // Binds the project record object to the variable used in the template
            if(estimate){
                renderer.addRecord('estimate', estimate); // Binds the project record object to the variable used in the template
            }
        
        
            var xml = renderer.renderToString(); // Returns template content interpreted by FreeMarker as XML string that can be passed to the nlapiXMLToPDF function.
        
            var file = nlapiXMLToPDF(xml); // Produces PDF output.
            file.setName("SOW" + projectId + ".pdf");
            file.setFolder("470656"); //ID for Statement of Work folder
            file.setIsOnline(false); //TODO: CONFIRM FORM ONLINE
            file.setEncoding('UTF-8');
        
            var fileid = nlapiSubmitFile(file);
        
            nlapiAttachRecord("file",fileid, "job",id);
            response.setContentType('PDF', 'sample.pdf', 'inline');
        
            response.write(file.getValue());
        }
    }
}

function getDate() {
    ////////////////Date Function////////////////////
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return mm + '/' + dd + '/' + yyyy;
    ///////////////Date Function End////////////////
}
// function getImages(id) {
//     var imgLoop = "";
//     var closingImgTag = '</img>';
//     var jobSearch = nlapiSearchRecord("job", null,
//         [
//             ["internalidnumber", "equalto", id]
//         ],
//         [
//             new nlobjSearchColumn("entityid").setSort(false),
//             new nlobjSearchColumn("altname"),
//             new nlobjSearchColumn("name", "file", null),
//             new nlobjSearchColumn("filetype", "file", null),
//             new nlobjSearchColumn("folder","file",null),
//             new nlobjSearchColumn("url","file",null),
//             new nlobjSearchColumn("internalid","file",null),
//             new nlobjSearchColumn("availablewithoutlogin","file",null)
//         ]
//     );

//     if(jobSearch){
//         for(var i = 0; i < jobSearch.length; i++){
//             var fileType = jobSearch[i].getValue("filetype", "file");
//             var fileId = jobSearch[i].getValue("internalid", "file");
//             var fileUrl = "https://system.na2.netsuite.com" + jobSearch[i].getValue("url", "file").replace(/&/g, "&amp;");
//             var availableWithoutLogin = jobSearch[i].getValue("availablewithoutlogin", "file");
//             nlapiLogExecution("debug", "urllink", fileUrl);
//             var fileFolder = jobSearch[i].getText("folder", "file");
//             if(fileType == "PNGIMAGE" && fileFolder == id){
//                 if(availableWithoutLogin == "F"){
//                     var loadedFile = nlapiLoadFile(fileId);
//                     loadedFile.setIsOnline(true);
//                     nlapiSubmitFile(loadedFile);
//                 }
//                 imgLoop += '<div><img src="'+ fileUrl +'" style="width:675px; margin: 0 auto 10px;">' + closingImgTag + '</div>';
//             }
//         }
//         return imgLoop;
//     }
// }

function grabDesignHours(project){
    var designTime = project.getFieldValue("custentity_pm_design_hours_required");
    if(!designTime || designTime == "0"){
        designTime = project.getFieldText("custentity_pm_design_plans").replace(/\D+/g, '');
        if(!designTime){
            return 0;
        }

    }
    return designTime;
}

function clearSOW(projectId) {
    var jobSearch = nlapiSearchRecord("job", null, [
        ["file.name", "startswith", "SOWPR"],
        "AND", ["file.filetype", "anyof", "PDF"],
        "AND", ["file.folder", "noneof", "474271"],
        "AND", ["file.name", "doesnotcontain", "DOCUSIGNED"],
        "AND", ["internalidnumber", "equalto", projectId]
    ], [
        new nlobjSearchColumn("internalid", "file", null),
        new nlobjSearchColumn("name", "file", null),
        new nlobjSearchColumn("companyname")
    ]);

    for (var i = 0; jobSearch != null && i < jobSearch.length; i++) {
        // get result values
        var searchresult = jobSearch[i];
        // var recordId = searchresult.getId();
        // var projectName = searchresult.getValue('companyname');
        var fileName = searchresult.getValue("name", "file", null);
        var fileId = searchresult.getValue("internalid", "file", null);

        var file = nlapiLoadFile(fileId);
        file.setName(fileName.split(".pdf")[0] + " DOCUSIGNED.pdf");
        nlapiSubmitFile(file);
    }
}