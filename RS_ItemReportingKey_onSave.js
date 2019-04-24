function RS_ItemReportingKey_onSave(type,form){

  	if (type == 'delete'){
		return;
	};

  	//var rectype = nlapiGetRecordType();
    //var newrec = nlapiGetNewRecord();
    //var recid = newrec.getId();
  	//var rec = nlapiLoadRecord(rectype,recid);
  	//var itemID = rec.getFieldValue('itemid');
  	//rec.setFieldValue('custitem_item_reporting_key',recid);
  	//var id = nlapiSubmitRecord(rec,true);
	//nlapiLogExecution('DEBUG','itemID | rec | id' , itemID + ' | ' + rec + ' | ' + id);

    var rectype = nlapiLookupField('item', nlapiGetRecordId(), 'recordtype');
    var recid = nlapiGetRecordId();

    var itemID = nlapiLookupField(rectype, recid, 'itemid');
    nlapiLogExecution('DEBUG', itemID, rectype + ':' + recid);
    nlapiSubmitField(rectype, recid, 'custitem_item_reporting_key', recid);


}