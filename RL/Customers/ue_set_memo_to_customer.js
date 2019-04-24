/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define(['N/search', 'N/record'], function (search, record) {
   function afterSubmit(context) {
      var noteType = context.newRecord.getValue('notetype'); // getText returns "Collections"
      // This is required for the cases where a note type is not selected.
      var noteTypeText = '';

      if(noteType) {
         noteTypeText = search.lookupFields({
            type: search.Type.NOTE_TYPE,
            id: noteType,
            columns: ['name']
         }).name;
      }
       

      var entityId = context.newRecord.getValue('entity');

      // This will prevent errors in the case where there is no entity. Not entirely sure when this would occur but it can occur.
      if (!entityId) {
         log.error('No Entity Id', JSON.stringify(context.newRecord));
         return;
      }

      var entityType = search.lookupFields({
         type: 'entity',
         id: entityId,
         columns: ['recordtype']
      }).recordtype;

      // Check if this note is for a customer
      if (entityType === 'customer') {
         var title = context.newRecord.getValue('title');
         var memo = context.newRecord.getValue('note');
         var time = context.newRecord.getValue('time').toLocaleString();

         var collectionStatus = '' +
            'Title: ' + title + '\n' +
            'Type: ' + noteTypeText + '\n' +
            'Date: ' + ' ' + time + '\n' +
            'Memo: ' + memo + '\n\n';

         if (noteType === '9') {
            // Updates customer record
            record.submitFields({
               type: record.Type.CUSTOMER,
               id: entityId,
               values: {
                  'custentity_collections_status': collectionStatus
               }
            });
         }

         // Updates customer record
         record.submitFields({
            type: record.Type.CUSTOMER,
            id: entityId,
            values: {
               'custentity_user_notes': collectionStatus
            }
         });
      }
   }

   return {
      afterSubmit: afterSubmit
   };
});