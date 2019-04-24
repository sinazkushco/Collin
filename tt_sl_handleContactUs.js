function handleContactUs(request, response) {

    // get the recipient using Script Parameters
    var sender = nlapiGetContext().getSetting('SCRIPT', 'custscript_tt_sender');

    // get data sent by the user
    var firstname = request.getParameter('firstname');
    var lastname  = request.getParameter('lastname');
    var companyname = request.getParameter('company');
    var email = request.getParameter('email');
    var message = request.getParameter('message');
    var recipient = request.getParameter('recipient');
    var dataToSend = request.getParameter("dataToSend");


    // notify the person in charge of handle this type of notifications.
    var currentuser = nlapiGetUser();
    var subject = "Contact Us Submission";

    var out = {
        code : 'ERROR'
    }

    if( ! dataToSend) {
        dataToSend   = "Contact Name  : " +  firstname + " " + lastname + "\n";
        dataToSend   = "Company Name  : " +  companyname + "\n";
        dataToSend      += "Contact Email : " + email + "\n";
        dataToSend      += "Message       : " + message + "\n";
    }
    
    
    try{
        nlapiSendEmail(sender, recipient, subject, dataToSend,null ,null ,null ,null ,false ,false , email);
        out.code = 'OK';
      nlapiLogExecution('DEBUG', 'OK', 'SENT');
    } catch(e) {
        nlapiLogExecution('DEBUG', 'EXCEPTION', e);
    }

    response.write(JSON.stringify(out));
}

// test url
// https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=129&deploy=1&firstname=Leonardo&lastname=Mello&email=test@test.com&message=this%20is%20a%20test%20message