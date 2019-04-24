function suitelet(request, response) {
    try {

        var id = request.getParameter('so_id');
        if(! id) {
            response.write('so_id parameter missing');
        }
        nlapiLogExecution("debug", "title", id);
        var record = nlapiLoadRecord('salesorder', id);
        var subsidiaryId = record.getFieldValue("subsidiary") || "1";
        var companyInfo = nlapiLoadRecord("subsidiary", subsidiaryId);
        // var logo = companyInfo.getValue("logo").replace("&","&amp;");
        // companyInfo.setValue("logo", logo);
        //var companyInfo = nlapiLoadConfiguration("companyinformation");
        var renderer = nlapiCreateTemplateRenderer();
        var template = nlapiLoadFile('SuiteScripts/Advanced PDF Forms/proformainvoice.xml');
        renderer.setTemplate(template.getValue());
        renderer.addRecord('companyInformation', companyInfo);
        renderer.addRecord('record', record);
        var xml = renderer.renderToString();
        var pdf = nlapiXMLToPDF(xml);
        response.setContentType('PDF', 'proforma.pdf', 'inline');
        response.write(pdf.getValue());

    } catch(err) {
        response.write(err + ' (line number: ' + err.lineno + ')');
        return;
    }
}