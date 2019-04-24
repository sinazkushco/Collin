var PROMO_CODE_PRODUCTION = "129";
var PROMO_CODE_SANDBOX = '137';

function applyPromotion() {
    var context = nlapiGetContext(),
        exec = context.executioncontext,
        user = context.user,
        role = context.role;
    if (exec == 'userinterface') {
        var customerId = nlapiGetFieldValue('entity');
        var customerSearch = nlapiSearchRecord("customer", null,
            [
                ["internalid", "anyof", customerId]
            ],
            [
                new nlobjSearchColumn("entityid").setSort(false),
                new nlobjSearchColumn("terms"),
                new nlobjSearchColumn("overduebalance"),
            ]
        );


        var customerTermsStatus = customerSearch[0].rawValues[2].value;
        customerTermsStatus = Number(customerTermsStatus)
        var promotionExists = false;
        var lineCount = Number(nlapiGetLineItemCount('promotions')) +1;
        for (var i = 1; i < lineCount; i++) {
            nlapiSelectLineItem('promotions', i)
            var line_promotion = nlapiGetCurrentLineItemText('promotions', 'promocode')
            if (line_promotion == 'Enterprise 5% Fee') {
                promotionExists = true;
            }
        }
        if (customerTermsStatus > 0 && !promotionExists) {
            nlapiSetFieldValue('automaticallyapplypromotions', 'F')
            nlapiSelectNewLineItem('promotions')
            nlapiSetCurrentLineItemValue('promotions', 'promocode', PROMO_CODE_PRODUCTION, true) //sandbox promotion code
            nlapiSetCurrentLineItemValue('promotions', 'promotion', 'Enterprise 5% Fee', true)
            nlapiCommitLineItem('promotions')
            nlapiSetFieldValue('automaticallyapplypromotions', 'T');
        }

        if (!role || role != '3') { //administrator
            setFieldDisabled(role, user)
        }
    }
}


// called by applyPromotion, hides 'Auto Apply Promotion' from view
function setFieldDisabled(currentRole, currentUser) {
    var authorizedRoles = {
        3: 'Administrator',
    }
    if (authorizedRoles[currentRole]) {
        return;
    }
    //disable Auto Apply Promotions by hiding it.
    nlapiDisableField("automaticallyapplypromotions", true)
    jQuery("#tr_fg_automaticallyapplypromotions").css('visibility', 'hidden');
}

function setFieldDisabled_onPageInit(){
    exec = context.executioncontext,
    user = context.user,
    role = context.role;

    if(exec == 'userinterface'){
        var authorizedRoles = {
            3: 'Administrator',
        }
    
        if (authorizedRoles[role]) {
            return;
        }
        nlapiDisableField("automaticallyapplypromotions", true)
        jQuery("#tr_fg_automaticallyapplypromotions").css('visibility', 'hidden');
    }
}





function updateChargeOnTermsChange() {
    var terms = nlapiGetFieldValue('terms');
    var customerId = nlapiGetFieldValue('entity');

    var customerSearch = nlapiSearchRecord("customer", null,
        [
            ["internalid", "anyof", customerId]
        ],
        [
            new nlobjSearchColumn("entityid").setSort(false),
            new nlobjSearchColumn("terms"),
            new nlobjSearchColumn("overduebalance"),
            new nlobjSearchColumn("datecreated"),
        ]
    );

    var customerTermsStatus = customerSearch[0].rawValues[2].value;
    customerTermsStatus = Number(customerTermsStatus)

    var customerCreatedDate = customerSearch[0].rawValues[3].value;
    customerCreatedDate = Date.parse(customerCreatedDate);

    if(customerCreatedDate < 1551427045000) {
        return;
    } // 3/1/19 @ 8am
//if customer has no terms (on order) and 0 balance on account  REMOVE PROMOTION
    if (!terms || terms == "8") {
        if (customerTermsStatus <= 0) {
            // set Auto Apply Promotions false
            nlapiSetFieldValue('automaticallyapplypromotions', 'F')
            // get promotions and loop looking for 5% credit charge
            var promoCount = nlapiGetLineItemCount('promotions');
            for (var i = 1; i <= promoCount; i++) {
                nlapiSelectLineItem("promotions", i);

                var promoCode = nlapiGetLineItemValue("promotions", "promocode");
                if (promoCode == PROMO_CODE_PRODUCTION) { //sandbox promo code
                    nlapiRemoveLineItem("promotions", i)
                    break;
                }
            }
            nlapiSetFieldValue('automaticallyapplypromotions', 'F');
        }
    } else {
        //check if promotion was applied
        var promotionExists = false;
        var lineCount = nlapiGetLineItemCount('promotions') +1;
        for(var i = 1; i<lineCount; i++){
            nlapiSelectLineItem('promotions', i)

            var promotion_code = nlapiGetCurrentLineItemText('promotions', 'promocode');
                if(promotion_code == 'Enterprise 5% Fee'){
                    promotionExists = true;
                }
            }
        // if no promotions exists AND we NEED it
        if(!promotionExists){
            nlapiSetFieldValue('automaticallyapplypromotions', 'F');
            nlapiSelectNewLineItem('promotions')
            nlapiSetCurrentLineItemValue('promotions', 'promocode', PROMO_CODE_PRODUCTION, true) // sandbox promo code
            nlapiSetCurrentLineItemValue('promotions', 'promotion', 'Enterprise 5% Fee', true)
            nlapiCommitLineItem('promotions')
            nlapiSetFieldValue('automaticallyapplypromotions', 'T');
        }
    }
}


// called onSave or record.  Checks for customer terms and either adds removes coupon if payment type is somthing other then terms
function validateCreditPromo_onSave() {
    var context = nlapiGetContext(),
        user = context.user,
        role = context.role,
        terms = nlapiGetFieldValue('terms');
    if (!terms || terms == '8') {
        //turn off auto apply promotions
        autoApplyCheckbox = nlapiGetFieldValue('automaticallyapplypromotions')
        nlapiSetFieldValue('automaticallyapplypromotions', 'F')
        // get promotions and loop looking for 5% credit charge
        var promoCount = nlapiGetLineItemCount('promotions');
        for (var i = 1; i <= promoCount; i++) {
            nlapiSelectLineItem("promotions", i);
            var promoCode = nlapiGetLineItemValue("promotions", "promocode");
            if (promoCode == PROMO_CODE_PRODUCTION) {
                nlapiRemoveLineItem("promotions", i)
                break;
            }
        }
        nlapiSetFieldValue('automaticallyapplypromotions', 'F');
    }
    return true;
}

// function removeWebStorePromotion_onPageInit(){
//     var promotionWasAppliedOnline = false;
//     var orderCreatedOnline = nlapiGetFieldValue('custbody1');
    
//     if(orderCreatedOnline == "4926"){
//         var promotionLineCount = nlapiGetLineItemCount('promotions');
//         for(var i = 1; i<promotionLineCount; i++){
//             nlapiSetFieldValue('automaticallyapplypromotions', 'F')
//             nlapiSelectLineItem('promotions', i);
//             var currentPromotion = nlapiGetCurrentLineItemText('promotions', 'promo');
//             if(currentPromotion == '')
//         }
//     }
// }





