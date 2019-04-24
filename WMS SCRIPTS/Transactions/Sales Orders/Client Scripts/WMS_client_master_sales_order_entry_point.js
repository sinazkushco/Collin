/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */

define([
     "N/email",
     "../../WMS_client_full_lock_order.js",
     "./WMS_client_sample_locations.js",
     "./client_partial_lock.js",
     "./client_sig_type_field.js"
], function (
     email,
     fullLock,
     sampleLocation,
     partialLock,
     sigType
) {
     function lineInit(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;
          try {
               partialLock.lineInit(context);
               sampleLocation.disableLineField(context, "location");
          } catch (error) {
               _sendErrorEmail("lineInit", error);
          }
     }

     function pageInit(context) {
          // Available contexts:
          // context.currentRecord;
          // context.mode;
          try {
               sigType.pageInit(context);
               sampleLocation.checkSampleOrderBox(context);
               sampleLocation.setLocationToSampleLocation(context);
               fullLock.preventEditMode(context);
               partialLock.pageInit(context);
          } catch (error) {
               _sendErrorEmail("pageInit", error);
          }
     }

     function postSourcing(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;
          // context.fieldId;

          try {
               sampleLocation.setItemLocationToSampleLocation(context);
               sampleLocation.setUOMToBaseUnit(context);
          } catch (error) {
               _sendErrorEmail("postSourcing", error);
          }
     }

     function saveRecord(context) {
          // Available contexts:
          // context.currentRecord;

          //Return true if you want to continue saving the record.
          try {
               return (
                    fullLock.preventEditMode(context) &&
                    sampleLocation.setLocationToSampleLocation(context) &&
                    sampleLocation.checkSampleOrderBox(context)
               );
          } catch (error) {
               _sendErrorEmail("saveRecord", error);
          }
     }

     function sublistChanged(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;

     }

     function validateDelete(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;

          return true; //Return true if the line deletion is valid.
     }

     function validateField(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;
          // context.fieldId;
          // context.line;
          // context.column;

          return true; //Return true to continue with the change.
     }

     function validateInsert(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;

          return (
               true
          ); //Return true if the line insertion is valid.
     }

     function validateLine(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;
          try {
               return (
                    partialLock.validateLine(context)
               ); //Return true if the line is valid.
          } catch (error) {
               _sendErrorEmail("validateLine", error);

          }
     }

     function fieldChanged(context) {
          // Available contexts:
          // context.currentRecord;
          // context.sublistId;
          // context.fieldId;
          // context.line;
          // context.column;

          try {
               sigType.fieldChanged(context);
               sampleLocation.setItemLocationToSampleLocation(context);
               sampleLocation.setPriceToZero(context);
          } catch (error) {
               _sendErrorEmail("fieldChange", error);
          }
     }

     function _sendErrorEmail(entryPoint, error) {
          email.send({
               author: 1226574,
               recipients: 1226574,
               subject: "An error has occured with " + entryPoint + " on a Sales Order",
               body: "<pre>" + JSON.stringify(error, null, 4) + "</pre>"
          });
     }

     return {
          lineInit: lineInit,
          pageInit: pageInit,
          postSourcing: postSourcing,
          saveRecord: saveRecord,
          sublistChanged: sublistChanged,
          validateDelete: validateDelete,
          validateField: validateField,
          validateInsert: validateInsert,
          validateLine: validateLine,
          fieldChanged: fieldChanged,
     };
});

