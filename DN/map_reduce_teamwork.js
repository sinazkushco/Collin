/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var SAVED_SEARCH_ID = "customsearch_hybrid_log_search_script";
define(["N/search", "N/record", "N/email", "N/https", "N/log", "../Library/moment"], function (search,record,email,https, log, moment) {
    var hybrid_teamwork_log;
    var record_event;
    var record_type;

    function getInputData() {
        var mySearch = search.load({
            id: SAVED_SEARCH_ID
        });
        return mySearch;
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        hybrid_teamwork_log = searchResult.id;
        try {
            var teamwork_json = JSON.parse(
                searchResult.values.custrecord_hybrid_teamwork_json
            );
            teamwork_json["record_type"] =
                searchResult.values.custrecord_hybrid_teamwork_type;
            teamwork_json["record_event"] =
                searchResult.values.custrecord_hybrid_teamwork_event;

            determine_event(teamwork_json);

            // record.submitFields({
            //     type: "customrecord_hybrid_teamwork_log",
            //     id: hybrid_teamwork_log,
            //     values: {
            //         custrecorddclf_status: "3"
            //     }
            // });
        } catch (e) {
            // record.submitFields({
            //     type: "customrecord_hybrid_teamwork_log",
            //     id: hybrid_teamwork_log,
            //     values: {
            //         custrecorddclf_status: "2"
            //     }
            // });
            record.submitFields({
                type: "customrecord_hybrid_teamwork_log",
                id: hybrid_teamwork_log,
                values: {
                    custrecord_hybrid_teamwork_error_log: e
                }
            });
        }
    }

    function determine_event(teamwork_json) {
        log.debug("function ran", "determine event");
        record_event = teamwork_json.record_event;

        if (record_event == "CREATED") {
            create_record(teamwork_json);
        } else if (record_event == "UPDATED") {
            update_record(teamwork_json);
        } else if (record_event == "DELETED") {
            delete_record(teamwork_json);
        }
    }

    function create_record(teamwork_json) {
        log.debug("function ran", "create record");
        record_type = teamwork_json.record_type;

        if (record_type == "PROJECT") {
            create_project(teamwork_json);
        } else if (record_type == "TASKLIST") {
            create_tasklist(teamwork_json);
        } else if (record_type == "TASK") {
            create_task(teamwork_json);
        } else if (record_type == "TIME") {
            create_time(teamwork_json);
        }
    }

    function update_record(teamwork_json) {
        log.debug("function ran", "update record");
        record_type = teamwork_json.record_type;

        if (record_type == "PROJECT") {
            update_project(teamwork_json);
        } else if (record_type == "TASKLIST") {
            update_tasklist(teamwork_json);
        } else if (record_type == "TASK") {
            update_task(teamwork_json);
        } else if (record_type == "TIME") {
            update_time(teamwork_json);
        }
    }

    function delete_record(teamwork_json) {
        log.debug("function ran", "delete record");
        record_type = teamwork_json.record_type;

        if (record_type == "PROJECT") {
            delete_project(teamwork_json);
        } else if (record_type == "TASKLIST") {
            delete_tasklist(teamwork_json);
        } else if (record_type == "TASK") {
            delete_task(teamwork_json);
        } else if (record_type == "TIME") {
            delete_time(teamwork_json);
        }
    }

    function create_project(teamwork_json) {
        log.debug("function ran", "create project");
        if(teamwork_json.project.companyId){
            var customer_id = find_netsuite_id("customer", teamwork_json.project.companyId);
        }
        

        var new_project = record.create({
            type: "job",
            isDynamic: true
        });

        // set form to hybrid form
        new_project.setValue({
            fieldId: "customform",
            value: 83
        });
        // set subsidiary to hybrid
        new_project.setValue({
            fieldId: "subsidiary",
            value: 4
        });

        // set customer
        if(customer_id){
            new_project.setValue({
                fieldId: "parent",
                value: customer_id
            });
        }

        // set project name
        new_project.setValue({
            fieldId: "companyname",
            value: teamwork_json.project.name
        });
        // set hybrid id
        new_project.setValue({
            fieldId: "custentity_hybrid_creative_id",
            value: teamwork_json.project.id
        });
        // save project
        new_project.save();
    }

    function create_tasklist(teamwork_json) {
        log.debug("function ran", "create tasklist");
        var netsuite_project_id = find_netsuite_id("job", teamwork_json.taskList.projectId);

        var new_tasklist = record.create({
            type: "projecttask",
            isDynamic: true
        });
        // set form to hybrid form
        new_tasklist.setValue({
            fieldId: "customform",
            value: 95
        });
        // set project to netsuite project
        new_tasklist.setValue({
            fieldId: "company",
            value: netsuite_project_id
        });
        // set task name
        new_tasklist.setValue({
            fieldId: "title",
            value: teamwork_json.taskList.name
        });
        // set hybrid id
        new_tasklist.setValue({
            fieldId: "custevent_hybrid_creative_id",
            value: teamwork_json.taskList.id
        });
        // set task status - NOTSTART / PROGRESS / COMPLETE
        new_tasklist.setValue({
            fieldId: "status",
            value: "PROGRESS"
        });
        // save task list
        new_tasklist.save();
    }

    function create_task(teamwork_json) {
        log.debug("function ran", "create task");
        log.debug("create task", teamwork_json);
        var netsuite_project_id = find_netsuite_id("job", teamwork_json.task.projectId);
        var teamwork_task_obj = request_task_info(teamwork_json.task.id);
        var netsuite_users_array = assign_users_to_project(teamwork_task_obj);
        var netsuite_parent_task_id = find_netsuite_id("projecttask", teamwork_json.task.taskListId);
        log.debug("netsuite parent id task", netsuite_parent_task_id);
        var estimated_time = teamwork_task_obj["estimated-minutes"] / 60;

        var new_task = record.create({
            type: "projecttask",
            isDynamic: true
        });
        // set form to hybrid form
        new_task.setValue({
            fieldId: "customform",
            value: 95
        });
        // set project to netsuite project
        new_task.setValue({
            fieldId: "company",
            value: netsuite_project_id
        });
        // set task name
        new_task.setValue({
            fieldId: "title",
            value: teamwork_json.task.name
        });
        // set hybrid id
        new_task.setValue({
            fieldId: "custevent_hybrid_creative_id",
            value: teamwork_json.task.id
        });
        // set task status - NOTSTART / PROGRESS / COMPLETE
        new_task.setValue({
            fieldId: "status",
            value: "PROGRESS"
        });
        // set parent task
        new_task.setValue({
            fieldId: "parent",
            value: netsuite_parent_task_id
        });
        // assign resources to task
        for (var i = 0; i < netsuite_users_array.length; i++) {
            new_task.selectNewLine({
                sublistId: "assignee"
            });
            new_task.setCurrentSublistValue({
                sublistId: "assignee",
                fieldId: "resource",
                value: netsuite_users_array[i]
            });
            new_task.setCurrentSublistValue({
                sublistId: "assignee",
                fieldId: "estimatedwork",
                value: "0"
            });
            //TODO: discuss cost, but also if we make dynamic, multiple roles on one task - cant determine
            new_task.setCurrentSublistValue({
                sublistId: "assignee",
                fieldId: "unitcost",
                value: "165"
            });
            new_task.commitLine({
                sublistId: "assignee"
            });
        }

        //set estimate work time for task
        new_task.setValue({
            fieldId: "estimatedwork",
            value: estimated_time
        });

        // save task list
        new_task.save();
    }

    // TODO: LOOK OVER
    function create_time(teamwork_json) {
        log.debug("function ran", "create time");
        var netsuite_employee_id = find_netsuite_id("employee", teamwork_json.time.userId);
        var netsuite_project_id = find_netsuite_id("job", teamwork_json.time.projectId);

        if (teamwork_json.time.taskId) {
            var teamwork_task_obj = request_task_info(teamwork_json.time.taskId);
            var netsuite_task_id = find_netsuite_id("projecttask", teamwork_json.time.taskId);
            log.debug("teamwork_task_obj line 270" + typeof teamwork_task_obj, teamwork_task_obj);
            //var netsuite_tasklist_name = teamwork_task_obj["todo-list-name"];
            // ETC THESE NEED TO BE SET - NO ROOM FOR USER ERROR FIXME:
            // TODO: turned off for testing
            // if (netsuite_tasklist_name == "User Experience") {
            //     //
            // }
        }

        var netsuite_friendly_date = moment(teamwork_json.time.date).toDate();
        log.debug("netsuite friendly date converted", netsuite_friendly_date);
        var teamwork_hours = teamwork_json.time.hours;
        var teamwork_minutes = teamwork_json.time.minutes / 60;
        var netsuite_time = teamwork_hours + teamwork_minutes;

        var time_entry = record.create({
            type: "timebill",
            isDynamic: true
        });
        // employee
        time_entry.setValue({
            fieldId: "employee",
            value: netsuite_employee_id
        });
        // date
        time_entry.setValue({
            fieldId: "trandate",
            value: netsuite_friendly_date
        });
        // netsuite project id
        time_entry.setValue({
            fieldId: "customer",
            value: netsuite_project_id
        });
        // time in hours
        time_entry.setValue({
            fieldId: "hours",
            value: netsuite_time
        });
        // location FIXME: What location? Needs to be a location within Hybrid Creative
        time_entry.setValue({
            fieldId: "location",
            value: "43"
        });
        // billable
        time_entry.setValue({
            fieldId: "isbillable",
            value: teamwork_json.time.billable
        });
        // hybrid id
        time_entry.setValue({
            fieldId: "custcol_hybrid_creative_id",
            value: teamwork_json.time.id
        });


        if (teamwork_json.time.taskId) {
            // parent task - this needs to be set first
            time_entry.setValue({
                fieldId: "casetaskevent",
                value: netsuite_task_id
            });
            // service item - this needs to be set second
            //TODO: TURNED OFF FOR TESTING 
            // time_entry.setValue({
            //     fieldId: "item",
            //     value: teamwork_json.task.id
            // });
        }

        time_entry.save();
    }

    function update_project(teamwork_json) {
        //update name?
        var netsuite_project_id = find_netsuite_id("job", teamwork_json.project.id);
        var project_status = teamwork_json.project.status;
        var project_name = teamwork_json.project.name;
        var customer_id = find_netsuite_id("customer", teamwork_json.project.companyId);
        var netsuite_project_status = "";
        var project_description = teamwork_json.project.description;

        if(project_status == "active"){
            netsuite_project_status = "1";
        } else if (project_status == "archived"){
            netsuite_project_status = "2";
        }
        record.submitFields({
            type: "job",
            id: netsuite_project_id,
            values: {
                companyname: project_name,
                entitystatus: netsuite_project_status,
                custentity_hybrid_creative_description: project_description,
                parent: customer_id
            }
        });
    }

    function update_tasklist(teamwork_json) {
        //update name?
        var netsuite_tasklist_id = find_netsuite_id("projecttask", teamwork_json.taskList.id);
        var tasklist_name = teamwork_json.taskList.name;
        record.submitFields({
            type: "projecttask",
            id: netsuite_tasklist_id,
            values: {
                title: tasklist_name
            }
        });
    }

    function update_task(teamwork_json) {
        var netsuite_task_id = find_netsuite_id("projecttask", teamwork_json.time.taskId);
        var teamwork_task_obj = request_task_info(teamwork_json.task.id);
        var netsuite_users_array = assign_users_to_project(teamwork_task_obj);
        var netsuite_parent_task_id = find_netsuite_id("projecttask", teamwork_json.task.taskListId);
        var estimated_time = teamwork_task_obj["estimated-minutes"] / 60;

        // load task record
        var task_record = record.load({
            type: "projecttask",
            id: netsuite_task_id,
            isDynamic: true
        });

        var assignees_line_count = task_record.getLineCount("assignee");

        // set task name
        task_record.setValue({
            fieldId: "title",
            value: teamwork_json.task.name
        });

        // set parent task
        task_record.setValue({
            fieldId: "parent",
            value: netsuite_parent_task_id
        });

        //remove all resources on task
        for (var k = 0; k < assignees_line_count; k++){
            task_record.removeLine({
                sublistId: "assignee",
                line: 0,
                ignoreRecalc: true
            });
        }

        // assign resources to task
        for (var i = 0; i < netsuite_users_array.length; i++) {
            task_record.selectNewLine({
                sublistId: "assignee"
            });
            task_record.setCurrentSublistValue({
                sublistId: "assignee",
                fieldId: "resource",
                value: netsuite_users_array[i]
            });
            task_record.setCurrentSublistValue({
                sublistId: "assignee",
                fieldId: "estimatedwork",
                value: "0"
            });
            //TODO: discuss cost, but also if we make dynamic, multiple roles on one task - cant determine
            task_record.setCurrentSublistValue({
                sublistId: "assignee",
                fieldId: "unitcost",
                value: "165"
            });
            task_record.commitLine({
                sublistId: "assignee"
            });
        }

        //set estimate work time for task
        task_record.setValue({
            fieldId: "estimatedwork",
            value: estimated_time
        });

        // save task list
        task_record.save();
    }

    function update_time(teamwork_json) {
        //update time
        log.debug("function ran", "create time");
        var netsuite_employee_id = find_netsuite_id("employee", teamwork_json.time.userId);
        var netsuite_project_id = find_netsuite_id("job", teamwork_json.time.projectId);

        if (teamwork_json.time.taskId) {
            var teamwork_task_obj = request_task_info(teamwork_json.time.taskId);
            var netsuite_task_id = find_netsuite_id("projecttask", teamwork_json.time.taskId);
            log.debug("teamwork_task_obj line 270" + typeof teamwork_task_obj, teamwork_task_obj);
            //var netsuite_tasklist_name = teamwork_task_obj["todo-list-name"];
            // ETC THESE NEED TO BE SET - NO ROOM FOR USER ERROR FIXME:
            // TODO: turned off for testing
            // if (netsuite_tasklist_name == "User Experience") {
            //     //
            // }
        }

        var netsuite_friendly_date = moment(teamwork_json.time.date).toDate();
        log.debug("netsuite friendly date converted", netsuite_friendly_date);
        var teamwork_hours = teamwork_json.time.hours;
        var teamwork_minutes = teamwork_json.time.minutes / 60;
        var netsuite_time = teamwork_hours + teamwork_minutes;

        var netsuite_time_id = find_netsuite_id("timebill", teamwork_json.time.id);

        var values =  {
            employee: netsuite_employee_id,
            trandate: netsuite_friendly_date,
            customer: netsuite_project_id,
            hours: netsuite_time,
            location: "43",
            isbillable: teamwork_json.time.billable
        };

        if (teamwork_json.time.taskId) {
            // parent task - this needs to be set first
            values["casetaskevent"] = netsuite_task_id;

            // service item - this needs to be set second
            //TODO: TURNED OFF FOR TESTING 
            // time_entry.setValue({
            //     fieldId: "item",
            //     value: teamwork_json.task.id
            // });
        }

        record.submitFields({
            type: "timebill",
            id: netsuite_time_id,
            values: values
        });

    }

    function delete_project(teamwork_json) {
        var netsuite_project_id = find_netsuite_id("job", teamwork_json.id);
        // Easy to delete
        record.delete({
            type: "job",
            id: netsuite_project_id,
        }); 
    }

    function delete_tasklist(teamwork_json) {
        var netsuite_tasklist_id = find_netsuite_id("projecttask", teamwork_json.id);
        // Easy to delete
        record.delete({
            type: "projecttask",
            id: netsuite_tasklist_id,
        }); 
    }

    function delete_task(teamwork_json) {
        var netsuite_task_id = find_netsuite_id("projecttask", teamwork_json.id);
        // Easy to delete
        record.delete({
            type: "projecttask",
            id: netsuite_task_id,
        }); 
    }

    function delete_time(teamwork_json) {
        var netsuite_task_id = find_netsuite_id("timebill", teamwork_json.id);
        // Easy to delete
        record.delete({
            type: "timebill",
            id: netsuite_task_id,
        }); 
    }

    function find_netsuite_id(record_type, hybrid_id) {
        log.debug("function ran", "find netsuite id");
        var internal_id = "";
        var hybrid_field = "custentity_hybrid_creative_id";

        if (record_type == "projecttask") {
            hybrid_field = "custevent_hybrid_creative_id";
        } else if (record_type == "timebill"){
            hybrid_field = "custcol_hybrid_creative_id";
        }

        var search_obj = search.create({
            type: record_type,
            filters: [
                [hybrid_field, "is", hybrid_id]
            ],
            columns: [
                "internalid"
            ]
        });

        search_obj.run().each(function (result) {
            internal_id = result.getValue("internalid");
            return false; // returns one result
        });
        return internal_id;
    }

    function request_task_info(hybrid_id) {
        log.debug("function ran", "request task info");
        var company = "hybridzdca";
        var key = "dHdwX0F5cFRCcTlLbVhkaG5RSFZMS2xoSE5sOExpQjk6eHh4";
        var action = "tasks/" + hybrid_id + ".json";

        try {
            var response = https.get({
                url: "https://" + company + ".teamwork.com/" + action,
                headers: {
                    Authorization: "BASIC " + key
                },
                body: {}
            });
            var response_body = JSON.parse(response.body);
            log.debug("response_body", response_body);
            log.debug("response_body2", response_body["todo-item"]);
            return response_body["todo-item"];
            log.debug("Find People assigned to task", response_body);
        } catch (e) {
            log.error("ERROR", JSON.stringify(e));
        }
    }

    function update_customer_to_hybrid() {}

    function assign_users_to_project(teamwork_request_obj) {
        log.debug("function ran", "assign users to project");
        log.debug("teamwork_request_obj", teamwork_request_obj);
        var netsuite_project_id = find_netsuite_id("job", teamwork_request_obj["project-id"]);
        var array_of_assigned_people = teamwork_request_obj[
            "responsible-party-ids"
        ].split(",");
        var unassigned_users = [];
        for (var i = 0; i < array_of_assigned_people.length; i++) {
            array_of_assigned_people[i] = find_netsuite_id("employee", array_of_assigned_people[i]);
            var netsuite_user_internal_id = array_of_assigned_people[i];
            var resource_found = check_if_resource_on_project(netsuite_project_id, netsuite_user_internal_id);
            if (!resource_found) {
                unassigned_users.push(netsuite_user_internal_id);
            }
        }

        if (unassigned_users.length > 0) {
            var loaded_project_record = record.load({
                type: "job",
                id: netsuite_project_id,
                isDynamic: true
            });

            for (var x = 0; x < unassigned_users.length; x++) {
                loaded_project_record.selectNewLine({
                    sublistId: "jobresources"
                });
                loaded_project_record.setCurrentSublistValue({
                    sublistId: "jobresources",
                    fieldId: "jobresource",
                    value: unassigned_users[x]
                });
                loaded_project_record.commitLine({
                    sublistId: "jobresources"
                });
            }

            loaded_project_record.save();
        }

        //loop through array_of_assigned_people
        //search project and resource
        //if exist then end
        //if dont exist add to array, loop through array to add to project
        //assign the people
        //assign_resources_to_project(teamwork_json, array_of_assigned_people);
        return array_of_assigned_people;
    }

    function check_if_resource_on_project(netsuite_project_id, netsuite_employee_id) {
        log.debug("function ran", "check if resource on project");
        var jobSearchObj = search.create({
            type: "job",
            filters: [
                ["subsidiary", "anyof", "4"],
                "AND",
                ["jobresource", "anyof", netsuite_employee_id],
                "AND",
                ["internalidnumber", "equalto", netsuite_project_id]
            ],
            columns: ["internalid"]
        });
        var searchResultCount = jobSearchObj.runPaged().count;

        if (searchResultCount == 0) {
            return false;
        } else {
            return true;
        }
    }

    return {
        getInputData: getInputData,
        map: map
    };
});