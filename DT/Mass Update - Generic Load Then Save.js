var SCRIPTNAME = 'Generic Load Save';

/**
 * @param recordType    passed in by mass update
 * @param recordID      passed in by mass update
 */

function generic_load_then_save(recordType, recordID)
{
  try{
    var rec = nlapiLoadRecord(recordType, recordID);
    if (rec){
        var success = nlapiSubmitRecord(rec);
        nlapiLogExecution('AUDIT', 'Mass Update: '+ SCRIPTNAME +" SUCCESS", recordType +":"+ success);
    } else {
        nlapiLogExecution('ERROR', 'Mass Update: '+ SCRIPTNAME +" FAILED", recordType +":"+ recordID);
    }
}

catch (error){
          nlapiLogExecution('ERROR', 'Mass Update: '+ SCRIPTNAME +" FAILED", recordType +":"+ recordID);
}
}