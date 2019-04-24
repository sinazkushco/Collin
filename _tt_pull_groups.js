function service(request,response){

    var values = [];
    try {

        var listRecord = nlapiLoadRecord('customlist', 294);
        var iterator = listRecord.getLineItemCount('customvalue');


        for(var i =1; i <= iterator; i++) {

            var id = listRecord.getLineItemValue('customvalue','valueid',i);
            var value = listRecord.getLineItemValue('customvalue','value',i);

            values.push({id:id,value:value});
        }


    } catch (e) {
        nlapiLogExecution('ERROR', 'Unable to receive suitelet response', e);
    }

    response.write(JSON.stringify(values));
}
