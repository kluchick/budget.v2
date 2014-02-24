/*
 * Serve JSON to our AngularJS client
 */

var mysql      = require('mysql');
var dateFormat = require('dateformat');

var DATE_TIME_FORMAT_TO_DB = 'yyyy-mm-dd HH:MM:ss';
var DATE_TIME_FORMAT_TO_UI = 'dd-mm-yyyy HH:MM:ss';

var connection = null;


/**
 * API method for return all charges
 * method: get
 * params: id, dateFrom, dateTo, categoryId
 */
exports.charges = function (req, res) {
    console.log(req.method);
    // get all collection or one entry from collection
    if (req.method === 'GET'){
        var id = checkEmpty(req.params.id);
        var dateFrom = (checkEmpty(req.query.dateFrom)!==null) ? new Date(req.query.dateFrom) : new Date(0);
        var dateTo = (checkEmpty(req.query.dateTo)!==null) ? new Date(req.query.dateFrom) : new Date();
        var categoryId = checkEmpty(req.query.categoryId);
        console.log('api.exports.charges: id='+id+'; dateFrom='+dateFrom+'; dateTo='+dateTo+'; categoryId='+categoryId);

        if (id === 'all'){ 
            readCharges({dateFrom: dateFrom, dateTo: dateTo}, function(err, charges){
                if (err){
                    console.log('api.charges = error');
                    res.json({});
                }else{
                    console.log('api.exports.charges length = '+charges.length);
                    res.json(charges);
                }
            });
        }
    }
    // create new entry in collection
    else if (req.method === 'POST'){
        var name = checkEmpty(req.body.name);
        var money = checkEmpty(req.body.money);
        var category = checkEmpty(req.body.category);
        var account = checkEmpty(req.body.account);
        console.log("api.exports.charges: create new charge: name = "+name+'; money = '+money+"; category = "+category+"; account = "+account);

        addCharge({name: name, money: money, account: account, category: category}, function(err, info){
            if(err){
                res.json({
                    error: 'Charge wasn\'t added'
                });
            }else{
                res.json({
                    info: info
                });
            }
        });      
    }

};

/**
 * API method for return periods
 * method: get
 * params: periodId
 */
exports.periods = function(req, res){
    console.log('api.exports.periods params: periodId = '+req.params.id);
    var periodIdParam = checkEmpty(req.params.id);
    readPeriods(periodIdParam, function(err, periods){
        if (err){
            console.log('api.exports.periods = error');
            res.json({});
        }else{
            console.log('api.exports.periods length = '+periods.length);
            if (periods.length === 1){
                res.json(periods[0]);
            }else{
                res.json(periods);                
            }
        }
    })   
}

/**
 * API method for return categories
 * method: get
 * params: categoryId
 */
exports.categories = function(req, res){
    console.log('api.exports.categories params: categoryId = '+req.params.id);
    console.log(req.method);
    if (req.method === 'GET'){
        var categoryIdParam = checkEmpty(req.params.id);
        readCategories(categoryIdParam, function(err, categories){
            if (err){
                console.log('api.exports.categories = error');
                res.json({});
            }else{
                console.log('api.exports.categories length = '+categories.length);
                if (categories.length === 1){
                    res.json(categories[0]);
                }else{
                    res.json(categories);                
                }
            }
        })     
    }else if (req.method === 'POST'){
        var categoryName = checkEmpty(req.body.name);
        console.log('New category name = '+categoryName);
        addCategory(categoryName, function(err, newCategoryId){
            console.log("newCategoryId = "+newCategoryId);
            if (newCategoryId > 0){
                var message = "New category with name "+categoryName+" and id = "+newCategoryId+" has been created";
                console.log(message);
                var createdCategory = {id: newCategoryId, Name: categoryName};
                res.json({result: createdCategory, info: message});
            }else{
                res.json({error: "Error during creation of category with name "+categoryName+"\n"+err});
            }
        });

    }

}

/**
 * API method for return accounts
 * method: get
 * params: accountsId
 */
exports.accounts = function(req, res){
    console.log('api.exports.accounts params: accountsId = '+req.params.id);
    var accountIdParam = checkEmpty(req.params.id);
    readAccounts(accountIdParam, function(err, accounts){
        if (err){
            console.log('api.exports.accounts = error');
            res.json({});
        }else{
            console.log('api.exports.accounts length = '+accounts.length);
            if (accounts.length === 1){
                res.json(accounts[0]);
            }else{
                res.json(accounts);                
            }
        }
    })
}


/**
 *                  Function block
 * ******************************************************
 * ******************************************************
 */


/**
 * Create new or return connection to mysql database
 * @returns {created connection}
 */
function getConnection(){
    if (connection === null){
        connection = initializeConnection({
            host: "localhost",
            user: "node",
            password: "node",
            database: "budget"
        });
    }
    return connection;
}

/**
 * Initialise connection and add lost connection handler
 * @param parameters of connection
 * @returns {created connection}
 */
function initializeConnection(config) {
    function addDisconnectHandler(connection) {
        connection.on("error", function (error) {
            if (error instanceof Error) {
                if (error.code === "PROTOCOL_CONNECTION_LOST") {
                    console.error(error.stack);
                    console.log("Lost connection. Reconnecting...");

                    initializeConnection(config);
                } else if (error.fatal) {
                    throw error;
                }
            }
        });
    }
    connection = mysql.createConnection(config);
    console.log('New connection has been created');
    // Add handlers.
    addDisconnectHandler(connection);

    connection.connect();
    return connection;
}


/**
 * Read charges from Charges table
 * @param dateFrom  - begin date of charges
 * @param dateTo    - end date of charges
 * @param callback  - callback function
 */
function readCharges(params, callback){
    getConnection();
    // console.log('api.readCharges dateFrom = '+dateFrom+'; dateTo = '+dateTo+'; category = '+category);
    var dateFrom = checkEmpty(params.dateFrom);
    var dateTo = checkEmpty(params.dateTo);
    var category = checkEmpty(params.category);

    var dateFromStr = dateFormat(dateFrom, DATE_TIME_FORMAT_TO_DB);
    var dateToStr = dateFormat(dateTo, DATE_TIME_FORMAT_TO_DB);
    console.log('api.readCharges: dateFromStr = '+dateFromStr+'; dateToStr = '+dateToStr+'; category = '+category);
    var categorySql = "";
    if (category !== null){
        categorySql = " AND cat.id = "+category+" ";
    }
    var sql = "SELECT ch.id, ch.Name, ch.Money, cat.Name as category, ch.Date, ac.name as account "+
        " FROM charges ch, categories cat, accounts ac "+
        " WHERE ch.Category_id = cat.id" +
        " AND ch.Account = ac.id"+
        " AND ch.Date >=  ? "+
        " AND ch.Date <= ? "+
        categorySql +
        " ORDER BY ch.Date desc";
    // console.log("sql = "+sql);
    connection.query(sql,
        [dateFromStr, dateToStr],
        function(err, rows, fields){
            var charges = [];
            if (err){
                console.log(err);
                callback(err, null);
            }else{
                for(var i in rows){
                    var cur = rows[i];
                    // cur.Date = dateFormat(cur.Date, DATE_TIME_FORMAT_TO_DB);
                    charges.push(cur);
                }
            }
            // console.log('Result: '+ JSON.stringify(charges));
            console.log('api.readCharges: read data length = '+charges.length);
            callback(null, charges);
        });
}

/**
 * Function insert record into charges table and update account table
 * @param name
 * @param money
 * @param categoryId
 * @param accountId
 * @param callback
 */
function addCharge(params, callback){
    getConnection();

    var info = null;
    var sql = "INSERT INTO `charges`(Name, Money, Account, Category_id, Date) VALUES (?,?,?,?, sysdate())";
    connection.query(sql,[params.name, params.money, params.account, params.category], function(err, rows, fields){
        if(err){
            console.log(err);
            callback(err, null);
        }else{
            updateAccount(params.money, params.account);
            info = 'Charge '+params.name+' for '+params.money+' has been successfully inserted';
            callback(null, info);
        }
    });
}

/**
 * Function for update amount of money on account
 * @param money
 * @param accountid
 */
function updateAccount(money, accountid){
    getConnection();
    var sql = "UPDATE accounts SET money = (money - ?) WHERE id = ?";
    connection.query(sql, [money, accountid], function(err, rows, fields){
        if (err){
            console.log('api.updateAccount error:'+err);
        }
    });
}

/**
 * Function for reading all periods from DB
 * @param callback
 */
function readPeriods(periodId, callback){
    getConnection();
    periodId = checkEmpty(periodId);
    console.log('readPeriods periodId = '+periodId);
    var sql = "";
    if (periodId === 'all'){
        sql = "SELECT id, name, dateFrom, dateTo FROM periods ";
    }else if (periodId === 'cur'){
        sql = "SELECT id, name, dateFrom, dateTo FROM periods WHERE dateFrom <= CURDATE()  AND dateTo is null  order by dateFrom LIMIT 1";
    }else if (isNumber(periodId)){
        sql = "SELECT id, name, dateFrom, dateTo FROM periods WHERE id = "+periodId;
    }else{
        callback(null, []);
    }
    console.log('api.readPeriods sql = '+sql);
    connection.query(sql, function(err, rows, fields){
        if (err){
            console.log('api.readPeriods error: '+err);
            callback(err, null);
        }else{
            // console.log('api.readPeriods.periods = '+JSON.stringify(rows));
            var periods = [];
            for(var i in rows){
                var cur = rows[i];
                periods.push(cur);
            }
            callback(null, periods);
        }
    });
}

/**
 * Read categories from database and return map in callback
 * @param callback
 */
function readCategories(category, callback){
    getConnection();
    var sql = "SELECT id, Name FROM categories ORDER BY Name ";
    connection.query(sql, function(err, rows, fields){
        if(err){
            console.log(err);
            callback(err, null);
        }else{
            var categories = [];
            for (var i in rows){
                var cur = rows[i];
                categories.push(cur);
            }
            // console.log('readCategories. categories = '+JSON.stringify(categories));
            callback(null, categories);
        }
    });
}


/**
 * Function inserts new 
 * @param name
 * @param callback
 */
function addCategory(name, callback){
    getConnection();
    console.log("api.addCategory.name = "+name);
    var sql = "INSERT INTO categories(Name) VALUES (?)";
    connection.query(sql,[name], function(err, rows, fields){
        if(err){
            console.log("add category. insert category error: "+err);
            callback(err, null);
        }else{
//          read id of created category
          sql = "SELECT max(id) AS maxid FROM categories ";
          connection.query(sql, function(err, rows, fields){
            if (err){
              consol.log("addCategory. Read category Error: "+ err);
              callback(err, null);
            }else{
//            sent back new category
              var newCategoryId = rows[0].maxid;
              console.log("api.addCategory.newCategoryId = "+newCategoryId);
              callback(null, newCategoryId);
            }
          });
        }
    });
}

/**
 * Function for read accounts from DB
 * @param  {[type]}   account  [not used]
 * @param  {Function} callback [description]
 */
function readAccounts(account, callback){
    getConnection();
    var sql = "SELECT id, name, money, (select sum(money)  from accounts) as totalAmount FROM accounts";
    connection.query(sql, function(err, rows, fields){
        if(err){
            console.log(err);
            callback(err, null);
        }else{
            var accounts = [];
            for (var i in rows){
                var cur = rows[i];
                accounts.push(cur);
            }
            // console.log('readaccounts. accounts = '+JSON.stringify(accounts));
            callback(null, accounts);
        }
    });
}

function checkEmpty(data){
/*    console.log('checkEmpty.data = '+data);
    console.log('is undefined = '+(typeof data === 'undefined'));
    console.log('is string undefined = '+ (data === 'undefined'));*/
    if (typeof data === 'undefined' || data === null || data === 'null' || data === '' || data === 'undefined'){
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