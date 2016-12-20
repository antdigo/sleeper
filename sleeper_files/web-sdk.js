(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var log = require('./log');
var dom = require('./dom');
var popupWindow = require('./popupWindow');
var state = require('./state');
var Segment = require('./segment');
var cookie = require('std/cookie');

module.exports = {
	show: show,
	addChatBox: addChatBox,
	openChatBox: openChatBox,
	hideChatBox: hideChatBox,
	showChatBox: showChatBox,
	removeChatBox: removeChatBox,
	registerListener: registerListener
};

function show() {
	// 1: TODO: check if document ready. If not, add listener and wait. If ready, proceed
	// 2: Show ASAPP UI in bottom right corner
	log('Create DOM');
	var el = dom.create('div', {
		textAlign: 'center',
		position: 'fixed',
		bottom: 10,
		right: 10,
		cursor: 'pointer'
	});
	var img = document.createElement('img');
	img.src = '//' + location.host + '/current-web/web/graphics/webSDK_button.png';
	el.appendChild(img);
	//dom.text(el, 'Customer Support')
	dom.onTap(el, function () {
		popupWindow.open();
	});
	document.body.appendChild(el);
}

function addChatBox() {
	log('Create ASAPP chat box');
	var frame = dom.create('iframe', {
		position: 'fixed',
		width: 320,
		height: 400,
		bottom: -400,
		right: 20,
		background: "none transparent",
		zIndex: "9999"
	});
	var referrer = cookie.get('asapp_referrer');
	frame.setAttribute('id', 'ASAPPChatIFrame');
	frame.src = ASAPP.Host + "/" + state.GetCompanyMarker() + "/web-sdk-iframe?token=" + state.GetCustomerAuthToken() + "&OriginPath=" + location.protocol + '//' + location.host + "&OriginPathFull=" + location.href + "&OriginTitle=" + document.title +
	//encode because referrer may contain & or = which is split on
	//by url.js
	"&Referrer=" + encodeURIComponent(referrer) + "&regionCode=" + state.GetRegionCode();
	frame.frameBorder = 0;
	frame.allowTransparency = "true";
	frame.style.background = 'none transparent';
	document.body.appendChild(frame);

	window.addEventListener('message', function (e) {
		if (e.origin.indexOf(ASAPP.Host) < 0) {
			return;
		}
		if (e.data == 'ASAPPChatInit') {
			$('#ASAPPChatIFrame').animate({
				bottom: '-360px'
			}, function () {
				sendEvent("Init");
			});
		} else if (e.data == 'ASAPPChatDisplaytrue') {
			$('#ASAPPChatIFrame').animate({
				bottom: '0px'
			}, function () {
				sendEvent("Open");
			});
		} else if (e.data == 'ASAPPChatDisplayfalse') {
			$('#ASAPPChatIFrame').animate({
				bottom: '-360px'
			}, function () {
				sendEvent("Minimize");
			});
		} else if (e.data == 'ASAPPChatRemove') {
			$('#ASAPPChatIFrame').remove();
			sendEvent("Remove");
		} else if (e.data == 'ASAPPGotInputFocus') {
			if (!checkDevice.isMobile()) {
				return;
			}
			$("html, body").animate({ scrollTop: $(document).height() });
			// $('#ASAPPChatIFrame').css('position', 'absolute')
		} else if (e.data == 'ASAPPGotInputBlur') {
			// $('#ASAPPChatIFrame').css('position', 'fixed')
		} else if (e.data && e.data.type == 'ASAPPSendAnalyticsEvent') {
			// Change others to use this format
			Segment.track(e.data.event, e.data.props);
		}
	});
}

function openChatBox() {
	if (!$('#ASAPPChatIFrame')) {
		return false;
	}
	$('#ASAPPChatIFrame').animate({
		bottom: '0px'
	}, function () {
		sendEvent("Open");
	});
	$('#ASAPPChatIFrame')[0].contentWindow.postMessage('ASAPPChatDisplaytrue', 'https:' + $('#ASAPPChatIFrame').attr('src'));
	return true;
}

function hideChatBox() {
	if (!$('#ASAPPChatIFrame')) {
		return false;
	}
	$('#ASAPPChatIFrame').animate({
		bottom: '-400px'
	}, function () {
		sendEvent("Hide");
	});
	return true;
}

function showChatBox() {
	if (!$('#ASAPPChatIFrame')) {
		return false;
	}
	$('#ASAPPChatIFrame').animate({
		bottom: '-360px'
	}, function () {
		sendEvent("Init");
	});
	return true;
}

function removeChatBox() {
	if (!$('#ASAPPChatIFrame')) {
		return false;
	}
	$('#ASAPPChatIFrame').remove();
	sendEvent("Remove");
	return true;
}

var listenCallback;
function registerListener(callback) {
	listenCallback = callback;
}

function sendEvent(eventType) {
	if (!listenCallback) {
		return;
	}
	listenCallback(eventType);
}

var checkDevice = {
	isAndroid: function () {
		return navigator.userAgent.match(/Android/i);
	},
	isBlackBerry: function () {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	isIOS: function () {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	isOpera: function () {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	isWindows: function () {
		return navigator.userAgent.match(/IEMobile/i);
	},
	isMobile: function () {
		return checkDevice.isAndroid() || checkDevice.isBlackBerry() || checkDevice.isIOS() || checkDevice.isOpera() || checkDevice.isWindows();
	}
};

},{"./dom":3,"./log":4,"./popupWindow":5,"./segment":6,"./state":7,"std/cookie":9}],2:[function(require,module,exports){
var log = require('./log');
var state = require('./state');
var badgeUI = require('./badgeUI');

module.exports = {
	'Ping': handlePing,
	'Load': handleLoad,
	'Open': handleOpen,
	'Action': handleAction,
	'Listen': handleListen,
	'Customer': handleCustomer,
	'EnableLogs': handleEnableLogs,
	'SetCompanyMarker': handleSetCompanyMarker
};

function handleLoad(args) {
	log("Loading");
	//TODO this is here for backwards compatability.
	//Once Casper updates snippet, this can be removed.
	if (args.Company) {
		state.SetCompanyMarker(args.Company);
	}

	if (!state.GetCompanyMarker()) {
		log.Error('Company marker is not set.');
		return;
	}

	var regionCode = args.RegionCode;
	if (!regionCode) {
		//TODO: 1) Should we default to a region if client doesn't pass one? 
		//(this might be necessary if customers without FeatureRegions are using
		//the SDK).
		//2) Where should the default come from (rather than hardcoding)? Storing 
		// in the db is best option, but need to get that data to the frontend.
		regionCode = "US";
	}
	state.SetRegionCode(regionCode);

	var url = ASAPP.Host + "/api/noauth/ShouldDisplayWebChat?ASAPP-ClientType=web-desk&ASAPP-ClientVersion=0.1.0";

	//IE9
	if (window.XDomainRequest) {
		var xhr = new XDomainRequest();
		xhr.open('POST', url, true);
	} else {
		var xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);
		xhr.setRequestHeader("Content-Type", "application/json;");
	}
	xhr.onload = function () {
		var resp = JSON.parse(xhr.responseText);
		if (resp.DisplayCustomerSupport) {
			badgeUI.addChatBox();
			log("Loaded");
		} else {
			log("Not loading");
		}
	};
	var data = {
		CompanyMarker: state.GetCompanyMarker(),
		RegionCode: state.GetRegionCode()
	};
	xhr.send(JSON.stringify(data));
}

function handleCustomer(args) {
	log("Auth Customer");
	if (!args.Customer) {
		log.Error('Missing Customer auth token');
		return;
	}
	state.SetCustomerAuthToken(args.Customer);
}

function handleOpen(args) {
	log("Open Web Chat");
	var didOpen = badgeUI.openChatBox();
	if (didOpen) {
		log("Did open chat");
	} else {
		log("ERROR: Chat frame not ready!");
	}
}

function handleAction(args) {
	log("Handle Action");
	if (!args.Action) {
		log.Error('Missing Action');
		return;
	}

	var result;
	switch (args.Action) {
		case 'Open':
		case 'ChatWidget.Open':
			result = badgeUI.openChatBox();
			break;
		case 'Hide':
		case 'ChatWidget.Hide':
			result = badgeUI.hideChatBox();
			break;
		case 'Show':
		case 'ChatWidget.Show':
			result = badgeUI.showChatBox();
			break;
		case 'Remove':
		case 'ChatWidget.Remove':
			result = badgeUI.removeChatBox();
			break;
		default:
			log("Invalid Action: " + args.Action);
	}
}

var listenHandlers = {};
function handleListen(args) {
	log("Handle Listen");
	if (!args.EventType || !args.Callback) {
		log.Error('Missing Args');
		return;
	}

	if (typeof listenHandlers[args.EventType] === "undefined") {
		listenHandlers[args.EventType] = [];
	}
	listenHandlers[args.EventType].push(args.Callback);
	badgeUI.registerListener(processEvent);
	return;
}

function processEvent(eventType) {
	if (!listenHandlers[eventType] && !listenHandlers["All"]) {
		return;
	}
	// Call All eventType handlers
	for (var i in listenHandlers["All"]) {
		listenHandlers["All"][i](eventType);
	}

	// Call specific eventType handlers
	for (var i in listenHandlers[eventType]) {
		listenHandlers[eventType][i](eventType);
	}
}

function handlePing(callback) {
	log("Ping?", "Pong!");
	if (typeof callback == 'function') {
		callback('Pong');
	}
}

function handleEnableLogs() {
	log.Enable();
}

function handleSetCompanyMarker(args) {
	if (!args.Company) {
		log.Error('Missing Company in parameters to SetCompanyMarker');
		return;
	}
	if (state.GetCompanyMarker()) {
		log.Error('Company marker already set.');
		return;
	}
	state.SetCompanyMarker(args.Company);
}

},{"./badgeUI":1,"./log":4,"./state":7}],3:[function(require,module,exports){
module.exports = {
	create: create,
	style: style,
	text: text,
	onTap: onTap
};

function create(tagName, styles) {
	return style(document.createElement(tagName), styles);
}

function style(el, styles) {
	for (var key in styles) {
		var val = styles[key];
		el.style[key] = typeof val == 'number' ? val + 'px' : val;
	}
	return el;
}

function text(el, text) {
	el.innerText = text;
}

function onTap(el, handler) {
	el.onclick = handler;
}

},{}],4:[function(require,module,exports){
var slice = require('std/slice');
var extend = require('std/extend');

var hostname = window.location.hostname;
var enabled = hostname == 'localhost' || hostname == '127.0.0.1';

module.exports = extend(function log() {
	_doLog(console.log, arguments);
}, {
	Enable: function () {
		enabled = true;
	},
	Error: function () {
		_doLog(console.error, arguments, true);
	}
});

function _doLog(consoleFn, fnArguments, force) {
	if (!enabled && !force) {
		return;
	}
	var args = ["ASAPP:"].concat(slice(fnArguments));
	consoleFn.apply(console, args);
}

},{"std/extend":11,"std/slice":17}],5:[function(require,module,exports){
var popup = require('std/popup');
var state = require('./state');

module.exports = {
	open: open
};

function open() {
	var winID = 'web-sdk-dialogue-' + state.GetCompanyMarker();
	//popup(ASAPP.Host+'/'+state.GetCompanyMarker()+'/web-sdk-dialogue?token='+state.GetCustomerAuthToken(), winID)
	window.open(ASAPP.Host + '/' + state.GetCompanyMarker() + '/web-sdk-dialogue?token=' + state.GetCustomerAuthToken(), '_blank');
}

},{"./state":7,"std/popup":16}],6:[function(require,module,exports){
module.exports = {
  track: function (event, props) {
    var analytics = window.analytics;
    if (!analytics) {
      return;
    }
    analytics.track(event, props);
  }
};

},{}],7:[function(require,module,exports){
var log = require('./log');

module.exports = {
	SetCompanyMarker: SetCompanyMarker,
	GetCompanyMarker: GetCompanyMarker,
	SetCustomerAuthToken: SetCustomerAuthToken,
	GetCustomerAuthToken: GetCustomerAuthToken,
	SetRegionCode: SetRegionCode,
	GetRegionCode: GetRegionCode
};

var _companyMarker;
function SetCompanyMarker(companyMarker) {
	log('SetCompanyMarker', companyMarker);
	_companyMarker = companyMarker;
}
function GetCompanyMarker() {
	return _companyMarker;
}

var _customerAuthToken;
function SetCustomerAuthToken(customerAuthToken) {
	log('SetCustomerAuthToken', customerAuthToken);
	_customerAuthToken = customerAuthToken;
}
function GetCustomerAuthToken() {
	if (!_customerAuthToken) {
		return '';
	}
	return _customerAuthToken;
}

var _regionCode;
function SetRegionCode(regionCode) {
	log('SetRegionCode', regionCode);
	_regionCode = regionCode;
}
function GetRegionCode() {
	if (!_regionCode) {
		return '';
	}
	return _regionCode;
}

},{"./log":4}],8:[function(require,module,exports){
var log = require('./log');
var commandHandlers = require('./commandHandlers');
var slice = require('std/slice');
var cookie = require('std/cookie');

initASAPP();

function initASAPP() {
	var queuedCommandArgs = ASAPP._;
	ASAPP._ = { push: handleCommandArgs };
	for (var i = 0; i < queuedCommandArgs.length; i++) {
		handleCommandArgs(queuedCommandArgs[i]);
	}

	setReferrerCookieIfChanged();
}

function handleCommandArgs(fnArguments) {
	var cmd = fnArguments[0];
	var args = slice(fnArguments, 1);
	var commandHandler = commandHandlers[cmd];
	if (commandHandler) {
		log('Handle command', cmd, args);
		commandHandler.apply(this, args);
	} else {
		log('Unknown command', cmd, { 'arguments': args });
	}
}

function setReferrerCookieIfChanged() {
	var ONE_MONTH_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;
	var currentValue = cookie.get('asapp_referrer') || null;

	if (document.referrer === currentValue) return;
	//Referrer should never have same host as current.
	if (parseHostname(window.location) === parseHostname(document.referrer)) {
		return;
	}
	log('Set referrer');
	cookie.set('asapp_referrer', document.referrer, ONE_MONTH_IN_MILLISECONDS);
}

//This code is taken from std/url.js 
//to avoid importing entire lib
function parseHostname(url) {
	var extractionRegex = new RegExp(['^', // start at the beginning of the string
	'((\\w+:)?//)?', // match a possible protocol, like http://, ftp://, or // for a relative url
	'(\\w[\\w\\.\\-]+)?', // match a possible domain
	'(:\\d+)?', // match a possible port
	'(\\/[^\\?#]+)?', // match a possible path
	'(\\?[^#]+)?', // match possible GET parameters
	'(#.*)?' // match the rest of the URL as the hash
	].join(''), 'i');

	var match = url.toString().match(extractionRegex);
	return match[3];
}

},{"./commandHandlers":2,"./log":4,"std/cookie":9,"std/slice":17}],9:[function(require,module,exports){
module.exports.get = function(name) {
	var regex = new RegExp(
		'(^|(; ))' + // beginning of document.cookie, or "; " which signifies the beginning of a new cookie
		name +
		'=([^;]*)') // the value of the cookie, matched up until a ";" or the end of the string
	
	var match = document.cookie.match(regex),
		value = match && match[3]
	return value && decodeURIComponent(value)
}

module.exports.set = function(name, value, duration) {
	if (duration === undefined) { duration = (365 * 24 * 60 * 60 * 1000) } // one year
	var date = (duration instanceof Date ? duration : (duration < 0 ? null : new Date(new Date().getTime() + duration))),
		expires = date ? "expires=" + date.toGMTString() + '; ' : '',
		cookieName = name + '=' + encodeURIComponent(value) + '; ',
		domain = 'domain='+document.domain+'; ',
		path = 'path=/; '

	document.cookie = cookieName + expires + domain + path
}

module.exports.isEnabled = function() {
	var name = '__test__cookie' + new Date().getTime()
	module.exports.set(name, 1)
	var isEnabled = !!module.exports.get(name)
	module.exports.remove(name)
	return isEnabled
}

module.exports.remove = function(name) {
	module.exports.set(name, "", new Date(1))
}

},{}],10:[function(require,module,exports){
var isList = require('./isList')

module.exports = function each(items, fn) {
	if (!items) { return }
	if (items.forEach == Array.prototype.forEach) {
		items.forEach(fn)
	} else if (isList(items)) {
		for (var i=0; i < items.length; i++) {
			fn(items[i], i)
		}
	} else {
		for (var key in items) {
			if (!items.hasOwnProperty(key)) { continue }
			fn(items[key], key)
		}
	}
}

},{"./isList":14}],11:[function(require,module,exports){
/*
	Example usage:

	var A = Class(function() {
		
		var defaults = {
			foo: 'cat',
			bar: 'dum'
		}

		this.init = function(opts) {
			opts = std.extend(opts, defaults)
			this._foo = opts.foo
			this._bar = opts.bar
		}

		this.getFoo = function() {
			return this._foo
		}

		this.getBar = function() {
			return this._bar
		}
	})

	var a = new A({ bar:'sim' })
	a.getFoo() == 'cat'
	a.getBar() == 'sim'
*/

module.exports = function extend(target, extendWith) {
	for (var key in extendWith) {
		if (typeof target[key] != 'undefined') { continue }
		target[key] = extendWith[key]
	}
	return target
}

},{}],12:[function(require,module,exports){
module.exports = function isArguments(obj) {
  return Object.prototype.toString.call(obj) == '[object Arguments]'
}
},{}],13:[function(require,module,exports){
module.exports = (function() {
	if (Array.isArray && Array.isArray.toString().match('\\[native code\\]')) {
		return function(obj) {
			return Array.isArray(obj)
		}
	} else if (Array.prototype) {
		return function(obj) {
			return (obj && obj.slice == Array.prototype.slice)
		}
	} else {
		// thanks @kangax http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
		return function(obj) {
			return Object.prototype.toString.call(obj) == '[object Array]'
		}
	}
})();

},{}],14:[function(require,module,exports){
var isArray = require('std/isArray')
var isArguments = require('std/isArguments')
var isNodeList = require('std/isNodeList')

module.exports = function isList(item) {
	return isArray(item) || isArguments(item) || isNodeList(item)
}

},{"std/isArguments":12,"std/isArray":13,"std/isNodeList":15}],15:[function(require,module,exports){
module.exports = (function() {
	if (typeof NodeList == 'undefined') {
		return function isNodeList() {
			return false
		}
	} else {
		return function isNodeList(obj) {
			return obj && obj.item == NodeList.prototype.item
		}
	}
}())
},{}],16:[function(require,module,exports){
var extend = require('./extend'),
	each = require('./each')

module.exports = function(url, winID, opts) {
	opts = extend(opts || {}, module.exports.defaults)
	if (!opts['left']) { opts['left'] = Math.round((screen.width - opts['width']) / 2) }
	if (!opts['top']) { opts['top'] = Math.round((screen.height - opts['height']) / 2) }

	var res = []
	each(opts, function(val, key) { res.push(key+'='+val) })
	var popupStr = res.join(',')

	return window.open(url, winID, popupStr)
}

module.exports.defaults = {
	'width':       600,
	'height':      400,
	'left':        null,
	'top':         null,
	'directories': 0,
	'location':    1,
	'menubar':     0,
	'resizable':   0,
	'scrollbars':  1,
	'titlebar':    0,
	'toolbar':     0
}

},{"./each":10,"./extend":11}],17:[function(require,module,exports){
/*
	Example usage:

	function log(category, arg1, arg2) { // arg3, arg4, ..., argN
		console.log('log category', category, std.slice(arguments, 1))
	}
*/
module.exports = function args(args, offset, length) {
	if (typeof length == 'undefined') { length = args.length }
	return Array.prototype.slice.call(args, offset || 0, length)
}


},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9hc2FwcC9hcHBzL3dlYi1zZGsvYmFkZ2VVSS5qcyIsImpzL2FzYXBwL2FwcHMvd2ViLXNkay9jb21tYW5kSGFuZGxlcnMuanMiLCJqcy9hc2FwcC9hcHBzL3dlYi1zZGsvZG9tLmpzIiwianMvYXNhcHAvYXBwcy93ZWItc2RrL2xvZy5qcyIsImpzL2FzYXBwL2FwcHMvd2ViLXNkay9wb3B1cFdpbmRvdy5qcyIsImpzL2FzYXBwL2FwcHMvd2ViLXNkay9zZWdtZW50LmpzIiwianMvYXNhcHAvYXBwcy93ZWItc2RrL3N0YXRlLmpzIiwianMvYXNhcHAvYXBwcy93ZWItc2RrL3dlYi1zZGsuanMiLCJqcy9ub2RlX21vZHVsZXMvc3RkL2Nvb2tpZS5qcyIsImpzL25vZGVfbW9kdWxlcy9zdGQvZWFjaC5qcyIsImpzL25vZGVfbW9kdWxlcy9zdGQvZXh0ZW5kLmpzIiwianMvbm9kZV9tb2R1bGVzL3N0ZC9pc0FyZ3VtZW50cy5qcyIsImpzL25vZGVfbW9kdWxlcy9zdGQvaXNBcnJheS5qcyIsImpzL25vZGVfbW9kdWxlcy9zdGQvaXNMaXN0LmpzIiwianMvbm9kZV9tb2R1bGVzL3N0ZC9pc05vZGVMaXN0LmpzIiwianMvbm9kZV9tb2R1bGVzL3N0ZC9wb3B1cC5qcyIsImpzL25vZGVfbW9kdWxlcy9zdGQvc2xpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFJLE1BQU0sUUFBUSxPQUFSLENBQVY7QUFDQSxJQUFJLE1BQU0sUUFBUSxPQUFSLENBQVY7QUFDQSxJQUFJLGNBQWMsUUFBUSxlQUFSLENBQWxCO0FBQ0EsSUFBSSxRQUFRLFFBQVEsU0FBUixDQUFaO0FBQ0EsSUFBSSxVQUFVLFFBQVEsV0FBUixDQUFkO0FBQ0EsSUFBSSxTQUFTLFFBQVEsWUFBUixDQUFiOztBQUVBLE9BQU8sT0FBUCxHQUFpQjtB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGxvZyA9IHJlcXVpcmUoJy4vbG9nJylcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbScpXG52YXIgcG9wdXBXaW5kb3cgPSByZXF1aXJlKCcuL3BvcHVwV2luZG93JylcbnZhciBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKVxudmFyIFNlZ21lbnQgPSByZXF1aXJlKCcuL3NlZ21lbnQnKVxudmFyIGNvb2tpZSA9IHJlcXVpcmUoJ3N0ZC9jb29raWUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c2hvdzogc2hvdyxcblx0YWRkQ2hhdEJveDogYWRkQ2hhdEJveCxcblx0b3BlbkNoYXRCb3g6IG9wZW5DaGF0Qm94LFxuXHRoaWRlQ2hhdEJveDogaGlkZUNoYXRCb3gsXG5cdHNob3dDaGF0Qm94OiBzaG93Q2hhdEJveCxcblx0cmVtb3ZlQ2hhdEJveDogcmVtb3ZlQ2hhdEJveCxcblx0cmVnaXN0ZXJMaXN0ZW5lcjogcmVnaXN0ZXJMaXN0ZW5lclxufVxuXG5mdW5jdGlvbiBzaG93KCkge1xuXHQvLyAxOiBUT0RPOiBjaGVjayBpZiBkb2N1bWVudCByZWFkeS4gSWYgbm90LCBhZGQgbGlzdGVuZXIgYW5kIHdhaXQuIElmIHJlYWR5LCBwcm9jZWVkXG5cdC8vIDI6IFNob3cgQVNBUFAgVUkgaW4gYm90dG9tIHJpZ2h0IGNvcm5lclxuXHRsb2coJ0NyZWF0ZSBET00nKVxuXHR2YXIgZWwgPSBkb20uY3JlYXRlKCdkaXYnLCB7XG5cdFx0dGV4dEFsaWduOiAnY2VudGVyJyxcblx0XHRwb3NpdGlvbjogJ2ZpeGVkJyxcblx0XHRib3R0b206IDEwLFxuXHRcdHJpZ2h0OiAxMCxcblx0XHRjdXJzb3I6ICdwb2ludGVyJ1xuXHR9KVxuXHR2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJylcblx0aW1nLnNyYyA9ICcvLycrbG9jYXRpb24uaG9zdCsnL2N1cnJlbnQtd2ViL3dlYi9ncmFwaGljcy93ZWJTREtfYnV0dG9uLnBuZydcblx0ZWwuYXBwZW5kQ2hpbGQoaW1nKVxuXHQvL2RvbS50ZXh0KGVsLCAnQ3VzdG9tZXIgU3VwcG9ydCcpXG5cdGRvbS5vblRhcChlbCwgZnVuY3Rpb24oKSB7XG5cdFx0cG9wdXBXaW5kb3cub3BlbigpXG5cdH0pXG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpXG59XG5cbmZ1bmN0aW9uIGFkZENoYXRCb3goKSB7XG5cdGxvZygnQ3JlYXRlIEFTQVBQIGNoYXQgYm94Jylcblx0dmFyIGZyYW1lID0gZG9tLmNyZWF0ZSgnaWZyYW1lJywge1xuXHRcdHBvc2l0aW9uOiAnZml4ZWQnLFxuXHRcdHdpZHRoOiAzMjAsXG5cdFx0aGVpZ2h0OiA0MDAsXG5cdFx0Ym90dG9tOiAtNDAwLFxuXHRcdHJpZ2h0OiAyMCxcblx0XHRiYWNrZ3JvdW5kOiBcIm5vbmUgdHJhbnNwYXJlbnRcIixcblx0XHR6SW5kZXg6IFwiOTk5OVwiXG5cdH0pXG5cdHZhciByZWZlcnJlciA9IGNvb2tpZS5nZXQoJ2FzYXBwX3JlZmVycmVyJylcblx0ZnJhbWUuc2V0QXR0cmlidXRlKCdpZCcsICdBU0FQUENoYXRJRnJhbWUnKVxuXHRmcmFtZS5zcmMgPSBBU0FQUC5Ib3N0K1wiL1wiK3N0YXRlLkdldENvbXBhbnlNYXJrZXIoKStcIi93ZWItc2RrLWlmcmFtZT90b2tlbj1cIitzdGF0ZS5HZXRDdXN0b21lckF1dGhUb2tlbigpK1xuXHRcdFwiJk9yaWdpblBhdGg9XCIrbG9jYXRpb24ucHJvdG9jb2wrJy8vJytsb2NhdGlvbi5ob3N0K1xuXHRcdFwiJk9yaWdpblBhdGhGdWxsPVwiK2xvY2F0aW9uLmhyZWYrXG5cdFx0XCImT3JpZ2luVGl0bGU9XCIrZG9jdW1lbnQudGl0bGUrXG5cdFx0Ly9lbmNvZGUgYmVjYXVzZSByZWZlcnJlciBtYXkgY29udGFpbiAmIG9yID0gd2hpY2ggaXMgc3BsaXQgb25cblx0XHQvL2J5IHVybC5qc1xuXHRcdFwiJlJlZmVycmVyPVwiK2VuY29kZVVSSUNvbXBvbmVudChyZWZlcnJlcikrXG5cdFx0XCImcmVnaW9uQ29kZT1cIitzdGF0ZS5HZXRSZWdpb25Db2RlKClcblx0ZnJhbWUuZnJhbWVCb3JkZXIgPSAwXG5cdGZyYW1lLmFsbG93VHJhbnNwYXJlbmN5ID0gXCJ0cnVlXCJcblx0ZnJhbWUuc3R5bGUuYmFja2dyb3VuZCA9ICdub25lIHRyYW5zcGFyZW50J1xuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZyYW1lKVxuXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24oZSkge1xuXHRcdGlmIChlLm9yaWdpbi5pbmRleE9mKEFTQVBQLkhvc3QpIDwgMCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdGlmIChlLmRhdGEgPT0gJ0FTQVBQQ2hhdEluaXQnKSB7XG5cdFx0XHQkKCcjQVNBUFBDaGF0SUZyYW1lJykuYW5pbWF0ZSh7XG5cdFx0XHRcdGJvdHRvbTogJy0zNjBweCdcblx0XHRcdH0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZW5kRXZlbnQoXCJJbml0XCIpXG5cdFx0XHR9KVxuXHRcdH0gZWxzZSBpZiAoZS5kYXRhID09ICdBU0FQUENoYXREaXNwbGF5dHJ1ZScpIHtcblx0XHRcdCQoJyNBU0FQUENoYXRJRnJhbWUnKS5hbmltYXRlKHtcblx0XHRcdFx0Ym90dG9tOiAnMHB4J1xuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNlbmRFdmVudChcIk9wZW5cIilcblx0XHRcdH0pXG5cdFx0fSBlbHNlIGlmIChlLmRhdGEgPT0gJ0FTQVBQQ2hhdERpc3BsYXlmYWxzZScpIHtcblx0XHRcdCQoJyNBU0FQUENoYXRJRnJhbWUnKS5hbmltYXRlKHtcblx0XHRcdFx0Ym90dG9tOiAnLTM2MHB4J1xuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNlbmRFdmVudChcIk1pbmltaXplXCIpXG5cdFx0XHR9KVxuXHRcdH0gZWxzZSBpZiAoZS5kYXRhID09ICdBU0FQUENoYXRSZW1vdmUnKSB7XG5cdFx0XHQkKCcjQVNBUFBDaGF0SUZyYW1lJykucmVtb3ZlKClcblx0XHRcdHNlbmRFdmVudChcIlJlbW92ZVwiKVxuXHRcdH0gZWxzZSBpZiAoZS5kYXRhID09ICdBU0FQUEdvdElucHV0Rm9jdXMnKSB7XG5cdFx0XHRpZiAoIWNoZWNrRGV2aWNlLmlzTW9iaWxlKCkpIHsgcmV0dXJuIH1cblx0XHRcdCQoXCJodG1sLCBib2R5XCIpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZG9jdW1lbnQpLmhlaWdodCgpIH0pO1xuXHRcdFx0Ly8gJCgnI0FTQVBQQ2hhdElGcmFtZScpLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKVxuXHRcdH0gZWxzZSBpZiAoZS5kYXRhID09ICdBU0FQUEdvdElucHV0Qmx1cicpIHtcblx0XHRcdC8vICQoJyNBU0FQUENoYXRJRnJhbWUnKS5jc3MoJ3Bvc2l0aW9uJywgJ2ZpeGVkJylcblx0XHR9IGVsc2UgaWYgKGUuZGF0YSAmJiBlLmRhdGEudHlwZSA9PSAnQVNBUFBTZW5kQW5hbHl0aWNzRXZlbnQnKSB7IC8vIENoYW5nZSBvdGhlcnMgdG8gdXNlIHRoaXMgZm9ybWF0XG5cdFx0XHRTZWdtZW50LnRyYWNrKGUuZGF0YS5ldmVudCwgZS5kYXRhLnByb3BzKVxuXHRcdH1cblx0fSlcbn1cblxuZnVuY3Rpb24gb3BlbkNoYXRCb3goKSB7XG5cdGlmICghJCgnI0FTQVBQQ2hhdElGcmFtZScpKSB7IHJldHVybiBmYWxzZSB9XG5cdCQoJyNBU0FQUENoYXRJRnJhbWUnKS5hbmltYXRlKHtcblx0XHRib3R0b206ICcwcHgnXG5cdH0sIGZ1bmN0aW9uKCkge1xuXHRcdHNlbmRFdmVudChcIk9wZW5cIilcblx0fSlcblx0JCgnI0FTQVBQQ2hhdElGcmFtZScpWzBdLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoXG5cdFx0J0FTQVBQQ2hhdERpc3BsYXl0cnVlJyxcblx0XHQnaHR0cHM6JyskKCcjQVNBUFBDaGF0SUZyYW1lJykuYXR0cignc3JjJylcblx0KVxuXHRyZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBoaWRlQ2hhdEJveCgpIHtcblx0aWYgKCEkKCcjQVNBUFBDaGF0SUZyYW1lJykpIHsgcmV0dXJuIGZhbHNlIH1cblx0JCgnI0FTQVBQQ2hhdElGcmFtZScpLmFuaW1hdGUoe1xuXHRcdGJvdHRvbTogJy00MDBweCdcblx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0c2VuZEV2ZW50KFwiSGlkZVwiKVxuXHR9KVxuXHRyZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBzaG93Q2hhdEJveCgpIHtcblx0aWYgKCEkKCcjQVNBUFBDaGF0SUZyYW1lJykpIHsgcmV0dXJuIGZhbHNlIH1cblx0JCgnI0FTQVBQQ2hhdElGcmFtZScpLmFuaW1hdGUoe1xuXHRcdGJvdHRvbTogJy0zNjBweCdcblx0fSwgZnVuY3Rpb24oKSB7XG5cdFx0c2VuZEV2ZW50KFwiSW5pdFwiKVxuXHR9KVxuXHRyZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiByZW1vdmVDaGF0Qm94KCkge1xuXHRpZiAoISQoJyNBU0FQUENoYXRJRnJhbWUnKSkgeyByZXR1cm4gZmFsc2UgfVxuXHQkKCcjQVNBUFBDaGF0SUZyYW1lJykucmVtb3ZlKClcblx0c2VuZEV2ZW50KFwiUmVtb3ZlXCIpXG5cdHJldHVybiB0cnVlXG59XG5cbnZhciBsaXN0ZW5DYWxsYmFja1xuZnVuY3Rpb24gcmVnaXN0ZXJMaXN0ZW5lcihjYWxsYmFjaykge1xuXHRsaXN0ZW5DYWxsYmFjayA9IGNhbGxiYWNrXG59XG5cbmZ1bmN0aW9uIHNlbmRFdmVudChldmVudFR5cGUpIHtcblx0aWYgKCFsaXN0ZW5DYWxsYmFjaykgeyByZXR1cm4gfVxuXHRsaXN0ZW5DYWxsYmFjayhldmVudFR5cGUpXG59XG5cbnZhciBjaGVja0RldmljZSA9IHtcblx0aXNBbmRyb2lkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKTtcbiAgfSxcbiAgaXNCbGFja0JlcnJ5OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKTtcbiAgfSxcbiAgaXNJT1M6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmV8aVBhZHxpUG9kL2kpO1xuICB9LFxuICBpc09wZXJhOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvT3BlcmEgTWluaS9pKTtcbiAgfSxcbiAgaXNXaW5kb3dzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvSUVNb2JpbGUvaSk7XG4gIH0sXG4gIGlzTW9iaWxlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKGNoZWNrRGV2aWNlLmlzQW5kcm9pZCgpIHx8IGNoZWNrRGV2aWNlLmlzQmxhY2tCZXJyeSgpIHx8IGNoZWNrRGV2aWNlLmlzSU9TKCkgfHwgY2hlY2tEZXZpY2UuaXNPcGVyYSgpIHx8IGNoZWNrRGV2aWNlLmlzV2luZG93cygpKTtcbiAgfVxufVxuIiwidmFyIGxvZyA9IHJlcXVpcmUoJy4vbG9nJylcbnZhciBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKVxudmFyIGJhZGdlVUkgPSByZXF1aXJlKCcuL2JhZGdlVUknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0J1BpbmcnOiBoYW5kbGVQaW5nLFxuXHQnTG9hZCc6IGhhbmRsZUxvYWQsXG5cdCdPcGVuJzogaGFuZGxlT3Blbixcblx0J0FjdGlvbic6IGhhbmRsZUFjdGlvbixcblx0J0xpc3Rlbic6IGhhbmRsZUxpc3Rlbixcblx0J0N1c3RvbWVyJzogaGFuZGxlQ3VzdG9tZXIsXG5cdCdFbmFibGVMb2dzJzogaGFuZGxlRW5hYmxlTG9ncyxcblx0J1NldENvbXBhbnlNYXJrZXInOiBoYW5kbGVTZXRDb21wYW55TWFya2VyXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUxvYWQoYXJncykge1xuXHRsb2coXCJMb2FkaW5nXCIpXG5cdC8vVE9ETyB0aGlzIGlzIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5LlxuXHQvL09uY2UgQ2FzcGVyIHVwZGF0ZXMgc25pcHBldCwgdGhpcyBjYW4gYmUgcmVtb3ZlZC5cblx0aWYgKGFyZ3MuQ29tcGFueSkge1xuXHRcdHN0YXRlLlNldENvbXBhbnlNYXJrZXIoYXJncy5Db21wYW55KVxuXHR9XG5cblx0aWYgKCFzdGF0ZS5HZXRDb21wYW55TWFya2VyKCkpIHtcblx0XHRsb2cuRXJyb3IoJ0NvbXBhbnkgbWFya2VyIGlzIG5vdCBzZXQuJylcblx0XHRyZXR1cm5cblx0fVxuXG5cdHZhciByZWdpb25Db2RlID0gYXJncy5SZWdpb25Db2RlXG5cdGlmICghcmVnaW9uQ29kZSkge1xuXHRcdC8vVE9ETzogMSkgU2hvdWxkIHdlIGRlZmF1bHQgdG8gYSByZWdpb24gaWYgY2xpZW50IGRvZXNuJ3QgcGFzcyBvbmU/IFxuXHRcdC8vKHRoaXMgbWlnaHQgYmUgbmVjZXNzYXJ5IGlmIGN1c3RvbWVycyB3aXRob3V0IEZlYXR1cmVSZWdpb25zIGFyZSB1c2luZ1xuXHRcdC8vdGhlIFNESykuXG5cdFx0Ly8yKSBXaGVyZSBzaG91bGQgdGhlIGRlZmF1bHQgY29tZSBmcm9tIChyYXRoZXIgdGhhbiBoYXJkY29kaW5nKT8gU3RvcmluZyBcblx0XHQvLyBpbiB0aGUgZGIgaXMgYmVzdCBvcHRpb24sIGJ1dCBuZWVkIHRvIGdldCB0aGF0IGRhdGEgdG8gdGhlIGZyb250ZW5kLlxuXHRcdHJlZ2lvbkNvZGUgPSBcIlVTXCJcblx0fVxuXHRzdGF0ZS5TZXRSZWdpb25Db2RlKHJlZ2lvbkNvZGUpXG5cblx0dmFyIHVybCA9IEFTQVBQLkhvc3QgKyBcIi9hcGkvbm9hdXRoL1Nob3VsZERpc3BsYXlXZWJDaGF0P0FTQVBQLUNsaWVudFR5cGU9d2ViLWRlc2smQVNBUFAtQ2xpZW50VmVyc2lvbj0wLjEuMFwiXG5cblx0Ly9JRTlcblx0aWYgKHdpbmRvdy5YRG9tYWluUmVxdWVzdCkge1xuXHRcdHZhciB4aHIgPSBuZXcgWERvbWFpblJlcXVlc3QoKTtcblx0XHR4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSlcblx0fSBlbHNlIHtcblx0XHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0eGhyLm9wZW4oJ1BPU1QnLCB1cmwsIHRydWUpXG5cdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uO1wiKTtcblx0fVxuXHR4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHJlc3AgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpXG5cdFx0aWYgKHJlc3AuRGlzcGxheUN1c3RvbWVyU3VwcG9ydCkge1xuXHRcdFx0YmFkZ2VVSS5hZGRDaGF0Qm94KClcblx0XHRcdGxvZyhcIkxvYWRlZFwiKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGxvZyhcIk5vdCBsb2FkaW5nXCIpXG5cdFx0fVxuXHR9XG5cdHZhciBkYXRhID0ge1xuXHRcdENvbXBhbnlNYXJrZXI6IHN0YXRlLkdldENvbXBhbnlNYXJrZXIoKSxcblx0XHRSZWdpb25Db2RlOiBzdGF0ZS5HZXRSZWdpb25Db2RlKClcblx0fVxuXHR4aHIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSlcbn1cblxuZnVuY3Rpb24gaGFuZGxlQ3VzdG9tZXIoYXJncykge1xuXHRsb2coXCJBdXRoIEN1c3RvbWVyXCIpXG5cdGlmICghYXJncy5DdXN0b21lcikge1xuXHRcdGxvZy5FcnJvcignTWlzc2luZyBDdXN0b21lciBhdXRoIHRva2VuJylcblx0XHRyZXR1cm5cblx0fVxuXHRzdGF0ZS5TZXRDdXN0b21lckF1dGhUb2tlbihhcmdzLkN1c3RvbWVyKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVPcGVuKGFyZ3MpIHtcblx0bG9nKFwiT3BlbiBXZWIgQ2hhdFwiKVxuXHR2YXIgZGlkT3BlbiA9IGJhZGdlVUkub3BlbkNoYXRCb3goKVxuXHRpZiAoZGlkT3Blbikge1xuXHRcdGxvZyhcIkRpZCBvcGVuIGNoYXRcIilcblx0fSBlbHNlIHtcblx0XHRsb2coXCJFUlJPUjogQ2hhdCBmcmFtZSBub3QgcmVhZHkhXCIpXG5cdH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlQWN0aW9uKGFyZ3MpIHtcblx0bG9nKFwiSGFuZGxlIEFjdGlvblwiKVxuXHRpZiAoIWFyZ3MuQWN0aW9uKSB7XG5cdFx0bG9nLkVycm9yKCdNaXNzaW5nIEFjdGlvbicpXG5cdFx0cmV0dXJuXG5cdH1cblxuXHR2YXIgcmVzdWx0XG5cdHN3aXRjaCAoYXJncy5BY3Rpb24pIHtcblx0XHRjYXNlICdPcGVuJzpcblx0XHRjYXNlICdDaGF0V2lkZ2V0Lk9wZW4nOlxuXHRcdFx0cmVzdWx0ID0gYmFkZ2VVSS5vcGVuQ2hhdEJveCgpXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdIaWRlJzpcblx0XHRjYXNlICdDaGF0V2lkZ2V0LkhpZGUnOlxuXHRcdFx0cmVzdWx0ID0gYmFkZ2VVSS5oaWRlQ2hhdEJveCgpXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdTaG93Jzpcblx0XHRjYXNlICdDaGF0V2lkZ2V0LlNob3cnOlxuXHRcdFx0cmVzdWx0ID0gYmFkZ2VVSS5zaG93Q2hhdEJveCgpXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdSZW1vdmUnOlxuXHRcdGNhc2UgJ0NoYXRXaWRnZXQuUmVtb3ZlJzpcblx0XHRcdHJlc3VsdCA9IGJhZGdlVUkucmVtb3ZlQ2hhdEJveCgpXG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0bG9nKFwiSW52YWxpZCBBY3Rpb246IFwiICsgYXJncy5BY3Rpb24pXG5cdH1cbn1cblxuXG52YXIgbGlzdGVuSGFuZGxlcnMgPSB7fVxuZnVuY3Rpb24gaGFuZGxlTGlzdGVuKGFyZ3MpIHtcblx0bG9nKFwiSGFuZGxlIExpc3RlblwiKVxuXHRpZiAoIWFyZ3MuRXZlbnRUeXBlIHx8ICFhcmdzLkNhbGxiYWNrKSB7XG5cdFx0bG9nLkVycm9yKCdNaXNzaW5nIEFyZ3MnKVxuXHRcdHJldHVyblxuXHR9XG5cblx0aWYgKHR5cGVvZiBsaXN0ZW5IYW5kbGVyc1thcmdzLkV2ZW50VHlwZV0gPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRsaXN0ZW5IYW5kbGVyc1thcmdzLkV2ZW50VHlwZV0gPSBbXVxuXHR9XG5cdGxpc3RlbkhhbmRsZXJzW2FyZ3MuRXZlbnRUeXBlXS5wdXNoKGFyZ3MuQ2FsbGJhY2spXG5cdGJhZGdlVUkucmVnaXN0ZXJMaXN0ZW5lcihwcm9jZXNzRXZlbnQpXG5cdHJldHVyblxufVxuXG5mdW5jdGlvbiBwcm9jZXNzRXZlbnQoZXZlbnRUeXBlKSB7XG5cdGlmICghbGlzdGVuSGFuZGxlcnNbZXZlbnRUeXBlXSAmJiAhbGlzdGVuSGFuZGxlcnNbXCJBbGxcIl0pIHsgcmV0dXJuIH1cblx0Ly8gQ2FsbCBBbGwgZXZlbnRUeXBlIGhhbmRsZXJzXG5cdGZvciAodmFyIGkgaW4gbGlzdGVuSGFuZGxlcnNbXCJBbGxcIl0pIHtcblx0XHRsaXN0ZW5IYW5kbGVyc1tcIkFsbFwiXVtpXShldmVudFR5cGUpXG5cdH1cblxuXHQvLyBDYWxsIHNwZWNpZmljIGV2ZW50VHlwZSBoYW5kbGVyc1xuXHRmb3IgKHZhciBpIGluIGxpc3RlbkhhbmRsZXJzW2V2ZW50VHlwZV0pIHtcblx0XHRsaXN0ZW5IYW5kbGVyc1tldmVudFR5cGVdW2ldKGV2ZW50VHlwZSlcblx0fVxufVxuXG5mdW5jdGlvbiBoYW5kbGVQaW5nKGNhbGxiYWNrKSB7XG5cdGxvZyhcIlBpbmc/XCIsIFwiUG9uZyFcIilcblx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0Y2FsbGJhY2soJ1BvbmcnKVxuXHR9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVuYWJsZUxvZ3MoKSB7XG5cdGxvZy5FbmFibGUoKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVTZXRDb21wYW55TWFya2VyKGFyZ3MpIHtcblx0aWYgKCFhcmdzLkNvbXBhbnkpIHtcblx0XHRsb2cuRXJyb3IoJ01pc3NpbmcgQ29tcGFueSBpbiBwYXJhbWV0ZXJzIHRvIFNldENvbXBhbnlNYXJrZXInKVxuXHRcdHJldHVyblxuXHR9XG5cdGlmIChzdGF0ZS5HZXRDb21wYW55TWFya2VyKCkpIHtcblx0XHRsb2cuRXJyb3IoJ0NvbXBhbnkgbWFya2VyIGFscmVhZHkgc2V0LicpXG5cdFx0cmV0dXJuXG5cdH1cblx0c3RhdGUuU2V0Q29tcGFueU1hcmtlcihhcmdzLkNvbXBhbnkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Y3JlYXRlOiBjcmVhdGUsXG5cdHN0eWxlOiBzdHlsZSxcblx0dGV4dDogdGV4dCxcblx0b25UYXA6IG9uVGFwXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZSh0YWdOYW1lLCBzdHlsZXMpIHtcblx0cmV0dXJuIHN0eWxlKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSksIHN0eWxlcylcbn1cblxuZnVuY3Rpb24gc3R5bGUoZWwsIHN0eWxlcykge1xuXHRmb3IgKHZhciBrZXkgaW4gc3R5bGVzKSB7XG5cdFx0dmFyIHZhbCA9IHN0eWxlc1trZXldXG5cdFx0ZWwuc3R5bGVba2V5XSA9ICh0eXBlb2YgdmFsID09ICdudW1iZXInID8gdmFsKydweCcgOiB2YWwpXG5cdH1cblx0cmV0dXJuIGVsXG59XG5cbmZ1bmN0aW9uIHRleHQoZWwsIHRleHQpIHtcblx0ZWwuaW5uZXJUZXh0ID0gdGV4dFxufVxuXG5mdW5jdGlvbiBvblRhcChlbCwgaGFuZGxlcikge1xuXHRlbC5vbmNsaWNrID0gaGFuZGxlclxufSIsInZhciBzbGljZSA9IHJlcXVpcmUoJ3N0ZC9zbGljZScpXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnc3RkL2V4dGVuZCcpXG5cbnZhciBob3N0bmFtZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZVxudmFyIGVuYWJsZWQgPSAoaG9zdG5hbWUgPT0gJ2xvY2FsaG9zdCcgfHwgaG9zdG5hbWUgPT0gJzEyNy4wLjAuMScpXG5cbm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kKFxuXHRmdW5jdGlvbiBsb2coKSB7XG5cdFx0X2RvTG9nKGNvbnNvbGUubG9nLCBhcmd1bWVudHMpXG5cdH0sXG5cdHtcblx0XHRFbmFibGU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZW5hYmxlZCA9IHRydWVcblx0XHR9LFxuXHRcdEVycm9yOiBmdW5jdGlvbigpIHtcblx0XHRcdF9kb0xvZyhjb25zb2xlLmVycm9yLCBhcmd1bWVudHMsIHRydWUpXG5cdFx0fVxuXHR9XG4pXG5cbmZ1bmN0aW9uIF9kb0xvZyhjb25zb2xlRm4sIGZuQXJndW1lbnRzLCBmb3JjZSkge1xuXHRpZiAoIWVuYWJsZWQgJiYgIWZvcmNlKSB7IHJldHVybiB9XG5cdHZhciBhcmdzID0gW1wiQVNBUFA6XCJdLmNvbmNhdChzbGljZShmbkFyZ3VtZW50cykpXG5cdGNvbnNvbGVGbi5hcHBseShjb25zb2xlLCBhcmdzKVxufVxuIiwidmFyIHBvcHVwID0gcmVxdWlyZSgnc3RkL3BvcHVwJylcbnZhciBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0b3Blbjogb3BlblxufVxuXG5mdW5jdGlvbiBvcGVuKCkge1xuXHR2YXIgd2luSUQgPSAnd2ViLXNkay1kaWFsb2d1ZS0nK3N0YXRlLkdldENvbXBhbnlNYXJrZXIoKVxuXHQvL3BvcHVwKEFTQVBQLkhvc3QrJy8nK3N0YXRlLkdldENvbXBhbnlNYXJrZXIoKSsnL3dlYi1zZGstZGlhbG9ndWU/dG9rZW49JytzdGF0ZS5HZXRDdXN0b21lckF1dGhUb2tlbigpLCB3aW5JRClcblx0d2luZG93Lm9wZW4oQVNBUFAuSG9zdCsnLycrc3RhdGUuR2V0Q29tcGFueU1hcmtlcigpKycvd2ViLXNkay1kaWFsb2d1ZT90b2tlbj0nK3N0YXRlLkdldEN1c3RvbWVyQXV0aFRva2VuKCksICdfYmxhbmsnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIHRyYWNrOiBmdW5jdGlvbihldmVudCwgcHJvcHMpIHtcbiAgICB2YXIgYW5hbHl0aWNzID0gd2luZG93LmFuYWx5dGljc1xuICAgIGlmICghYW5hbHl0aWNzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgYW5hbHl0aWNzLnRyYWNrKGV2ZW50LCBwcm9wcylcbiAgfVxufVxuIiwidmFyIGxvZyA9IHJlcXVpcmUoJy4vbG9nJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdFNldENvbXBhbnlNYXJrZXI6IFNldENvbXBhbnlNYXJrZXIsXG5cdEdldENvbXBhbnlNYXJrZXI6IEdldENvbXBhbnlNYXJrZXIsXG5cdFNldEN1c3RvbWVyQXV0aFRva2VuOiBTZXRDdXN0b21lckF1dGhUb2tlbixcblx0R2V0Q3VzdG9tZXJBdXRoVG9rZW46IEdldEN1c3RvbWVyQXV0aFRva2VuLFxuXHRTZXRSZWdpb25Db2RlOiBTZXRSZWdpb25Db2RlLFxuXHRHZXRSZWdpb25Db2RlOiBHZXRSZWdpb25Db2RlXG59XG5cbnZhciBfY29tcGFueU1hcmtlclxuZnVuY3Rpb24gU2V0Q29tcGFueU1hcmtlcihjb21wYW55TWFya2VyKSB7XG5cdGxvZygnU2V0Q29tcGFueU1hcmtlcicsIGNvbXBhbnlNYXJrZXIpXG5cdF9jb21wYW55TWFya2VyID0gY29tcGFueU1hcmtlclxufVxuZnVuY3Rpb24gR2V0Q29tcGFueU1hcmtlcigpIHtcblx0cmV0dXJuIF9jb21wYW55TWFya2VyXG59XG5cbnZhciBfY3VzdG9tZXJBdXRoVG9rZW5cbmZ1bmN0aW9uIFNldEN1c3RvbWVyQXV0aFRva2VuKGN1c3RvbWVyQXV0aFRva2VuKSB7XG5cdGxvZygnU2V0Q3VzdG9tZXJBdXRoVG9rZW4nLCBjdXN0b21lckF1dGhUb2tlbilcblx0X2N1c3RvbWVyQXV0aFRva2VuID0gY3VzdG9tZXJBdXRoVG9rZW5cbn1cbmZ1bmN0aW9uIEdldEN1c3RvbWVyQXV0aFRva2VuKCkge1xuXHRpZiAoIV9jdXN0b21lckF1dGhUb2tlbikge1xuXHRcdHJldHVybiAnJ1xuXHR9XG5cdHJldHVybiBfY3VzdG9tZXJBdXRoVG9rZW5cbn1cblxudmFyIF9yZWdpb25Db2RlXG5mdW5jdGlvbiBTZXRSZWdpb25Db2RlKHJlZ2lvbkNvZGUpIHtcblx0bG9nKCdTZXRSZWdpb25Db2RlJywgcmVnaW9uQ29kZSlcblx0X3JlZ2lvbkNvZGUgPSByZWdpb25Db2RlXG59XG5mdW5jdGlvbiBHZXRSZWdpb25Db2RlKCkge1xuXHRpZiAoIV9yZWdpb25Db2RlKSB7XG5cdFx0cmV0dXJuICcnXG5cdH1cblx0cmV0dXJuIF9yZWdpb25Db2RlXG59XG4iLCJ2YXIgbG9nID0gcmVxdWlyZSgnLi9sb2cnKVxudmFyIGNvbW1hbmRIYW5kbGVycyA9IHJlcXVpcmUoJy4vY29tbWFuZEhhbmRsZXJzJylcbnZhciBzbGljZSA9IHJlcXVpcmUoJ3N0ZC9zbGljZScpXG52YXIgY29va2llID0gcmVxdWlyZSgnc3RkL2Nvb2tpZScpXG5cbmluaXRBU0FQUCgpXG5cbmZ1bmN0aW9uIGluaXRBU0FQUCgpIHtcblx0dmFyIHF1ZXVlZENvbW1hbmRBcmdzID0gQVNBUFAuX1xuXHRBU0FQUC5fID0geyBwdXNoOmhhbmRsZUNvbW1hbmRBcmdzIH1cblx0Zm9yICh2YXIgaT0wOyBpPHF1ZXVlZENvbW1hbmRBcmdzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aGFuZGxlQ29tbWFuZEFyZ3MocXVldWVkQ29tbWFuZEFyZ3NbaV0pXG5cdH1cblxuXHRzZXRSZWZlcnJlckNvb2tpZUlmQ2hhbmdlZCgpIFxufVxuXG5mdW5jdGlvbiBoYW5kbGVDb21tYW5kQXJncyhmbkFyZ3VtZW50cykge1xuXHR2YXIgY21kID0gZm5Bcmd1bWVudHNbMF1cblx0dmFyIGFyZ3MgPSBzbGljZShmbkFyZ3VtZW50cywgMSlcblx0dmFyIGNvbW1hbmRIYW5kbGVyID0gY29tbWFuZEhhbmRsZXJzW2NtZF1cblx0aWYgKGNvbW1hbmRIYW5kbGVyKSB7XG5cdFx0bG9nKCdIYW5kbGUgY29tbWFuZCcsIGNtZCwgYXJncylcblx0XHRjb21tYW5kSGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKVxuXHR9IGVsc2Uge1xuXHRcdGxvZygnVW5rbm93biBjb21tYW5kJywgY21kLCB7ICdhcmd1bWVudHMnOmFyZ3MgfSlcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRSZWZlcnJlckNvb2tpZUlmQ2hhbmdlZCgpIHtcblx0dmFyIE9ORV9NT05USF9JTl9NSUxMSVNFQ09ORFMgPSAzMCAqIDI0ICogNjAgKiA2MCAqIDEwMDBcblx0dmFyIGN1cnJlbnRWYWx1ZSA9IGNvb2tpZS5nZXQoJ2FzYXBwX3JlZmVycmVyJykgfHwgbnVsbFxuXG5cdGlmIChkb2N1bWVudC5yZWZlcnJlciA9PT0gY3VycmVudFZhbHVlKSByZXR1cm5cblx0Ly9SZWZlcnJlciBzaG91bGQgbmV2ZXIgaGF2ZSBzYW1lIGhvc3QgYXMgY3VycmVudC5cblx0aWYgKHBhcnNlSG9zdG5hbWUod2luZG93LmxvY2F0aW9uKSBcblx0XHQ9PT0gcGFyc2VIb3N0bmFtZShkb2N1bWVudC5yZWZlcnJlcikpIHtcblx0XHRyZXR1cm5cblx0fVxuXHRsb2coJ1NldCByZWZlcnJlcicpXG5cdGNvb2tpZS5zZXQoJ2FzYXBwX3JlZmVycmVyJywgZG9jdW1lbnQucmVmZXJyZXIsIE9ORV9NT05USF9JTl9NSUxMSVNFQ09ORFMpXG59XG5cbi8vVGhpcyBjb2RlIGlzIHRha2VuIGZyb20gc3RkL3VybC5qcyBcbi8vdG8gYXZvaWQgaW1wb3J0aW5nIGVudGlyZSBsaWJcbmZ1bmN0aW9uIHBhcnNlSG9zdG5hbWUodXJsKSB7XG4gICAgdmFyIGV4dHJhY3Rpb25SZWdleCA9IG5ldyBSZWdFeHAoWydeJywgLy8gc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXG4gICAgJygoXFxcXHcrOik/Ly8pPycsIC8vIG1hdGNoIGEgcG9zc2libGUgcHJvdG9jb2wsIGxpa2UgaHR0cDovLywgZnRwOi8vLCBvciAvLyBmb3IgYSByZWxhdGl2ZSB1cmxcbiAgICAnKFxcXFx3W1xcXFx3XFxcXC5cXFxcLV0rKT8nLCAvLyBtYXRjaCBhIHBvc3NpYmxlIGRvbWFpblxuICAgICcoOlxcXFxkKyk/JywgLy8gbWF0Y2ggYSBwb3NzaWJsZSBwb3J0XG4gICAgJyhcXFxcL1teXFxcXD8jXSspPycsIC8vIG1hdGNoIGEgcG9zc2libGUgcGF0aFxuICAgICcoXFxcXD9bXiNdKyk/JywgLy8gbWF0Y2ggcG9zc2libGUgR0VUIHBhcmFtZXRlcnNcbiAgICAnKCMuKik/JyAvLyBtYXRjaCB0aGUgcmVzdCBvZiB0aGUgVVJMIGFzIHRoZSBoYXNoXG4gICAgXS5qb2luKCcnKSwgJ2knKVxuXG5cdHZhciBtYXRjaCA9IHVybC50b1N0cmluZygpLm1hdGNoKGV4dHJhY3Rpb25SZWdleClcblx0cmV0dXJuIG1hdGNoWzNdXG59XG4iLCJtb2R1bGUuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG5cdHZhciByZWdleCA9IG5ldyBSZWdFeHAoXG5cdFx0JyhefCg7ICkpJyArIC8vIGJlZ2lubmluZyBvZiBkb2N1bWVudC5jb29raWUsIG9yIFwiOyBcIiB3aGljaCBzaWduaWZpZXMgdGhlIGJlZ2lubmluZyBvZiBhIG5ldyBjb29raWVcblx0XHRuYW1lICtcblx0XHQnPShbXjtdKiknKSAvLyB0aGUgdmFsdWUgb2YgdGhlIGNvb2tpZSwgbWF0Y2hlZCB1cCB1bnRpbCBhIFwiO1wiIG9yIHRoZSBlbmQgb2YgdGhlIHN0cmluZ1xuXHRcblx0dmFyIG1hdGNoID0gZG9jdW1lbnQuY29va2llLm1hdGNoKHJlZ2V4KSxcblx0XHR2YWx1ZSA9IG1hdGNoICYmIG1hdGNoWzNdXG5cdHJldHVybiB2YWx1ZSAmJiBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpXG59XG5cbm1vZHVsZS5leHBvcnRzLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlLCBkdXJhdGlvbikge1xuXHRpZiAoZHVyYXRpb24gPT09IHVuZGVmaW5lZCkgeyBkdXJhdGlvbiA9ICgzNjUgKiAyNCAqIDYwICogNjAgKiAxMDAwKSB9IC8vIG9uZSB5ZWFyXG5cdHZhciBkYXRlID0gKGR1cmF0aW9uIGluc3RhbmNlb2YgRGF0ZSA/IGR1cmF0aW9uIDogKGR1cmF0aW9uIDwgMCA/IG51bGwgOiBuZXcgRGF0ZShuZXcgRGF0ZSgpLmdldFRpbWUoKSArIGR1cmF0aW9uKSkpLFxuXHRcdGV4cGlyZXMgPSBkYXRlID8gXCJleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpICsgJzsgJyA6ICcnLFxuXHRcdGNvb2tpZU5hbWUgPSBuYW1lICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSArICc7ICcsXG5cdFx0ZG9tYWluID0gJ2RvbWFpbj0nK2RvY3VtZW50LmRvbWFpbisnOyAnLFxuXHRcdHBhdGggPSAncGF0aD0vOyAnXG5cblx0ZG9jdW1lbnQuY29va2llID0gY29va2llTmFtZSArIGV4cGlyZXMgKyBkb21haW4gKyBwYXRoXG59XG5cbm1vZHVsZS5leHBvcnRzLmlzRW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgbmFtZSA9ICdfX3Rlc3RfX2Nvb2tpZScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXHRtb2R1bGUuZXhwb3J0cy5zZXQobmFtZSwgMSlcblx0dmFyIGlzRW5hYmxlZCA9ICEhbW9kdWxlLmV4cG9ydHMuZ2V0KG5hbWUpXG5cdG1vZHVsZS5leHBvcnRzLnJlbW92ZShuYW1lKVxuXHRyZXR1cm4gaXNFbmFibGVkXG59XG5cbm1vZHVsZS5leHBvcnRzLnJlbW92ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0bW9kdWxlLmV4cG9ydHMuc2V0KG5hbWUsIFwiXCIsIG5ldyBEYXRlKDEpKVxufVxuIiwidmFyIGlzTGlzdCA9IHJlcXVpcmUoJy4vaXNMaXN0JylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBlYWNoKGl0ZW1zLCBmbikge1xuXHRpZiAoIWl0ZW1zKSB7IHJldHVybiB9XG5cdGlmIChpdGVtcy5mb3JFYWNoID09IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoKSB7XG5cdFx0aXRlbXMuZm9yRWFjaChmbilcblx0fSBlbHNlIGlmIChpc0xpc3QoaXRlbXMpKSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGZuKGl0ZW1zW2ldLCBpKVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gaXRlbXMpIHtcblx0XHRcdGlmICghaXRlbXMuaGFzT3duUHJvcGVydHkoa2V5KSkgeyBjb250aW51ZSB9XG5cdFx0XHRmbihpdGVtc1trZXldLCBrZXkpXG5cdFx0fVxuXHR9XG59XG4iLCIvKlxuXHRFeGFtcGxlIHVzYWdlOlxuXG5cdHZhciBBID0gQ2xhc3MoZnVuY3Rpb24oKSB7XG5cdFx0XG5cdFx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdFx0Zm9vOiAnY2F0Jyxcblx0XHRcdGJhcjogJ2R1bSdcblx0XHR9XG5cblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbihvcHRzKSB7XG5cdFx0XHRvcHRzID0gc3RkLmV4dGVuZChvcHRzLCBkZWZhdWx0cylcblx0XHRcdHRoaXMuX2ZvbyA9IG9wdHMuZm9vXG5cdFx0XHR0aGlzLl9iYXIgPSBvcHRzLmJhclxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0Rm9vID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fZm9vXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRCYXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9iYXJcblx0XHR9XG5cdH0pXG5cblx0dmFyIGEgPSBuZXcgQSh7IGJhcjonc2ltJyB9KVxuXHRhLmdldEZvbygpID09ICdjYXQnXG5cdGEuZ2V0QmFyKCkgPT0gJ3NpbSdcbiovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCwgZXh0ZW5kV2l0aCkge1xuXHRmb3IgKHZhciBrZXkgaW4gZXh0ZW5kV2l0aCkge1xuXHRcdGlmICh0eXBlb2YgdGFyZ2V0W2tleV0gIT0gJ3VuZGVmaW5lZCcpIHsgY29udGludWUgfVxuXHRcdHRhcmdldFtrZXldID0gZXh0ZW5kV2l0aFtrZXldXG5cdH1cblx0cmV0dXJuIHRhcmdldFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFyZ3VtZW50c10nXG59IiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cdGlmIChBcnJheS5pc0FycmF5ICYmIEFycmF5LmlzQXJyYXkudG9TdHJpbmcoKS5tYXRjaCgnXFxcXFtuYXRpdmUgY29kZVxcXFxdJykpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShvYmopXG5cdFx0fVxuXHR9IGVsc2UgaWYgKEFycmF5LnByb3RvdHlwZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbihvYmopIHtcblx0XHRcdHJldHVybiAob2JqICYmIG9iai5zbGljZSA9PSBBcnJheS5wcm90b3R5cGUuc2xpY2UpXG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIHRoYW5rcyBAa2FuZ2F4IGh0dHA6Ly9wZXJmZWN0aW9ua2lsbHMuY29tL2luc3RhbmNlb2YtY29uc2lkZXJlZC1oYXJtZnVsLW9yLWhvdy10by13cml0ZS1hLXJvYnVzdC1pc2FycmF5L1xuXHRcdHJldHVybiBmdW5jdGlvbihvYmopIHtcblx0XHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nXG5cdFx0fVxuXHR9XG59KSgpO1xuIiwidmFyIGlzQXJyYXkgPSByZXF1aXJlKCdzdGQvaXNBcnJheScpXG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCdzdGQvaXNBcmd1bWVudHMnKVxudmFyIGlzTm9kZUxpc3QgPSByZXF1aXJlKCdzdGQvaXNOb2RlTGlzdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNMaXN0KGl0ZW0pIHtcblx0cmV0dXJuIGlzQXJyYXkoaXRlbSkgfHwgaXNBcmd1bWVudHMoaXRlbSkgfHwgaXNOb2RlTGlzdChpdGVtKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgTm9kZUxpc3QgPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gaXNOb2RlTGlzdCgpIHtcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gaXNOb2RlTGlzdChvYmopIHtcblx0XHRcdHJldHVybiBvYmogJiYgb2JqLml0ZW0gPT0gTm9kZUxpc3QucHJvdG90eXBlLml0ZW1cblx0XHR9XG5cdH1cbn0oKSkiLCJ2YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKSxcblx0ZWFjaCA9IHJlcXVpcmUoJy4vZWFjaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXJsLCB3aW5JRCwgb3B0cykge1xuXHRvcHRzID0gZXh0ZW5kKG9wdHMgfHwge30sIG1vZHVsZS5leHBvcnRzLmRlZmF1bHRzKVxuXHRpZiAoIW9wdHNbJ2xlZnQnXSkgeyBvcHRzWydsZWZ0J10gPSBNYXRoLnJvdW5kKChzY3JlZW4ud2lkdGggLSBvcHRzWyd3aWR0aCddKSAvIDIpIH1cblx0aWYgKCFvcHRzWyd0b3AnXSkgeyBvcHRzWyd0b3AnXSA9IE1hdGgucm91bmQoKHNjcmVlbi5oZWlnaHQgLSBvcHRzWydoZWlnaHQnXSkgLyAyKSB9XG5cblx0dmFyIHJlcyA9IFtdXG5cdGVhY2gob3B0cywgZnVuY3Rpb24odmFsLCBrZXkpIHsgcmVzLnB1c2goa2V5Kyc9Jyt2YWwpIH0pXG5cdHZhciBwb3B1cFN0ciA9IHJlcy5qb2luKCcsJylcblxuXHRyZXR1cm4gd2luZG93Lm9wZW4odXJsLCB3aW5JRCwgcG9wdXBTdHIpXG59XG5cbm1vZHVsZS5leHBvcnRzLmRlZmF1bHRzID0ge1xuXHQnd2lkdGgnOiAgICAgICA2MDAsXG5cdCdoZWlnaHQnOiAgICAgIDQwMCxcblx0J2xlZnQnOiAgICAgICAgbnVsbCxcblx0J3RvcCc6ICAgICAgICAgbnVsbCxcblx0J2RpcmVjdG9yaWVzJzogMCxcblx0J2xvY2F0aW9uJzogICAgMSxcblx0J21lbnViYXInOiAgICAgMCxcblx0J3Jlc2l6YWJsZSc6ICAgMCxcblx0J3Njcm9sbGJhcnMnOiAgMSxcblx0J3RpdGxlYmFyJzogICAgMCxcblx0J3Rvb2xiYXInOiAgICAgMFxufVxuIiwiLypcblx0RXhhbXBsZSB1c2FnZTpcblxuXHRmdW5jdGlvbiBsb2coY2F0ZWdvcnksIGFyZzEsIGFyZzIpIHsgLy8gYXJnMywgYXJnNCwgLi4uLCBhcmdOXG5cdFx0Y29uc29sZS5sb2coJ2xvZyBjYXRlZ29yeScsIGNhdGVnb3J5LCBzdGQuc2xpY2UoYXJndW1lbnRzLCAxKSlcblx0fVxuKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXJncyhhcmdzLCBvZmZzZXQsIGxlbmd0aCkge1xuXHRpZiAodHlwZW9mIGxlbmd0aCA9PSAndW5kZWZpbmVkJykgeyBsZW5ndGggPSBhcmdzLmxlbmd0aCB9XG5cdHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCBvZmZzZXQgfHwgMCwgbGVuZ3RoKVxufVxuXG4iXX0=