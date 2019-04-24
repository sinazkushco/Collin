
// Entry point for javascript creates a router to handle new routes and adds a view inside the Product Details Page

define(
	'TavanoTeam.SmartMerchand.SmartMerchand'
,   [
		"CMS.Merchandising.View"
	]
,   function (
        CMSMerchandisingView
	)
{
	'use strict';

	return  {
        mountToApp: function mountToApp (container)
        {
            container.getComponent('CMS').registerCustomContentType({

                // this property value MUST be lowercase
                id: 'cct_smart_merchand'

                // The view to render the CCT
                ,	view: CMSMerchandisingView
            });
		}
	};
});

