function addProductSuitelet() {
    // In parent window
    var productType = "&productType=" + nlapiGetFieldValue("custentity_pm_add_product_list");
    var productId = "&productId=" + nlapiGetRecordId();
    var url = "https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=567&deploy=1" + productType + productId;
    var pop = window.open(url);


    var winClosed = setInterval(function () {

        if (pop.closed) {
            clearInterval(winClosed);
            if(confirm('You need to refresh the page to see your new item, would you like me to refresh your page now?')){
                window.location.reload();  
            }
        }

    }, 250);

}