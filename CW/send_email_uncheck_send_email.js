//customscript_send_email_after_submit
//sends email and unchecks send_email checkbox 
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
var scriptName = "SEND_EMAIL_UNCHECK_SEND_EMAIL";
define(['N/record', 'N/log', 'N/runtime', 'N/email', 'N/search'], after_submit_send_email);
function after_submit_send_email(record, log, runtime, email, search) {
    function execute(context) {
        var currentRecord = context.newRecord;
        var internalId = currentRecord.id;
        var recordType = currentRecord.type;
        var send_email = search.lookupFields({ //check if email needs to be sent, this returns a boolean value
            type: recordType,
            id: internalId,
            columns: "custentity_send_email_for_acc_creat"
        });
        send_email = send_email.custentity_send_email_for_acc_creat;
        log.audit({
            title: 'send email ' + scriptName,
            details: 'value ' + send_email + ' internalid ' + internalId + " recordtype " + recordType
        });
        if (send_email) {
            var loadedRecord = record.load({
                type: recordType,
                id: internalId,
                isDynamic: false,
                defaultValues: null
            });

            // var send_email = loadedRecord.getValue('custentity_send_email_for_acc_creat');
            log.audit({
                title: 'pass context check ' + send_email
            });

            log.audit({
                title: 'pass send_email check'
            });
            var environment = runtime.envType;
            var cust_email = loadedRecord.getValue('email');

            loadedRecord.setValue('custentity_send_email_for_acc_creat', false);
            log.debug({
                title: 'send email' + scriptName,
                details: 'value ' + loadedRecord.getValue('custentity_send_email_for_acc_creat')
            });
            var from_id;
            var link;
            if (environment === "SANDBOX") {
                link = 'https://checkout.netsuite.com/c.4516274_SB1/checkout-2-05-0/index.ssp?is=login&sc=6&login=T&sc=6&origin=customercenter&' + cust_email + '#login-register';
                from_id = 638378; //collin wong
            } else {
                //link = 'https://checkout.kushbottles.com/checkout-2-05-0/index.ssp?sc=1&reset=T&is=login&login=T&exist=T&email=' + cust_email + '#login-register';
                //from_id = 4926;  //hello@kushbottles.com
                link = 'https://www.kushsupplyco.com/sca-dev-aconcagua/checkout.ssp?is=login&login=T&fragment=login-register#/forgot-password';
                from_id = 943918;//noreply@kushbottles.com
            }
            try {
                var success = loadedRecord.save();
                if (success) {
                    log.debug({
                        title: 'SUCCESS AT' + scriptName,
                        details: 'Record Saved' + success
                    });
                    var subject = 'Welcome to KushSupplyCo!';
                    var body = "<br/><div style='padding:30px'>Welcome to <a href='https://www.kushsupplyco.com//'>KushSupplyCo.com</a>! <br/> Your online account has been created. Please use this link to set a password: <a href='" + link + "'>Create Password</a></div>";
                    var styled_body = returnEmailBody(body);
                    email.send({
                        author: from_id, //id of sender
                        recipients: cust_email, //array of ids, can be numbers or strings
                        subject: subject,
                        body: styled_body
                    });
                }
            } catch (error) {
                log.error({
                    title: 'FAILED TO SAVE' + scriptName,
                    details: cust_email + JSON.stringify(error)
                });
            }
            //defined in https://system.netsuite.com/app/common/media/mediaitem.nl?id=386049
        }
    }
    return {
        afterSubmit: execute
    };
}

function returnEmailBody(body) {
    return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\
    <html xmlns="http://www.w3.org/1999/xhtml">\
    \
    <head>\
            <!-- NAME: 1:2 COLUMN -->\
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\
            <meta name="viewport" content="width=device-width, initial-scale=1.0">\
            <title>\
            Kush Bottles TSM/SSS Notification\
            </title>\
        \
            <style type="text/css">\
            body,\
            #bodyTable,\
            #bodyCell {\
                height: 100% !important;\
                margin: 0;\
                padding: 0;\
                width: 100% !important;\
        }\
        \
            table {\
                border-collapse: collapse;\
        }\
        \
            img,\
            a img {\
                border: 0;\
                outline: none;\
                text-decoration: none;\
        }\
        \
            h1,\
            h2,\
            h3,\
            h4,\
            h5,\
            h6 {\
                margin: 0;\
                padding: 0;\
        }\
        \
            p {\
                margin: 1em 0;\
                padding: 0;\
        }\
        \
            a {\
                word-wrap: break-word;\
        }\
        \
            em {\
                text-align: center !important;\
                display: block;\
        }\
        \
            .ReadMsgBody {\
                width: 100%;\
        }\
        \
            .ExternalClass {\
                width: 100%;\
        }\
        \
            .ExternalClass,\
            .ExternalClass p,\
            .ExternalClass span,\
            .ExternalClass font,\
            .ExternalClass td,\
            .ExternalClass div {\
                line-height: 100%;\
        }\
        \
            table,\
            td {\
                mso-table-lspace: 0pt;\
                mso-table-rspace: 0pt;\
        }\
        \
            #outlook a {\
                padding: 0;\
        }\
        \
            img {\
                -ms-interpolation-mode: bicubic;\
        }\
        \
            body,\
            table,\
            td,\
            p,\
            a,\
            li,\
            blockquote {\
                -ms-text-size-adjust: 100%;\
                -webkit-text-size-adjust: 100%;\
        }\
        \
            #templatePreheader,\
            #templateHeader,\
            #templateBody,\
            #templateColumns,\
            .templateColumn,\
            #templateFooter {\
                min-width: 100%;\
        }\
        \
            #bodyCell {\
                padding: 20px;\
        }\
        \
            .mcnImage {\
                vertical-align: bottom;\
        }\
        \
            .mcnTextContent img {\
                height: auto !important;\
        }\
        \
            body,\
            #bodyTable {\
                background-color: #F2F2F2;\
        }\
        \
            #bodyCell {\
                border-top: 0;\
        }\
        \
            #templateContainer {\
                border: 0;\
        }\
        \
            h1 {\
                color: #606060 !important;\
                display: block;\
                font-family: Helvetica;\
                font-size: 40px;\
                font-style: normal;\
                font-weight: bold;\
                line-height: 125%;\
                letter-spacing: -1px;\
                margin: 0;\
                text-align: center;\
                padding: 20px 20px 0 20px;\
        }\
        \
            h2 {\
                color: #404040 !important;\
                display: block;\
                font-family: Helvetica;\
                font-size: 26px;\
                font-style: normal;\
                font-weight: bold;\
                line-height: 125%;\
                letter-spacing: -.75px;\
                margin: 0;\
                text-align: left;\
                padding: 20px 20px 10px 20px;\
        }\
        \
            h3 {\
                color: #606060 !important;\
                display: block;\
                font-family: Helvetica;\
                font-size: 15px;\
                font-style: normal;\
                font-weight: normal;\
                line-height: 125%;\
                letter-spacing: -.5px;\
                margin: 0;\
                text-align: left;\
                padding: 30px 20px 30px 20px;\
                border-bottom: 1px solid #f2f2f2;\
        }\
        \
        \
            h4 {\
                color: #808080 !important;\
                display: block;\
                font-family: Helvetica;\
                font-size: 16px;\
                font-style: normal;\
                font-weight: bold;\
                line-height: 125%;\
                letter-spacing: normal;\
                margin: 0;\
                text-align: left;\
        }\
        \
            #templatePreheader {\
                background-color: #FFFFFF;\
                border-top: 0;\
                border-bottom: 0;\
        }\
        \
            .preheaderContainer .mcnTextContent,\
            .preheaderContainer .mcnTextContent p {\
                color: #606060;\
                font-family: Helvetica;\
                font-size: 11px;\
                line-height: 125%;\
                text-align: left;\
        }\
        \
            .preheaderContainer .mcnTextContent a {\
                color: #606060;\
                font-weight: normal;\
                text-decoration: underline;\
        }\
        \
            #templateHeader {\
                background-color: #222222;\
                border-top: 10px solid #222222;\
                border-bottom: 10px solid #222222;\
        }\
        \
            .headerContainer .mcnTextContent,\
            .headerContainer .mcnTextContent p {\
                color: #606060;\
                font-family: Helvetica;\
                font-size: 15px;\
                line-height: 150%;\
                text-align: left;\
        }\
        \
            .headerContainer .mcnTextContent a {\
                color: #6DC6DD;\
                font-weight: normal;\
                text-decoration: underline;\
        }\
        \
            #templateBody {\
                background-color: #FFFFFF;\
                border-top: 0;\
                border-bottom: 0;\
        }\
        \
            .bodyContainer .mcnTextContent,\
            .bodyContainer .mcnTextContent p {\
                color: #606060;\
                font-family: Helvetica;\
                font-size: 15px;\
                line-height: 150%;\
                text-align: left;\
        }\
        \
            .bodyContainer .mcnTextContent a {\
                color: #66a9c4;\
                font-weight: normal;\
                text-decoration: none;\
        }\
        \
            #templateColumns {\
                background-color: #FFFFFF;\
                border-top: 0;\
                border-bottom: 0;\
        }\
        \
            .leftColumnContainer .mcnTextContent,\
            .leftColumnContainer .mcnTextContent p {\
                color: #606060;\
                font-family: Helvetica;\
                font-size: 15px;\
                line-height: 150%;\
                text-align: left;\
        }\
        \
            .leftColumnContainer .mcnTextContent a {\
                color: #6DC6DD;\
                font-weight: normal;\
                text-decoration: underline;\
        }\
        \
            .rightColumnContainer .mcnTextContent,\
            .rightColumnContainer .mcnTextContent p {\
                color: #606060;\
                font-family: Helvetica;\
                font-size: 15px;\
                line-height: 150%;\
                text-align: left;\
        }\
        \
            .rightColumnContainer .mcnTextContent a {\
                color: #6DC6DD;\
                font-weight: normal;\
                text-decoration: underline;\
        }\
        \
            #templateFooter {\
                background-color: #FFFFFF;\
                border-top: 0;\
                border-bottom: 0;\
        }\
        \
            .footerContainer .mcnTextContent,\
            .footerContainer .mcnTextContent p {\
                color: #606060;\
                font-family: Helvetica;\
                font-size: 11px;\
                line-height: 125%;\
                text-align: left;\
        }\
        \
            .footerContainer .mcnTextContent a {\
                color: #606060;\
                font-weight: normal;\
                text-decoration: underline;\
        }\
            /*MY STYLES*/\
        \
            .item-list {\
                font-family: sans-serif !important;\
                font-size: 12px;\
        }\
        \
            .item-table {\
                width: 100%;\
        }\
        \
            .item-header {\
                font-weight: bold;\
        }\
        \
            .item-header th {\
                padding: 0 0 10px 0;\
        }\
        \
            .item-subtotal {\
                border-top: 1px solid #f2f2f2;\
        }\
        \
            .item-subtotal td {\
                padding: 10px 0 0 0;\
        }\
        \
            .item-line td {\
                padding: 0 0 10px 0;\
        }\
        \
            .item-shipping td {\
                padding: 10px 0 0 0;\
        }\
        \
            .item-tax td {\
                padding: 10px 0 0 0;\
        }\
        \
            .item-total td {\
                padding: 10px 0 0 0;\
        }\
            /*MY STYLES END*/\
        \
            @media only screen and (max-width: 480px) {\
                body,\
                table,\
                td,\
                p,\
                a,\
                li,\
                blockquote {\
                -webkit-text-size-adjust: none !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                body {\
                width: 100% !important;\
                min-width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[id=bodyCell] {\
                padding: 10px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcnTextContentContainer] {\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                .mcnBoxedTextContentContainer {\
                max-width: 100% !important;\
                min-width: 100% !important;\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcpreview-image-uploader] {\
                width: 100% !important;\
                display: none !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                img[class=mcnImage] {\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcnImageGroupContentContainer] {\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnImageGroupContent] {\
                padding: 9px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnImageGroupBlockInner] {\
                padding-bottom: 0 !important;\
                padding-top: 0 !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                tbody[class=mcnImageGroupBlockOuter] {\
                padding-bottom: 9px !important;\
                padding-top: 9px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcnCaptionTopContent],\
                table[class=mcnCaptionBottomContent] {\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcnCaptionLeftTextContentContainer],\
                table[class=mcnCaptionRightTextContentContainer],\
                table[class=mcnCaptionLeftImageContentContainer],\
                table[class=mcnCaptionRightImageContentContainer],\
                table[class=mcnImageCardLeftTextContentContainer],\
                table[class=mcnImageCardRightTextContentContainer] {\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnImageCardLeftImageContent],\
                td[class=mcnImageCardRightImageContent] {\
                padding-right: 18px !important;\
                padding-left: 18px !important;\
                padding-bottom: 0 !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnImageCardBottomImageContent] {\
                padding-bottom: 9px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnImageCardTopImageContent] {\
                padding-top: 18px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcnCaptionLeftContentOuter] td[class=mcnTextContent],\
                table[class=mcnCaptionRightContentOuter] td[class=mcnTextContent] {\
                padding-top: 9px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnCaptionBlockInner] table[class=mcnCaptionTopContent]:last-child td[class=mcnTextContent] {\
                padding-top: 18px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnBoxedTextContentColumn] {\
                padding-left: 18px !important;\
                padding-right: 18px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=columnsContainer] {\
                display: block !important;\
                max-width: 600px !important;\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=mcnTextContent] {\
                padding-right: 18px !important;\
                padding-left: 18px !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[id=templateContainer],\
                table[id=templatePreheader],\
                table[id=templateHeader],\
                table[id=templateColumns],\
                table[class=templateColumn],\
                table[id=templateBody],\
                table[id=templateFooter] {\
                max-width: 600px !important;\
                width: 100% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                h1 {\
                font-size: 24px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                h2 {\
                font-size: 20px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                h3 {\
                font-size: 18px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                h4 {\
                font-size: 16px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[class=mcnBoxedTextContentContainer] td[class=mcnTextContent],\
                td[class=mcnBoxedTextContentContainer] td[class=mcnTextContent] p {\
                font-size: 18px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                table[id=templatePreheader] {\
                display: block !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=preheaderContainer] td[class=mcnTextContent],\
                td[class=preheaderContainer] td[class=mcnTextContent] p {\
                font-size: 14px !important;\
                line-height: 115% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=headerContainer] td[class=mcnTextContent],\
                td[class=headerContainer] td[class=mcnTextContent] p {\
                font-size: 18px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=bodyContainer] td[class=mcnTextContent],\
                td[class=bodyContainer] td[class=mcnTextContent] p {\
                font-size: 18px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=leftColumnContainer] td[class=mcnTextContent],\
                td[class=leftColumnContainer] td[class=mcnTextContent] p {\
                font-size: 18px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=rightColumnContainer] td[class=mcnTextContent],\
                td[class=rightColumnContainer] td[class=mcnTextContent] p {\
                font-size: 18px !important;\
                line-height: 125% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=footerContainer] td[class=mcnTextContent],\
                td[class=footerContainer] td[class=mcnTextContent] p {\
                font-size: 14px !important;\
                line-height: 115% !important;\
            }\
        }\
        \
            @media only screen and (max-width: 480px) {\
                td[class=footerContainer] a[class=utilityLink] {\
                display: block !important;\
            }\
        }\
        </style>\
    </head>\
    \
    <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="margin: 0;padding: 0;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;background-color: #F2F2F2;height: 100% !important;width: 100% !important;">\
        \
        <center>\
            <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;margin: 0;padding: 20px;background-color: #F2F2F2;height: 100% !important;width: 100% !important;">\
            <tr>\
                <td align="center" valign="top" id="bodyCell" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;margin: 0;padding: 20px;border-top: 0;height: 100% !important;width: 100% !important;">\
                <!-- BEGIN TEMPLATE // -->\
                <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateContainer" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;border: 0; background-color:white">\
                    <tr>\
                    <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                        <!-- BEGIN PREHEADER // -->\
                        <table border="0" cellpadding="0" cellspacing="0" width="600" id="templatePreheader" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
                        <tr>\
                            <td valign="top" class="preheaderContainer" style="padding-top: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                <tbody class="mcnTextBlockOuter">\
                                <tr>\
                                <td valign="top" class="mcnTextBlockInner" style="padding-top: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                    <!--[if mso]>\
                                    <table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">\
                                    <tr>\
                                    <![endif]-->\
        \
        \
                            </td>\
                                <![endif]-->\
        \
                                <!--[if mso]>\
                            </tr>\
                            </table>\
                                <![endif]-->\
                            </td>\
                            </tr>\
                            </tbody>\
                        </table>\
                        </td>\
                    </tr>\
                    </table>\
                        <!-- // END PREHEADER -->\
                </td>\
                </tr>\
                    <tr>\
                    <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
								<!-- BEGIN HEADER // -->\
								<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateHeader" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #222222;border-top: 10px solid #222222;border-bottom: 10px solid #222222;">\
								<tr>\
									<td valign="top" class="headerContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
									<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnImageBlock" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
										<tbody class="mcnImageBlockOuter">\
										<tr>\
										<td valign="top" style="padding: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;" class="mcnImageBlockInner">\
											<table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" class="mcnImageContentContainer" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
											<tbody>\
											<tr>\
												<td class="mcnImageContent" valign="top" style="padding-right: 9px;padding-left: 9px;padding-top: 0;padding-bottom: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
				\
				\
												<img align="left" alt="header image" src="https://www.kushsupplyco.com/Images/Global/logo/KSC_logo_white.png" width="200" style="max-width: 200px;padding-bottom: 0;display: inline !important;vertical-align: bottom;border: 0;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;" class="mcnImage">\
				\
				\
												</td>\
										</tr>\
										</tbody>\
										</table>\
									</td>\
									</tr>\
									</tbody>\
								</table>\
								</td>\
							</tr>\
							</table>\
								<!-- // END HEADER -->\
                </td>\
                </tr>\
                <tr>\
							<td align="left" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
								<!-- BEGIN BODY // -->\
								<table border="0" cellpadding="0" cellspacing="0" width="600" id="templateBody" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
								<!--PLACE CONTENT HERE---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------->\
				'+ body + ' \
						\
								<!-- // END BODY -->\
                    <tr>\
                    <td align="left" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                     \
                </td>\
                </tr>\
                    <tr>\
                    <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                        <!-- BEGIN COLUMNS // -->\
                        <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateColumns" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
                        <tr>\
                            <td align="left" valign="top" class="columnsContainer" width="50%" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;">\
                                <tr>\
                                <td valign="top" class="leftColumnContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;"></td>\
                            </tr>\
                        </table>\
                        </td>\
                            <td align="left" valign="top" class="columnsContainer" width="50%" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="templateColumn" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;">\
                                <tr>\
                                <td valign="top" class="rightColumnContainer" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;"></td>\
                            </tr>\
                        </table>\
                        </td>\
                    </tr>\
                    </table>\
                        <!-- // END COLUMNS -->\
                </td>\
                </tr>\
                    <tr>\
                    <td align="center" valign="top" style="mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                        <!-- BEGIN FOOTER // -->\
                        <table border="0" cellpadding="0" cellspacing="0" width="600" id="templateFooter" style="border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;min-width: 100%;background-color: #FFFFFF;border-top: 0;border-bottom: 0;">\
                        <tr>\
                            <td valign="top" class="footerContainer" style="padding-bottom: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
        \
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnTextBlock" style="min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                <tbody class="mcnTextBlockOuter">\
                                <tr>\
                                <td valign="top" class="mcnTextBlockInner" style="padding-top: 9px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;">\
                                    <!--[if mso]>\
                                    <table align="left" border="0" cellspacing="0" cellpadding="0" width="100%" style="width:100%;">\
                                    <tr>\
                                    <![endif]-->\
                                    <!--[if mso]>\
                                    <td valign="top" width="600" style="width:600px;">\
                                    <![endif]-->\
                                    <table align="left" border="0" cellpadding="0" cellspacing="0" style="max-width: 100%;min-width: 100%;border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;" width="100%" class="mcnTextContentContainer">\
                                    <tbody>\
                                    <tr>\
        \
                                        <td valign="top" class="mcnTextContent" style="padding-top: 0;padding-right: 18px;padding-bottom: 9px;padding-left: 18px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%;color: #606060;font-family: Helvetica;font-size: 11px;line-height: 125%;text-align: left;">\
        \
                                        <em style="text-align: center;">Copyright © Kush Supply CO. , All rights reserved.</em>\
                                        <br>\
                                        <!--<br>\
                                        <strong>Our mailing address is:</strong><br>\
                                        *|HTML:LIST_ADDRESS_HTML|* *|END:IF|*<br>-->\
                                        <br>\
                                    </td>\
                                </tr>\
        \
                                </tbody>\
                                </table>\
                                    <!--[if mso]>\
                                </td>\
                                    <![endif]-->\
                                    <!--[if mso]>\
                                </tr>\
                                </table>\
                                    <![endif]-->\
                            </td>\
                            </tr>\
                            </tbody>\
                        </table>\
                        </td>\
                    </tr>\
                    </table>\
                        <!-- // END FOOTER -->\
                </td>\
                </tr>\
            </table>\
                <!-- // END TEMPLATE -->\
            </td>\
        </tr>\
        </table>\
    </center>\
    </body>\
        \
        </html>'
}