/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pageInit = function () {
        // entry point needed to upload script
    };
    exports.sendRegistrationEmail = function (emailAddress) {
        jQuery
            .ajax({
                method: "GET",
                url: "https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=558&deploy=1&compid=4516274&h=f9b2c1689ab4b8af7c34",
                data: {
                    type: "send_registration_url",
                    user_email: emailAddress
                }
            })
            .done(function () {
                var successElement = "<h1 id=\"email_success_message\" style=\"display: inline; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #44D62C;\">Registration Email Sent</h1>";
                jQuery(".uir-page-title-firstline").append(successElement);
                jQuery("#email_success_message").fadeOut(3000, function () {
                    jQuery("#email_success_message").remove();
                });
            });
    };
    exports.sendWillCallRegistrationEmail = function (emailAddress) {
        jQuery
            .ajax({
                method: "GET",
                url: "https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=800&deploy=1&compid=4516274&h=54a1ef9473c17337ec71",
                data: {
                    type: "send_registration_url",
                    user_email: emailAddress
                }
            })
            .done(function () {
                var successElement = "<h1 id=\"email_success_message\" style=\"display: inline; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #44D62C;\">Registration Email Sent</h1>";
                jQuery(".uir-page-title-firstline").append(successElement);
                jQuery("#email_success_message").fadeOut(3000, function () {
                    jQuery("#email_success_message").remove();
                });
            });
    };
    
});
