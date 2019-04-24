//button added in   BSP_KB_FedExInterface.js
//script deployed   loader-printProFormaInvoice.js
//functions set in  action_printProFormaInvoice.js

function printProFormaInvoice() {
    if (window.debug === true){
        debugger;
    }
    var actionName = "Print Pro Forma Invoice";
    var customAction = "Custom Action: "+ actionName +". ";

    /* instantiating globals */
    var currentRecord = {
        type: nlapiGetRecordType(),
        id: nlapiGetRecordId()
    };
    var tranid = 'tranid', customform = 'customform';
    var fieldsToLookup = [tranid, customform];
    var fields = nlapiLookupField(currentRecord.type, currentRecord.id, fieldsToLookup);
    var transactionID = fields[tranid];

    var Form = {
        FIELDNAME: 'customform',
        SalesOrderFormID: 109,
        ProFormaInvoiceID: 158,
        Current: fields[customform]
    };


    //creating modal, or displaying if it already exists.  prevents appending multiple modals
    var MODAL = window.MODAL || createModal(transactionID);
    MODAL.show();
    MODAL.SetState.start();

    if (!MODAL.$Shadow[0] && !MODAL.$Dialog[0]){
        nlapiLogExecution('ERROR',customAction +" NetSuite's Timeout Modal is not present?", MODAL);
    }


    //logic starts here
    if (window.show_preview) {
        window.setTimeout(changeForm_proFormaInvoice, 1000);
    } else {
        nlapiLogExecution('ERROR',customAction +" window.show_preview(id,null,null,null)", "NetSuite changed one of their default functions");
        MODAL.SetState.printbroken();
    }
    function changeForm_proFormaInvoice(){
        if (window.debug === true){
            debugger;
        }
        try {
            nlapiSubmitField(currentRecord.type, currentRecord.id, Form.FIELDNAME, Form.ProFormaInvoiceID);
            MODAL.SetState.printing();
            window.show_preview(currentRecord.id);
            window.setTimeout(revertForm_previousForm, 1500);
        } catch (error){
            nlapiLogExecution('ERROR',customAction +" Error printing Pro Forma Invoice", transactionID);
            MODAL.SetState.failed(error);
        }
    }
    function revertForm_previousForm(){
        var previousForm = Form.Current || Form.SalesOrderFormID;
        if (window.debug === true){
            debugger;
        }
        try {
            nlapiSubmitField(currentRecord.type, currentRecord.id, Form.FIELDNAME, previousForm);
            MODAL.SetState.complete();
            nlapiLogExecution('AUDIT',customAction +" Pro Forma Invoice Printed successfully", "Successfully printed "+transactionID);
        } catch (error){
            console.error(error);
            if (error.code === 'INSUFFICIENT_PERMISSION'){
                MODAL.SetState.permissions();
            } else if (error.message === 'Record has been changed'){
                console.warn("Record has been changed.  Trying again.");
                try {
                    nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), Form.FIELDNAME, previousForm);
                    MODAL.SetState.complete();
                    nlapiLogExecution('AUDIT',customAction +" Pro Forma Invoice Printed successfully", "Successfully printed "+transactionID);
                } catch (err2){
                    nlapiLogExecution('ERROR', customAction + " Error printing Pro Forma Invoice", err2);
                    MODAL.SetState.failed(err2);
                }
            } else {
                nlapiLogExecution('ERROR', customAction + " Error printing Pro Forma Invoice", error);
                MODAL.SetState.failed(error);
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////// Helper Functions ////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function createModal(transactionID){
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
        createModalStates(MODAL, transactionID);

        window.MODAL = MODAL;
        return MODAL;
    }
    function createModalStates(MODAL, transactionID){
        MODAL.show = function(){
            MODAL.$Shadow.css('visibility','visible');
            MODAL.$Dialog.css('visibility','visible');
        };
        MODAL.hide = function(){
            MODAL.$Shadow.css('visibility','hidden');
            MODAL.$Dialog.css('visibility','hidden');
            jQuery(MODAL.BUTTON).off('click');
        };
        MODAL.SetState.start = function (){
            console.log('Setting state to STARTING');
            MODAL.TITLE.html("Do NOT CLOSE THIS WINDOW!<br/>Do NOT reload the page.");
            MODAL.DESCRIPTION.html("Generating the template.<img src='/images/setup/loading.gif' /><br/>" +
                "<br/><sup>(if theres any issues, call Donald)</sup>");
            MODAL.BUTTON.text('Preventing Tab Keypress').css( {'opacity': 0} );
        };
        MODAL.SetState.printing = function (){
            console.log('Setting state to PRINTING');
            MODAL.TITLE.html("Do NOT CLOSE THIS WINDOW!<br/>Do NOT reload the page.");
            MODAL.DESCRIPTION.html("Printing the Pro Forma Invoice.<img src='/images/setup/loading.gif' /><br/>" +
                "<br/><sup>(if theres any issues, call Donald)</sup>");
            MODAL.BUTTON.text('Preventing Tab Keypress').css( {'opacity': 0} );
        };
        MODAL.SetState.complete = function(){
            console.log('setting state to COMPLETE');
            MODAL.TITLE.html("Success!");
            MODAL.DESCRIPTION.html(transactionID +" has been printed. <br /> Please reload this page.");
            MODAL.BUTTON.text('Reload Page').css( {'opacity': 1} ).on('click', forceReloadPage );
        };
        MODAL.SetState.permissions = function(){
            MODAL.TITLE.html("No Sales Order Approval");
            MODAL.DESCRIPTION.html("Only employees with Sales Order Approval can print the pro forma invoice. <br/>Find someone to print it for you or Hipchat Donald/Dennis/Collin." +
                "<br />Sorry for the inconvenience, the Dev team is working on a resolution.");
            MODAL.BUTTON.text('Close').css( {'opacity': 1} ).on('click', MODAL.hide );
        };
        MODAL.SetState.failed = function(error){
            MODAL.TITLE.text("Error: Please email netsuitehelp@kushbottles.com with the error message in the text box below:");
            MODAL.DESCRIPTION.html("<textarea id='copyme'>Order Number: "+ transactionID +"\n"+ JSON.stringify(error) +"</textarea><br/><span id='copyoutput'></span>");
            MODAL.BUTTON.text('Copy to Clipboard').css( {'opacity': 1} ).on('click', copyToClipboard );
        };
        MODAL.SetState.printbroken = function(){
            var errorMessage = "On the Sales Order page, NetSuite changed their default show_preview(id,null,null,null) function. Will need to refactor the print feature, and possibly for picking ticket as well.";
            MODAL.TITLE.text("NetSuite Error: Please email netsuitehelp@kushbottles.com with the error message in the text box below:");
            MODAL.DESCRIPTION.html("<textarea id='copyme'>"+errorMessage+"</textarea><br/><span id='copyoutput'></span>");
            MODAL.BUTTON.text('Copy to Clipboard').css( {'opacity': 1} ).on('click', copyToClipboard );
        };
    }

    function forceReloadPage(){
        if (window){
            if (window.location){
                window.location.href = window.location.href; //completely intentional
                // window.location.href = window.location.href.replace('&e=T','');
            }
        }
    }
    function copyToClipboard(event) {
        var copyOutput = 'Could not access your clipboard, just do it manually';
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

if (window){
    window.printProFormaInvoice = printProFormaInvoice;
}