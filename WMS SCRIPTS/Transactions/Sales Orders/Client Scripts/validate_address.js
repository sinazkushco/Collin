/**
* @NApiVersion 2.x
* @NModuleScope SameAccount
*/

define(["N/https", "N/url", "N/runtime"],
     function (https, url, runtime) {
          function validate_address(context) {
               if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
                    try {

                         var currentRecord = context.currentRecord;
                         // eslint-disable-next-line no-global-assign
                         alert = alert || function alert() { };
                         var billzip;
                         var billstate;
                         var billcountry;
                         var shipzip = currentRecord.getValue("shipzip");
                         var shipstate = currentRecord.getValue("shipstate");
                         var shipcountry = currentRecord.getValue("shipcountry");
                         var bill_address_id = currentRecord.getValue({
                              fieldId: "billingaddress_key"
                         });
                         if (bill_address_id) {
                              var response = https.post({
                                   url: url.resolveScript({ scriptId: "customscript_scale_master_suitelet", deploymentId: "customdeploy_scale_master_suitelet" }),
                                   body:
                                   {
                                        bill_address_id: bill_address_id,
                                        action: "get_billaddress_info"
                                   }
                              });
                              var response_data = JSON.parse(response.body).data;

                              billzip = response_data.billzip;
                              billstate = response_data.billstate;
                              billcountry = response_data.billcountry;

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
                                        alert("Address Requires Zip");
                                        return false;
                                   }
                              }

                              if (countries_that_need_state.indexOf(shipcountry) != -1 || countries_that_need_state.indexOf(billcountry) != -1) {
                                   if (!shipstate || !billstate) {
                                        //console.log('missing state')
                                        alert("Address Requires State");
                                        return false;
                                   }
                              }

                              if ((!shipzip && !shipstate) || (!billzip && !billstate)) {
                                   //console.log('missing state and zip')
                                   alert("Missing both Zip and State");
                                   return false;
                              }
                         } else {
                              //alert('Missing Bill Address')
                              return false;
                         }
                    } catch (e) {
                         log.debug("error at validate address", e);
                         //console.log(e)
                    }
               }
               return true;
          }

          return {
               validate_address: validate_address
          };
     });