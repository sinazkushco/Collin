/**
 * The purpose of this script is to
 *
 *  For User Event Scripts, entry point is beforeSubmit.
 *  For Client scripts, entry point is saveRecord.
 *  Both entry points eventually call the model, {controllerName}
 * */

// cut and paste entry points into here.

/** entry point fires when the read operation on a record occurs including nlapiLoadRecord, but before returning the record or page.
 * it cannot source standard records -- use pageInit for that.
 * @param   type    string      write operation type: {create edit delete *xedit *approve *reject *cancel *pack *ship *dropship *specialorder *orderitems *paybills}
 */
function afterSubmit_saveCallTime(type) {
    var recordId = nlapiGetRecordId();
    var record = nlapiLoadRecord("phonecall", recordId)
    var getTime = new Date();
    var setTime = record.setDateTimeValue("custevent_call_complete_time", nlapiDateToString(getTime,'datetimetz'));
    nlapiSubmitRecord(record);
}

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////unused entry points/////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/** entry point fires when the read operation on a record occurs including nlapiLoadRecord, but before returning the record or page.
 * it cannot source standard records -- use pageInit for that.
 *  @param  type    string          read operation type: {create edit view copy print email quickview}
 *  @param  form    nlobjForm       object representing the current form
 *  @param  request nlobjRequest    object representing the GET request (browser only)
 */
function beforeLoad_saveCallTime(type, form, request) {
    
    
}

/** entry point fires before any write operation.  changes to a record here will be persisted to the write operation
 *  DO NOT nlapiLoadRecord OR nlapiSubmitRecord OR ELSE YOU LOSE DATA
 * @param   type        string      write operation type: {create edit delete *xedit *approve *reject *cancel *pack *ship *markcomplete *reassign *editforecast}
 * @return  boolean                 false to prevent submission
 */
function beforeSubmit_saveCallTime(type) {

	return true;
}
