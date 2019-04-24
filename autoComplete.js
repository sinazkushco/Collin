// Script is used to autocomplete address through Google Places API.  Deployed on Address Form

//instatiate two global variables required by google api
var autocomplete;
var placeSearch;

// create script dynamically and add to head of DOM
function googleinit() {
    var user = nlapiGetContext().user;
    if(user == '528' || user == '806057'){
        var script = document.createElement('script');
        script.async = true;
        script.type = 'text/javascript';

        //callback added to api call, that calls first function after api has loaded
        script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBEE8ZxvoQGElmBorBQQd5j7XWHAikyjno&libraries=places&callback=autoComplete";

        var head = document.querySelector('head');
        head.appendChild(script);
    }
}


//function autoComplete is called by callback on Google API call.  
function autoComplete() {
    //identify element that will have autocomplete attached to it.
    var input = document.querySelector('#addr1');
    //instatiate google api object
    autocomplete = new google.maps.places.Autocomplete(input)
    //add event listener for place changed - calls fillInAddress.  'place_changed' is an event provided by Google that is called when the user clicks on an autocomplete recommendation or hits the enter key
    autocomplete.addListener('place_changed', fillInAddress);
}

//fillInAddress is called by event listener.  This takes returned object from Google and applys data to DOM elements.
function fillInAddress() {
    var place = autocomplete.getPlace();
    console.log(place)
    var elements = place.address_components;
    var street;
    var zip;

    //loop through address data object.  Checking against the types array for each index, and searching for the type of data within that element.
    for (var i = 0; i < elements.length; i++) {
        var current_element_type = elements[i].types[0];
        var value = elements[i].long_name;
        if (current_element_type == 'street_number') {
            street = value
        } else if (current_element_type == 'route') {
            street += ' ' + value
        } else if (current_element_type == 'postal_code') {
            zip = value;
        }
    }
    //set main address field and zip code.  NOTE: once zip code is populated, NS autopopulates both city and state fields.
    nlapiSetFieldValue('addr1', street)
    nlapiSetFieldValue('zip', zip)
    //addressee field is required before saving form.  Create a placeholder so user is aware.
    var addressee = document.querySelector('#addressee')
    addressee.placeholder = "Enter a value for Addressee"

}

