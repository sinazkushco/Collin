
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['../Libraries/global_modules.js', 'N/search', 'N/ui/serverWidget'], function (global_modules, search, serverWidget) {
     function beforeLoad(context) {
          var record = context.newRecord;
          log.debug('record', record);
          if (record) {
               var recordId = record.id,
                    form = context.form,
                    isStockedInScaleLocation = _isStockedInScaleLocation(recordId),
                    fieldstoDisable = ['custitem_ea_qty', 'custitem_ic_qty', 'custitem_mc_qty', 'stockunit', 'purchaseunit', 'saleunit'];
               log.debug('isStockedInScaleLocation', isStockedInScaleLocation);
               if (isStockedInScaleLocation) {
                    fieldstoDisable.forEach(function (fieldId) {
                         var fieldValue = record.getValue(fieldId);
                         log.debug('fieldValue', fieldValue);
                         if (fieldValue) {
                              var field = form.getField({ id: fieldId });
                              field.updateDisplayType({
                                   displayType: serverWidget.FieldDisplayType.DISABLED
                              });
                         }
                    });
               }
          }
     }

     function beforeSubmit(context) {
          var currentRecord = context.newRecord;
          global_modules.validate_uom(currentRecord);
          global_modules.set_ea_weight_if_mc_weight('custitem_mc_weight', currentRecord);
     }
     function afterSubmit(context) {
     }

     function _isStockedInScaleLocation(recordId) {
          if (!recordId) return;
          var itemSearchObj = search.create({
               type: 'item',
               filters:
                [
                     ['internalidnumber', 'is', recordId],
                     'AND',
                     ['inventorylocation.custrecord_scale_enabled', 'is', 'T'],
                     'AND',
                     ['locationquantityavailable', 'greaterthan', '0']
                ],
               columns:
                [
                     'internalid',
                     'locationquantityavailable',
                     'inventorylocation'
                ]
          });

          return itemSearchObj.runPaged().count ? true : false;
     }

     return {
          beforeLoad: beforeLoad,
          beforeSubmit: beforeSubmit,
          afterSubmit: afterSubmit
     };
});
