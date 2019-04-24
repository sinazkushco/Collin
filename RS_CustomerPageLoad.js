function RS_NewCall(type, fld)
{
	var customerID = nlapiGetFieldValue('internalid');
	var popUpURL = '/app/crm/calendar/call.nl?l=T&refresh=activities&invitee=' + customerID + '&company=' + customerID;
   	nlOpenWindow(popUpURL, 'activitypopup', 'width=840,height=1000,resizable=yes,scrollbars=yes');
	return false;
}