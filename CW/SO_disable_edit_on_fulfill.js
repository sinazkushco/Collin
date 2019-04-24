function alert_and_redirect(exec) {
    if (exec === 'userinterface') {
        var picking_ticket_locations = nlapiGetFieldValue('custbody_locations_picked');
        if (picking_ticket_locations) {
            var allowed_roles = ['3', '1008', '1054'];
            if (allowed_roles.indexOf(role) == -1) {
                alert('You cannot edit this order while it is being fulfilled.\n Heading back to view mode!');
                var modal = jQuery('<div>').addClass('modal').css({
                    display: 'block',
                    position: 'fixed',
                    'z-index': '1000',
                    top: '0',
                    left: '0',
                    height: '100%',
                    width: '100%'
                });
                jQuery('body').append(modal); //create a loading screen model
                var current_url = window.location.href;
                var view_url = current_url.replace('&e=T', '');
                window.location.replace(view_url);
            }
        }
    }
}