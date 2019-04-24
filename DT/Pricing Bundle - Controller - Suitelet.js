/* requires credentials.js */
var scriptName = "Bundle Pricing - Controller Suitelet.js ";

/** receives string, spits out string
 *
 * @param request   {nlobjRequest}
 * @param response  {nlobjResponse}
 */
function entryPoint_Suitelet_Pricing_Bundle(request, response){
    var payload = {
        lastitem: request.getParameter('lastitem'),
        items: request.getParameter('items')
    };
    response.setContentType('JAVASCRIPT');

    nlapiLogExecution('DEBUG', scriptName + ' >> request as string', JSON.stringify(payload));
    //@TODO currently we do only one action. if we were to make more actions, we would need more checks for params here.
    //call restlet here to do lastitem
    if (payload.items !== null && payload.lastitem !== null){
        var rest_response_string = callRESTlet(payload);//string
        var rest_response_object = JSON.parse(rest_response_string);
        if (rest_response_object.status === 'SUCCESS') {
            response.writeLine("var resp = " + rest_response_string + ";"); //assign resp on success to use in callback
            response.writeLine("sessionStorage.setItem('status','SUCCESS');");
            response.writeLine("sessionStorage.setItem('response',JSON.stringify("+ rest_response_string +"));");
        } else {
            //respond fail due to RESTlet not giving success
            response.writeLine("sessionStorage.setItem('status','"+ rest_response_object.status +"');")
        }
    } else {
        //respond fail due to Suitelet not enough params
        var reason = payload.items === null ?
            "missing data: no items in cart" :
            payload.lastitem === null ?
                "missing data: last item added to cart" :
                "unknown suitelet error";

        response.writeLine( "sessionStorage.setItem('status', '"+ reason +"');" );
    }

}


/**
 * something i copied from netsuite docs that prevents 'Infinity' from breaking your code.  and also 'null', i think.
 * only used for POST.  example:  JSON.stringify(payload, replacer);
 */
function replacer(key, value){
    if (typeof value === "number" && !isFinite(value)){
        return String(value);
    }
    return value;
}

//receive object, spit out string
function callRESTlet(payload){
    var RESTlet = {};
    RESTlet.Settings = getRESTletSettings(payload);

    //call the restlet
    nlapiLogExecution('DEBUG',scriptName + ' > Calling RESTLET ', RESTlet.Settings.URL);
    RESTlet.Response = nlapiRequestURL(RESTlet.Settings.URL + "&action=bundle", null, RESTlet.Settings.HEADERS); //if we add more actions, make this not hard-coded

    //doing stuff with the restlet response
    RESTlet.BodyString = RESTlet.Response.getBody(); //this is the output returned from suitelet
    RESTlet.BodyObj = RESTlet.BodyString ? JSON.parse(RESTlet.BodyString) : {status: 'FAILED', reason: 'empty'};

    RESTlet.CODE = RESTlet.Response.getCode();
    RESTlet.Error = RESTlet.Response.getError();

    if (RESTlet.CODE !== 200) {
        //restlet returned an error
        return handleRESTletError(RESTlet);
    } else {
        //restlet returned data. receiving object from restlet.
        if (RESTlet.BodyObj.status === "SUCCESS") {
            nlapiLogExecution('DEBUG', scriptName + ' >> REST response SUCCESS ', RESTlet.BodyString);
        } else {
            nlapiLogExecution('AUDIT', scriptName + ' >> REST response FAILED ', RESTlet.BodyString);
        }
        return JSON.stringify(RESTlet.BodyObj); //dont return body string because we need to escape ".  therefore, we return JSON.stringify( {} ) to preserve \"
    }
}

function handleRESTletError(RESTlet){
    nlapiLogExecution('ERROR',scriptName + ' > REST error code:', RESTlet.CODE);
    nlapiLogExecution('ERROR',scriptName + ' > REST error stringified:', JSON.stringify(RESTlet.Error));
    nlapiLogExecution('ERROR',scriptName + ' > REST body string:', JSON.stringify(RESTlet.BodyObj));
    //handle error or restlet here

    return {status: "ERROR: "+ RESTlet.code};
}

function getRESTletSettings(payload){
    var context = nlapiGetContext();
    var environment = context.environment;

    //Setting up URL
    var url = {
        base: {
            SANDBOX: "https://4516274-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=432&deploy=1",
            PRODUCTION: "https://4516274.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=434&deploy=1"
        },
        items: '&items=',
        lastitem: '&lastitem=',
        getFullURL: function(){
            var env = environment || 'SANDBOX', //environment is grabbed from the global
                items = this.items + payload.items,
                lastitem = this.lastitem + payload.lastitem;
            return this.base[env] + lastitem + items;
        }
        //2.0 resolve for SB, url.resolveScript({scriptId: 432, deploymentId: 788, returnExternalUrl: false}) returns "/app/site/hosting/restlet.nl?script=432&deploy=788&compid=4516274_SB1"
        //2.0 resolve for SB, url.resolveScript({scriptId: 432, deploymentId: 788, returnExternalUrl: true}) returns ""https://rest.netsuite.com/app/site/hosting/restlet.nl?script=432&deploy=788&compid=4516274_SB1""
    };

    //Calling credential function from the attached library to use for headers
    nlapiLogExecution('DEBUG', scriptName + ' >> nlapiGetContext().environment', environment);
    var cred = new Credentials(environment);

    //Setting up Headers
    var headers = {
        "User-Agent-x": "SuiteScript-Call",
        "Authorization": "NLAuth nlauth_account=" + cred.account + ", nlauth_email=" + cred.email +
        ", nlauth_signature= " + cred.signature + ", nlauth_role=" + cred.role,
        "Content-Type": "application/json"
    };

    return {
        URL: url.getFullURL(),
        HEADERS: headers
    }
}