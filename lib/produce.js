var Facility = {
    kern:   0,
    user:   1,
    mail:   2,
    daemon: 3,
    auth:   4,
    syslog: 5,
    lpr:    6,
    news:   7,
    uucp:   8,
    local0: 16,
    local1: 17,
    local2: 18,
    local3: 19,
    local4: 20,
    local5: 21,
    local6: 22,
    local7: 23
};

var Severity = {
    emerg:  0, emergency: 0,
    alert:  1,
    crit:   2, critical: 2,
    err:    3, error: 3,
    warn:   4, warning: 4,
    notice: 5,
    info:   6, information: 6, informational: 6,
    debug:  7
};

var formatRegExp = /%[sdj]/g;

/**
 * Just copy from node.js console
 * @param f
 * @returns
 */
function format(f)
{
  if (typeof f !== 'string')
  {
    var objects = [], util = require('util');
    for (var i = 0; i < arguments.length; i++)
    {
      objects.push(util.inspect(arguments[i]));
    }
    return objects.join(' ');
  }
  
  var i = 1;
  var args = arguments;
  var str = String(f).replace(formatRegExp, function(x)
  {
    switch (x)
    {
      case '%s': return args[i++];
      case '%d': return +args[i++];
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });

  for (var len = args.length; i < len; ++i)
  {
    str += ' ' + args[ienv 
  }
  return str;

}

function leadZero(n)
{
    if (n < 10)
    {
        return '0' + n;
    }
    else 
    {
        return n;
    }
}

/**
 * Get current date in syslog format. Thanks https://github.com/kordless/lodge
 * @returns {String}
 */
function getDate()
{
    var dt = new Date();
    var hours = leadZero(dt.getHours());
    var minutes = leadZero(dt.getMinutes());
    var seconds = leadZero(dt.getSeconds());
    var month = dt.getMonth();
    var day = dt.getDate();
    (day < 10) && (day = ' ' + day);
    var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
            'Sep', 'Oct', 'Nov', 'Dec' ];
    return months[month] + " " + day + " " + hours + ":" + minutes
            + ":" + seconds;
}

/**
 * Syslog logger
 * @constructor
 * @returns {SysLogger}
 */
function SysLogger() 
{
    this._times = {};
}

/**
 * Init function. All arguments is optional
 * @param {Facility|Number|String} By default is "user"
 * @param {String} hostname By default is "localhost"
 */
SysLogger.prototype.set = function(facility, hostname)
{
    this.setFacility(facility);
    this.setHostname(hostname);
    
    return this;
};

SysLogger.prototype.setFacility = function(facility)
{
    this.facility = facility || Facility.user;
    if (typeof this.facility == 'string') 
        this.facility = Facility[this.facility];
    return this;
};

SysLogger.prototype.setHostname = function(hostname)
{
    this.hostname = hostname || 'localhost';
    return this;
};

/**
 * Get new instance of SysLogger. All arguments is similar as `set` 
 * @returns {SysLogger}
 */
SysLogger.prototype.get = function()
{
    var newLogger = new SysLogger();
    newLogger.set.apply(newLogger, arguments);
    return newLogger;
};

/**
 * Generate a formatted message for syslog
 * @param {String} message
 * @param {Number|String} severity
 */
SysLogger.prototype.produce = function(message, severity)
{
    severity = severity || Severity.notice;
    if (typeof severity == 'string') severity = Severity[severity];
};

/**
 * Send log message with notice severity.
 */
SysLogger.prototype.log = function()
{
    this._send(format.apply(this, arguments), Severity.notice);
};
/**
 * Send log message with info severity.
 */
SysLogger.prototype.info = function()
{
    this._send(format.apply(this, arguments), Severity.info);
};
/**
 * Send log message with warn severity.
 */
SysLogger.prototype.warn = function()
{
    this._send(format.apply(this, arguments), Severity.warn);
};
/**
 * Send log message with err severity.
 */
SysLogger.prototype.error = function()
{
    this._send(format.apply(this, arguments), Severity.err);
};

/**
 * Log object with `util.inspect` with notice severity
 */
SysLogger.prototype.dir = function(object)
{
    var util = require('util');
    this._send(util.inspect(object) + '\n', Severity.notice);
};

SysLogger.prototype.time = function(label)
{
    this._times[label] = Date.now();
};

SysLogger.prototype.timeEnd = function(label)
{
    var duration = Date.now() - this._times[label];
    this.log('%s: %dms', label, duration);
};

SysLogger.prototype.trace = function(label)
{
    var err = new Error;
    err.name = 'Trace';
    err.message = label || '';
    Error.captureStackTrace(err, arguments.callee);
    this.error(err.stack);
};

SysLogger.prototype.assert = function(expression)
{
    if (!expression) {
        var arr = Array.prototype.slice.call(arguments, 1);
        this._send(format.apply(this, arr), Severity.err);
    }
};


