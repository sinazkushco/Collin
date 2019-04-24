/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *@NModuleScope Public
 */
define(["require", "exports", "N/log", "N/record", "../Library/moment"], function (require, exports, log, record, moment) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.post = function (context) {
        var response = {
            success: false,
            message: 'failed',
        };
        var id_map = {
            customer_name: 'custrecord_customer_name',
            nps_rating: 'custrecord_nps_rating',
            nps_response1: 'custrecord_nps_response_1',
            nps_response2: 'custrecord_nps_response_2',
            order_number: 'custrecord_order_number',
            date: 'custrecord_date_created'
        };
        if (context.access) {
            var data = JSON.parse(context.payload);
            log.debug('data', data);
            data = verify_data(data);
            log.debug('data after verify', data);
            if (data) {
                var saved = create__nsp_record(data, id_map);
                if (saved) {
                    log.debug('saved', saved);
                    response.success = true;
                    response.message = 'record saved ' + saved;
                }
                var customer_updated = record.submitFields({
                    type: record.Type.CUSTOMER,
                    id: data.customer_name,
                    values: {
                        'custentity_nps_last_submitted_date': data.date
                    }
                });
                log.debug('customer_updated', customer_updated);
            }
        }
        return response;
    };
    function create__nsp_record(data, id_map) {
        var nsp_entry = record.create({
            type: 'customrecord_nps_data'
        });
        for (var key in data) {
            log.debug('key', key);
            log.debug('id_map', id_map[key]);
            log.debug('data[key]', data[key]);
            nsp_entry.setValue({
                fieldId: id_map[key],
                value: data[key]
            });
        }
        return nsp_entry.save();
    }
    function verify_data(data) {
        for (var key in data) {
            if (!data[key]) {
                return false;
            }
        }
        // var datetime = new Date(data.date);
        data.date = moment(data.date, 'MM/DD/YYYY').toDate();
        return data;
    }
});
