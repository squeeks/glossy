/*
 *
 *
 */

/*
 *	These values replace the integers in message that define the facility.
 */
FacilityIndex = [
    "kern",     // kernel messages
    "user",     // user-level messages
    "mail",     // mail system
    "daemon",   // system daemons
    "auth",     // security/authorization messages
    "syslog",   // messages generated internally by syslogd
    "lpr",      // line printer subsystem
    "news",     // network news subsystem
    "uucp",     // UUCP subsystem
    "clock",    // clock daemon
    "sec",      // security/authorization messages
    "ftp",      // FTP daemon
    "ntp",      // NTP subsystem
    "audit",    // log audit
    "alert",    // log alert
    "clock",    // clock daemon (note 2)
    "local0",   // local use 0  (local0)
    "local1",   // local use 1  (local1)
    "local2",   // local use 2  (local2)
    "local3",   // local use 3  (local3)
    "local4",   // local use 4  (local4)
    "local5",   // local use 5  (local5)
    "local6",   // local use 6  (local6)
    "local7",   // local use 7  (local7)
];

// Note 1 - Various operating systems have been found to utilize
//           Facilities 4, 10, 13 and 14 for security/authorization,
//           audit, and alert messages which seem to be similar. 

// Note 2 - Various operating systems have been found to utilize
//           both Facilities 9 and 15 for clock (cron/at) messages.


/*
 *	These values replace the integers in message that define the severity.
 */
SeverityIndex = [
    "emerg",    // Emergency: system is unusable
    "alert",    // Alert: action must be taken immediately
    "crit",     // Critical: critical conditions
    "err",      // Error: error conditions
    "warn",     // Warning: warning conditions
    "notice",   // Notice: normal but significant condition
    "info",     // Informational: informational messages
    "debug"     // Debug: debug-level messages
];

/*
 *	Defines the range matching BSD style months to integers.
 */
BSDDateIndex = {
	Jan: 1,
	Feb: 2,
	Mar: 3,
	Apr: 4,
	May: 5,
	Jun: 6,
	Jul: 7,
	Aug: 8,
	Sep: 9,
	Oct: 10,
	Nov: 11,
	Dec: 12
}


/*  
 *  @param raw_message
 *      
 */
module.exports.parse = function(rawMessage, callback) {

	// Always return the original message
	parsedMessage = {
		originalMessage: rawMessage
	};

	// Try RFC 5424
	messageHead = rawMessage.match(/^(<\d+>\d)\s(\S+)\s(\S+)\s(\S+)\s(.*)$/);

	// No Good? Try RFC 3164
	if(!messageHead) messageHead = rawMessage.match(/^(<\d+>)(\w{3}\s+\d+\s\d+:\d+:\d+)\s(\S+)\s(.*)$/);

	if(messageHead)
	{
		// Parse Primary Keys to get Facility, Severity, Version
		priKeys = decodePri(messageHead[1]);
		for (key in priKeys)
		{
			parsedMessage[key] = priKeys[key];
		}

		parsedMessage['time']    = parseTimeStamp(messageHead[2]);
		parsedMessage['host']    = messageHead[3];
		parsedMessage['message'] = messageHead.length == 5 ? messageHead[4] : messageHead[5];

	}
	
	if(callback) {
		callback(parsedMessage);
	} else {
		return parsedMessage;
	}
};


/*
 *    Parses the PRI value from the start of message
 *
 *    @param {String} message Supplied raw primary value and version
 *    @return {Object} Returns object containing Facility, Severity and Version
 *         if correctly parsed, empty values on failure.
 */
function decodePri(message)
{
	if(typeof message != 'string') return;

	privalMatch = message.match(/^.*<(\d+)>(\d)/);
	if(!privalMatch) privalMatch = message.match(/^.*<(\d+)>/);

	returnVal = {
		prival:  parseInt(privalMatch[1]),
	};

	if(privalMatch[2]) returnVal['version'] = parseInt(privalMatch[2]);

	if(returnVal.prival && returnVal.prival >= 0 && returnVal.prival <= 191) {
	
		returnVal.facilityID = parseInt(returnVal.prival / 8);
		returnVal.severityID = returnVal.prival - (returnVal.facilityID * 8);

		if(returnVal.facilityID < 24 && returnVal.severityID < 8) {
			returnVal.facility = FacilityIndex[returnVal.facilityID];
			returnVal.severity = SeverityIndex[returnVal.severityID];
		}
	}

	return returnVal;
}


/*
 *	Attempts to parse a given timestamp
 *	@param {String} timeStamp Supplied timestamp, should only be the
 *		timestamp, not the entire message
 *	@return {Object} Date object on success
 */
function parseTimeStamp(timeStamp)
{
	
	if(typeof timeStamp != 'string') return;
	
	var parsedTime;

	// Try RFC3339 Style (specified in RFC5424)
	// https://github.com/tardate/rfc3339date.js
	// This portion is Copyright (c) 2010 Paul GALLAGHER http://tardate.com
	var d = timeStamp.match(/(\d{4})(-)?(\d{2})(-)?(\d{2})(T)?(\d{2})(:)?(\d{2})?(:)?(\d{2})?([\.,]\d+)?($|Z|([+-])(\d{2})(:)?(\d{2})?)/i);
	if (d) {
		var year   = parseInt(d[1],10);
		var mon    = parseInt(d[3],10) - 1;
		var day    = parseInt(d[5],10);
		var hour   = parseInt(d[7],10);
		var mins   = ( d[9] ? parseInt(d[9],10) : 0 );
		var secs   = ( d[11] ? parseInt(d[11],10) : 0 );
		var millis = ( d[12] ? parseFloat(String(1.5).charAt(1) + d[12].slice(1)) * 1000 : 0 );
		if (d[13]) {
			parsedTime = new Date();
			parsedTime.setUTCFullYear(year);
			parsedTime.setUTCMonth(mon);
			parsedTime.setUTCDate(day);
			parsedTime.setUTCHours(hour);
			parsedTime.setUTCMinutes(mins);
			parsedTime.setUTCSeconds(secs);
			parsedTime.setUTCMilliseconds(millis);
			if (d[13] && d[14]) {
				var offset = (d[15] * 60) 
				if (d[17]) offset += parseInt(d[17],10);
				offset *= ((d[14] == '-') ? -1 : 1);
				parsedTime.setTime(parsedTime.getTime() - offset * 60 * 1000);
			}

		} else {
			parsedTime = new Date(year,mon,day,hour,mins,secs,millis);
		}
	}

	if(parsedTime) return parsedTime;

	// Try BSD Style formatting (specified in RFC 3164)
	d = timeStamp.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/);
	if(d) {
		// Years are absent from the specification, use this year
		currDate   = new Date();
		parsedTime = new Date( currDate.getUTCFullYear(), BSDDateIndex[ d[1] ], d[2], d[3], d[4], d[5] );
	}

	if(parsedTime) return parsedTime;

	// Try ISO 8601 (suggested in RFC 3164)
	d = timeStamp.match(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/); //TODO: Less strict match? TZ designations?
	if(d) {
		parsedTime = new Date(d[1], d[2], d[3], d[4], d[5], d[6]);
	}
	
	return parsedTime;

}
