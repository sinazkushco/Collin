function LookupFeaturedItems(request, response)
{
var pauseLoop = false;
    if (request.getMethod() == 'GET')
    {
        var catURL = 'https://www.kushbottles.com/homepage-featured-items';
        var catResponse = nlapiRequestURL(catURL, null, null);

        var searchStrBegin = '<div id="kb-catlist-begin"';
        var searchStrEnd = '<div id="kb-catlist-end"';

        var pageHTML = '';
        pageHTML = catResponse.getBody();
        var startIndex = pageHTML.indexOf(searchStrBegin);
        var endIndex = pageHTML.indexOf(searchStrEnd);
        
        if ((startIndex > 0) && (endIndex > 0))
        {
            var catHTML = pageHTML.substring(startIndex, endIndex);
            var lines = catHTML.split(/\r?\n/);

            var jsFuncs = '';
            response.setContentType('JAVASCRIPT');
            response.write('function updateFeaturedItems() { \n');
            response.write('var featuredItemsHTML = \'\'; \n');
            for (var i = 0; i < lines.length; i++)
            {
                var jsLine1 = lines[i];
                var jsStartIndex = jsLine1.indexOf('<script');
                var startSkipIndex = jsLine1.indexOf('QuickView Modal Start');
                var endSkipIndex = jsLine1.indexOf('QuickView Modal End');
                if(startSkipIndex >= 0) {
                    pauseLoop = true;
                }
                if(endSkipIndex >= 0) {
                    pauseLoop = false;
                }

                if(!pauseLoop) {
                    if (jsStartIndex >= 0)
                    {
                        var scriptCode = true;
                        while (scriptCode)
                        {
                            i++;
                            jsLine1 = lines[i];
                            var jsEndIndex = jsLine1.indexOf('</script>');
                            if (jsEndIndex >= 0)
                            {
                                i++;
                                if (i < lines.length)
                                {
                                    jsLine1 = lines[i];
                                }
                                scriptCode = false;
                            }
                            else
                            {
                                jsFuncs += jsLine1 + '\n';
                            }
                        }
                    }
                    if (i < lines.length)
                    {
                        var find = '\'';
                        var re = new RegExp(find, 'g');

                        var jsLine2 = jsLine1.replace(re, '\\\'');
                        var jsLine3 = 'featuredItemsHTML += \'' + jsLine2 + '\';';
                        response.write(jsLine3 + '\n');
                    }
                }
            }

            response.write('document.getElementById(\'kb-featured-items\').innerHTML = featuredItemsHTML;\n');
            response.write('}\n');
            response.write('updateFeaturedItems();\n');
            response.write(jsFuncs);
        }
        else
        {
          //response.write('Original Page: \n');
          //response.write(pageHTML);
        }
    }
    else
    {
       //response.write('Please use a GET request\n');
    }
}
