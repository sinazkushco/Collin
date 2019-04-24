var Rec = {
    User: nlapiGetUser(),
    Role: nlapiGetRole(),
    recordtype: nlapiGetRecordType(),//classification
    recordid: nlapiGetRecordId(),
    NAME: nlapiGetFieldValue('name')
};

var FIELD = "custrecord_"+ Rec.recordtype +"_code_extid"; //custrecord_class_code_extid
Rec.externalid = nlapiGetFieldValue(FIELD);
var LOGTITLE = Rec.recordtype +":"+ Rec.recordid;

/*
* When a user attempts to save the finance code field value that is visible on the form of a global record (class, department, location), then also update the externalid with that code.
* This is so Finance can CSV upload more easily.
* */
function beforeSubmit_financeCodeToExternalID(context){
    Rec.context = context.toString().toLowerCase();
    Rec.externalid_OLD = Rec.recordtype && Rec.recordid && nlapiLookupField(Rec.recordtype, Rec.recordid, 'externalid'); //makes sure this only looks up on create

    try {
        //expected flows
        if (Rec.externalid === '' && Rec.externalid_OLD) {
            //externalid cannot be unset or nulled once it has ever been set
            Rec.ACTION = 'UNSET';
            Rec.REASON = 'Nothing updated; unsetting an externalid is not allowed by NetSuite.';
            throw errorMessage(Rec.ACTION);
        }
        else if (Rec.externalid && Rec.externalid_OLD !== Rec.externalid) {
            //update needed because values differ
            nlapiSetFieldValue('externalid', Rec.externalid); // this is a failsafe redundancy for csv imports, which are client scripts.
            
            if (Rec.context === 'create'){
                //if the conditional falls in here, the externalid needs to be updated in the aftersubmit portion
                Rec.ACTION = 'CREATING NEW '+ Rec.recordtype;
                Rec.REASON = 'Nothing updated yet; aftersubmit script will set the externalid';
                nlapiLogExecution('DEBUG', LOGTITLE, JSON.stringify(Rec));
            } else {
                updateExternalID(Rec.externalid);
            }


        } else {
            //currently does not account if the field does not exist
            // if you edited my field, shame on you.
            // if you created a new field and deployment, and script goes into this conditional, you need to follow the syntax listed in the var FIELD =
            Rec.ACTION = 'NO UPDATE';
            Rec.REASON = 'Nothing updated; old and new value on field are both the same.';
            nlapiLogExecution('DEBUG', LOGTITLE, JSON.stringify(Rec));
        }
    } catch (error){
        nlapiLogExecution('ERROR', LOGTITLE, JSON.stringify(Rec));
        throw error;
    }


}

function afterSubmit_financeCodeToExternalID(context){
    Rec.context = context.toString().toLowerCase();
    
    try {
        if (Rec.context === 'create' && Rec.externalid) {
            updateExternalID(Rec.externalid);
        }
    } catch(error){
        nlapiLogExecution('ERROR', LOGTITLE, JSON.stringify(Rec));
        throw error;
    }
}

function errorMessage(action){
    var BEGINNING =
        action === 'UNSET' ? 'Once externalid is set, it can never be removed/empty; you can only change it.  <br/>If you would like to not use this financial code anymore, add -- to the front of the value.'
            : action === 'MISMATCH' ? 'Your '+ Rec.recordtype +'record was created successfully, but the External ID failed to update in the system.'
            : 'External ID failed to update in the system.'
    ;
    var END = '  <br/><br/>If you need assistance, PLEASE <a href="http://help.kushco.com">submit a ticket to the NetSuite Help Desk</a> with the following message: <br/><br/>'+JSON.stringify(Rec);
    return BEGINNING + END;
}

function updateExternalID(externalid){
    nlapiSubmitField(Rec.recordtype, Rec.recordid, 'externalid', externalid);
    
    //check to see if it did actually update
    Rec.externalid_UPDATED = nlapiLookupField(Rec.recordtype, Rec.recordid, 'externalid');
    if (Rec.externalid_UPDATED !== externalid) {
        //update failed
        Rec.ACTION = 'MISMATCH';
        Rec.REASON = 'Values failed to update in the system.';
        throw errorMessage(Rec.ACTION);
    } else {
        Rec.ACTION = 'UPDATED SUCCESSFULLY';
        Rec.REASON = 'Successfully updated externalid.';
        nlapiLogExecution('AUDIT', LOGTITLE, JSON.stringify(Rec));
        return true;
    }
}