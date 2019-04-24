var SCRIPTNAME = 'Fix Tax by Load Save';

/**
 * @param recordType    passed in by mass update
 * @param recordID      passed in by mass update
 */
function fixTaxByLoadThenSave(recordType, recordID)
{
    nlapiLogExecution('DEBUG', 'Mass Update: '+ SCRIPTNAME +" run", recordType +": "+ recordID);
    //AVA_TransactionInit('edit');
    //nlapiLogExecution('DEBUG', 'Mass Update: '+ SCRIPTNAME +" AVA_TransactionInit called", recordType +": "+ recordID);
    var rec = nlapiLoadRecord(recordType, recordID);
    var taxBefore = rec.getFieldValue('taxtotal');

    var avatax_remembers = parseFloat(rec.getFieldValue('custpage_ava_totaltax'));
    if (avatax_remembers || avatax_remembers === 0){
        rec.setFieldValue('taxamountoverride', avatax_remembers, true);
        nlapiLogExecution('AUDIT', 'Mass Update: '+ SCRIPTNAME +" tax overridden", avatax_remembers +' overrode | was '+ taxBefore);
    }

    var success = nlapiSubmitRecord(rec);
    if (success && avatax_remembers || avatax_remembers === 0){
        var taxAfter = nlapiLookupField(recordType, recordID, 'taxtotal');
        nlapiLogExecution('AUDIT', 'Mass Update: '+ SCRIPTNAME +" SUCCESS", 'Updated '+ success +': '+ taxBefore +' => '+ taxAfter);
    } else {
        nlapiLogExecution('ERROR', 'Mass Update: '+ SCRIPTNAME +" FAILED TO UPDATE " + recordID, recordType +": "+ recordID);
    }
}