/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 */
define(['N/ui/serverWidget'],
     function (serverWidget) {

          function beforeLoad(context) {
               show_fields(context);
          }
          return {
               beforeLoad: beforeLoad
          };

          function show_fields(context) {
               if (context.newRecord && context.newRecord.id == '10') {
                    var fields_to_show = ['custrecord_azure_connection'];
                    fields_to_show.map(function (field_id) {
                         var field = context.form.getField(field_id);
                         field.updateDisplayType({
                              displayType: serverWidget.FieldDisplayType.NORMAL
                         });
                    });
               }
          }

     });


