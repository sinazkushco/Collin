/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
     function (record, search) {

          function getInputData(context) {
               return search.create({
                    type: 'customer',
                    filters:
                [
                     [['address.zipcode','isempty',''],'OR',['address.stateid','anyof','@NONE@']]
                ],
                    columns:
                [
                     search.createColumn({
                          name: 'entityid',
                          summary: 'GROUP',
                          sort: search.Sort.ASC
                     }),
                     search.createColumn({
                          name: 'addressinternalid',
                          join: 'Address',
                          summary: 'GROUP',
                          sort: search.Sort.ASC
                     })
                ]
               })
          }

          function map(context) {
               var result = JSON.parse(context.value)
               log.debug('context', context)
               log.debug('result', result)
               log.debug('result.id', result.id)
               log.debug('result.recordType', result.recordType)
            //    var address_id = result.values['addressinternalid.Address']
            //    log.debug('address_id', address_id)
            //    var saved_record = DeleteCustomerAddress(result.id, address_id, result.recordType)
            //    log.debug('saved_record', saved_record)
          }

          function DeleteCustomerAddress(customerId, addressId, type) {
               var customerRec = record.load({
                    type: type,
                    id: customerId,
                    isDynamic: true
               })
               var line = customerRec.findSublistLineWithValue({
                    sublistId: 'addressbook',
                    fieldId: 'addressid',
                    value: addressId
               })
               //log.debug('delete address', { customerId: customerId, addressId: addressId, line: line });

               if (line == -1)
                    throw 'address id ' + addressId + ' not found under customer id ' + customerId
               customerRec.selectLine({
                    sublistId: 'addressbook',
                    line: line
               })
               customerRec.removeCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
               })
               customerRec.removeLine({
                    sublistId: 'addressbook',
                    line: line
               })
               return customerRec.save()
               //log.debug('deleted', '');
          }

          return {
               getInputData: getInputData,
               map: map
          }
     })


