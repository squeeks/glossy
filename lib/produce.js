/*
 *
 *
 */

/*
 *	These values replace the integers in message that define the facility.
 */
Facility = {
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
 *	These values replace the integers in message that define the severity.
 */
SeverityIndex = {
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
 *	Defines the range matching BSD style months to integers.
 */
BSDDateIndex = {
	'Jan': 1,
	'Feb': 2,
	'Mar': 3,
	'Apr': 4,
	'May': 5,
	'Jun': 6,
	'Jul': 7,
	'Aug': 8,
	'Sep': 9,
	'Oct': 10,
	'Nov': 11,
	'Dec': 12
}


/*
 *
 */
var SyslogProduce = function(messageFormat) {
	
	this.messageFormat = messageFormat;
};


/*
 *
 */
SyslogProduce.prototype.produce = function() {

	
};


/*
 *	Prepend a zero to a number less than 10
 *	@param {Number} n
 *	@return {String}
 *
 *	Where's sprintf when you need it?
 */
function leadZero(n) {
	if(typeof n != 'number') return n;
	n = n < 10 ? '0' + n : n ;
	return n;
}


/*
 *	Get current date in RFC 3164 format. If no date is supplied, the default
 *	is the current time in GMT + 0.
 *	@param {Date} dateObject optional Date object
 *	@returns {String}
 *
 *	Features code taken from BSDDateIndex
 */
function generateBSDDate(dateObject) {
	if(!dateObject) dateObject = new Date();
	var hours   = leadZero(dateObject.getHours());
	var minutes = leadZero(dateObject.getMinutes());
	var seconds = leadZero(dateObject.getSeconds());
	var month   = dateObject.getMonth();
	var day     = dateObject.getDate();
	(day < 10) && (day = ' ' + day);
	return BSDDateIndex[month] + " " + day + " " + hours + ":" + minutes
		+ ":" + seconds;
}




module.exports = SyslogProduce;

