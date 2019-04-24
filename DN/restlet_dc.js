/**
 * Purpose of Restlet is to encrypt a string.
 * @access POST Only
 * @returns {String} Returns the value of the encrypted string.
 */
function init(request) {
    var response = {
        status: 'fail',
        data: '',
        success: false
    };
    nlapiLogExecution('DEBUG', 'request started > ' + typeof request, request);

    var dataobj = request;
    // nlapiLogExecution('DEBUG', 'dataobj' + typeof dataobj, dataobj);
    log.audit(dataobj)

    if (dataobj.access) {
        if(dataobj.type == "encrypt_email"){
            response.hashed = nlapiEncrypt(dataobj.string, "aes");
            response.status = 'pass';
        }
        if(dataobj.type == "decrypt_email"){
            response.hashed = nlapiDecrypt(dataobj.string, "aes");
            response.status = 'pass';
        }
        if(dataobj.type == "encrypt_password"){
            log.audit('Made it, im here')
            response.hashed = nlapiEncrypt(dataobj.string);
            response.status = 'pass';
        }
        // nlapiEncrypt(dataobj.password);

    }

    var restlet_final_response = response;
    nlapiLogExecution('DEBUG', 'restlet response: ' + typeof restlet_final_response, restlet_final_response);
    return restlet_final_response;
}
