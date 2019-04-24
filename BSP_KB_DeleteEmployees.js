function deleteEmployees()
{
  //nlapiDeleteRecord('inventoryitem', 2);
  var searchresults = nlapiSearchRecord('employee', null, null, null);
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
          if ((newID != -5) && (newID != 3) && (newID != 410) && (newID != 512))
          {
          	nlapiDeleteRecord(searchresults[i].getRecordType(), newID);
          }
        }
        catch (e)
        {
          nlapiLogExecution('DEBUG', 'Employee Deletion failed for', 'ID = ' + newID);
        }
      }
    }  
}
