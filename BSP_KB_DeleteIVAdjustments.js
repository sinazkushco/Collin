function deleteIVAjustments()
{
  //nlapiDeleteRecord('inventoryadjustment', 2);
  var searchresults = nlapiSearchRecord('inventoryadjustment', null, null, null);
    var lastID = 0;
    for (var i = searchresults.length-1; i >= 0; i--)
    {
      var searchresult = searchresults[i];
      var newID = searchresults[i].getId();
      if (lastID != newID)
      {
        nlapiDeleteRecord(searchresults[i].getRecordType(), newID);
        lastID = newID;
      }
    }  
}
