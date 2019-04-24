//------------------------------------------------------------------
// Copyright 2017, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written
// permission of Prolecto Resources, Inc.
//------------------------------------------------------------------

//------------------------------------------------------------------
//Script: k_CL_IdRecord.js
//Developer: Carl            
//Date: 10/03/2017
//Module: SOTOPOLINKER
//Description: Record id library
//------------------------------------------------------------------
/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * @description Library id record script. <br>
 */
define({

	REC : {
		/**
		 * NETSUITE List : Item <br>
		 * Note: Please sync id in function getDataBySearchSO
		 */
		N_ITEM : {

			CUSTOMPROD : 'custitem2'
		},

		/**
		 * NETSUITE Transaction : Purchase Order
		 */
		N_SALESORD : {

			COL_LINKEDPOSO : 'custcol_k_linked_po_so',
			COL_LINKEDPOSOUID : 'custcol_k_linked_po_so_uid'
		},

		/**
		 * NETSUITE Transaction : Purchase Order
		 */
		N_PURCHORD : {

			COL_LINKEDPOSO : 'custcol_k_linked_po_so',
			COL_LINKEDPOSOUID : 'custcol_k_linked_po_so_uid'
		},

	}

});
