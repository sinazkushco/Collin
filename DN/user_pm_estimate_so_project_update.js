/** entry point fires immediately after any write operation on a record. you may need to load the record again.
 * it cannot source standard records -- use pageInit for that.
 *  nlapiGet___Record returns a record object in readonly, so you have to use nlapiLoadRecord(nlapiGetRecordType, nlapiGetRecordId) / nlapiSubmitRecord to modify a record
 * @param   type    string      write operation type: {create edit delete *xedit *approve *reject *cancel *pack *ship *dropship *specialorder *orderitems *paybills}
 */
function afterSubmit_updateTranRecWithProject(type) {
    var subsidiary = nlapiGetFieldValue("subsidiary");
    if (type == "create" && subsidiary == "1") {
        var estimateId = nlapiGetFieldValue("custentity_pm_estimate_record");
        var salesorderId = nlapiGetFieldValue("custentity_pm_sales_order_record");
        var projectId = nlapiGetFieldValue("id");

        if(estimateId){
            nlapiSubmitField("estimate", estimateId, "job", projectId); //will force update to latest project
        }
        if(salesorderId){
            nlapiSubmitField("salesorder", salesorderId, "job", projectId); //will force update to latest project
            
        }

    }
}