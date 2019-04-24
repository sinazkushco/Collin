function BSP_SalesOrderBeforeLoad(type,form)
{
    form.addButton('custpage_bsp_shippingfee', 'Estimate Shipping', 'BSP_FedExCalculateShipping()');
    form.addField('custpage_bsp_divtest','inlinehtml','DivTest');
    form.getField('custpage_bsp_divtest').setDefaultValue('<div id="bsp_dialog" title="Basic dialog"><p>JQuery Dialog</p></div>');
}

function BSP_FedExCalculateShipping()
{
    var trxID = nlapiGetFieldValue('tranid'); 
    alert('Sales Order ID: ' + trxID);
    var intID = nlapiGetFieldValue('id');
    alert('Sales Order Internal ID: ' + intID);
    var intHTMLID = document.getElementById('id').value;
    alert('Sales Order Internal ID (HTML): ' + intHTMLID);
    var dialog = NS.jQuery('#bsp_dialog').dialog({autoOpen:false,width:350,modal:false,
      buttons: {
        Cancel: function() {
          dialog.dialog( 'close' );
        }
      }});
    dialog.dialog('open');
    NS.jQuery('.ui-dialog').css({'left': '100px', 'top': '200px'});
    NS.jQuery('.ui-dialog').css({'font-family': 'Open Sans,Helvetica,sans-serif'});
    NS.jQuery('.ui-dialog').css({'font-size': '11pt'});
    NS.jQuery('.ui-widget-header').css({'background': '#607799', 'border': '1px solid #607799'});
}
