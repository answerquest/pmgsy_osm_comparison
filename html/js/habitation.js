// habitation.js

const normalColor = "blue";
const normalColor_border = "white";
const selectedColor = "yellow";
const selectedColor_border = "black";
const lassoLimit = 50;


// ############################################
// GLOBAL VARIABLES
var URLParams = {}; // for holding URL parameters
var habitationsLayer = new L.geoJson(null);
var blockLayer = new L.geoJson(null);
var osmLayer1 = new L.geoJson(null);
var osmLayer2 = new L.geoJson(null);

var globalBlockBoundary = null;
var globalHab = {};
var globalOSM = {};
var globalSTATE_ID = '';
var globalDISTRICT_ID = '';
var globalBLOCK_ID = '';
var globalToggle = {1:false, 2:false};
var globalTurfBlock = null;

var globalSelectedFliter = {
    'habitations': false,
    'osm_far': false,
    'osm_near': false
};

// #################################
/* TABULATOR */
var itemsTotal = function(values, data, calcParams){
    var calc = values.length;
    return calc + ' total';
}

var table1 = new Tabulator("#table1", {
    height: 400,
    selectable: true,
    tooltipsHeader: true, //enable header tooltips,
    index: "id",
    clipboard:"copy",
    clipboardCopyRowRange:"selected", //change default selector to selected
    columnDefaults:{
        tooltip:true,
    },
    responsiveLayout: "collapse",
    // pagination:true,
    columns: [
        { title: "id", field: "id", headerFilter: "input" },
        { title: "HAB_ID", field: "HAB_ID", headerFilter: "input", bottomCalc:itemsTotal },
        { title: "HAB_NAME", field: "HAB_NAME", headerFilter: "input", width:150 },
        { title: "population", field: "TOT_POPULA", headerFilter: "input", hozAlign:"right", width:70  },
        { title: "lat", field: "latitude", headerFilter: "input", hozAlign:"right", width:80 },
        { title: "lon", field: "longitude", headerFilter: "input", hozAlign:"right", width:80 }
    ]
});

table1.on("rowSelected", function(row){
    let h = row.getData();
    // console.log('row selected',h);
    let lat = parseFloat(h.latitude);
    let lon = parseFloat(h.longitude);
    if( checklatlng(lat, lon)) {
        map.panTo([lat, lon]);
        // colorMap([h.id], 6, selectedColor, selectedColor_border);
        colorMap(idsList=[h.id], which='habitations', action='select');
    }
    // setupStopEditing(s.id, s.name);
    // globalSelected.add(s.id);
    
});

table1.on("rowDeselected", function(row){
    let h = row.getData();
    // colorMap([h.id], 5, normalColor, normalColor_border);
    colorMap(idsList=[h.id], which='habitations', action='deselect');
});

// ###########
// OSM - FAR 
var table2 = new Tabulator("#table2", {
    height: 300,
    selectable: true,
    tooltipsHeader: true, //enable header tooltips,
    index: "osmId",
    clipboard:"copy",
    clipboardCopyRowRange:"selected", //change default selector to selected
    columnDefaults:{
        tooltip:true,
    },
    columns: [
        { title: "OsmId", field: "osmId", headerFilter: "input", width:100, bottomCalc:itemsTotal},
        { title: "name", field: "name", headerFilter: "input", width:150 },
        { title: "population", field: "population", headerFilter: "input", width:70, hozAlign:"right" },
        { title: "tag", field: "place", headerFilter: "input", width:100 },
        { title: "lat", field: "lat", headerFilter: "input", hozAlign:"right"},
        { title: "lon", field: "lon", headerFilter: "input", hozAlign:"right" },
        { title: "type", field: "type", headerFilter: "input" }
    ]
});

table2.on("rowSelected", function(row){
    let h = row.getData();
    // console.log('row selected',h);
    let lat = parseFloat(h.lat);
    let lon = parseFloat(h.lon);
    if( checklatlng(lat, lon)) {
        map.panTo([lat, lon]);
        // colorMap([h.id], 6, selectedColor, selectedColor_border);
        colorMap(idsList=[h.osmId], which='osm_far', action='select');
    }
    // setupStopEditing(s.id, s.name);
    // globalSelected.add(s.id);
    
});

table2.on("rowDeselected", function(row){
    let h = row.getData();
    // colorMap([h.id], 5, normalColor, normalColor_border);
    colorMap(idsList=[h.osmId], which='osm_far', action='deselect');
});





// ###########
// OSM - NEAR
var table3 = new Tabulator("#table3", {
    height: 400,
    selectable: true,
    tooltipsHeader: true, //enable header tooltips,
    index: "osmId",
    clipboard:"copy",
    clipboardCopyRowRange:"selected", //change default selector to selected
    columnDefaults:{
        tooltip:true,
    },
    columns: [
        { title: "OsmId", field: "osmId", headerFilter: "input", width:100, bottomCalc:itemsTotal},
        { title: "name", field: "name", headerFilter: "input", width:150 },
        { title: "population", field: "population", headerFilter: "input", width:70, hozAlign:"right" },
        { title: "tag", field: "place", headerFilter: "input", width:100 },
        { title: "lat", field: "lat", headerFilter: "input", hozAlign:"right"},
        { title: "lon", field: "lon", headerFilter: "input", hozAlign:"right" },
        { title: "type", field: "type", headerFilter: "input" }
    ]
});

table3.on("rowSelected", function(row){
    let h = row.getData();
    // console.log('row selected',h);
    let lat = parseFloat(h.lat);
    let lon = parseFloat(h.lon);
    if( checklatlng(lat, lon)) {
        map.panTo([lat, lon]);
        // colorMap([h.id], 6, selectedColor, selectedColor_border);
        colorMap(idsList=[h.osmId], which='osm_near', action='select');
    }
    // setupStopEditing(s.id, s.name);
    // globalSelected.add(s.id);
    
});

table3.on("rowDeselected", function(row){
    let h = row.getData();
    // colorMap([h.id], 5, normalColor, normalColor_border);
    colorMap(idsList=[h.osmId], which='osm_near', action='deselect');
});

// #################################
/* MAP */

var cartoPositron = L.tileLayer.provider('CartoDB.Positron', {maxNativeZoom:19, maxZoom: 20});
var OSM = L.tileLayer.provider('OpenStreetMap.Mapnik', {maxNativeZoom:19, maxZoom: 20});
var gStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var gHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3']});
var esriWorld = L.tileLayer.provider('Esri.WorldImagery', {maxNativeZoom:18, maxZoom: 20});
var baseLayers = { 
    "OpenStreetMap.org" : OSM, 
    "Carto Positron": cartoPositron, 
    "ESRI Satellite": esriWorld,
    "gStreets": gStreets, 
    "gHybrid": gHybrid
};

var map = new L.Map('map', {
    center: STARTLOCATION,
    zoom: STARTZOOM,
    layers: [cartoPositron],
    scrollWheelZoom: true,
    maxZoom: 20,
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [
        { text: 'Load THIS block', callback: blockFromMap },
        // { text: 'Map an unmapped Stop here', callback: route_unMappedStop_popup }
    ]
});
$('.leaflet-container').css('cursor','crosshair'); // from https://stackoverflow.com/a/28724847/4355695 Changing mouse cursor to crosshairs
L.control.scale({metric:true, imperial:false, position: "bottomright"}).addTo(map);

// layers
var overlays = {
    "PMGSY Habitations": habitationsLayer,
    "Block Boundary": blockLayer,
    "OSM data out of proximity": osmLayer1,
    "OSM data within proximity": osmLayer2
};
var layerControl = L.control.layers(baseLayers, overlays, {collapsed: true, autoZIndex:false}).addTo(map); 

// https://github.com/Leaflet/Leaflet.fullscreen
map.addControl(new L.Control.Fullscreen({position:'topright'}));

const lasso = L.lasso(map); // lasso tool : https://github.com/zakjan/leaflet-lasso

// buttons on map
L.easyButton('<img src="lib/lasso.png" width="100%" title="Click to activate Lasso tool: Press mouse button down and drag to draw a lasso on the map around the points you want to select." data-toggle="tooltip" data-placement="right">', 
    function(btn, map){
    lasso.enable();
}).setPosition('topleft').addTo(map);

// SVG renderer
var myRenderer = L.canvas({ padding: 0.5 });

// Add in a crosshair for the map. From https://gis.stackexchange.com/a/90230/44746
var crosshairIcon = L.icon({
    iconUrl: crosshairPath,
    iconSize:     [crosshairSize, crosshairSize], // size of the icon
    iconAnchor:   [crosshairSize/2, crosshairSize/2], // point of the icon which will correspond to marker's location
});
crosshair = new L.marker(map.getCenter(), {icon: crosshairIcon, interactive:false});
crosshair.addTo(map);
// Move the crosshair to the center of the map when the user pans
map.on('move', function(e) {
    var currentLocation = map.getCenter();
    crosshair.setLatLng(currentLocation);
    $('.position').html(`${currentLocation.lat.toFixed(3)},${currentLocation.lng.toFixed(3)}`);
});

// lat, long in url
var hash = new L.Hash(map);

// custom content on top of the map
// easyButton
// L.easyButton('<img src="lib/route.svg" width="100%" title="toggle route lines" data-toggle="tooltip" data-placement="right">', function(btn, map){
//     routeLines();
//     ;
// }).addTo(map);

L.control.custom({
    position: 'bottomleft',
    content: `
    <span id="osm_status"></span><br>
    <i class="legend" style="background:blue"></i> PMGSY Habitations<br>
    <i class="legend" style="background:green"></i> OSM places nearby<br>
    <i class="legend" style="background:red"></i> OSM places far
    `,
    //<button class="btn btn-outline-success btn-sm" onclick="openOSM()">Open in OSM</button>`,
    classes: `divOnMap1`
}).addTo(map);

// Load India int'l boundary as per shapefile shared on https://surveyofindia.gov.in/pages/outline-maps-of-india
L.geoJSON(india_outline, {
    style: function (feature) {
        return {
            color: "black",
            fillOpacity: 0,
            weight: 3,
            opacity: 1
        };
    },
    interactive: false
}).addTo(map);


// test disabling dragging for phone screens


// ############################################
// RUN ON PAGE LOAD
$(document).ready(function () {
    loadURLParams(URLParams);

    // Selectize initializatons

    let stateSelectize = $('#state').selectize({
        placeholder: "Choose a State",
        labelField: 'STATE_NAME',
        valueField: 'STATE_ID',
        searchField: ['STATE_NAME','STATE_ID'],
        maxItems: 1,
        // plugins: ['remove_button'], // spotted here: https://stackoverflow.com/q/51611957/4355695
        render: {
            item: function(data, escape) {
                return `<div class="item">${escape(data.STATE_ID)}: ${escape(data.STATE_NAME)}</div>`;
            },
            option: function(data, escape) {
                return `<div class="option">${escape(data.STATE_ID)}: ${escape(data.STATE_NAME)}</div>`;
            },
        },
        onChange(STATE_ID) {
            if(STATE_ID) {
                globalSTATE_ID = STATE_ID;
                loadDistricts(STATE_ID);
            }
            else globalSTATE_ID = null;
        },
        onClear(){
            $("#district")[0].selectize.clear();
            $("#district")[0].selectize.clearOptions(silent=true);
        }
    });

    let districtSelectize = $('#district').selectize({
        placeholder: "Choose a District",
        labelField: 'DISTRICT_NAME',
        valueField: 'DISTRICT_ID',
        searchField: ['DISTRICT_NAME','DISTRICT_ID'],
        maxItems: 1,
        // plugins: ['remove_button'], // spotted here: https://stackoverflow.com/q/51611957/4355695
        render: {
            item: function(data, escape) {
                return `<div class="item">${escape(data.DISTRICT_ID)}: ${escape(data.DISTRICT_NAME)}</div>`;
            },
            option: function(data, escape) {
                return `<div class="option">${escape(data.DISTRICT_ID)}: ${escape(data.DISTRICT_NAME)}</div>`;
            },
        },
        onChange(DISTRICT_ID) {
            if(DISTRICT_ID) {
                globalDISTRICT_ID = DISTRICT_ID;
                loadBlocks(globalSTATE_ID, DISTRICT_ID);
            }
            else globalDISTRICT_ID = null;
        },
        onClear(){
            $("#block")[0].selectize.clear();
            $("#block")[0].selectize.clearOptions(silent=true);
        }
    });

    let blockSelectize = $('#block').selectize({
        placeholder: "Choose a Block",
        labelField: 'BLOCK_NAME',
        valueField: 'BLOCK_ID',
        searchField: ['BLOCK_NAME','BLOCK_ID'],
        maxItems: 1,
        // plugins: ['remove_button'], // spotted here: https://stackoverflow.com/q/51611957/4355695
        render: {
            item: function(data, escape) {
                return `<div class="item">${escape(data.BLOCK_ID)}: ${escape(data.BLOCK_NAME)}</div>`;
            },
            option: function(data, escape) {
                return `<div class="option">${escape(data.BLOCK_ID)}: ${escape(data.BLOCK_NAME)}</div>`;
            },
        },
        onChange(BLOCK_ID) {
            if(BLOCK_ID) {
                globalBLOCK_ID = BLOCK_ID;
                loadHabitations(globalSTATE_ID, BLOCK_ID, globalDISTRICT_ID);
                loadRegion(BLOCK_ID);

                // trigger OSM data load unless url param says so
                if(!(URLParams['O'] && URLParams['O'] == 'N' )) {
                    console.log(`Auto-triggering compareWithOSM()`);
                    compareWithOSM();
                }
                
            }
            else globalBLOCK_ID = '';
        },
        onClear(){
            table1.clearData();
            habitationsLayer.clearLayers();
            blockLayer.clearLayers();

            table2.clearData();
            table3.clearData();
            osmLayer1.clearLayers();
            osmLayer2.clearLayers();

            $('#table1_status').html(`Select a block`);
            $('#osm_status').html(``);

        }
    });

    // ###########
    // What to start off
    loadStates();


    // ##########
    // map lasso related
    map.on('lasso.finished', (event) => {
        console.log(`${event.layers.length} places selected by lasso tool`);
        // sanity check
        if(event.layers.length > lassoLimit) {
            alert(`${event.layers.length} places selected by lasso? This doesn't seem right. please zoom in and make a smaller selection.`);
            return;
        }
        
        // $('#reconcileStatus').html(``);
        event.layers.forEach(element => {
            if(element.properties && element.properties.id) {
                table1.selectRow(element.properties.id);
            }
            else if (element.properties && element.properties.osmId) {
                if (element.properties.proximity == 'far')
                    table2.selectRow(element.properties.osmId);
                else
                    table3.selectRow(element.properties.osmId);
            }
            // note: take care to ensure that this only takes stops from stopsLayer. By default it grabs whatever's there, irrespective of layer. Currently, this entails that no other layer should have feature.properties set.
        });
    });

    map.on('lasso.disabled', (event) => {
        // lasso was making mouse cursor into hand after completion. So make it crosshairs again
        $('.leaflet-container').css('cursor','crosshair');
        // from https://stackoverflow.com/a/28724847/4355695 Changing mouse cursor to crosshairs
    });
});


// ############################################
// FUNCTIONS

function loadStates() {
    $.ajax({
        url: `./API/statesList`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $("#state")[0].selectize.clear();
            $("#state")[0].selectize.clearOptions(silent=true);
            $("#state")[0].selectize.addOption(returndata.states);

            if(URLParams['S']) {
                $("#state")[0].selectize.setValue(URLParams['S'],silent=false);
            }
          
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            // $("#stopsTable_status").html(jqXHR.responseText);
        },
    });
}

function loadDistricts(STATE_ID) {
    $.ajax({
        url: `./API/districtsList/${STATE_ID}`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $("#district")[0].selectize.clear();
            $("#district")[0].selectize.clearOptions(silent=true);
            $("#district")[0].selectize.addOption(returndata.districts);

            if(URLParams['D']) {
                $("#district")[0].selectize.setValue(URLParams['D'],silent=false);
            }
          
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            // $("#stopsTable_status").html(jqXHR.responseText);
        },
    });
}


function loadBlocks(STATE_ID, DISTRICT_ID) {
    $.ajax({
        url: `./API/blocksList?STATE_ID=${STATE_ID}&DISTRICT_ID=${DISTRICT_ID}`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            $("#block")[0].selectize.clear();
            $("#block")[0].selectize.clearOptions(silent=true);
            $("#block")[0].selectize.addOption(returndata.blocks);

            if(URLParams['B']) {
                $("#block")[0].selectize.setValue(URLParams['B'],silent=false);
            }
          
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            // $("#stopsTable_status").html(jqXHR.responseText);
        },
    });
}


function loadRegion(BLOCK_ID) {
    blockLayer.clearLayers();
    $.ajax({
        url: `./API/loadRegion/${BLOCK_ID}`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            // console.log(returndata);
            blockLayer.clearLayers();

            globalBlockBoundary = L.geoJSON(returndata, {
                style: function (feature) {
                    return {
                        color: "orange",
                        fillOpacity: 0,
                        weight: 2,
                        opacity: 0.6
                    };
                },
                interactive: false

            }).addTo(blockLayer);
            if (!map.hasLayer(blockLayer)) map.addLayer(blockLayer);
            map.fitBounds(blockLayer.getBounds());
          
        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            // $("#stopsTable_status").html(jqXHR.responseText);
        },
    });
}

function loadHabitations(STATE_ID, BLOCK_ID, DISTRICT_ID) {
    table1.clearData();
    $('#table1_status').html(`Loading..`);
    $.ajax({
        url: `./API/habitations?STATE_ID=${STATE_ID}&BLOCK_ID=${BLOCK_ID}&DISTRICT_ID=${DISTRICT_ID}`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            let habJ = Papa.parse(returndata.data, {header:true, skipEmptyLines:true});
            
            table1.setData(habJ.data);
            $('#table1_status').html(`Loaded`);
            
            mapHabitations(habJ.data, STATE_ID, BLOCK_ID, DISTRICT_ID);

            if(! habJ.data.length) {
                $('#table1_status').html(`No habitations data for this block in the database.`);
            }

            // change URL to have permalink to this route
            let plink = `?S=${STATE_ID}&D=${DISTRICT_ID}&B=${BLOCK_ID}`;
            // respect if url param says don't load overpass data
            if (URLParams['O']) {
                if (URLParams['O']=='N') {
                    plink += `&O=N`;
                } 
                // else {
                //     compareWithOSM();
                // }

            } else {
                    plink += `&O=Y`;
                    // compareWithOSM();
            }

            
            // #${map.getZoom()}/${map.getCenter().lat.toFixed(4)}/${map.getCenter().lng.toFixed(4)}`;
            history.pushState({page: 1}, null, plink);

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            // $("#stopsTable_status").html(jqXHR.responseText);
        },
    });
}

function mapHabitations(data, STATE_ID, BLOCK_ID, DISTRICT_ID) {
    var circleMarkerOptions = {
        renderer: myRenderer,
        radius: 6,
        fillColor: normalColor,
        color: normalColor_border,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
    };
    var mapCounter = 0;
    habitationsLayer.clearLayers();

    data.forEach(h => {
        let lat = parseFloat(h.latitude);
        let lon = parseFloat(h.longitude);
        if(!checklatlng(lat,lon)) return;
        let tooltipContent = `PMGSY ${h.HAB_ID}: ${h.HAB_NAME}`;
        let popupContent = `${h.HAB_ID}: ${h.HAB_NAME}<br>
        Population: ${h.TOT_POPULA}<br>
        unique id: ${h.id}<br>
        <button onclick="locateInTable('${h.id}',1)">Locate in table</button>
        `;

        globalHab[h.id] = L.circleMarker([lat,lon], circleMarkerOptions)
            .bindTooltip(tooltipContent, {direction:'top', offset: [0,-5]})
            .bindPopup(popupContent);
        globalHab[h.id].properties = h;
        globalHab[h.id].addTo(habitationsLayer);
        mapCounter ++;
    });

    if (!map.hasLayer(habitationsLayer)) map.addLayer(habitationsLayer);
    console.log(`${mapCounter} habitations mapped.`)

}

function locateInTable(id, which=1) {
    // table1.deselectRow();
    if (which == 1) {
        table1.selectRow(id);
        table1.scrollToRow(id, "top", false);
    } else if (which == 2) {
        table2.selectRow(id);
        table2.scrollToRow(id, "top", false);
    }
    else {
        table3.selectRow(id);
        table3.scrollToRow(id, "top", false);
    }
    // var selectedData = table1.getSelectedData();
    // let name = selectedData[0].name;

    // setupStopEditing(id, name);
}

// function colorMap(idsList, radius=6, chosenColor='blue', chosenColor_border='white') {
//     idsList.forEach(e => {
//         if(globalHab[e]) {
//             globalHab[e].setStyle({
//                 fillColor : chosenColor,
//                 color: chosenColor_border,
//                 radius: radius
//             });
//         }
//     });
// }

function colorMap(idsList, which='habitations', action='select') {
    var fillColorVal = 'blue', colorVal = 'white', radiusVal = 5;
    var holder = null;

    if(which == 'habitations' && action == 'select') {
        console.log(`habitations select`);
        fillColorVal = 'lightblue';
        radiusVal = '7';
        holder = globalHab;

    } else if (which == 'habitations' && action == 'deselect') {
        console.log(`habitations deselect`);
        fillColorVal = 'blue';
        radiusVal = '5';
        holder = globalHab;

    } else if (which == 'osm_near' && action == 'select') {
        console.log(`osm_near select`);
        fillColorVal = 'lightgreen';
        radiusVal = '7';
        holder = globalOSM;

    } else if (which == 'osm_near' && action == 'deselect') {
        console.log(`osm_near deselect`);
        fillColorVal = 'green';
        radiusVal = '5';
        holder = globalOSM;
        
    } else if (which == 'osm_far' && action == 'select') {
        console.log(`osm_far select`);
        fillColorVal = 'lightred';
        radiusVal = '7';
        holder = globalOSM;
        
    } else if (which == 'osm_far' && action == 'deselect') {
        console.log(`osm_far deselect`);
        fillColorVal = 'red';
        radiusVal = '5';
        holder = globalOSM;
        
    }

    idsList.forEach(e => {
        if(holder[e]) {
            holder[e].setStyle({
                fillColor : fillColorVal,
                // color: chosenColor_border,
                radius: radiusVal
            });
        }
    });
}




// function loadOverpass() {
//     table2.clearData();
//     osmLayer1.clearLayers();

//     let bounds = null;
//     // take bounding box of the block's boundary
//     if (blockLayer.getLayers().length)
//         bounds = blockLayer.getBounds().toBBoxString().split(','); // lon,lat,lon,lat
//     else 
//         // if no shape loaded, revert to map's bounds
//         bounds = map.getBounds().toBBoxString().split(',');
    
//     let payload = {
//         'lat1': bounds[1],
//         'lon1': bounds[0],
//         'lat2': bounds[3],
//         'lon2': bounds[2]
//     }
//     console.log('loadOverpass',payload);

//     $('#table2_status').html(`Loading..`);

//     $.ajax({
//         url: `./API/overpass`,
//         type: "POST",
//         data : JSON.stringify(payload),
//         cache: false,
//         contentType: 'application/json',
//         success: function (returndata) {
//             if(returndata.osm_locations) {
//                 let osmJ = Papa.parse(returndata.osm_locations, {header:true, skipEmptyLines:true});
//                 mapOSM(osmJ.data);
//             }
            
            
//             if(returndata.num == 0) {
//                 $('#table2_status').html(`No OSM data for given limits.`);
//             }

//         },
//         error: function (jqXHR, exception) {
//             console.log("error:", jqXHR.responseText);
//             $("#table2_status").html(jqXHR.responseText);
//         },
//     });
// }

function mapOSM(data, which='far') {
    var circleMarkerOptions2 = {
        'far': {
            renderer: myRenderer,
            radius: 6,
            fillColor: 'red',
            color: 'white',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        'near': {
            renderer: myRenderer,
            radius: 5,
            fillColor: 'green',
            color: 'white',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        }
    };
    // osmLayer1.clearLayers();
    let layer = null;
    if(which=='far') layer = osmLayer1;
    else layer = osmLayer2;

    // let data2 = [];
    data.forEach(o => {
        let lat = parseFloat(o.lat);
        let lon = parseFloat(o.lon);
        if(!checklatlng(lat,lon)) return;

        // data2.push(o);

        let tooltipContent = `OSM ${o.osmId}: ${o.name.length? o.name : '<no name>'}`;
        let popupContent = `<a href="https://www.openstreetmap.org/${o.type}/${o.osmId}" target="_blank">${o.osmId}</a>: ${o.name}<br>
        tag: place=${o.place}<br>
        ${o.population? `tag: population=${o.population}<br>`: ``}
        <button onclick="locateInTable('${o.osmId}',${ which=='far' ? 2 : 3 })">Locate in table</button>
        `;

        globalOSM[o.osmId] = L.circleMarker([lat,lon], circleMarkerOptions2[which])
            .bindTooltip(tooltipContent, {direction:'top', offset: [0,-5]})
            .bindPopup(popupContent);
        globalOSM[o.osmId].properties = o;
        globalOSM[o.osmId].addTo(layer);
        // mapCounter ++;
    });

    if (!map.hasLayer(layer)) map.addLayer(layer);

    // console.log(`${mapCounter} OSM places mapped.`)
}


function jump2OSM(which='open') {
    // open OSM: https://www.openstreetmap.org/#map=13/28.1952/80.6254
    // edit OSM: https://www.openstreetmap.org/edit#map=13/28.1952/80.6254 13 min

    let z = map.getZoom();
    let c = map.getCenter();
    let lat = c.lat.toFixed(4);
    let lon = c.lng.toFixed(4);
    let url = ``;

    if(which == 'open'){
        url = `https://www.openstreetmap.org/#map=${z}/${lat}/${lon}`;
        var win = window.open(url, '_blank');

    } else  { // if (which == 'edit') // use if more options come along
        
        fire off gpx creation api then go to OSM
        not working right now, issue: https://github.com/openstreetmap/iD/issues/9093
        $.ajax({
            url: `./API/boundaryGPX/${globalBLOCK_ID}`,
            type: "GET",
            // data : JSON.stringify(payload),
            cache: false,
            contentType: 'application/json',
            success: function (returndata) {
                console.log(returndata);
                z = z < 13? 13 : z;

                let getUrl = window.location;
                let baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
                let gpxURL = `${baseUrl}/gpx/${globalBLOCK_ID}.gpx`;
                let url = `https://www.openstreetmap.org/edit#gpx=${gpxURL}`;
                var win = window.open(url, '_blank');
            },
            error: function (jqXHR, exception) {
                console.log("error:", jqXHR.responseText);
                // jump 2 osm anyway
                z = z < 13? 13 : z;
                let url = `https://www.openstreetmap.org/edit#map=${z}/${lat}/${lon}`;
                var win = window.open(url, '_blank');
            },
        });

        
    }

    
}

function compareWithOSM() {
    table2.clearData();
    table3.clearData();
    osmLayer1.clearLayers();
    osmLayer2.clearLayers();

    let proximity = parseInt($('#proximity').val());
    if(!proximity) {
        alert(`Please enter a valid proximity value in meters`);
        return;
    }
    if(!globalBLOCK_ID.length) {
        alert("Please select a block first");
        return;
    }

    let payload = {
        'STATE_ID': globalSTATE_ID,
        'BLOCK_ID': globalBLOCK_ID,
        'proximity': proximity
    };

    $('#osm_status').html(`Fetching OSM data and comparing..`);

    $.ajax({
        url: `./API/comparison1`,
        type: "POST",
        data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            // doubletap
            osmLayer1.clearLayers();
            osmLayer2.clearLayers();
            let total = returndata['OSM_near'] + returndata['OSM_far'];
            if(total == 0) {
                $('#osm_status').html(`No OSM data found within selected block boundary.`);
                return;
            }

            if(returndata['num_OSM_far'] > 0) {
                let far1 = Papa.parse(returndata['OSM_far'], {header:true, skipEmptyLines:true});
                table2.setData(far1.data);
                mapOSM(far1.data, which='far');
            }

            if(returndata['num_OSM_near'] > 0) {
                let near1 = Papa.parse(returndata['OSM_near'], {header:true, skipEmptyLines:true});
                table3.setData(near1.data);
                mapOSM(near1.data, which='near');
            }
            $('#osm_status').html(`Found ${returndata['num_OSM_far']} locations outside proximity, ${returndata['num_OSM_near']} within proximity.`)

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            $("#osm_status").html(JSON.parse(jqXHR.responseText).detail);
        },
    });

}



function insideBoundary(lat,lon) {
    // function to do point-in-polygon check between OSM data and the block boundary loaded

    // if nothing loaded, return false
    if(! globalBLOCK_ID.length ) return false;

    // if no block loaded, just say true - nope, don't want to do that for the new use case
    // if (!globalBlockBoundary.toGeoJSON().features.length) return true;
    
    return turf.booleanPointInPolygon( turf.point([lon,lat]), globalBlockBoundary.toGeoJSON().features[0]);
}


function blockFromMap(e) {
    let lat = parseFloat(e.latlng.lat.toFixed(6));
    let lon = parseFloat(e.latlng.lng.toFixed(6));


    // sanity check: check if this point is already within the presently loaded polygon
    if(insideBoundary(lat,lon)) {
        alert(`Bro! This block is already loaded! Click outside to load up some other block.`);
        return;
    }
    
    $.ajax({
        url: `./API/blockFromMap/${lat}/${lon}`,
        type: "GET",
        // data : JSON.stringify(payload),
        cache: false,
        contentType: 'application/json',
        success: function (returndata) {
            console.log('blockFromMap:',returndata);
            loadFull(returndata);

        },
        error: function (jqXHR, exception) {
            console.log("error:", jqXHR.responseText);
            
        },
    });
}


function loadFull(data) {
    // $("#routes_list")[0].selectize.setValue(URLParams['route'],silent=false)

    // set the top URL to this
    let plink = `?S=${data.STATE_ID}&D=${data.DISTRICT_ID}&B=${data.BLOCK_ID}&O=Y`;
    history.pushState({page: 1}, null, plink);

    // refresh the URLParams var
    loadURLParams(URLParams);

    // and then, set the ball rolling
    $("#state")[0].selectize.setValue(data.STATE_ID,silent=false);

}



function toggleSelected(which='habitations') {
    
    let table = null;
    if(which == 'habitations') table = table1;
    else if (which == 'osm_far') table = table2;
    else table = table3;

    if(!globalSelectedFliter[which]) {
        let selData = table.getSelectedData();
        if(!selData.length) {
            alert("Nothing selected");
            return;
        }
        let selIds = [];
        selData.forEach(s => {
            if(which == 'habitations') selIds.push(s.id);
            else selIds.push(s.osmId);
        })
        console.log('selIds:',selIds);
        if(which == 'habitations')
            table.setFilter("id", "in", selIds);
        else
            table.setFilter("osmId", "in", selIds);

        $(`#toggle_${which}`).html(`Show All`);
        globalSelectedFliter[which] = true;
    }
    else {
        // clear all filters on the target table
        table.clearFilter(true);
        $(`#toggle_${which}`).html(`Show Selected`);
        globalSelectedFliter[which] = false;
    }
    //alert("Coming soon!");

}