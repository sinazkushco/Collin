function saveCustomShipCost_beforeSubmit(type)
{
    if (type == 'create')
    {
        var executionContext = nlapiGetContext().getExecutionContext();
        if (executionContext === 'webstore')
        {
            var record = nlapiGetNewRecord();
            var calculatedShippingCost = record.getFieldValue('custbody_customfedexshippingcost');
            nlapiLogExecution('DEBUG', 'calculatedShippingCost', calculatedShippingCost);
            if (calculatedShippingCost && !isNaN(parseFloat(calculatedShippingCost)))
            {
                record.setFieldValue('shippingcost', calculatedShippingCost);
                //record.setFieldValue('shippingcostoverridden', 'T');
            }
        }
    }
}
