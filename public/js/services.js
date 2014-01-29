'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var budgetServices = angular.module('myApp.services', ['ngResource']);

budgetServices.factory('Charges', ['$resource', 
    function($resource){
        return $resource('api/charges/:chargeId', {}, {
            all: {method: 'GET', params:{chargeId: 'all'}, isArray: true}
        });
    }]);

budgetServices.factory('Periods', ['$resource', 
    function($resource){
        return $resource('api/periods/:periodId', {}, {
        	all: {method: 'GET', params:{periodId: 'all'}, isArray: true}
        });
    }]);
