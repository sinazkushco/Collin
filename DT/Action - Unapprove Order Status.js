function unapproveOrder() {

    /* instantiating globals */
    var STATUSES = {
        PENDING_APPROVAL: "A",
        PENDING_FULFILLMENT: "B"
    }; //enumeration of order statuses
    // var transactionID = rec.getFieldValue('tranid');

    var transactionID = nlapiGetFieldValue('tranid');
    var orderstatus = nlapiGetFieldValue('orderstatus');

    //creating modal, or displaying if it already exists.  prevents appending multiple modals
    var MODAL = window.MODAL || createModal();
    MODAL.show();
    MODAL.SetState.working(transactionID);

    if (!MODAL.$Shadow[0] && !MODAL.$Dialog[0]){
        nlapiLogExecution('ERROR',"Custom Action: Unapprove.  NetSuite's Timeout Modal is not present?", MODAL);
    }

    if (orderstatus === STATUSES.PENDING_FULFILLMENT) {

        var rec = nlapiLoadRecord( nlapiGetRecordType(), nlapiGetRecordId() );
        rec.setFieldValue("custbody_k_hold_for_approval", "T");
        rec.setFieldValue("orderstatus", STATUSES.PENDING_APPROVAL);

        nlapiSetFieldValue('inpt_orderstatus',"Attempting to set to Pending Approval..."); //visual only

        try {
            window.setTimeout(delaySubmitRecord, 1000);
            function delaySubmitRecord(){
                var success = nlapiSubmitRecord(rec);

                if (success) {
                    nlapiLogExecution('AUDIT','Custom Action: Unapprove.  Order unapproved successfully', success);
                    nlapiSetFieldValue('inpt_orderstatus',"Pending Approval"); //visual only
                    MODAL.SetState.complete(transactionID);
                } else {
                    nlapiLogExecution('ERROR','Custom Action: Unapprove.  Order submitted unsuccessfully but did not throw', transactionID);
                    MODAL.SetState.failure('Record submitted unsuccessfully but did not throw an error.');
                    alert('Please contact Donald with the error message and do not close this window.');
                }
            }
        } catch (error){
            nlapiLogExecution('ERROR','Custom Action: Unapprove.  Error unapproving the Order', transactionID);
            MODAL.SetState.failure(error);
        }
    } else {
        var status = nlapiGetFieldValue('status');
        nlapiLogExecution('DEBUG','Custom Action: Unapprove.  Order Status is not Pending Fulfillment', status);
        MODAL.SetState.notallowed(transactionID, status);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////// Helper Functions ////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function createModal(){
        var MODAL = {};
        MODAL.SetState = {};

        //cloning NetSuite's timeout modal and appending to the body
        //if the timeout modal does not exist or has been renamed, script will not throw since we are using jQuery
        MODAL.$Shadow = jQuery('#timeoutblocker').clone().attr('id','modalshadow').css( {'z-index': 9000, margin: 0, position: 'fixed'} );
        MODAL.$Dialog = jQuery('#timeoutpopup').clone().attr('id','modaldialog').css( {'z-index': 9001} );
        jQuery('body').append(MODAL.$Shadow, MODAL.$Dialog);

        //setting modal references
        MODAL.TITLE = MODAL.$Dialog.find('#title');
        MODAL.DESCRIPTION = MODAL.$Dialog.find('#description');
        MODAL.BUTTON = MODAL.$Dialog.find('#button');
        createModalStates(MODAL);

        window.MODAL = MODAL;
        return MODAL;
    }
    function createModalStates(MODAL){
        MODAL.show = function(){
            MODAL.$Shadow.css('visibility','visible');
            MODAL.$Dialog.css('visibility','visible');
        };
        MODAL.hide = function(){
            MODAL.$Shadow.css('visibility','hidden');
            MODAL.$Dialog.css('visibility','hidden');
            jQuery(MODAL.BUTTON).off('click');
        };
        MODAL.SetState.working = function (transactionID){
            console.log('Setting state to WORKING');
            MODAL.TITLE.html("Unapproving "+ transactionID +".<img src='/images/setup/loading.gif' />");
            MODAL.DESCRIPTION.html("Reverting to Pending Approval.");
            MODAL.BUTTON.text('Preventing Tab Keypress').css( {'opacity': 0} );
        };
        MODAL.SetState.complete = function(){
            console.log('setting state to COMPLETE');
            MODAL.TITLE.html("Success!");
            MODAL.DESCRIPTION.html(transactionID +" is now <b>Pending Approval</b>. <br/>Please note that <b>Hold For Approval</b> is set.");
            MODAL.BUTTON.text('Reload Page').css( {'opacity': 1} ).on('click', forceReloadPage );
        };
        MODAL.SetState.failure = function(error){
            MODAL.TITLE.text("ERROR. Please email netsuitehelp@kushbottles.com with this order number "+ transactionID +" and error message");
            MODAL.DESCRIPTION.html("<textarea id='copyme'>Order Number: "+ transactionID +"\n"+ JSON.stringify(error) +"</textarea><br/><span id='copyoutput'></span>");
            MODAL.BUTTON.text('Copy to Clipboard').css( {'opacity': 1} ).on('click', copyToClipboard );
        };
        MODAL.SetState.notallowed = function(transactionID, orderstatusText){
            MODAL.TITLE.text("Not Allowed");
            MODAL.DESCRIPTION.html(transactionID +" is <b>"+ orderstatusText +"</b>. <br/>Order cannot be unapproved.");
            MODAL.BUTTON.text('Close').css( {'opacity': 1} ).on('click', MODAL.hide );
        };
    }

    function forceReloadPage(){
        if (window){
            if (window.location){
                window.location.href = window.location.href.replace('&e=T','')
            }
        }
    }
    function copyToClipboard(event) {
        var copyOutput = 'Could not copy for you, just do it manually';
        var copyTextarea = document.querySelector('#copyme');
        copyTextarea.select();

        try {
            var successful = document.execCommand('copy');
            if (successful) copyOutput = 'Copied!';
            document.querySelector('#copyoutput').innerText = copyOutput;
            copyTextarea.select();
        } catch (err) {
            document.querySelector('#copyoutput').innerText = copyOutput;
            copyTextarea.select();
        }
    }

    return MODAL;
}
