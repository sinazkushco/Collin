//-----------------------------------------------------------------------------------------------------------
//Copyright 2016, All rights reserved, Prolecto Resources, Inc.
//
//No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 */
// this script udpates Kush externa ID. important during creation of duplicates so they can be rejected.
define(['N/record', 'N/search', 'N/runtime'],
    function(record, search, runtime) {

        function each(params) {

            try {


                log.audit("starting mass update", params.id); //

                var unitRec = record.load({
                    type:params.type,
                    id:params.id
                });



                var unit = unitRec.getValue("custrecord_pri_jc_unit_blob");
                var profileid = unitRec.getValue("custrecord_pri_jc_unit_profile");

                var prefix = profileid.toString();

                log.debug("profileid", profileid);

				// comment out below if we want to go back to internalID prefix instead of string prefix
                var brandSearch = search.create({
	                "type" : "customrecord_pri_brand",
	                "filters" : [ [ "isinactive", "is", "F" ], "AND", [ "custrecord_pri_job_control_profile", "is", profileid ] ],
	                "columns" : [ search.createColumn({"name" : "custrecord_pri_external_id_prefix"})
	                              ]
	            });

	            var brandSearchRange = brandSearch.run().getRange(0, 1000);

	            if (brandSearchRange.length === 0)
	            {
	                throw "Brand for this Job Control Profile " + profileid + " has not been defined";
	            }

				prefix = brandSearchRange[0].getValue("custrecord_pri_external_id_prefix");
                // comment out above if we want to go back to internalID prefix instead of string prefix

                //log.debug ("unit", unit);
                var unitJSON = JSON.parse(unit);
                var unitid = unitJSON.id;

                log.debug ("prefix", prefix);
                log.debug ("unitid", unitid);
                var externalid = prefix+":"+unitid;
                log.debug ("externalid", externalid);
                var oldExtID = unitRec.getValue('externalid'); //

                if (unitid && prefix)
                {
                    unitRec.setValue({fieldId:'externalid', value:externalid});
                    unitRec.save();
                }

                var newExtID = unitRec.getValue('externalid'); //
                log.audit("Completed Mass Update", oldExtID +' => '+ newExtID ); //

            } catch (e) {
                log.error("Unable to update PRI Job Control Unit ID: "+ params.id, e.toString()); //
            }
        }




        return {
            each: each
        };
    }



);