/* Version    Date            Author           Remarks
* 2.00       2018-02-13      cWong            Created Script
*
*/
/**
* @NApiVersion 2.x
* @NModuleScope SameAccount
*/
define(['N/log', 'N/search'],

    function (log, search) {
        function validate_uom(currentRecord) {
            try {
                alert = alert || function (string) { }
                debugger;
                var inner_carton_qty = currentRecord.getValue('custitem_ic_qty');
                var master_carton_qty = currentRecord.getValue('custitem_mc_qty');
                var missing_ea_fields = check_for_missing_values(currentRecord, 'ea')
                var missing_ic_fields = check_for_missing_values(currentRecord, 'ic');
                var uom_types = []
                //If dimensions are provided, all dimensions need to be provided.  else, we can have all dimensions be blank.
                if (missing_ea_fields.length < 3 && missing_ea_fields.length > 0) {
                    alert("Eaches Dimensions must be completely filled out, or completely empty");
                    return false;
                } else if (missing_ea_fields.length == 0) {
                    uom_types.push('ea')
                }
                if (missing_ic_fields.length < 3 && missing_ic_fields.length > 0) {
                    alert("Inner Carton Dimensions must be completely filled out, or completely empty");
                    return false;
                } else if (missing_ic_fields.length == 0) {
                    uom_types.push('ic');
                }
                var missing_mc_fields = check_for_missing_values(currentRecord, 'mc');
                if (missing_mc_fields.length < 3 && missing_mc_fields.length > 0) {
                    alert("Master Carton Dimensions must be completely filled or completely empty");
                    return false;
                } else if (missing_mc_fields.length == 0) {
                    uom_types.push('mc');
                }

                if (inner_carton_qty || master_carton_qty) {
                    if (inner_carton_qty) {

                        if (!master_carton_qty) {//If Inner Carton Quantity exists, we need a Master Carton Quantity as well
                            alert('If inner carton exist, master carton must exist as well');
                            return false;
                        }
                        if (inner_carton_qty >= master_carton_qty) {//Ensure Master Carton Quantity is greater than Inner Carton Quantity if Inner Carton Quantity is filled.
                            alert('Master Carton Quantity must be greater than Inner Carton Quantity');
                            return false;
                        }
                        if (inner_carton_qty < 2) {//Ensure Inner Carton Quantity and Master Carton Quantity are greater than 1. 
                            alert('Inner Carton Quantity must be greater than 1');
                            return false
                        }
                    }
                    if (!currentRecord.getValue('custitem_ea_weight')) { //Eaches weight can be autofilled by extrapolating MC weight; if EA_weight is empty and MC_weight is filled, calculate EA_weight based off MC_weight divided by MC_qty {  eaches_weight = (MC_weight/MC_qty).toFixed(5)
                        var master_carton_weight = currentRecord.getValue('custitem_mc_weight');
                        if (master_carton_weight) {
                            currentRecord.setValue('custitem_ea_weight', (Number(master_carton_weight) / Number(master_carton_qty)).toFixed(5));
                        }
                    }

                    if (master_carton_qty < 2) {
                        alert('Master Carton Quantity must be greater than 1');
                        return false;
                    }

                    var dim_array = []
                    uom_types.forEach(function (type) {
                        dim_array.push(sort_dims(currentRecord, type));
                    })
                    // Ensure the volume of MC > IC > Ea
                    if (!isIncreasingSequence(dim_array)) {
                        alert('The volume of each UOM must be in this order: MC > IC > Ea');
                        return false;
                    }
                    // If Sale UOM Numeral is > 1, and MC qty doesnt exist, the user needs to supply MC qty 

                } else {
                    var sale_uom_numeral = currentRecord.getValue('custitem_uom_numeral');
                    if (sale_uom_numeral > 1) {
                        alert('If Sale Unit Numberal is greater than 1, you must provide Master Carton')
                        return false;
                    }
                }
            } catch (e) {
                log.error('error at uom validation', e);
            }
            return true;
        }

    function isIncreasingSequence(numArr) {
            for (var num = 0; num < numArr.length - 1; num++) {
                if (numArr[num] >= numArr[num + 1]) {
                    return false;
                }
            }
            return true;
        }

        function find_volume(array_of_3_numbers) {
            var volume = array_of_3_numbers[0] * array_of_3_numbers[1] * array_of_3_numbers[2]
            return volume;
        }
        //In a BeforeSubmit, make sure the longest dim is length, then width, then height (switch them yourself in, regardless of what order the user puts in)
        function sort_dims(record, uom_type) {
            var dim_array = [];
            dim_array.push(record.getValue("custitem_" + uom_type + "_height"));
            dim_array.push(record.getValue("custitem_" + uom_type + "_width"));
            dim_array.push(record.getValue("custitem_" + uom_type + "_length"));
            dim_array.sort(function (a, b) { return a - b });
            debugger;
            record.setValue({
                fieldId: "custitem_" + uom_type + "_height",
                value: dim_array[0]
            })
            record.setValue({
                fieldId: "custitem_" + uom_type + "_width",
                value: dim_array[1]
            })
            record.setValue({
                fieldId: "custitem_" + uom_type + "_length",
                value: dim_array[2]
            })
            return find_volume(dim_array);
        }

        function check_for_missing_values(currentRecord, uom_type) {
            var array_of_fields = ["custitem_" + uom_type + "_height", "custitem_" + uom_type + "_length", "custitem_" + uom_type + "_width"]
            var missing_fields = []
            for (var i = 0; i < array_of_fields.length; i++) {
                if (!currentRecord.getValue(array_of_fields[i])) {
                    missing_fields.push(array_of_fields[i])
                }
            }
            return missing_fields;
        }



        function set_ea_weight_if_mc_weight(fieldId, currentRecord) {//Extrapolated value in requirement 4 is saved into the NS DB and run on: field change of MC_weight, and before submit
            if (fieldId == 'custitem_mc_weight') {
                if (!currentRecord.getValue('custitem_ea_weight')) { //each weight is empty
                    var master_carton_weight = currentRecord.getValue('custitem_mc_weight');
                    var master_carton_qty = currentRecord.getValue('custitem_mc_qty');
                    if (master_carton_weight && master_carton_qty) {
                        currentRecord.setValue('custitem_ea_weight', (Number(master_carton_weight) / Number(master_carton_qty)).toFixed(5));
                    }
                }
            }
        }

        function check_if_stocked_in_scale_loc(currentRecordId) {
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["internalidnumber", "equalto", currentRecordId],
                        "AND",
                        ["inventorylocation.custrecord_scale_enabled", "is", "T"],
                        "AND",
                        ["locationquantityavailable", "greaterthan", "0"]
                    ],
                columns:
                    [
                        "internalid",
                        "locationquantityavailable",
                        "inventorylocation"
                    ]
            });
            var searchResultCount = itemSearchObj.runPaged().count;
            if (searchResultCount) {
                return true
            } else {
                return false
            }
        }

        return {
            validate_uom: validate_uom,
            set_ea_weight_if_mc_weight: set_ea_weight_if_mc_weight,
            check_if_stocked_in_scale_loc: check_if_stocked_in_scale_loc
        }
    });