'use strict';

/* jasmine specs for controllers go here */
describe('Budget controllers', function() {

  beforeEach(function(){
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  beforeEach(module('myApp'));
  beforeEach(module('myApp.services'));

  describe('ChargeListCtrl', function(){
    var scope, ctrl, $httpBackend;

    beforeEach(angular.mock.inject(function(_$httpBackend_, $rootScope, Charges, $controller) {
      $httpBackend = _$httpBackend_;
      var params = '?categoryId=null&dateFrom=null&dateTo=null';
/*      $httpBackend.expectGET('api/charges/all'+params).
          respond([{"Name":"Test","Money":200,"category":"Еда","Date":"2014-01-01 16:18:23","account":"Наличные"},
                   {"Name":"Шампунь","Money":500,"category":"Быт","Date":"2014-01-10 16:18:23","account":"Карточка"},
                   {"Name":"Обед","Money":50,"category":"Еда","Date":"2014-01-05 16:18:23","account":"Карточка"}]);*/

      $httpBackend.expectGET('api/charges/all?').
          respond([{"Name":"Test","Money":200,"category":"Еда","Date":"2014-01-01 16:18:23","account":"Наличные"},
                   {"Name":"Шампунь","Money":500,"category":"Быт","Date":"2014-01-10 16:18:23","account":"Карточка"},
                   {"Name":"Обед","Money":50,"category":"Еда","Date":"2014-01-05 16:18:23","account":"Карточка"}]);


      scope = $rootScope.$new();
      scope.budget = {};
      ctrl = $controller('ChargeListCtrl', {
        $scope: scope
      });
    }));

    it('init check', function() {
      expect(scope.name).toBe('ChargeListCtrl name'); 
      console.log(scope.charges);
      expect(scope.charges).toBeUndefined();

    });

    it('charges should be filled without filtering', function(){

      $httpBackend.flush();
      // console.log(scope.charges);
      expect(scope.charges.length).toBe(5); //some 2 additonal objectes from resource
      expect(scope.charges[0]).toEqualData({"Name":"Test","Money":200,"category":"Еда","Date":"2014-01-01 16:18:23","account":"Наличные"});  
    });

    it('charges should be filled with from date filtering', function(){
      $httpBackend.flush();
      scope.dateFrom = new Date('2014-01-10');
      scope.filterAction();
      // console.log(scope.charges);
      expect(scope.charges.length).toBe(3); //some 2 additonal objectes from resource
      expect(scope.charges[0]).toEqualData({"Name":"Шампунь","Money":500,"category":"Быт","Date":"2014-01-10 16:18:23","account":"Карточка"});  
    });

    it('charges should be filled with to date filtering', function(){
      $httpBackend.flush();
      scope.dateTo = new Date('2014-01-02');
      scope.filterAction();
      // console.log(scope.dateFrom);
      // console.log(scope.charges);
      expect(scope.charges.length).toBe(3); //some 2 additonal objectes from resource
      expect(scope.charges[0]).toEqualData({"Name":"Test","Money":200,"category":"Еда","Date":"2014-01-01 16:18:23","account":"Наличные"});  
    });

    it('charges should be filled with category filtering', function(){
      $httpBackend.flush();
      scope.selectedCategory = 'Быт';
      scope.filterAction();
      // console.log(scope.charges);
      expect(scope.charges.length).toBe(1);
      expect(scope.charges[0]).toEqualData({"Name":"Шампунь","Money":500,"category":"Быт","Date":"2014-01-10 16:18:23","account":"Карточка"});  
    });

  });

});
