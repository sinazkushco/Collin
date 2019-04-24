/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(["require", "exports", "N/log", "N/record", "N/redirect", "N/ui/serverWidget"], function (require, exports, log, record, redirect, ui) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var barrierBags = {
        laminate: {
            FIELDID: "custrecord_pm_laminate",
            LABEL: "Laminate",
            TYPE: ui.FieldType.SELECT,
            LIST: "167",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoil: {
            FIELDID: "custrecord_pm_true_foil",
            LABEL: "True Foil",
            TYPE: ui.FieldType.SELECT,
            LIST: "169",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        window: {
            FIELDID: "custrecord_pm_window",
            LABEL: "Window",
            TYPE: ui.FieldType.SELECT,
            LIST: "170",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        hangHole: {
            FIELDID: "custrecord_pm_hang_hole",
            LABEL: "Hang Hole",
            TYPE: ui.FieldType.SELECT,
            LIST: "171",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        tearNotch: {
            FIELDID: "custrecord_pm_tear_notch",
            LABEL: "Tear Notch",
            TYPE: ui.FieldType.SELECT,
            LIST: "172",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        zipper: {
            FIELDID: "custrecord_pm_zipper",
            LABEL: "Zipper",
            TYPE: ui.FieldType.SELECT,
            LIST: "173",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        gussets: {
            FIELDID: "custrecord_pm_gussets",
            LABEL: "Gussets",
            TYPE: ui.FieldType.SELECT,
            LIST: "174",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        kLogoOnGusset: {
            FIELDID: "custrecord_pm_k_logo_on_gusset",
            LABEL: '"K" Logo On Gusset',
            TYPE: ui.FieldType.SELECT,
            LIST: "165",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateFront: {
            FIELDID: "custrecord_pm_substrate_front",
            LABEL: "Substrate Front",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateBack: {
            FIELDID: "custrecord_pm_substrate_back",
            LABEL: "Substrate Back",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateGusset: {
            FIELDID: "custrecord_pm_substrate_gusset",
            LABEL: "Substrate Gusset",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        sizeBarrierBags: {
            FIELDID: "custrecord_pm_size_barrier_bags",
            LABEL: "Size - Barrier Bags",
            TYPE: ui.FieldType.SELECT,
            LIST: "191",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var gripNglides = {
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoil: {
            FIELDID: "custrecord_pm_true_foil",
            LABEL: "True Foil",
            TYPE: ui.FieldType.SELECT,
            LIST: "169",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        window: {
            FIELDID: "custrecord_pm_window",
            LABEL: "Window",
            TYPE: ui.FieldType.SELECT,
            LIST: "170",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        hangHole: {
            FIELDID: "custrecord_pm_hang_hole",
            LABEL: "Hang Hole",
            TYPE: ui.FieldType.SELECT,
            LIST: "171",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        tearNotch: {
            FIELDID: "custrecord_pm_tear_notch",
            LABEL: "Tear Notch",
            TYPE: ui.FieldType.SELECT,
            LIST: "172",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        zipper: {
            FIELDID: "custrecord_pm_zipper",
            LABEL: "Zipper",
            TYPE: ui.FieldType.SELECT,
            LIST: "173",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        gussets: {
            FIELDID: "custrecord_pm_gussets",
            LABEL: "Gussets",
            TYPE: ui.FieldType.SELECT,
            LIST: "174",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        gngLogoOnGusset: {
            FIELDID: "custrecord_pm_gng_logo",
            LABEL: '"GNG" Logo On Gusset',
            TYPE: ui.FieldType.SELECT,
            LIST: "175",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateFront: {
            FIELDID: "custrecord_pm_substrate_front",
            LABEL: "Substrate Front",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateBack: {
            FIELDID: "custrecord_pm_substrate_back",
            LABEL: "Substrate Back",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateGusset: {
            FIELDID: "custrecord_pm_substrate_gusset",
            LABEL: "Substrate Gusset",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        sizeGripNGlides: {
            FIELDID: "custrecord_pm_size_grip_n_glides",
            LABEL: "Size - Grip N Glides",
            TYPE: ui.FieldType.SELECT,
            LIST: "192",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var kushNslides = {
        laminate: {
            FIELDID: "custrecord_pm_laminate",
            LABEL: "Laminate",
            TYPE: ui.FieldType.SELECT,
            LIST: "167",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        lockColor: {
            FIELDID: "custrecord_pm_lock_color",
            LABEL: "Lock Color",
            TYPE: ui.FieldType.SELECT,
            LIST: "176",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoil: {
            FIELDID: "custrecord_pm_true_foil",
            LABEL: "True Foil",
            TYPE: ui.FieldType.SELECT,
            LIST: "169",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateFront: {
            FIELDID: "custrecord_pm_substrate_front",
            LABEL: "Substrate Front",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateBack: {
            FIELDID: "custrecord_pm_substrate_back",
            LABEL: "Substrate Back",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateGusset: {
            FIELDID: "custrecord_pm_substrate_gusset",
            LABEL: "Substrate Gusset",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        sizeKushNSlides: {
            FIELDID: "custrecord_pm_size_kush_n_slides",
            LABEL: "Size - Kush N Slides",
            TYPE: ui.FieldType.SELECT,
            LIST: "193",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var dymaPakBags = {
        laminate: {
            FIELDID: "custrecord_pm_laminate",
            LABEL: "Laminate",
            TYPE: ui.FieldType.SELECT,
            LIST: "167",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        zipper: {
            FIELDID: "custrecord_pm_zipper",
            LABEL: "Zipper",
            TYPE: ui.FieldType.SELECT,
            LIST: "173",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        gussets: {
            FIELDID: "custrecord_pm_gussets",
            LABEL: "Gussets",
            TYPE: ui.FieldType.SELECT,
            LIST: "174",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateFront: {
            FIELDID: "custrecord_pm_substrate_front",
            LABEL: "Substrate Front",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateBack: {
            FIELDID: "custrecord_pm_substrate_back",
            LABEL: "Substrate Back",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateGusset: {
            FIELDID: "custrecord_pm_substrate_gusset",
            LABEL: "Substrate Gusset",
            TYPE: ui.FieldType.SELECT,
            LIST: "166",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        instructionsGraphics: {
            FIELDID: "custrecord_pm_instructions_graphics",
            LABEL: "Instruction Graphics",
            TYPE: ui.FieldType.SELECT,
            LIST: "190",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        sizeDymaPakBags: {
            FIELDID: "custrecord_pm_size_dyma_pak_bags",
            LABEL: "Size - Dyma Pak Bags",
            TYPE: ui.FieldType.SELECT,
            LIST: "194",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var paperExitBags = {
        sizePaperExitBags: {
            FIELDID: "custrecord_pm_size_paper_exit_bags",
            LABEL: "Size - Paper Exit Bags",
            TYPE: ui.FieldType.SELECT,
            LIST: "185",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var labels = {
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoil: {
            FIELDID: "custrecord_pm_true_foil",
            LABEL: "True Foil",
            TYPE: ui.FieldType.SELECT,
            LIST: "169",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateMaterial: {
            FIELDID: "custrecord_pm_substrate_material",
            LABEL: "Substrate Material",
            TYPE: ui.FieldType.SELECT,
            LIST: "179",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        substrateColor: {
            FIELDID: "custrecord_pm_substrate_color",
            LABEL: "Substrate Color",
            TYPE: ui.FieldType.SELECT,
            LIST: "180",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        productBeingLabeled: {
            FIELDID: "custrecord_pm_product_being_labeled",
            LABEL: "Product Being Labeled",
            TYPE: ui.FieldType.TEXT,
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        labelType: {
            FIELDID: "custrecord_pm_label_type",
            LABEL: "Label Type",
            TYPE: ui.FieldType.SELECT,
            LIST: "178",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        finishing: {
            FIELDID: "custrecord_pm_finishing",
            LABEL: "Finishing",
            TYPE: ui.FieldType.SELECT,
            LIST: "181",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        embossing: {
            FIELDID: "custrecord_pm_embossing",
            LABEL: "Embossing",
            TYPE: ui.FieldType.SELECT,
            LIST: "182",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        hiRiseGloss: {
            FIELDID: "custrecord_pm_hi_rise_gloss",
            LABEL: "Hi-Rise Gloss",
            TYPE: ui.FieldType.SELECT,
            LIST: "183",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        applicationLocation: {
            FIELDID: "custrecord_pm_application_location",
            LABEL: "Application Location",
            TYPE: ui.FieldType.SELECT,
            LIST: "184",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var coinEnvelopes = {
        laminate: {
            FIELDID: "custrecord_pm_laminate",
            LABEL: "Laminate",
            TYPE: ui.FieldType.SELECT,
            LIST: "167",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoilColor: {
            FIELDID: "custrecord_pm_true_foil_color",
            LABEL: "True Foil - Color",
            TYPE: ui.FieldType.SELECT,
            LIST: "177",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var blisterPacksAndInserts = {
        laminate: {
            FIELDID: "custrecord_pm_laminate",
            LABEL: "Laminate",
            TYPE: ui.FieldType.SELECT,
            LIST: "167",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoilColor: {
            FIELDID: "custrecord_pm_true_foil_color",
            LABEL: "True Foil - Color",
            TYPE: ui.FieldType.SELECT,
            LIST: "177",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        productBeingPackaged: {
            FIELDID: "custrecord_pm_product_being_packaged",
            LABEL: "Product Being Packaged",
            TYPE: ui.FieldType.TEXT,
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var boxes = {
        laminate: {
            FIELDID: "custrecord_pm_laminate",
            LABEL: "Laminate",
            TYPE: ui.FieldType.SELECT,
            LIST: "167",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        spotUV: {
            FIELDID: "custrecord_pm_spot_uv",
            LABEL: "Spot UV",
            TYPE: ui.FieldType.SELECT,
            LIST: "168",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        window: {
            FIELDID: "custrecord_pm_window",
            LABEL: "Window",
            TYPE: ui.FieldType.SELECT,
            LIST: "170",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        trueFoilColor: {
            FIELDID: "custrecord_pm_true_foil_color",
            LABEL: "True Foil - Color",
            TYPE: ui.FieldType.SELECT,
            LIST: "177",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        embossing: {
            FIELDID: "custrecord_pm_embossing",
            LABEL: "Embossing",
            TYPE: ui.FieldType.SELECT,
            LIST: "182",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        kbBoxNumber: {
            FIELDID: "custrecord_pm_kb_box_number",
            LABEL: "KB Box #",
            TYPE: ui.FieldType.TEXT,
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var glassJars = {};
    var concentrateContainers = {};
    var vapeProducts = {};
    var other = {};
    var screenPrints = {
        foil: {
            FIELDID: "custrecord_pm_foil",
            LABEL: "Foil",
            TYPE: ui.FieldType.SELECT,
            LIST: "186",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        productBeingPrinted: {
            FIELDID: "custrecord_pm_product_being_printed",
            LABEL: "Product Being Printed",
            TYPE: ui.FieldType.TEXT,
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var woodBoroJarLids = {
        lidSize: {
            FIELDID: "custrecord_pm_lid_size",
            LABEL: "Lid Size",
            TYPE: ui.FieldType.SELECT,
            LIST: "187",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        lidVarnish: {
            FIELDID: "custrecord_pm_lid_varnish",
            LABEL: "Lid Varnish",
            TYPE: ui.FieldType.SELECT,
            LIST: "188",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        lidEtch: {
            FIELDID: "custrecord_pm_lid_etch",
            LABEL: "Lid Etch",
            TYPE: ui.FieldType.SELECT,
            LIST: "189",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        }
    };
    var required = {
        name: {
            FIELDID: "name",
            LABEL: "Product Name",
            TYPE: ui.FieldType.TEXT,
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.NORMAL
        },
        productList: {
            FIELDID: "custrecord_pm_product_list",
            LABEL: "Product",
            TYPE: ui.FieldType.SELECT,
            LIST: "131",
            MANDATORY: true,
            DISPLAYTYPE: ui.FieldDisplayType.DISABLED
        }
    };
    exports.onRequest = function (context) {
        var productType;
        if (context.request.method === "GET") {
            productType = context.request.parameters.productType;
            createForm(context, productType);
        }
        else {
            var projectId = getQueryStringValue(context, "productId");
            productType = getQueryStringValue(context, "productType");
            createRecord(context, projectId, productType);
            log.debug("entire context", context.request.parameters);
            log.debug("redirect project id", projectId);
            log.debug("redirect project type", productType);
            redirect.toRecord({
                type: "job",
                id: projectId
            });
        }
    };
    var createForm = function (context, productType) {
        var form = ui.createForm({ title: "Product Info" });
        createRequiredFields(form, productType);
        createProjectFields(form, productType);
        form.addSubmitButton({
            label: "Submit Button"
        });
        context.response.writePage(form);
    };
    var createRequiredFields = function (form, productType) {
        Object.keys(required).forEach(function (key) {
            var field;
            if (required[key].LIST) {
                field = form.addField({
                    id: required[key].FIELDID,
                    label: required[key].LABEL,
                    type: required[key].TYPE,
                    source: required[key].LIST
                });
            }
            else {
                field = form.addField({
                    id: required[key].FIELDID,
                    label: required[key].LABEL,
                    type: required[key].TYPE
                });
            }
            if (required[key].FIELDID === "custrecord_pm_product_list") {
                field.defaultValue = productType;
            }
            setMandatory(required[key].MANDATORY, field);
            setFieldType(required[key].DISPLAYTYPE, field);
        });
    };
    var createProjectFields = function (form, productType) {
        var productObj = setProductObj(productType);
        Object.keys(productObj).forEach(function (key) {
            var field;
            if (productObj[key].LIST) {
                field = form.addField({
                    id: productObj[key].FIELDID,
                    label: productObj[key].LABEL,
                    type: productObj[key].TYPE,
                    source: productObj[key].LIST
                });
            }
            else {
                field = form.addField({
                    id: productObj[key].FIELDID,
                    label: productObj[key].LABEL,
                    type: productObj[key].TYPE
                });
            }
            setMandatory(productObj[key].MANDATORY, field);
            setFieldType(productObj[key].DISPLAYTYPE, field);
        });
    };
    var createRecord = function (context, projectId, productType) {
        var newItemRecord = record.create({
            type: "customrecord_pm_product"
        });
        setRequiredValues(newItemRecord, context, projectId);
        setValues(newItemRecord, context, productType);
        newItemRecord.save();
    };
    var setValues = function (newItemRecord, context, productType) {
        var productObj = setProductObj(productType);
        Object.keys(productObj).forEach(function (key) {
            newItemRecord.setValue({
                fieldId: productObj[key].FIELDID,
                value: context.request.parameters[productObj[key].FIELDID]
            });
        });
    };
    var setRequiredValues = function (newItemRecord, context, projectId) {
        newItemRecord.setValue({
            fieldId: "custrecord_pm_product_project_id",
            value: projectId
        });
        Object.keys(required).forEach(function (key) {
            newItemRecord.setValue({
                fieldId: required[key].FIELDID,
                value: context.request.parameters[required[key].FIELDID]
            });
        });
    };
    var setMandatory = function (mandatory, field) {
        if (mandatory) {
            field.isMandatory = true;
        }
    };
    var setFieldType = function (type, field) {
        field.updateDisplayType({
            displayType: type
        });
    };
    var setProductObj = function (productType) {
        var productObj;
        if (productType === "1") {
            productObj = barrierBags;
        }
        else if (productType === "2") {
            productObj = gripNglides;
        }
        else if (productType === "3") {
            productObj = kushNslides;
        }
        else if (productType === "4") {
            productObj = dymaPakBags;
        }
        else if (productType === "5") {
            productObj = paperExitBags;
        }
        else if (productType === "6") {
            productObj = labels;
        }
        else if (productType === "7") {
            productObj = coinEnvelopes;
        }
        else if (productType === "8") {
            productObj = blisterPacksAndInserts;
        }
        else if (productType === "9") {
            productObj = boxes;
        }
        else if (productType === "10") {
            productObj = glassJars;
        }
        else if (productType === "11") {
            productObj = concentrateContainers;
        }
        else if (productType === "12") {
            productObj = vapeProducts;
        }
        else if (productType === "14") {
            productObj = other;
        }
        else if (productType === "15") {
            productObj = screenPrints;
        }
        else if (productType === "16") {
            productObj = woodBoroJarLids;
        }
        return productObj;
    };
    var getQueryStringValue = function (context, name) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        var results = regex.exec(context.request.parameters.entryformquerystring);
        log.debug("pre format results query string param", context.request.parameters.entryformquerystring);
        log.debug("results query string param", results);
        if (!results) {
            return null;
        }
        if (!results[2]) {
            return "";
        }
        log.debug("decode", decodeURIComponent(results[2].replace(/\+/g, " ")));
        return decodeURIComponent(results[2].replace(/\+/g, " "));
        // return decodeURIComponent(context.request.parameters.entryformquerystring.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(name).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
    };
});
