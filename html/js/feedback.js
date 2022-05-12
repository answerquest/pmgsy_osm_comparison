// feedback.js


// second map in feedback popup

var cartoPositron2 = L.tileLayer.provider('CartoDB.Positron', {maxNativeZoom:19, maxZoom: 20});
var OSM2 = L.tileLayer.provider('OpenStreetMap.Mapnik', {maxNativeZoom:19, maxZoom: 20});
var gStreets2 = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var gHybrid2 = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var esriWorld2 = L.tileLayer.provider('Esri.WorldImagery', {maxNativeZoom:18, maxZoom: 20});
var baseLayers2 = { 
    "OpenStreetMap.org" : OSM2, 
    "Carto Positron": cartoPositron2, 
    "ESRI Satellite": esriWorld2,
    "gStreets": gStreets2, 
    "gHybrid": gHybrid2
};

var crosshairIcon2 = L.icon({
    iconUrl: crosshairPath,
    iconSize:     [crosshairSize, crosshairSize], // size of the icon
    iconAnchor:   [crosshairSize/2, crosshairSize/2], // point of the icon which will correspond to marker's location
});



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
            zoom: 14,
            layers: [cartoPositron2],
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
            fillColor: normalColor,
            color: normalColor_border,
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
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

    // frontend validation

    let payload = {
        'uid': globalSelectedHabitation,
        'feedback1_submitter_name': feedback1_submitter_name,
        'feedback1_submitter_phone': feedback1_submitter_phone,
        'feedback1_submitter_email': feedback1_submitter_email
    };
    if(feedback1_changeName.length && feedback1_changeName != p.HAB_NAME) {
        payload['feedback1_changeName'] = feedback1_changeName;
    }
    if(feedback1_changePopulation && feedback1_changePopulation != p.HAB_NAME) {
        payload['feedback1_changePopulation'] = feedback1_changePopulation;
    }
    if(newLoc && newLoc != $('#hab_location').html()) {
        let holder1 = newLoc.split(',');
        payload['lat'] = holder1[0];
        payload['lon'] = holder1[1];

    }
    if(feedback1_comments.length) payload['feedback1_comments'] = feedback1_comments;


    $('#feedback1_status').html(`Sending feedback..`);
    $.ajax({
        url: `./API/feedback1`,
        type: "POST",
        data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $('#feedback1_status').html(`Thank you, sent the feedback.`);
            var wait2 = setTimeout(() => {
                $('#feedbackModal1').modal('hide');
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


