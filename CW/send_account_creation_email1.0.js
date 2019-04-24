//Client Script - Send Account Creation Email
//customscript_send_account_creation_email
//Send Account Creation Email

//called from create customer account button on customer record
//checks give access, sets their password and send them an email to
//set a new password

var scriptName = "Send_Account_Creation_Email";

function send_email_to_create_account() {
    var recordId = nlapiGetRecordId();
    var recordType = nlapiGetRecordType();
    var record = nlapiLoadRecord(recordType, recordId);
    var cust_email = record.getFieldValue('email');
    var password = generateRandomPassword();
    //check give access and set passwords for account creation
    record.setFieldValue('giveaccess', 'T');
    record.setFieldValue('password', password);
    record.setFieldValue('password2', password);
    record.setFieldValue('custentity_send_email_for_acc_creat', 'T');
    try {
        var success = nlapiSubmitRecord(record);
        if (success) {
            nlapiLogExecution('AUDIT', scriptName + ' Record Saved', success);
            window.location.replace(window.location.href);
        }
    } catch (error) {
        nlapiLogExecution('ERROR', scriptName + ' FAILED TO SAVE: ' + cust_email, JSON.stringify(error));
    }

}

function generateRandomPassword() { //create password
    var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    var randomString = '';
    for (var i = 0; i < 12; i++) {
        randomString += characters[Math.floor(Math.random() * (charactersLength - 1))];
    }
    return randomString;
}