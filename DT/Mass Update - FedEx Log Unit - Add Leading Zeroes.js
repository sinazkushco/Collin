/**
 * Adds leading zeroes to time created so string sorts actually show in chronological order.
 * Only needs to be run once to update old records, as all new records should show the date and time correctly with leading zeroes
 *      Example:    Input:  2017/12/1 12:36:21 PM PST
 *                  Output: 2017/12/01 12:36:21 PM PST
 *
 * @param recordType    OBJECT passed in by mass update, not a string.  acts like a string though except for type comparisons
 * @param recordID      OBJECT passed in by mass update, not a number/string.  acts like a string though except for type comparisons.
 */
function addLeadingZeroesToDate(recordType, recordID)
{
    var timeField = 'custrecord_fedex_unit_time_created';

    var date = nlapiLookupField(recordType, recordID, timeField);
    // var date = "2017/12/1 12:36:21 PM PST";
    nlapiLogExecution('DEBUG', recordID, date);

    if (date[7] === '/' && date[9] === ' '){
        var dateWithLeadingZeros = date.substring(0,8) +"0"+ date.substring(8);
        nlapiSubmitField(recordType, recordID, timeField, dateWithLeadingZeros);
        nlapiLogExecution('AUDIT', recordID +" updated", dateWithLeadingZeros);
    } else {
        nlapiLogExecution('AUDIT', recordID +" date[7]", date[7]);
        nlapiLogExecution('AUDIT', recordID +" date[9]", date[9]);
    }
}