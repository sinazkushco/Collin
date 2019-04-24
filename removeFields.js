/** entry point fires when the read operation on a record occurs including nlapiLoadRecord, but before returning the record or page.
 * it cannot source standard records -- use pageInit for that.
 *  @param  type    string          read operation type: {create edit view copy print email quickview}
 *  @param  form    nlobjForm       object representing the current form
 *  @param  request nlobjRequest    object representing the GET request (browser only)
 */

 //script is used for Project Management Product, remove all fields not related to selected product, and make all other fields mandatory on edit mode.

function beforeLoad_hideEmptyProjectFields(type, form, request){
    if(type == 'edit' || type == 'view'){
        var record_type = nlapiGetRecordType();
        var record_id = nlapiGetRecordId();
        var record = nlapiLoadRecord(record_type, record_id);
        var fields = record.getAllFields();
        //empty array to push only necesarry fields to
        var parsed_fields = []
        //loop through all fields on record and push only custrecord fields to 'parsed_fields' array
        for(var i = 0; i<fields.length; i++){
            if(fields[i].indexOf('custrecord') !== -1){
                parsed_fields.push(fields[i])
            }
        }
        validate_fields(parsed_fields,record,form)
    }
}

function validate_fields(field_array,record,form){
    for(var i = 0; i<field_array.length; i++){
        var field = field_array[i]
        var value = record.getFieldValue(field)
        // should test for empty string, however Netsuite will sometimes return this value as null
        if(value == '' || value == null || value == undefined){
            //hide empty fields
            form.getField(field).setDisplayType('hidden'); 
        }else{
            //make all other fields required
            form.getField(field).setMandatory(true)
        }
    }
}
	



	