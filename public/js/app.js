'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'ngRoute',
  'ngQuickDate'
]).
config(function ($routeProvider, $locationProvider, ngQuickDateDefaultsProvider) {
  $routeProvider.
    when('/showCharges', {
      templateUrl: 'chargeList.html',
      controller: 'ChargeListCtrl'
    }).
    otherwise({
      redirectTo: '/showCharges'
    });

  $locationProvider.html5Mode(true);

  ngQuickDateDefaultsProvider.set({});
});
