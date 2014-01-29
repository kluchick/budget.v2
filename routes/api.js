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
    console.log('api.exports.charges: id='+req.param.id+'; dateFrom='+req.query.dateFrom+'; dateTo='+req.query.dateTo+'; categoryId='+req.query.categoryId);
    var chargeIdParam = checkEmpty(req.params.id);
    var dateFromParam = checkEmpty(req.query.dateFrom);
    var dateToParam = checkEmpty(req.query.dateTo);
    var categoryIdParam = checkEmpty(req.query.categoryId);

    var dateFrom = new Date(0);
    var dateTo = new Date();    
    // console.log('exports.charges dateFrom = '+dateFrom+'; dateTo = '+dateTo);
    if (dateFromParam !== null){
        dateFrom = new Date(dateFromParam);
    }
    if (dateToParam !== null){
        dateTo = new Date(dateToParam);
    }
    // console.log('exports.charges chargeIdParam = '+chargeIdParam+'; dateFromParam='+dateFromParam+'; dateToParam = '+dateToParam+'; categoryIdParam='+categoryIdParam);
    // console.log('exports.charges dateFrom = '+dateFrom+'; dateTo = '+dateTo);
    if (chargeIdParam === 'all'){ 
        readCharges(dateFrom, dateTo, categoryIdParam, function(err, charges){
            if (err){
                console.log('api.charges = error');
                res.json({});
            }else{
                console.log('api.exports.charges length = '+charges.length);
                res.json(charges);
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
function readCharges(dateFrom, dateTo, category, callback){
    getConnection();
    // console.log('api.readCharges dateFrom = '+dateFrom+'; dateTo = '+dateTo+'; category = '+category);
    dateFrom = checkEmpty(dateFrom);
    dateTo = checkEmpty(dateTo);
    category = checkEmpty(category);

    var dateFromStr = dateFormat(dateFrom, DATE_TIME_FORMAT_TO_DB);
    var dateToStr = dateFormat(dateTo, DATE_TIME_FORMAT_TO_DB);
    console.log('api.readCharges: dateFromStr = '+dateFromStr+'; dateToStr = '+dateToStr+'; category = '+category);
    var categorySql = "";
    if (category !== null){
        categorySql = " AND cat.id = "+category+" ";
    }
    var sql = "SELECT ch.Name, ch.Money, cat.Name as category, ch.Date, ac.name as account "+
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