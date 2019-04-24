/**
 * @param recordType    passed in by mass update
 * @param recordID      passed in by mass update
 */
function updateTimeCreated(recordType, recordID)
{
    var timeField = 'custrecord_fedex_unit_success_extid';
    var timeCreatedField = 'custrecord_fedex_unit_time_created';

    var fields = [timeField, timeCreatedField];
    var columns = nlapiLookupField(recordType, recordID, fields);
    // if (!columns[timeCreatedField]){
        var timeValue = Number(columns[timeField]);
        if (timeValue){
            var Timestamp = new Date( timeValue );
            var timeCreated = getDate(Timestamp) +' '+ getTime(Timestamp);//
            nlapiSubmitField(recordType, recordID, timeCreatedField, timeCreated);
            log(recordID + 'updated', 'AUDIT');
        } else {
            log('no time provided');
        }
    // } else {
    //     log('time already filled');
    // }
}
// var recordType = 'customrecord_fedex_log_unit';
// var recordID = 7624;
function pad(time, sigFigs){
    sigFigs = sigFigs ? sigFigs : 2;
    var scalar = sigFigs;
    var zeroes = "0";
    while (--scalar){
        zeroes += "0";
    }
    return (zeroes+time).slice(sigFigs * -1);
}
function getDate(time){
    return ''+ time.getFullYear() +'/'+ pad(time.getMonth()+1) +'/'+ pad(time.getDate());
}
function getTime(time){
    var ampm = time.getHours() >= 12 ? ' PM' : ' AM';
    return ''+ pad(time.getHours()) +':'+ pad(time.getMinutes()) +':'+ pad(time.getSeconds()) +'.'+ pad(time.getMilliseconds(), 3) +ampm;
}

/**  Either console.logs or nlapiLogExecution depending on if script is executed server side or client side.
 * @param message   the message to log
 * @param type      required for server side nlapiLogExecution
 */
function log (message, type) {
    var context = nlapiGetContext().getExecutionContext();
    if (context === 'userinterface'){
        try {
            if (type === 'ERROR'){
                console.error(message);
            } else if (type === 'SYSTEM'){
                console.error(message);
            } else if (type === 'AUDIT'){
                console.warn(message);
            } else {
                console.log(message);
            }
        } catch (error){
            //no console
            nlapiLogExecution('DEBUG','ERROR THROWN ON '+context, error);
        }
    } else {
        if (type === 'AUDIT') {
            nlapiLogExecution('AUDIT',context,message);
        } else if (type === 'ERROR'){
            nlapiLogExecution('ERROR',context,message);
        } else if (type === 'SYSTEM'){
            nlapiLogExecution('SYSTEM',context,message);
        } else {
            nlapiLogExecution('DEBUG',context,message);
        }
    }
}