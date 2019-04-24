/**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 */
define([],
    function () {
        function render(params) {

            var portlet = params.portlet;
            portlet.title = 'Auto Refresh Dashboard';
            var fldRefreshRate = portlet.addField({
                id: 'custpage_txtrefreshrate',
                type: 'text',
                label: 'Refresh Rate (in seconds)'
            });
            var fldRefreshNote = portlet.addField({
                id: 'custpage_txtrefreshnote',
                type: 'inlinehtml',
                label: 'Refresh Note'
            });
            var fldButton = portlet.addField({
                id: 'custpage_btnsubmit',
                type: 'inlinehtml',
                label: 'Submit'
            });
            fldRefreshRate.defaultValue = '30';
            fldRefreshNote.defaultValue = '<br/><h1>Please reload page before resetting the refresh rate</h1><br/>'
            var refreshScript = 'var refreshTimerId = setInterval(function() { jQuery(\\\'.ns-portlet-icon-refresh.ns-portlet-action\\\').each(function(index) { jQuery(this).click(); }); }, \' + parseInt(document.getElementById(\'custpage_txtrefreshrate\').value) * 1000 + \');';
            fldButton.defaultValue = '<button type="button" onclick="var script = document.createElement(\'script\'); script.type = \'text/javascript\'; script.id = \'refreshDashboard\'; script.innerHTML = \'' + refreshScript + '\'; window.top.document.head.appendChild(script);">Set Refresh Interval</button>';
        }
        return {
            render: render
        };
    });