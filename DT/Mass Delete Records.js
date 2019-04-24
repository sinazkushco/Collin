/**
* @param recordType    passed in by mass update
* @param recordID      passed in by mass update
*/
function delete_records(recordType, recordID)
{
    nlapiDeleteRecord(recordType, recordID); // Delete record
}