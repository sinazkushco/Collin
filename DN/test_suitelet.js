var SEARCHMODULE, UIMODULE, RENDER, FILE, RECORD;

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(['N/search', 'N/ui/serverWidget', 'N/render', 'N/file', 'N/record'], runSuitelet);

//********************** MAIN FUNCTION **********************
function runSuitelet(search, ui, render, file, record) {
    SEARCHMODULE = search;
    UIMODULE = ui;
    RENDER = render;
    FILE = file;
    RECORD = record;

    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}

function execute(context) {
    var template;
    //var id = context.request.parameters.id;
    var id = "755535";
    //var project = nlapiLoadRecord("job", id);
    var project = RECORD.load({
        type: 'job',
        id: id
    });
    //var projectId = project.getFieldValue("entityid").split(" ")[0];
    var customer = RECORD.load({
        type: 'customer',
        id: project.getValue("parent")
    });

    var estimate = RECORD.load({
        type: 'estimate',
        id: project.getValue("custentity_pm_estimate_record")
    });
    

    // var estimate = nlapiLoadRecord("estimate", 899993); //random estimate to work off of
    //var estimate = nlapiLoadRecord("salesorder", 478830); //random estimate to work off of

    // var estimateId = project.getFieldValue("custentity_pm_estimate_record");
    // var salesOrderId = project.getFieldValue("custentity_pm_sales_order_record");

    // if (salesOrderId) {
    //     estimate = nlapiLoadRecord("salesorder", salesOrderId); //random estimate to work off of
    // } else if (estimateId) {
    //     estimate = nlapiLoadRecord("estimate", estimateId); //random estimate to work off of
    // }

    // var today = getDate();



    var xmlTmplFile = FILE.load('531147');
    var myFile = RENDER.create();
    myFile.templateContent = xmlTmplFile.getContents();
    myFile.addRecord('project', project);
    myFile.addRecord('customer', customer);
    myFile.addRecord('estimate', estimate);
    var invoicePdf = myFile.renderAsPdf();
    // myFile.setName("SOW" + "TEST" + ".pdf");
    // myFile.setFolder("470656"); //ID for Statement of Work folder
    // myFile.setIsOnline(false); //TODO: CONFIRM FORM ONLINE
    // myFile.setEncoding('UTF-8');

    // var fileid = FILE.save(myFile);












    // if (context.request.method == 'GET') {
    //     context.response.write('Hello World'); //Example writing HTML string
    //     return;
    // } else {
    //     var form = UIMODULE.createForm({
    //         title: 'Demo Suitelet Form'
    //     }); //Example writing form object
    //     context.response.writePage(form);
    // }
}