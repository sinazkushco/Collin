/**
 *@NApiVersion 2.x
*@NScriptType Suitelet
*@NModuleScope Public
*/

define([
    'N/https',
    'N/xml',
    'N/file',
  ], function (https, xml, file) {
  
    function onRequest(context) {
      if (context.request.method == 'GET') {
        // Get SEC listing via RSS feed
        var response = https.get({
          url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001604627&type=&dateb=&owner=exclude&count=100&output=atom',
          headers: {
            'Content-type': 'application/xml'
          }
        });
  
        var xmlBody = response.body;
        var xmlDocument = xml.Parser.fromString(xmlBody);
        var entries = xmlDocument.getElementsByTagName('entry')

        var sec_data = entries.map(function(entry) {
            var filings = entry.getElementsByTagName('filing-type')[0],
                href = entry.getElementsByTagName('filing-href')[0],
                description = entry.getElementsByTagName('form-name')[0],
                filingDate = entry.getElementsByTagName('filing-date')[0],
                filingNumber = entry.getElementsByTagName('file-number')[0],
                filmNumber = entry.getElementsByTagName('film-number')[0],
                xbrl_href = entry.getElementsByTagName('xbrl_href')[0],
                amend = entry.getElementsByTagName('amend')[0],
                accession = entry.getElementsByTagName('accession-nunber')[0],
                act = entry.getElementsByTagName('act')[0],
                size = entry.getElementsByTagName('size')[0]

            filings = filings ? filings.textContent : '';
            href = href ? href.textContent : '';
            description = description? description.textContent : '';
            filingDate = filingDate ? filingDate.textContent : '';
            filingNumber = filingNumber ? filingNumber.textContent : '';
            filmNumber =  filmNumber ? filmNumber.textContent : '';
            xbrl_href = xbrl_href ? xbrl_href.textContent : '';
            amend = amend ? amend.textContent : '';
            accession = accession ? accession.textContent : '';
            act = act ? act.textContent : '';
            size = size ? size.textContent : '';

            log.debug('Data', {
                'Filings': filings,
                'Format': format,
                'Description': description,
                'Filing Date': filingDate,
                'File/Film Number': filingNumber,
                href: href.replace(' ', '/') 
            });

            var template = "<a href='{href}' target='_blank'>Documents</a>";
            var template2 = "<br/><a href='{xbrl_href}'target='_blank'>Interactive Data</a><br/><a href='https://www.kushco.com/xbrl-files/' target='_blank'>XBRL</a>";
            
            // Formats filing number
            if(filingNumber) {
                filingNumber = "<span style='color: red'>" + filingNumber +'</span>';
            }
            if(filmNumber) {
                filingNumber = filingNumber + '\n' + filmNumber;
            }
            // Formats description
            if(amend) {
                description = "<b>"+amend+"</b> " + description;
            }
            if(accession) {
                description = description + '<br/>Acc-no: ' + accession;
            }
            if(act) {
                description = description + ' ('+act+' Act)';
            }
            if(size) {
                description = description + ' Size: ' + size;
            }


            // Formats links for Format column
            var format = template.replace('{href}', href)
            if(xbrl_href) {
                format = format + template2.replace('{xbrl_href}', xbrl_href);
            }

            return {
                'Filings': filings,
                'Format': format,
                'Description': description,
                'Filing Date': filingDate,
                'File/Film Number': filingNumber
            }
        })

        context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
        context.response.setHeader('Access-Control-Allow-Origin', '*');
        context.response.write(JSON.stringify(sec_data));
        return;
      }
    }
  
    return {
      onRequest: onRequest
    }
  });