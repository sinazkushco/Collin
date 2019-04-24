function LookupFeaturedItems(request, response)
{
    if (request.getMethod() == 'GET')
    {
        var catURL = 'http://92705.kushbottles.com/homepage-featured-items';
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
            response.write(catHTML);
        }
    }
}
