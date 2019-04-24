
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/global_modules.js', 'N/record', 'N/search'],
     function runSuitelet(global_modules, record, search) {
          function master_suitelet(context) {
               var response = {
                    success: false,
                    message: '',
                    data: {}
               }
               var action = context.request.parameters['action'] || ''
               if (context.request.method == 'POST') {
                    switch (action) {
                    case 'check_if_stocked_in_scale_loc':
                         var current_record_id = context.request.parameters['current_record_id'] || ''
                         if (current_record_id) {
                              var stocked_in_scale_loc = global_modules.check_if_stocked_in_scale_loc(current_record_id)
                              response.stocked_in_scale_loc = stocked_in_scale_loc
                              response.success = true
                         } else {
                              response.message = 'missing item id at check if stocked in scale location'
                         }
                         break
                    case 'set_warehouse_status':
                         var id = context.request.parameters['id'] || ''
                         var type = context.request.parameters['type'] || ''
                         var status = context.request.parameters['status'] || ''
                         if (id && type && status) {
                              var saved_record = record.submitFields({
                                   id: id,
                                   type: type,
                                   values: {
                                        custbody_warehouse_status: status
                                   }
                              })
                              log.debug('set warehouse status saved record', saved_record)
                         } else {
                              log.error('no payload')
                         }
                         break
                    case 'get_billaddress_info':
                         var bill_address_id = context.request.parameters['bill_address_id'] || ''
                         var customerSearchObj = search.create({
                              type: 'customer',
                              filters: [
                                   ['address.internalidnumber', 'equalto', bill_address_id]
                              ],
                              columns: [
                                   search.createColumn({
                                        name: 'zipcode',
                                        join: 'Address'
                                   }),
                                   search.createColumn({
                                        name: 'state',
                                        join: 'Address'
                                   }),
                                   search.createColumn({
                                        name: 'country',
                                        join: 'Address'
                                   })
                              ]
                         })
                         var searchResultCount = customerSearchObj.runPaged().count
                         if (searchResultCount) {
                              customerSearchObj.run().each(function (result) {
                                   response.data.billzip = result.getValue({
                                        name: 'zipcode',
                                        join: 'Address'
                                   })
                                   response.data.billstate = result.getValue({
                                        name: 'state',
                                        join: 'Address'
                                   })
                                   response.data.billcountry = result.getValue({
                                        name: 'country',
                                        join: 'Address'
                                   })
        
                                   return false
                              })
                         }
                         response.success = true
                         break
                    default:
                         response.message = 'no action'
                    }
               }

               return context.response.write(JSON.stringify(response))
          }
          return {
               onRequest: master_suitelet
          }
     })

