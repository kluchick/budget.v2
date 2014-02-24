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
    
    budget.infoMessage = null;
    $scope.budget = budget;
    $scope.budget.origCahrges = null;
    $scope.budget.periods = null;
    $scope.budget.currentPeriod = null;
    $scope.budget.categories = null;
    $scope.budget.accounts = null;
    $scope.budget.totals = {};
    $scope.budget.totals.spend = 0;
  }
myApp.controller('AppCtrl', AppCtrl);

/**
 * Charge list controller
 */
function ChargeListCtrl($scope, $http, $filter, $location, $anchorScroll, Charges, Periods) {

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
 * Charge list controller
 */
function AddChargeCtrl($scope, $location, $anchorScroll, Categories, Accounts, Charges){
  $scope.money = 50;

  getCategories({categoryName: 'all'}, $scope, Categories, function(err, categories){
    if (categories){
      $scope.categories = categories;
      for (var i in categories){
        var cur = categories[i];
        if (cur.Name === 'Еда'){
          $scope.selectedCategory = cur;
          $scope.defaultCategory = cur;
        }else if (cur.Name === 'Перевод'){
          $scope.transferCategory = cur;
        }
      }
    }else{
      console.log("Categories not found"+err);
    }
  });

  getAccounts({accountId: 'all'}, $scope, Accounts, function(err, accounts){
    if (accounts){
      $scope.accounts = accounts;
      for (var i in accounts){
        var cur = accounts[i];
        if (cur.name === 'Наличные'){
          $scope.selectedAccount = cur;
          $scope.defaultAccount = cur;
        }
      }  
    }
  });

  /*
  add charge function
   */
  $scope.addCharge = function(){
    //check do we need add new category before new charge
    addCategory({name: $scope.addCategoryName}, $scope, Categories, $location, $anchorScroll, function(newCategory){
      if (newCategory){
        $scope.selectedCategory = newCategory;
      }
      // add new charge
      addCharge({name: $scope.name, money: $scope.money, category: $scope.selectedCategory.id, account: $scope.selectedAccount.id}, Charges, $scope, $location, $anchorScroll, function(err, info){

        if ($scope.transferAccount){
          var transferMoney = 0-$scope.money;
          // add additiona charge if it is transfer operation
          addCharge({name: $scope.name, money: transferMoney, category: $scope.selectedCategory.id, account: $scope.transferAccount.id}, Charges, $scope, $location, $anchorScroll, function(){});
        }
        // set defaults
        $scope.money = 50;
        $scope.selectedAccount = $scope.defaultAccount;
        $scope.selectedCategory = $scope.defaultCategory;
      });
    })
  }

  /*
  change money func for money field
   */
  $scope.changeMoney = function(operation, value){
    if (operation === 'minus'){
      $scope.money -=value;
    }else if (operation === 'plus'){
      $scope.money +=value;
    }else if (operation=== '='){
      $scope.money = value;
    }
  }

}

myApp.controller('AddChargeCtrl', AddChargeCtrl);



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
 * Function for add new charge
 * @param {[type]}   params   [name, money, category and account of new charge]
 * @param {[type]}   Charges  [service]
 * @param {[type]}   $scope   [controller's scope]
 * @param {Function} callback [description]
 */
function addCharge(params, Charges, $scope, $location, $anchorScroll, callback){
  var name = checkEmpty(params.name);
  var money = checkEmpty(params.money);
  var category = checkEmpty(params.category);
  var account = checkEmpty(params.account);

  console.log("addCharge started ...");
  var newCharge = new Charges({id: "1"});
  newCharge.name = name;
  newCharge.money = money;
  newCharge.account = account;
  newCharge.category = category;

  console.log(newCharge);
  newCharge.$save(newCharge, function(response){
    showMessage({info: response.info, error: response.error}, $scope, $location, $anchorScroll);
    if (checkEmpty(response.error)=== null){
      $scope.budget.origCahrges = null;
      callback(null, response.info);
    }
  });

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
 * [getCategories description]
 * @param  {[type]}   params     [input parameters]
 * @param  {[type]}   $scope     [link to scope]
 * @param  {[type]}   Categories [Categories service]
 * @param  {Function} callback   [description]
 */
function getCategories(params, $scope, Categories, callback){
  console.log("Start get categories ... ");
  var categoryName = checkEmpty(params.categoryName);
  console.log("getCategories categoryName = "+categoryName);
  if (categoryName === 'all'){
    if ($scope.budget.categories === null){
      $scope.budget.categories = 
      Categories.all().$promise.then(function(categories){
        // strange behaivour or categories resource. Fix.
        $scope.budget.categories = categories;
        callback(null, categories);
      }, function(err){
        callback(err, null);
      });
    }else{
      callback(null, $scope.budget.categories);
    }
  }
}

/**
 * Add new category
 * @param {[type]}   params     [contains name of the category]
 * @param {[type]}   $scope     [controller's scope]
 * @param {[type]}   Categories [service]
 * @param {Function} callback   [description]
 */
function addCategory(params, $scope, Categories, $location, $anchorScroll, callback){
  console.log("Add category started ...");
  console.log(params);
  var categoryName = checkEmpty(params.name);
  if (categoryName){
    var newCategory = new Categories({name: categoryName});
    newCategory.$save(newCategory, function(response){
      // console.log(response);
      showMessage({info: response.info, error: response.error}, $location, $anchorScroll, $scope);
      if (checkEmpty(response.error)===null){
        var createdCategory = response.result;
        $scope.categories.push(createdCategory);
        callback(createdCategory);
      }
    });
  }else{
    callback(null);
  }
}

/**
 * Get accounts from service
 * @param  {[type]}   params   [not used]
 * @param  {[type]}   $scope   [controller scope]
 * @param  {[type]}   Accounts [service]
 * @param  {Function} callback [description]
 */
function getAccounts(params, $scope, Accounts, callback){
  console.log("Start get accounts ...");
  var account = checkEmpty(params.accountId);
  console.log("getAccounts account parameter: "+account);
  if (account === 'all'){
    if ($scope.budget.accounts === null){
        Accounts.all().$promise.then(function(accounts){
          $scope.budget.accounts = accounts;
          callback(null, accounts);
        }, function(err){
          callback(err, null);
        });
    }else{
      callback(null, $scope.budget.accounts);
    }
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
    if (isNumber(cur.Money) && cur.Money > 0){
      totalMoney += cur.Money;
    }
  }
  console.log('getCharges totalMoney = '+totalMoney);
  $scope.budget.totals.spend = totalMoney;
}

/**
 * Function for showing message
 * @param  {[type]} params [contain info or error string]
 * @param  {[type]} $scope [cotroller scope]
 */
function showMessage(params, $scope, $location, $anchorScroll){
  var info = checkEmpty(params.info);
  var error = checkEmpty(params.error);
  $location.hash('infoMessage');
  if (info){
    $scope.infoMessageClass = "infoMessage";
    $scope.budget.infoMessage = info;
  }else if (error){
    $scope.infoMessageClass = "errorMessage";
    $scope.budget.errorMessage = error;
  }
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