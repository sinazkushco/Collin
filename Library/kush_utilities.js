/**
 *@NApiVersion 2.x
*/

define(['N/url', 'N/runtime'], function (url, runtime) {
    /**
     * 
     * @param {Object} options
     * @param {String} options.scriptId
     * @param {String} options.deploymentId
     * @param {String} options.hostType
     */
    function getScriptUrl(options) {
        var scriptId = options.scriptId;
        var deploymentId = options.deploymentId;
        var hostType = 'FORM';
        var hostTypes = {
            APPLICATION: true,
            CUSTOMER_CENTER: true,
            FORM: true,
            RESTLET: true,
            SUITETALK: true
        }
        if (hostTypes[options.hostType]) {
            hostType = options.hostType
        }

        var baseURL = url.resolveDomain({
            hostType: url.HostType[hostType],
            accountId: runtime.accountId
        });

        var URLPath = url.resolveScript({
            scriptId: scriptId,
            deploymentId: deploymentId,
            returnExternalURL: true
        });

        return baseURL + URLPath;
    }

    /**
     * @param {String} strData
     * @param {String} strDelimiter
     */
    function CSVToArray(strData, strDelimiter) {
        // Source: https://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
        // This will parse a delimited string into an array of
        // arrays. The default delimiter is the comma, but this
        // can be overriden in the second argument.
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");
        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
            (
                // Delimiters.
                "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                // Quoted fields.
                "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                // Standard fields.
                "([^\"\\" + strDelimiter + "\\r\\n]*))"
            ),
            "gi"
        );
        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]];
        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null;
        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec(strData)) {
            // Get the delimiter that was found.
            var strMatchedDelimiter = arrMatches[1];
            // Check to see if the given delimiter has a length
            // (is not the start of string) and if it matches
            // field delimiter. If id does not, then we know
            // that this delimiter is a row delimiter.
            if (
                strMatchedDelimiter.length &&
                (strMatchedDelimiter != strDelimiter)
            ) {
                // Since we have reached a new row of data,
                // add an empty row to our data array.
                arrData.push([]);
            }
            // Now that we have our delimiter out of the way,
            // let's check to see which kind of value we
            // captured (quoted or unquoted).
            if (arrMatches[2]) {
                // We found a quoted value. When we capture
                // this value, unescape any double quotes.
                var strMatchedValue = arrMatches[2].replace(
                    new RegExp("\"\"", "g"),
                    "\""
                );
            } else {
                // We found a non-quoted value.
                var strMatchedValue = arrMatches[3];
            }
            // Now that we have our value string, let's add
            // it to the data array.
            arrData[arrData.length - 1].push(strMatchedValue);
        }
        // Return the parsed data.
        return (arrData);
    }

    function CSVToJson(csv) {
        var lines = csv.split("\n");
        var result = [];
        var headers = lines[0].split(",");

        for (var i = 1; i < lines.length; i++) {
            var obj = {};
            var currentline = lines[i].split(",");

            for (var j = 0; j < headers.length; j++) {
                if(currentline[j]) {
                    obj[headers[j].trim()] = currentline[j].trim();
                }
            }
            if(Object.keys(obj).length !== 0 && obj.constructor === Object) {
                result.push(obj);
            }
        }
        return result;
    }

    return {
        getScriptUrl: getScriptUrl,
        CSVToArray: CSVToArray,
        CSVToJson: CSVToJson
    }
});
