function deleteItems()
{
  //nlapiDeleteRecord('inventoryitem', 2);
  var searchresults = nlapiSearchRecord('inventoryitem', null, null, null);
    var lastID = 0;
    for (var i = searchresults.length-1; i >= 0; i--)
    {
      var searchresult = searchresults[i];
      var newID = searchresults[i].getId();
      if (lastID != newID)
      {
        lastID = newID;
        try
        {
          nlapiDeleteRecord(searchresults[i].getRecordType(), newID);
        }
        catch (e)
        {
          nlapiLogExecution('DEBUG', 'Item Deletion failed for', 'ID = ' + newID);
        }
      }
    }  
}
