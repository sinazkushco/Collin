/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define([], function () {
    function beforeLoad(context) {
        // context.newRecord;
        // context.type;
        // context.form;

        // Will not show up for new customers i.e. on Create
        if(context.type === context.UserEventType.VIEW  || context.type === context.UserEventType.EDIT) {
            var entityId = context.newRecord.id;
            var functionName = '' + 
                "nlOpenWindow('/app/crm/common/note.nl?l=T&refresh=usernotes&perm=LIST_CUSTJOB&entity=" +
                entityId +
                "&_ts=" + 
                (new Date).getTime() +
                "', 'newnote','width=640,height=640,resizable=yes,scrollbars=yes');"

            context.form.addButton({
                id: 'custpage_new_note',
                label: 'New Note',
                functionName:  functionName
            });
        }
    }
     
    function afterSubmit(context) {
        // context.newRecord;
        // context.oldRecord;
        // context.type;
    }
     
    function beforeSubmit(context) {
        // context.newRecord;
        // context.oldRecord;
        // context.type;
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
    };
});
 
