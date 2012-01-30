/*
 *    Glossy Producer - Generate valid syslog messages
 *
 *    Copyright Squeeks <privacymyass@gmail.com>.
 *     This is free software licensed under the MIT License - 
 *     see the LICENSE file that should be included with this package.
 */

/*
 *    These values replace the integers in message that define the facility.
 */
var FacilityIndex = {
    'kern':   0,  // kernel messages
    'user':   1,  // user-level messages
    'mail':   2,  // mail system
    'daemon': 3,  // system daemons
    'auth':   4,  // security/authorization messages
    'syslog': 5,  // messages generated internally by syslogd
    'lpr':    6,  // line printer subsystem
    'news':   7,  // network news subsystem
    'uucp':   8,  // UUCP subsystem
    'clock':  9,  // clock daemon
    'sec':    10, // security/authorization messages
    'ftp':    11, // FTP daemon
    'ntp':    12, // NTP subsystem
    'audit':  13, // log audit
    'alert':  14, // log alert
    'clock':  15, // clock daemon (note 2) 
    'local0': 16, // local use 0  (local0)
    'local1': 17, // local use 1  (local1)
    'local2': 18, // local use 2  (local2)
    'local3': 19, // local use 3  (local3)
    'local4': 20, // local use 4  (local4)
    'local5': 21, // local use 5  (local5)
    'local6': 22, // local use 6  (local6)
    'local7': 23  // local use 7  (local7)
};

// Note 1 - Various operating systems have been found to utilize
//           Facilities 4, 10, 13 and 14 for security/authorization,
//           audit, and alert messages which seem to be similar. 

// Note 2 - Various operating systems have been found to utilize
//           both Facilities 9 and 15 for clock (cron/at) messages.

/*
 *    These values replace the integers in message that define the severity.
 */
var SeverityIndex = {
    'emerg': 0,                 // Emergency: system is unusable
    'emergency': 0,

    'alert': 1,                 // Alert: action must be taken immediately

    'crit': 2,                  // Critical: critical conditions
    'critical': 2,

    'err': 3,                   // Error: error conditions
    'error': 3,

    'warn': 4,                  // Warning: warning conditions
    'warning': 4,

    'notice': 5,                // Notice: normal but significant condition

    'info': 6  ,                // Informational: informational messages
    'information': 6,
    'informational': 6,

    'debug':  7                 // Debug: debug-level messages
};


/*
 *    Defines the range matching BSD style months to integers.
 */
var BSDDateIndex = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];


/*
 *  SyslogProduce class
 *  @param {Object} provides persistent details of all messages:
 *      facility: The facility index
 *      severity: Severity index
 *      host: Host address, either name or IP
 *      app_id: Application ID
 *      pid: Process ID
 *      msgID: Message ID (RFC5424 only)
 *      type: RFC3164/RFC5424 message type
 *  @return {Object} SyslogProduce object
 */
var SyslogProduce = function(options) {
    if(options && typeof options =='object' && options.type) {
        this.type = options['type'].match(/bsd|3164/i) ? "RFC3164" : "RFC5424";
    } else if(options && typeof options == 'string') {
        this.type = options.match(/bsd|3164/i) ? "RFC3164" : "RFC5424";
    } else {
        this.type = "RFC5424";
    }

    if(options && options.facility && FacilityIndex[options.facility]) {
        this.facility = options.facility;
    }
    if(options && options.pid && parseInt(options.pid)) {
        this.pid = options.pid;
    }
    if(options && options.host)   this.host   = options.host.replace(/\s+/g, '');
    if(options && options.app_id) this.app_id = options.app_id.replace(/\s+/g, '');
    if(options && options.msgID)  this.msgID  = options.msgID.replace(/\s+/g, '');

};


/*
 *  @param {Object} options object containing details of the message:
 *      facility: The facility index
 *      severity: Severity index
 *      host: Host address, either name or IP
 *      app_id: Application ID
 *      pid: Process ID
 *      date: Timestamp to be applied, uses current GMT by default
 *      msgID: Message ID (RFC5424 only)
 *      structuredData: Object of structured data (RFC5424 only)
 *      message: The message to be sent
 *
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.produce = function(options, callback) {
    
    var msgData = new Array();
    if(!options.date instanceof Date) {
        options.date = new Date(Date());
    }
    
    if(!options.facility) options.facility = this.facility;

    if(this.type == 'RFC5424') {
        msgData.push(
            calculatePrival({ 
                facility: options.facility,
                severity: options.severity,
                version:  1
            })
        );

        if(!msgData[0]) return false;

        msgData.push(options.prival);
        msgData.push(generateDate(options.date));

        msgData.push(options.host   || this.host   || '-');
        msgData.push(options.app_id || this.app_id || '-');
        msgData.push(options.pid    || this.pid    || '-');
        msgData.push(options.msgID  || this.msgID  || '-');
        if(options.structuredData) {
            msgData.push(generateStructuredData(options.structuredData) || '-');
        } else {
            msgData.push('-');
        }

        if(!options.message) options.message = '-';

    } else {
        options.timestamp = generateBSDDate(options.date);    
        msgData.push(
            calculatePrival({ 
                facility: options.facility,
                severity: options.severity,
            }) + options.timestamp
        );

        msgData.push(options.host   || this.host);
        msgData.push();
        if(options.pid || this.pid) {
            var app = options.app_id || this.app_id;
            var pid = options.pid    || this.pid;
            msgData.push(app + '[' + pid + ']:');
        } else {
            msgData.push(app + ':');
        }
    }

    var compiledMessage = msgData.join(' ').replace(/\s+/g, ' ');
    compiledMessage += ' ' + options.message || '';
    msgData.push(compiledMessage);

    if(callback) {
        return callback(compiledMessage);
    } else {
        return compiledMessage;
    }

};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'debug'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.debug = function(options, callback) {
    options.severity = 'debug';
    return this.produce(options, callback);
};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'info'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.info = function(options, callback) {
    options.severity = 'info';
    return this.produce(options, callback);
};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'notice'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.notice = function(options, callback) {
    options.severity = 'notice';
    return this.produce(options, callback);
};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'warn'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.warn = function(options, callback) {
    options.severity = 'warn';
    return this.produce(options, callback);
};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'crit'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.crit = function(options, callback) {
    options.severity = 'crit';
    return this.produce(options, callback);
};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'alert'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.alert = function(options, callback) {
    options.severity = 'alert';
    return this.produce(options, callback);
};


/*
 *  @param {Object} options object containing details of the message with
 *      the severity as 'emergency'
 *  @param {Function} callback a callback run once the message is built
 *  @return {String} compiledMessage on completion, false on failure
 */
SyslogProduce.prototype.emergency = function(options, callback) {
    options.severity = 'emergency';
    return this.produce(options, callback);
};


/*
 *  Prepend a zero to a number less than 10
 *  @param {Number} n
 *  @return {String}
 *
 *  Where's sprintf when you need it?
 */
function leadZero(n) {
    if(typeof n != 'number') return n;
    n = n < 10 ? '0' + n : n ;
    return n;
}


/*
 *  Get current date in RFC 3164 format. If no date is supplied, the default
 *  is the current time in GMT + 0.
 *  @param {Date} dateObject optional Date object
 *  @returns {String}
 *
 *  Features code taken from https://github.com/akaspin/ain
 */
function generateBSDDate(dateObject) {
    if(!(dateObject instanceof Date)) dateObject = new Date(Date());
    var hours   = leadZero(dateObject.getHours());
    var minutes = leadZero(dateObject.getMinutes());
    var seconds = leadZero(dateObject.getSeconds());
    var month   = dateObject.getMonth();
    var day     = dateObject.getDate();
    (day < 10) && (day = ' ' + day);
    return BSDDateIndex[month] + " " + day + " " + hours + ":" + minutes
        + ":" + seconds;
}


/*
 *  Generate date in RFC 3339 format. If no date is supplied, the default is
 *  the current time in GMT + 0.
 *  @param {Date} dateObject optional Date object
 *  @returns {String} formatted date
 */
function generateDate(dateObject) {
    if(!(dateObject instanceof Date)) dateObject = new Date(Date());
    
    // Calcutate the offset
    var timeOffset;
    var minutes = Math.abs(dateObject.getTimezoneOffset());
    var hours = 0;
    while(minutes >= 60) {
        hours++;
        minutes -= 60;
    }

    if(dateObject.getTimezoneOffset() < 0) {
        // Ahead of UTC
        timeOffset = '+' + leadZero(hours) + '' + ':' + leadZero(minutes);
    } else if(dateObject.getTimezoneOffset() > 0) {
        // Behind UTC
        timeOffset = '-' + leadZero(hours) + '' + ':' + leadZero(minutes);
    } else {
        // UTC
        timeOffset = 'Z';
    }


    // Date
    formattedDate = dateObject.getUTCFullYear()         + '-' +
    // N.B. Javascript Date objects return months of the year indexed from
    // zero, while the RFC 5424 syslog standard expects months indexed from
    // one.
    leadZero(dateObject.getUTCMonth() + 1)  + '-' +
    // N.B. Javascript Date objects return days of the month indexed from one
    // (unlike months of year), so this does not need any correction.
    leadZero(dateObject.getUTCDate())   + 'T' +
    // Time
    leadZero(dateObject.getUTCHours())         + ':' +
    leadZero(dateObject.getUTCMinutes())       + ':' +
    leadZero(dateObject.getUTCSeconds())       + '.' +
    leadZero(dateObject.getUTCMilliseconds())  +
    timeOffset;
    
    return formattedDate;
    
}


/*
 *  Calculate the PRIVAL for a given facility
 *  @param {Object} values Contains the three key arguments
 *      facility {Number}/{String} the Facility Index
 *      severity {Number}
 *      version  {Number} For RFC 5424 messages, this should be 1
 *
 *  @return {String}
 */
function calculatePrival(values) {

    var pri = {};
    // Facility
    if(typeof values.facility == 'string' && !values.facility.match(/^\d+$/)) {
        pri['facility'] = FacilityIndex[values.facility.toLowerCase()];
    } else if( parseInt(values.facility) && parseInt(values.facility) < 24) {
        pri['facility'] = parseInt(values.facility);
    }

    //Severity
    if(typeof values.severity == 'string' && !values.severity.match(/^\d+$/)) {
        pri['severity'] = SeverityIndex[values.severity.toLowerCase()];
    } else if( parseInt(values.severity) && parseInt(values.severity) < 8) {
        pri['severity'] = parseInt(values.severity);
    }

    if(!isNaN(pri.severity) && !isNaN(pri.facility)) {
        pri['prival'] = (pri['facility'] * 8) + pri['severity'];
        pri['str'] = values.version ? '<' + pri['prival'] + '>' + values.version : '<' + pri['prival'] + '>';
        return pri['str'];
    } else {
        return false;
    }

}


/*
 *  Serialise objects into the structured data segment
 *  @param {Object} struct The object to serialise
 *  @return {String} structuredData the serialised data
 */
function generateStructuredData(struct) {
    if(typeof struct != 'object') return false;

    var structuredData = '';
    
    for(sdID in struct) {
        sdElement = struct[sdID];
        structuredData += '[' + sdID;
        for(key in sdElement) {
            sdElement[key] = sdElement[key].replace(/(\]|\\|")/g, '\\$1');
            structuredData += ' ' + key + '="' + sdElement[key] + '"';
        }
        structuredData += ']';

    }

    return structuredData;
}

if(typeof module == 'object') {
    module.exports = SyslogProduce;
}
