/*global QUnit*/

sap.ui.define([
	"com/tim/orderintel/controller/PurchaseOrder.controller"
], function (Controller) {
	"use strict";

	QUnit.module("PurchaseOrder Controller");

	QUnit.test("I should test the PurchaseOrder controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
