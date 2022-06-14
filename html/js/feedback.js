// feedback.js

// ############################################
// GLOBAL VARIABLES

var globalSelectedHabitation = null;
var map2 = null;
var globalSelectedOSM = null;

// ############################################
// second map in feedback popup

var cartoPositron2 = L.tileLayer.provider('CartoDB.Positron', {maxNativeZoom:19, maxZoom: 20});
var OSM2 = L.tileLayer.provider('OpenStreetMap.Mapnik', {maxNativeZoom:19, maxZoom: 20});
var gStreets2 = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var gHybrid2 = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var esriWorld2 = L.tileLayer.provider('Esri.WorldImagery', {maxNativeZoom:18, maxZoom: 20});
var soi2 = L.tileLayer('https://storage.googleapis.com/soi_data/export/tiles/{z}/{x}/{y}.webp', {
    maxZoom: 20,
    maxNativeZoom: 15,
    attribution: '<a href="https://onlinemaps.surveyofindia.gov.in/FreeMapSpecification.aspx" target="_blank">1:50000 Open Series Maps</a> &copy; <a href="https://www.surveyofindia.gov.in/pages/copyright-policy" target="_blank">Survey Of India</a>, Compiled by <a href="https://github.com/ramSeraph/opendata" target="_blank">ramSeraph</a>'
});
var buildings2 = L.tileLayer('https://server.nikhilvj.co.in/buildings1/styles/basic/{z}/{x}/{y}.webp', {
    maxZoom: 20,
    attribution: '<a href="https://github.com/microsoft/GlobalMLBuildingFootprints" target="_blank">GlobalMLBuildingFootprints India data</a>, rendered using TileServer GL by <a href="" target="_blank">Nikhil VJ</a>, see <a href="https://github.com/answerquest/maptiles_recipe_buildings" target="_blank">recipe here</a>'
});

var baseLayers2 = { 
    "OpenStreetMap.org" : OSM2, 
    "Carto Positron": cartoPositron2, 
    "ESRI Satellite": esriWorld2,
    "Survey of India 1:50000": soi,
    // "ML Bldg footprints by Microsoft": buildings2,
    "gStreets": gStreets2, 
    "gHybrid": gHybrid2
};

var crosshairIcon2 = L.icon({
    iconUrl: crosshairPath,
    iconSize:     [crosshairSize, crosshairSize], // size of the icon
    iconAnchor:   [crosshairSize/2, crosshairSize/2], // point of the icon which will correspond to marker's location
});


// ############################################

function feedback1(id) {
    globalSelectedHabitation = id;
    let p = globalHab[id].properties;
    console.log(p);
    $('#HAB_NAME').html(p.HAB_NAME);
    $('#HAB_ID').html(p.HAB_ID);
    $('#hab_location').html(`${p.latitude},${p.longitude}`);
    $('#feedback1_changeName').val(p.HAB_NAME);
    $('#feedback1_changePopulation').val(p.TOT_POPULA);
    

    $('#feedbackModal1').modal('show');
    // var feedbackModal1 = document.getElementById('feedbackModal1');
    // feedbackModal1.show();

    if(map2) map2.remove();
    var wait1 = setTimeout(() => {
        // creating map after timeout so that the modal fade-in animation doesn't mess with the map
        let lat = parseFloat(p.latitude);
        let lon = parseFloat(p.longitude);
        map2 = new L.Map('map2', {
            center: [lat, lon],
            zoom: 17,
            layers: [esriWorld2],
            scrollWheelZoom: true,
            maxZoom: 20,
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: [
                // { text: 'Load THIS block', callback: blockFromMap },
                // { text: 'Map an unmapped Stop here', callback: route_unMappedStop_popup }
            ]
        });

        // layers
        var overlays2 = {
            "ML Bldg footprints by Microsoft": buildings2
        };

        var layerControl2 = L.control.layers(baseLayers2, overlays2, {collapsed: true, autoZIndex:false}).addTo(map2); 


        crosshair2 = new L.marker(map2.getCenter(), {icon: crosshairIcon2, interactive:false});
        crosshair2.addTo(map2);
        // Move the crosshair to the center of the map when the user pans
        map2.on('move', function(e) {
            var currentLocation = map2.getCenter();
            crosshair2.setLatLng(currentLocation);
            if($('#changeLoc').prop('checked'))
                $('#newLoc').val(`${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}`);
        });

        // place one marker
        var circleMarkerOptions3 = {
            radius: 6,
            fillColor: 'yellow',
            color: 'black',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
        let marker1 = L.circleMarker([lat,lon], circleMarkerOptions3).addTo(map2);
        

        $('#changeLoc').change( function(){
            if ($(this).is(':checked')) {
                var currentLocation = map2.getCenter();
                $('#newLoc').val(`${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}`);
            } else {
                map2.panTo([p.latitude, p.longitude], {animate:false});
                $('#newLoc').val('');
            }
        });

    },1000);
    
}

function feedback1_resetLoc() {
    if(!globalSelectedHabitation) return; // bugproofing

    let p = globalHab[globalSelectedHabitation].properties;
    map2.panTo([p.latitude, p.longitude], {animate:false});
    if($('#changeLoc').prop('checked')) $('#newLoc').val(`${p.latitude},${p.longitude}`);
}


function submitFeedback1() {
    
    let p = globalHab[globalSelectedHabitation].properties;
    let feedback1_changeName = $('#feedback1_changeName').val();
    let feedback1_changePopulation = parseInt($('#feedback1_changePopulation').val());
    let newLoc = $('#newLoc').val();
    let feedback1_comments = $('#feedback1_comments').val();
    let feedback1_submitter_name = $('#feedback1_submitter_name').val();
    let feedback1_submitter_phone = $('#feedback1_submitter_phone').val();
    let feedback1_submitter_email = $('#feedback1_submitter_email').val();

    // to do: frontend side validations

    let payload = {
        'ref_id': globalSelectedHabitation,
        'category': 'habitation',
        'STATE_ID': globalSTATE_ID,
        'DISTRICT_ID': globalDISTRICT_ID,
        'BLOCK_ID': globalBLOCK_ID,
        'feedback1_submitter_name': feedback1_submitter_name,
        'feedback1_submitter_phone': feedback1_submitter_phone,
        'feedback1_submitter_email': feedback1_submitter_email
    };
    var changeFlag = false;
    if(feedback1_changeName.length && feedback1_changeName != p.HAB_NAME) {
        payload['feedback1_changeName'] = feedback1_changeName;
        changeFlag = true;
    }
    if(feedback1_changePopulation && feedback1_changePopulation != p.TOT_POPULA) {
        payload['feedback1_changePopulation'] = feedback1_changePopulation;
        changeFlag = true;
    }
    if(newLoc && newLoc != $('#hab_location').html()) {
        let holder1 = newLoc.split(',');
        payload['lat'] = holder1[0];
        payload['lon'] = holder1[1];
        changeFlag = true;

    }
    if(feedback1_comments.length) {
        payload['feedback1_comments'] = feedback1_comments;
        changeFlag = true;
    }

    if(!changeFlag) {
        alert('No change suggestion or comment? Please give something.');
        return;
    }

    $('#feedback1_status').html(`Sending feedback..`);
    $.ajax({
        url: `${APIpath}/feedback1`,
        type: "POST",
        data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $('#feedback1_status').html(`Thank you, sent the feedback.`);
            var wait2 = setTimeout(() => {
                $('#feedbackModal1').modal('hide');
                feedback1_clear();
            }, 2000);

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            if(jqXHR.responseJSON && jqXHR.responseJSON.detail) {
                alert(jqXHR.responseJSON.detail);
                $('#feedback1_status').html(jqXHR.responseJSON.detail);
            } 
        },
    });

}


function feedback1_clear() {
    $('#feedback1_changeName').val('');
    $('#feedback1_changePopulation').val('');
    $('#feedback1_comments').val('');
    $('#feedback1_submitter_name').val('');
    $('#feedback1_submitter_phone').val('');
    $('#feedback1_submitter_email').val('');
    $('#newLoc').val('');
    $('#feedback1_status').html('');
    map.closePopup();
}


// ############################################
// feedback2 : OSM places suggestion for inclusion

function feedback2_initiate(osmId) {
    globalSelectedOSM = osmId;
    let p = globalOSM[osmId].properties;
    console.log(p);

    $('#osmName').val(p.name ? p.name : '');
    $('#feedback2_name').val(p.name ? p.name : '');

    $('#feedback2_population').val(p.population ? p.population: '');

    // TO DO: populate osm_info by loading from OSM JSON url
    // example: https://api.openstreetmap.org/api/0.6/node/7659143857.json
    let osmUrl = `https://api.openstreetmap.org/api/0.6/${p.type}/${p.osmId}.json`;


    $('#feedbackModal2').modal('show');

    if(map2) map2.remove();
    var wait1 = setTimeout(() => {
        console.log(`Creating map2 for feedback2 modal`);
        // creating map after timeout so that the modal fade-in animation doesn't mess with the map
        let lat = parseFloat(p.lat);
        let lon = parseFloat(p.lon);
        map2 = new L.Map('map3', {
            center: [lat, lon],
            zoom: 17,
            layers: [esriWorld2],
            scrollWheelZoom: true,
            maxZoom: 20,
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: [
                // { text: 'Load THIS block', callback: blockFromMap },
                // { text: 'Map an unmapped Stop here', callback: route_unMappedStop_popup }
            ]
        });

        var layerControl2 = L.control.layers(baseLayers2, {}, {collapsed: true, autoZIndex:false}).addTo(map2); 


        let crosshair2 = new L.marker(map2.getCenter(), {icon: crosshairIcon2, interactive:false});
        crosshair2.addTo(map2);
        // Move the crosshair to the center of the map when the user pans
        map2.on('move', function(e) {
            var currentLocation = map2.getCenter();
            crosshair2.setLatLng(currentLocation);
            // if($('#changeLoc').prop('checked'))
            //     $('#newLoc').val(`${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}`);
        });

        // place one marker
        var circleMarkerOptions3 = {
            radius: 6,
            fillColor: 'yellow',
            color: 'black',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
        let marker1 = L.circleMarker([lat,lon], circleMarkerOptions3).addTo(map2);
        

        // $('#changeLoc').change( function(){
        //     if ($(this).is(':checked')) {
        //         var currentLocation = map2.getCenter();
        //         $('#newLoc').val(`${currentLocation.lat.toFixed(5)},${currentLocation.lng.toFixed(5)}`);
        //     } else {
        //         map2.panTo([p.latitude, p.longitude], {animate:false});
        //         $('#newLoc').val('');
        //     }
        // });

    },1000);
}

function submitfeedback2() {
    let p = globalOSM[globalSelectedOSM].properties;
    
    let feedback2_name = $('#feedback2_name').val();
    let feedback2_population = parseInt($('#feedback2_population').val());
    let feedback2_comments = $('#feedback2_comments').val();
    let feedback2_submitter_name = $('#feedback2_submitter_name').val();
    let feedback2_submitter_phone = $('#feedback2_submitter_phone').val();
    let feedback2_submitter_email = $('#feedback2_submitter_email').val();

    // to do: frontend side validations

    let payload = {
        'ref_id': `https://www.openstreetmap.org/${p.type}/${p.osmId}`,
        'category': $('#feedback2_category').val(),
        'STATE_ID': globalSTATE_ID,
        'DISTRICT_ID': globalDISTRICT_ID,
        'BLOCK_ID': globalBLOCK_ID,
        'feedback2_submitter_name': feedback2_submitter_name,
        'feedback2_submitter_phone': feedback2_submitter_phone,
        'feedback2_submitter_email': feedback2_submitter_email
    };
    // var changeFlag = false;
    if(feedback2_name.length && feedback2_name != p.name) {
        payload['feedback2_name'] = feedback2_name;
        // changeFlag = true;
    }
    if(feedback2_population && feedback2_population != p.population) {
        payload['feedback2_population'] = feedback2_population;
        // changeFlag = true;
    }
    if(feedback2_comments.length) {
        payload['feedback2_comments'] = feedback2_comments;
        // changeFlag = true;
    }

    // if(!changeFlag) {
    //     alert('No change suggestion or comment? Please give something.');
    //     return;
    // }

    $('#feedback2_status').html(`Sending feedback..`);
    $.ajax({
        url: `${APIpath}/feedback2`,
        type: "POST",
        data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $('#feedback2_status').html(`Thank you, sent the feedback.`);
            var wait2 = setTimeout(() => {
                $('#feedbackModal2').modal('hide');
                feedback2_clear();
            }, 2000);

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            if(jqXHR.responseJSON && jqXHR.responseJSON.detail) {
                alert(jqXHR.responseJSON.detail);
                $('#feedback2_status').html(jqXHR.responseJSON.detail);
            } 
        },
    });
    
}

function feedback2_clear() {
    $('#feedback2_name').val('');
    $('#feedback2_population').val('');
    $('#feedback2_comments').val('');
    $('#feedback2_submitter_name').val('');
    $('#feedback2_submitter_phone').val('');
    $('#feedback2_submitter_email').val('');
    $('#feedback2_status').html('');

    // reset dropdown to default. from https://www.geeksforgeeks.org/how-to-reset-selected-value-to-default-using-jquery/
    $('#feedback2_category option').each(function () {
        if (this.defaultSelected) {
            this.selected = true;
            return false;
        }
    });

    map.closePopup();

}
