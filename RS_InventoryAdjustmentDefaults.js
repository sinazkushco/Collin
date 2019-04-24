function RS_InventoryAdjustmentBeforeLoad(type,form)
{
    var currentContext = nlapiGetContext();
    if (type == 'create')
    {
        var location = currentContext.getLocation();
        nlapiSetFieldValue('adjlocation', location);
    }
  	nlapiDisableLineItemField('inventory','units','true')
}
function RS_PurchaseOrderBeforeLoad(type,form)
{
    var currentContext = nlapiGetContext();
    if (type == 'create')
    {
        // var location = currentContext.getLocation();
       // nlapiSetFieldValue('location', location);
    }
}