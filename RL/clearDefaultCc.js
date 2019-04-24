/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

//  Clears default credit card on customer accounts with terms
define(['N/email'], runUserEvent);

function runUserEvent() {
    function clearDefaultCc(context) {
        if(context.type == context.UserEventType.DELETE) {
            log.debug({
                title: 'Context Type is Delete',
                details: context.type
            })
            return;
        }

        var terms = context.newRecord.getValue({
            fieldId: 'terms'
        });
        
        if(terms) {
            log.debug({
                title: 'Terms exist',
                details: 'Term value: ' + terms
            })
            var numberOfCreditCards = context.newRecord.getLineCount({
                sublistId: 'creditcards'
            });

            for(var line=0; line < numberOfCreditCards; line++) {
                var defaultCreditCard = context.newRecord.getSublistValue({
                    sublistId: 'creditcards',
                    fieldId: 'ccdefault',
                    line: line
                });

                if(defaultCreditCard) {
                    log.debug({
                        title: 'Default CC found',
                        details: 'Default CC (' + (typeof defaultCreditCard) + '): ' + defaultCreditCard + ' on line: ' + line
                    })
                    // Set default credit card to false
                    context.newRecord.setSublistValue({
                        sublistId: 'creditcards',
                        fieldId: 'ccdefault',
                        line: line,
                        value: false
                    });
                }
            }
        }
    }

    function beforeSubmit(context) {
        try {
            clearDefaultCc(context);
        } 
        catch(error) {
            email.send({
                author: 1209212,// Randy's internalId
                recipients: 'dev@kushbottles.com',
                subject: 'Error occured on Customer Record ',
                body: 'There was an issue with the clearDefaultCc.js script.\nPlease contact Randy if there are any questions.',
            })
        }
    }

	return {
        beforeSubmit: beforeSubmit
    };
}
