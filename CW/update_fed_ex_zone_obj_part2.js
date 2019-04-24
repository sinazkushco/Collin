/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/log', 'N/record', 'N/http'],
    function (search, log, record, http) {
    
        function getInputData() {
            return search.create({
                type: "location",
                filters:
                    [
                        ["makeinventoryavailablestore", "is", "T"],
                        "AND", 
                        ["subsidiary","anyof","1"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC
                        }),
                        "zip"
                    ]
            });
        }

        function reduce(context) {
            var warehouses_with_zones = get_warehouse_zone_data();
            var data_base_updated = false;
            var context_values = JSON.parse(context.values[0]);
            var current_warehouse_zip = context_values.values.zip;
            var current_warehouse_id = context_values.id;
            log.debug(current_warehouse_id);
            log.debug('current_warehouse_zip',current_warehouse_zip);
            var warehouses_in_database = Object.keys(warehouses_with_zones['500']);
            log.debug('warehouses_in_database', warehouses_in_database);
            if(warehouses_in_database.indexOf(current_warehouse_id) == -1){
                data_base_updated = true;
                log.debug('create_fedex_zone_data','wooo');
                warehouses_with_zones = create_fedex_zone_data(current_warehouse_zip, warehouses_with_zones, current_warehouse_id);
            }
            if(data_base_updated){
                log.debug('database needs update','CMON!');
                record.submitFields({
                    type: 'customrecord_warehouses_with_zones',
                    id: '1',
                    values: {
                        'custrecord_warehouse_with_zones_obj': JSON.stringify(warehouses_with_zones)
                    }
                });
            }
        }

        function get_warehouse_zone_data(){            
            return JSON.parse(search.lookupFields({type:'customrecord_warehouses_with_zones',id:'1',columns:['custrecord_warehouse_with_zones_obj']}).custrecord_warehouse_with_zones_obj);
        }

        function create_fedex_zone_data(warehouse_zip, warehouses_with_zones, warehouse_internal_id) {
            for (var i = 500; i < 995; i++) {
                log.debug('started loop create fedex zone data', i);
                var destination_zip_code_first_3_digits = add_leading_zeroes(i);
                var full_destination_zip_code = add_ending_zeroes(destination_zip_code_first_3_digits);
                try {
                    if (warehouses_with_zones[destination_zip_code_first_3_digits]) {
                        var fedex_html = http.get({
                            url: 'http://www.fedex.com/ratetools/RateToolsMain.do?method=FindZones&origPostalCd=' + warehouse_zip + '&destPostalCd=' + full_destination_zip_code + '&destCountryCd=US'
                        });
                        var regex_results = fedex_html.body.match(/var groundZone = "([0-9]+)"/);
                        var zone = 'na';
                        if (regex_results) {
                            zone = fedex_html.body.match(/var groundZone = "([0-9]+)"/)[1];
                        }
                        warehouses_with_zones[destination_zip_code_first_3_digits][warehouse_internal_id] = zone;
                    }
                } catch (e) {
                    log.debug('FAILED TO GET FED EX ZONE DATA', e);
                    console.log(e);
                }
            }
            return warehouses_with_zones;
        }

        function add_leading_zeroes(zip_code) {
            var str_zip_code = zip_code.toString();
            while (str_zip_code.length < 3) {
                str_zip_code = '0' + str_zip_code;
            }
            return str_zip_code;
        }

        function add_ending_zeroes(zip_code) {
            zip_code += '00';
            return zip_code;
        }

        return {
            getInputData: getInputData,
            reduce: reduce
        };
    });