var SEARCH, RECORD;
 
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record'], runUserEvent);
 
function runUserEvent(search, record) {
    SEARCH = search;
    RECORD = record;
 
    var returnObj = {};
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}
 
function afterSubmit(context) {
    var newRecord = context.newRecord;
    //var subsidiary = newRecord.getValue("subsidiary");
    var transactionId = newRecord.getValue({fieldId: "createdfrom"});
    var createdFromPO = newRecord.getText({fieldId: "createdfrom"}).indexOf("PO") > -1;

    if(createdFromPO){
        findRelatedProject(transactionId);
    }
    return;
}

function findRelatedProject(poId){
    var purchaseOrder = RECORD.load({
        type: "purchaseorder", 
        id: poId
    });

    var itemCount = purchaseOrder.getLineCount({sublistId: "item"});
    for(var i = 0; i < itemCount; i++){
        var project = purchaseOrder.getSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_project',
            line: 0});
        if(project){
            updateProjectStatus(project, purchaseOrder);
        }
    }
}

function updateProjectStatus(projectId, purchaseOrder) {
    var projectStatus = "";
    var projectSearch = SEARCH.lookupFields({
        type: "job",
        id: projectId,
        columns: ['custentity_pm_status']
    });
    var purchaseOrderStatus = purchaseOrder.getValue({fieldId: "status"});
    
    if(projectSearch.custentity_pm_status.length > 0){
        projectStatus = projectSearch.custentity_pm_status[0].value;
    }
    if(projectStatus == "12" || projectStatus == "13"){ //In Transit & Partially Received/In QC
        if(purchaseOrderStatus == "Pending Receipt"){
            //do nothing
        } else if(purchaseOrderStatus == "Partially Received" || purchaseOrderStatus == "Pending Billing/Partially Received"){
            RECORD.submitFields({
                type: 'job',
                id: projectId,
                values: {
                    'custentity_pm_status': '13' //Partially Received/In QC
                }
            });
        } else {
            RECORD.submitFields({
                type: 'job',
                id: projectId,
                values: {
                    'custentity_pm_status': '14' //Received/In QC
                }
            });
        }
    }
}
