// common.js

// CONSTANTS

const STARTLOCATION = [22.022,78.464];
const STARTLOCATIONjson = {lat: 22.022, lng: 78.464};
const STARTZOOM = 5;


// map crosshair size etc:
const crosshairPath = 'lib/focus-black.svg';
const crosshairSize = 30;


// GLOBAL VARIABLES

var APIpath = 'https://server.nikhilvj.co.in/pmgsy/API';
var GPXpath = 'https://server.nikhilvj.co.in/pmgsy/gpx';

if (window.location.host =="localhost:5510") { 
    APIpath = 'http://localhost:5510/API';
}

// ###########################################################
// RUN ON PAGE LOAD
$(document).ready(function() {
	
});


// ###########################################################
// FUNCTIONS

function checklatlng(lat,lon) {
	if ( typeof lat == 'number' && 
		typeof lon == 'number' &&
		!isNaN(lat) &&
		!isNaN(lon) ) {
		//console.log(lat,lon,'is valid');
		return true;
	}
	else {
		//console.log(lat,lon,'is not valid');
		return false;
	}
}

function loadURLParams(URLParams) {
    // URL parameters. from https://stackoverflow.com/a/2405540/4355695
    var query = window.location.search.substring(1).split("&");
    for (var i = 0, max = query.length; i < max; i++)
    {
        if (query[i] === "") // check for trailing & with no param
            continue;
        var param = query[i].split("=");
        URLParams[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
        // this gets stored to global json variable URLParams
    }

}

