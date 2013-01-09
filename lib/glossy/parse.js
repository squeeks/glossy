/*
 *    Glossy Parser - Parse incoming syslog messages
 *
 *    Copyright Squeeks <privacymyass@gmail.com>.
 *    This is free software licensed under the MIT License - 
 *    see the LICENSE file that should be included with this package.
 */

/*
 *    These values replace the integers in message that define the facility.
 */
var FacilityIndex = [
    'kern',     // kernel messages
    'user',     // user-level messages
    'mail',     // mail system
    'daemon',   // system daemons
    'auth',     // security/authorization messages
    'syslog',   // messages generated internally by syslogd
    'lpr',      // line printer subsystem
    'news',     // network news subsystem
    'uucp',     // UUCP subsystem
    'clock',    // clock daemon
    'sec',      // security/authorization messages
    'ftp',      // FTP daemon
    'ntp',      // NTP subsystem
    'audit',    // log audit
    'alert',    // log alert
    'clock',    // clock daemon (note 2)
    'local0',   // local use 0  (local0)
    'local1',   // local use 1  (local1)
    'local2',   // local use 2  (local2)
    'local3',   // local use 3  (local3)
    'local4',   // local use 4  (local4)
    'local5',   // local use 5  (local5)
    'local6',   // local use 6  (local6)
    'local7'    // local use 7  (local7)
];

// Note 1 - Various operating systems have been found to utilize
//           Facilities 4, 10, 13 and 14 for security/authorization,
//           audit, and alert messages which seem to be similar. 

// Note 2 - Various operating systems have been found to utilize
//           both Facilities 9 and 15 for clock (cron/at) messages.

/*
 *    These values replace the integers in message that define the severity.
 */
var SeverityIndex = [
    'emerg',    // Emergency: system is unusable
    'alert',    // Alert: action must be taken immediately
    'crit',     // Critical: critical conditions
    'err',      // Error: error conditions
    'warn',     // Warning: warning conditions
    'notice',   // Notice: normal but significant condition
    'info',     // Informational: informational messages
    'debug'     // Debug: debug-level messages
];

/*
 *    Defines the range matching BSD style months to integers.
 */
var BSDDateIndex = {
    'Jan': 0,
    'Feb': 1,
    'Mar': 2,
    'Apr': 3,
    'May': 4,
    'Jun': 5,
    'Jul': 6,
    'Aug': 7,
    'Sep': 8,
    'Oct': 9,
    'Nov': 10,
    'Dec': 11
}

// These values match the hasing algorithm values as defined in RFC 5848
var signedBlockValues = {

    // Section 4.2.1
    hashAlgorithm: [
        null,
        'SHA1',
        'SHA256'
    ],

    // Section 5.2.1
    keyBlobType: {
        'C': 'PKIX Certificate',
        'P': 'OpenPGP KeyID',
        'K': 'Public Key',
        'N': 'No key information',
        'U': 'Unknown'
    }

};

/*  
 *  Parse the raw message received.
 *
 *  @param {String/Buffer} rawMessage Raw message received from socket
 *  @param {Function} callback Callback to run after parse is complete
 *  @return {Object} map containing all successfully parsed data.
 */
function parseMessage(rawMessage, callback) {

    // Are you node.js? Is this a Buffer?
    if(typeof Buffer == 'function' && Buffer.isBuffer(rawMessage)) {
        rawMessage = rawMessage.toString('utf8', 0);
    } else if(typeof rawMessage != 'string') {
        return rawMessage;
    }

    // Always return the original message
    var parsedMessage = {
        originalMessage: rawMessage
    };
    
    var segments = rawMessage.split(' ');
    if(segments.length < 2) return parsedMessage;
    var priKeys = decodePri(segments[0]);
    if(priKeys) {
        for (key in priKeys) parsedMessage[key] = priKeys[key];
    }

    //TODO Could our detection between 3164/5424 be improved?
    if(segments[0].match(/^(<\d+>\d)$/))  {
        segments.shift(); // Shift the prival off
        var timeStamp         = segments.shift(); 
        parsedMessage.time    = parseTimeStamp(timeStamp);
        parsedMessage.host    = decideValue(segments.shift());
        parsedMessage.appName = decideValue(segments.shift());
        parsedMessage.pid     = decideValue(segments.shift());
        parsedMessage.msgID   = decideValue(segments.shift());
        
        if(segments[0] !== '-') {
            var spliceMarker = 0;
            for (part in segments) {
                if(segments[part].substr(-1) === ']'){
                    spliceMarker = part;
                    spliceMarker++;
                    break;
                }
            }
            if(spliceMarker != 0) {
                var sd = segments.splice(0, spliceMarker).join(' ');
                parsedMessage.structuredData = parseStructure(sd);

                if(parsedMessage.structuredData['ssign']) {
                    parsedMessage.structuredData.signedBlock = 
                        parseSignedBlock(parsedMessage.structuredData);
                } else if(parsedMessage.structuredData['ssign-cert']) {
                    parsedMessage.structuredData.signedBlock = 
                        parseSignedCertificate(parsedMessage.structuredData);
                }

            }
        } else {
            segments.shift(); // Shift the SD marker off
        }
        parsedMessage.message = segments.join(' ');

    } else if (segments[0].match(/^(<\d+>\d+:)$/)) {
        parsedMessage.type    = 'RFC3164';
        var timeStamp         = segments.splice(0,1).join(' ').replace(/^(<\d+>)/,'');
        parsedMessage.time    = parseTimeStamp(timeStamp);
        parsedMessage.message = segments.join(' ');

    } else if(segments[0].match(/^(<\d+>\w+)/)) {
        parsedMessage.type    = 'RFC3164';
        if (segments[1] == '') segments.splice(1,1); 
        var timeStamp         = segments.splice(0,3).join(' ').replace(/^(<\d+>)/,'');
        parsedMessage.time    = parseTimeStamp(timeStamp);
        parsedMessage.host    = segments.shift();
        parsedMessage.message = segments.join(' ');
    }

    if(callback) {
        callback(parsedMessage);
    } else {
        return parsedMessage;
    }

};

/*
 *  RFC5424 messages are supposed to specify '-' as the null value
 *  @param {String} a section from an RFC5424 message
 *  @return {Boolean/String} null if string is entirely '-', or the original value
 */
function decideValue(value) {
    return value === '-' ? null : value;
}

/*
 *  Parses the PRI value from the start of message
 *
 *  @param {String} message Supplied raw primary value and version
 *  @return {Object} Returns object containing Facility, Severity and Version
 *      if correctly parsed, empty values on failure.
 */
function decodePri(message) {
    if(typeof message != 'string') return;

    var privalMatch = message.match(/^<(\d+)>/);
    if(!privalMatch) return false;

    var returnVal = {
        prival:  parseInt(privalMatch[1])
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
 *  Attempts to parse a given timestamp
 *  @param {String} timeStamp Supplied timestamp, should only be the timestamp, 
 *      not the entire message
 *  @return {Object} Date object on success
 */
function parseTimeStamp(timeStamp) {
    
    if(typeof timeStamp != 'string') return;
    
    var parsedTime;

    // Try RFC3339 Style (specified in RFC5424)
    // https://github.com/tardate/rfc3339date.js
    // This portion is Copyright (c) 2010 Paul GALLAGHER http://tardate.com
    //FIXME This regexp is *very* slow
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
        parsedTime = new Date(
            currDate.getUTCFullYear(), 
            BSDDateIndex[ d[1] ], 
            d[2], 
            d[3], 
            d[4], 
            d[5]);
    }

    if(parsedTime) return parsedTime;

    // Try ISO 8601 (suggested in RFC 3164)
    d = timeStamp.match(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/); //TODO: Less strict match? TZ designations?
    if(d) {
        parsedTime = new Date(d[1], d[2], d[3], d[4], d[5], d[6]);
    }
    
    return parsedTime;

}


/*
 *  Parse the structured data out of RFC5424 messages
 *  @param {String} msg The STRUCTURED-DATA section
 *  @return {Object} sdStructure parsed structure
 */
function parseStructure(msg) {
    var sdStructure = { };
    var sdElements  = msg.split('][');
    //TODO could we improve things here?
    for(element in sdElements) {
        var element = sdElements[element];
            element = element.replace(/^\[|\]$/g, '');        
        var sdID    = element.match(/^([^\s=\]]+)\s/)[1];
            element = element.replace(sdID + ' ', '');
        var sdKeys  = element.split(/"\s/);

        for(key in sdKeys) {
            var sdKeyValue = sdKeys[key].match(/^([^\s=\]]+)="(.*)$/);
            if(!sdKeyValue) continue;
            var sdKey    = sdKeyValue[1];
            var sdValue  = sdKeyValue[2];
            if(!sdStructure[sdID]) sdStructure[sdID] = { };
            sdStructure[sdID][sdKey] = sdValue;
        }

    }

    return sdStructure;
}


/*
 *  Make sense of signed block messages
 *  @param {Object} block the parsed structured data containing signed data
 *  @return {Object} validatedBlock translated and named values, binary
 *      elements will be Buffer objects, if available
 */
function parseSignedBlock(block) {

    if(typeof block != 'object') return false;

    var signedBlock    = { };
    var validatedBlock = { };
    // Figure out where in the object the keys live...
    if(block.structuredData && block.structuredData.ssign) {
        signedBlock = block.structuredData.ssign;
    } else if(block.ssign) {
        signedBlock = block.ssign
    } else if(block.VER) {
        signedBlock = block;
    } else {
        return false;
    }

    var versionMatch = signedBlock.VER.match(/^(\d{2})(\d|\w)(\d)$/);
    if(versionMatch != null) {
        validatedBlock.version        = versionMatch[1];
        validatedBlock.hashAlgorithm  = parseInt(versionMatch[2]);
        validatedBlock.hashAlgoString = signedBlockValues.hashAlgorithm[validatedBlock.hashAlgorithm];
        validatedBlock.sigScheme      = parseInt(versionMatch[3]);
    }

    validatedBlock.rebootSessionID   = parseInt(signedBlock.RSID);
    validatedBlock.signatureGroup    = parseInt(signedBlock.SG);
    validatedBlock.signaturePriority = parseInt(signedBlock.SPRI);
    validatedBlock.globalBlockCount  = parseInt(signedBlock.GBC);
    validatedBlock.firstMsgNumber    = parseInt(signedBlock.FMN);
    validatedBlock.msgCount          = parseInt(signedBlock.CNT);
    validatedBlock.hashBlock         = signedBlock.HB.split(/\s/);

    // Check to see if we're in node or have a Buffer type
    if(typeof Buffer == 'function') {
        for(hash in validatedBlock.hashBlock) {
            validatedBlock.hashBlock[hash] = new Buffer(
                validatedBlock.hashBlock[hash], encoding='base64'); 
        }
        validatedBlock.thisSignature = new Buffer(
            signedBlock.SIGN, encoding='base64');
    } else {
        validatedBlock.thisSignature = signedBlock.SIGN;
    }

    return validatedBlock;
    
}


/*
 *  Make sense of signed certificate messages
 *  @param {Object} block the parsed structured data containing signed data
 *  @return {Object} validatedBlock translated and named values, binary
 *      elements will be Buffer objects, if available
 */
function parseSignedCertificate(block) {

    if(typeof block != 'object') return false;

    var signedBlock    = { };
    var validatedBlock = { };
    // Figure out where in the object the keys live...
    if(block.structuredData && block.structuredData['ssign-cert']) {
        signedBlock = block.structuredData['ssign-cert'];
    } else if(block['ssign-cert']) {
        signedBlock = block['ssign-cert'];
    } else if(block.VER) {
        signedBlock = block;
    } else {
        return false;
    }

    var versionMatch = signedBlock.VER.match(/^(\d{2})(\d|\w)(\d)$/);
    if(versionMatch != null) {
        validatedBlock.version        = versionMatch[1];
        validatedBlock.hashAlgorithm  = parseInt(versionMatch[2]);
        validatedBlock.hashAlgoString = signedBlockValues.hashAlgorithm[validatedBlock.hashAlgorithm];
        validatedBlock.sigScheme      = parseInt(versionMatch[3]);
    }

    validatedBlock.rebootSessionID     = parseInt(signedBlock.RSID);
    validatedBlock.signatureGroup      = parseInt(signedBlock.SG);
    validatedBlock.signaturePriority   = parseInt(signedBlock.SPRI);
    validatedBlock.totalPayloadLength  = parseInt(signedBlock.TPBL);
    validatedBlock.payloadIndex        = parseInt(signedBlock.INDEX);
    validatedBlock.fragmentLength      = parseInt(signedBlock.FLEN);

    var payloadFragment             = signedBlock.FRAG.split(/\s/);
    validatedBlock.payloadTimestamp = parseTimeStamp(payloadFragment[0]);
    validatedBlock.payloadType      = payloadFragment[1];
    validatedBlock.payloadName      = signedBlockValues.keyBlobType[payloadFragment[1]];

    if(typeof Buffer == 'function') {
        validatedBlock.keyBlob = new Buffer(
            payloadFragment[2], encoding='base64');
        validatedBlock.thisSignature = new Buffer(
            signedBlock.SIGN, encoding='base64');
    } else {
        validatedBlock.keyBlob       = payloadFragment[2];
        validatedBlock.thisSignature = signedBlock.SIGN;
    }

    return validatedBlock;

}


if(typeof module == 'object') {
    module.exports.parse = parseMessage;
}
