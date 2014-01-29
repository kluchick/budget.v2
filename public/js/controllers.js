'use strict';

// var dateFormat = require('dateformat');

var DATE_TIME_FORMAT_TO_UI = 'dd-MM-yyyy HH:mm:ss';

/* Controllers */

/**
 * Application main cotroller
 */
var myApp = angular.module('myApp.controllers', []);

function AppCtrl ($scope, $http) {
    var budget = {};
    
    budget.infoMessage = '';
    $scope.budget = budget;
    $scope.budget.origCahrges = null;
    $scope.budget.periods = null;
    $scope.budget.currentPeriod = null;
    $scope.budget.totals = {};
    $scope.budget.totals.spend = 0;
  }
myApp.controller('AppCtrl', AppCtrl);

/**
 * Charge list controller
 */
function ChargeListCtrl($scope, $http, $filter, Charges, Periods) {
    $scope.name = 'ChargeListCtrl name';
    $scope.dateFrom = null;
    $scope.dateTo = null;
    $scope.selectedCategory = null;
    // select charges for current period
    getPeriods({periodId: 'cur'}, $scope, Periods, function(err, periods){
      if (periods){
        $scope.period = periods;
        $scope.budget.currentPeriod = $scope.period;
        $scope.selectedPeriod = $scope.budget.currentPeriod;
        console.log("current period id = "+$scope.budget.currentPeriod.id);
        $scope.dateFrom = new Date($scope.budget.currentPeriod.dateFrom);

        getCharges({dateFrom: $scope.period.dateFrom, dateTo: $scope.period.dateTo}, $scope, Charges, function(err, charges){
          if (charges){ 
            $scope.fillCategories(charges);
            filterCharges({dateFrom: $scope.dateFrom, dateTo: $scope.dateTo, category: $scope.selectedCategory, hideCategory: 'Перевод'}, $scope, function(err, filterCharges){
              $scope.charges = filterCharges;
            })
          }
        }); 

      }
    });
    // get list of all periods
    getPeriods({periodId: 'all'}, $scope, Periods, function(err, periods){
      if (periods){
        console.log(periods);
        $scope.periods = periods;
      }
    });

    // run filterCharges function
    $scope.filterAction = function(){
      console.log('Start filterAction ...');
      filterCharges({dateFrom: $scope.dateFrom, dateTo: $scope.dateTo, category: $scope.selectedCategory, hideCategory: 'Перевод'}, $scope, function(err, filterCharges){
          if (filterCharges){
            $scope.charges = filterCharges;  
          }
        });
    }

    // reread list of charges for another period
    $scope.changePeriod = function(){
      console.log('Change period started ...');
      $scope.budget.origCahrges = null;
      $scope.dateFrom = new Date($scope.selectedPeriod.dateFrom);
      $scope.dateTo = new Date($scope.selectedPeriod.dateTo);

      getCharges({dateFrom: $scope.selectedPeriod.dateFrom, dateTo: $scope.selectedPeriod.dateTo}, $scope, Charges, function(err, charges){
        if (charges){ 
          $scope.fillCategories(charges);
          $scope.charges = charges;
        }
      });
    }

    // get list of categories from list of charges
    $scope.fillCategories = function(charges){
      var categoriesObj = {};
      for (var i in charges){
        var cur = charges[i];
        categoriesObj[cur.category] = true;
      }
      var categories = Object.keys(categoriesObj);
      categories.sort();
      $scope.categories = categories;         
    }

    // watchers TODO: fix them for few-times changes
    $scope.$watchCollection('dateFrom', function(newNames, oldNames) {
      $scope.filterAction();
    });
    $scope.$watchCollection('dateTo', function(newNames, oldNames) {
      $scope.filterAction();
    });


}

myApp.controller('ChargeListCtrl', ChargeListCtrl);



/**
 * General supported functions
 */

/**
 * Read charge list from database
 * @param  {list of parameters}   params   [dateFrom; dateTo, categoryId (all can be empty)]
 * @param  {[type]}   $scope   [scope of the calling controller]
 * @param  {[array]}   Charges  [result charge list]
 * @param  {Function} callback [callback function]
 */
function getCharges(params, $scope, Charges, callback){
  if ($scope.budget.origCahrges === null){
    var dateFrom = checkEmpty(params.dateFrom);
    var dateTo = checkEmpty(params.dateTo);
    var categoryId = checkEmpty(params.categoryId);
    console.log('getCharges params: dateFrom = '+dateFrom+'; dateTo = '+dateTo+'; categoryId = '+categoryId);
    var params = {dateFrom: dateFrom, dateTo: dateTo, categoryId: categoryId};
    console.log('params: '+angular.toJson(params));
    Charges.all(params, function(charges){
        console.log('controller.getCharges length = '+charges.length);
        $scope.budget.origCahrges = charges;
        calcTotalAmount($scope, charges);
        callback(null, charges);      
    });    
  }else{
    callback(null, $scope.budget.origCahrges);
  }

}

/**
 * Function for filter charges from existing charge list using different params
 * @param  {array}   params   list of filtering parameters
 * @param  {[type]}   $scope   controllers scope
 * @param  {Function} callback callback function
 */
function filterCharges(params, $scope, callback){
  var filterCategory = checkEmpty(params.category);
  var filterDateFrom = checkEmpty(params.dateFrom);
  var filterDateTo = checkEmpty(params.dateTo);
  var filterHideCategory = checkEmpty(params.hideCategory);

  console.log('filterCharges params: filterCategory = '+filterCategory+'; filterDateFrom = '+filterDateFrom+'; filterDateTo = '+filterDateTo);

  var filterCharges = $scope.budget.origCahrges;
  var resultFiltering = [];
  if (filterDateFrom !== null){
    console.log('filterDateFrom mili = '+filterDateFrom.getTime());
    var testDate = new Date (filterDateFrom);
    console.log(filterDateFrom);
  }
  for (var i in filterCharges){
    var cur = filterCharges[i];
    if (filterCategory !== null && cur.category !== filterCategory){
      // filter out
      console.log('Element is filtered by category');
    }else if (filterDateFrom !== null && new Date(cur.Date).getTime() < filterDateFrom.getTime()){
      //filter out
      console.log('Element if filtered by dateFrom param');
    }else if (filterDateTo !== null && new Date(cur.Date).getTime() > filterDateTo.getTime()){
      //filter out
      console.log('Element if filtered by dateTo param');
    }else if (filterHideCategory !== null && cur.category === filterHideCategory){
      //filter out
    }
    else{
      resultFiltering.push(cur);
    }
  }
  calcTotalAmount($scope, resultFiltering);
  callback(null, resultFiltering);
}

/**
 * Read periods from database
 * @param  {[type]}   params   [description]
 * @param  {[type]}   $scope   [description]
 * @param  {[type]}   Periods  [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function getPeriods(params, $scope, Periods, callback){
  console.log('Start get periods ...');
  var periodId = checkEmpty(params.periodId);
  console.log('getPeriods periodId = '+periodId);
  if (periodId === 'cur' && $scope.budget.currentPeriod !== null){
    callback(null, $scope.budget.currentPeriod);
  }else if (periodId === 'all'){
    if ($scope.budget.periods === null){
      $scope.budget.periods = Periods.all();
      callback(null, $scope.budget.periods);
    }else{
      callback(null, $scope.budget.periods);
    }
  }
  else{
    var periodsResult = Periods.get({periodId: periodId}, function(periods){
      if (periods){
        console.log(periods);
        callback(null, periods);
      }
    });    
  }
}

/**
 * Calculate total amount of given charges
 * @param  {[type]} $scope  [controller scope]
 * @param  {[type]} charges list of charges
 * @return {[type]}         [total amount]
 */
function calcTotalAmount($scope, charges){
  var totalMoney = 0;
  for (var i in charges){
    var cur = charges[i];
    if (isNumber(cur.Money)){
      totalMoney += cur.Money;
    }
  }
  console.log('getCharges totalMoney = '+totalMoney);
  $scope.budget.totals.spend = totalMoney;
}

function checkEmpty(data){
    // console.log('checkEmpty.data = '+data+'typeof = '+typeof data);
    if (typeof data === 'undefined' || data === null || data === '' || data === 'undefined'){
        return null;
    }else{
        return data;
    }
}

/**
 * Check the input is a Number
 * @param  {[type]}  n [description]
 * @return {Boolean}   [description]
 */
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}