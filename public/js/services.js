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

budgetServices.factory('Categories', ['$resource', 
    function($resource){
        return $resource('api/categories/:categoryId', {}, {
        	all: {method: 'GET', params:{categoryId: 'all'}, isArray: true}
        });
    }]);

budgetServices.factory('Accounts', ['$resource', 
    function($resource){
        return $resource('api/accounts/:accountId', {}, {
        	all: {method: 'GET', params:{accountId: 'all'}, isArray: true}
        });
    }]);
