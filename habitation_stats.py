# habitation_stats.py

import os, time, json, requests, datetime, sys, io
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape
from urllib.parse import urlencode, quote_plus

import dbconnect

# constants
statsFile = "stats_habitations_vs_OSM.csv"
proximity = 1000
METERS_CRS = 7755
OVERPASS_PAUSE = 3

###########
# FUNCTIONS

def logmessage( *content ):
    global timeOffset
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"{timestamp}: {' '.join(str(x) for x in list(content))}" # from https://stackoverflow.com/a/3590168/4355695
    print(line) # print to screen also

    logFolder = 'logs'
    logFilename = 'stats_log.txt'
    
    with open(os.path.join(logFolder,logFilename), 'a') as f:
        print(line, file=f) # file=f argument at end writes to file. from https://stackoverflow.com/a/2918367/4355695


def makegpd(x,lat='latitude',lon='longitude'):
    gdf = gpd.GeoDataFrame(x, geometry=gpd.points_from_xy(x[lon],x[lat]), crs="EPSG:4326")
    gdf.drop(columns=[lat,lon], inplace=True)
    return gdf


def overpass(lat1, lon1, lat2, lon2):
    OSM_additional_columns = ['name','place','population','postal_code','wikidata','wikipedia','source','is_in','addr:country','addr:postcode']
    BBOX = f"{lat1},{lon1},{lat2},{lon2}"

    url = "https://overpass-api.de/api/interpreter"
    headers = {
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    payloadText = f"""
    [out:json][timeout:300];
    (
      node["place"="isolated_dwelling"]({BBOX});
      way["place"="isolated_dwelling"]({BBOX});
      relation["place"="isolated_dwelling"]({BBOX});
      node["place"="hamlet"]({BBOX});
      way["place"="hamlet"]({BBOX});
      relation["place"="hamlet"]({BBOX});
      node["place"="village"]({BBOX});
      way["place"="village"]({BBOX});
      relation["place"="village"]({BBOX});
    );
    out body center;
    >;
    out skel qt;
    """
    # note: including "center" above so that in case the object is an area instead of a node, then give its centroid
    # from https://www.mappa-mercia.org/2014/09/extracting-centroids-from-openstreetmap.html\
    
    payload = urlencode({'data':payloadText}, quote_via=quote_plus)
    logmessage(f"Sending api call to Overpass with BBOX: {BBOX}")
    
    response = requests.request("POST", url, headers=headers, data=payload)
    logmessage("overpass response status:",response.status_code)
    if response.status_code != 200:
        return {'num':0, 'osm_reponse':response.text}
    try:
        osmD = response.json()
    except:
        logmessage(response.status_code, response.text)
        raise
    # logmessage(osmD)
    
    logmessage(f"Got {len(osmD.get('elements',[]))} elements total from overpass")
    collector = []
    for e in osmD.get('elements',[]):
        if e['type'] == 'node':
            # exclude entries which are just nodes but no tags {} - those are nodes under some other object and not actual OSM places
            if not e.get('tags',False):
                continue
            row = {'osmId': e['id'], 'lat':e['lat'], 'lon':e['lon'], 'type':e['type']}
            # row.update(e.get('tags',{}))
            for col in OSM_additional_columns:
                if e.get('tags',{}).get(col):
                    row[col] = e['tags'][col]
            collector.append(row)
        
        elif e['type'] == 'way' and e.get('tags',{}):
            # if polygon, then take its centroid
            if e.get('center',False):
                row = {'osmId': e['id'], 'lat':e['center']['lat'], 'lon':e['center']['lon'], 'type':e['type']}
                for col in OSM_additional_columns:
                    if e.get('tags',{}).get(col):
                        row[col] = e['tags'][col]
                collector.append(row)
    
    if len(collector):
        df1 = pd.DataFrame(collector).fillna('')
        # TO DO: whitelist of accepted column names, or upper limit on variety of tags

        returnD = {'num': len(df1), 'osm_locations':df1.to_csv(index=False)} 
    else:
        returnD = {'num':0 }
    
    return returnD

###########
# PRELOAD DATA

doneBlocks = []
if os.path.isfile(statsFile):
    df1 = pd.read_csv(statsFile)
    doneBlocks = df1['BLOCK_ID'].tolist()
    logmessage(f"{len(doneBlocks)} blocks already done")



##########
# MAIN PROG START
s1 = """select distinct "STATE_ID" from block
"""
statesList = dbconnect.makeQuery(s1, output='column')

statesList = statesList[17:]
logmessage(f"statesList:",statesList)
# sys.exit()


counter = 0
# loop thru each state
for S in statesList:
    logmessage(f"STATE_ID: {S}")
    
    # fetch all habitations under this state
    s2 = f"""select id, "HAB_ID", "STATE_ID", "DISTRICT_I","BLOCK_ID", "HAB_NAME", "TOT_POPULA",
    ST_Y(geometry) as lat, 
    ST_X(geometry) as lon
    from habitation
    where "STATE_ID" = '{S}'
    """
    hdf1 = dbconnect.makeQuery(s2, output='df')
    if not len(hdf1):
        logmessage(f"No habitations for STATE_ID {S} ??")
        continue

    blocksList = hdf1['BLOCK_ID'].unique().tolist()    
    # skip if all these blocks are already covered
    if len(set(blocksList) - set(doneBlocks)) == 0:
        # skip to next state
        logmessage(f"Skipping STATE_ID {S} as all blocks covered already.")
        continue

    hdf2 = makegpd(hdf1, lat='lat',lon='lon')


    # fetch the state's combined shape
    s3 = f"""select ST_AsGeoJSON(st_union(geometry)) as geometry
    from block
    where "STATE_ID" = '{S}'
    group by "STATE_ID"
    """
    holder1 = dbconnect.makeQuery(s3, output='oneValue')
    if not holder1:
        logmessage()
        logmessage(f"ALERT: STATE_ID:{S}: No combined shape obtained from block table")
        logmessage()
        continue
    shape1 = shape(json.loads(holder1))

    # fetch all locations within the state's bounds from overpass
    overpassResponse = overpass(shape1.bounds[1],shape1.bounds[0],shape1.bounds[3],shape1.bounds[2])
    if not overpassResponse.get('num',False):
        logmessage()
        logmessage(f"No response from overpass, exiting program, please run after some time.")
        logmessage(overpassResponse.get('osm_reponse',''))
        logmessage()
        sys.exit()
    odf1 = pd.read_csv(io.BytesIO(overpassResponse['osm_locations'].encode('UTF-8'))).fillna('')
    odf2 = makegpd(odf1, lat='lat',lon='lon')

    # now cycle thru each block
    collector = []
    for B in blocksList:
        if B in doneBlocks: continue

        row = {
            'STATE_ID': S,
            'BLOCK_ID': B
        }
        # habitations
        hdf3 = hdf2[hdf2['BLOCK_ID'] == B].copy().reset_index(drop=True)
        row['hab_num'] = len(hdf3)

        if not len(hdf3):
            logmessage(f"{S}:{B}: No habitations, weird")
            continue

        # fetch the shape of the block
        s4 = f""" select ST_AsGeoJSON(geometry) as geometry from block 
        where "STATE_ID"='{S}' and "BLOCK_ID"='{B}'
        """
        holder2 = dbconnect.makeQuery(s4, output='oneValue', noprint=True)
        if not holder2:
            logmessage()
            logmessage(f"No block boundary for BLOCK_ID: {B} under STATE_ID: {S} - fallback to convex hull of habitations")
            # fallback : make convex hull of habitations and apply buffer of proximity m.
            # have to convert to meters CRS and back along the way
            s5 = f"""select ST_AsGeoJSON(
                ST_Transform(
                    ST_Buffer(
                        ST_Transform(
                            ST_ConvexHull( ST_Collect(geometry) )
                            , {METERS_CRS}
                        ), {proximity}
                    ),4326 
                )
            ) as geometry
            from habitation
            where "STATE_ID"='{S}' and "BLOCK_ID"='{B}'
            """
            holder2 = dbconnect.makeQuery(s5, output='oneValue')

        shape2 = shape(json.loads(holder2))


        # see if all habitations are inside this block only
        row['hab_outside'] = len(hdf3[~hdf3.within(shape2)])

        # get all overpass locations inside this block
        odf3 = odf2[odf2.within(shape2)].copy().reset_index(drop=True)
        row['osm_num'] = len(odf3)


        # this block has more habitaitons or more OSM places?
        if len(odf3) > (len(hdf3) - row['hab_outside']):
            row['greater'] = 'osm'
        else:
            row['greater'] = 'hab'


        # find proximity and outlier OSM places
        if len(odf3):
            hdf3_buffer = hdf3.to_crs(METERS_CRS).buffer(proximity).to_crs(4326).unary_union
            row['osm_near'] = len(odf3[odf3.within(hdf3_buffer)])
            row['osm_far'] = len(odf3[~odf3.within(hdf3_buffer)])
        else:
            row['osm_near'] = 0
            row['osm_far'] = 0

        
        # find proximity and outlier Habitations wrt OSM places
        if len(odf3):
            odf3_buffer = odf3.to_crs(METERS_CRS).buffer(proximity).to_crs(4326).unary_union
            row['hab_near'] = len(hdf3[hdf3.within(odf3_buffer)])
            row['hab_far'] = len(hdf3[~hdf3.within(odf3_buffer)])
        else:
            row['hab_near'] = 0
            row['hab_far'] = len(hdf3)

        collector.append(row)
        counter += 1
        if counter %100 == 0:
            logmessage(f"{counter} blocks done")


    # save data for this state
    if os.path.isfile(statsFile):
        pd.DataFrame(collector).to_csv(statsFile, index=False, header=False, mode='a')
    else:
        pd.DataFrame(collector).to_csv(statsFile, index=False)
    
    # wait time before next run to give overpass time
    time.sleep(OVERPASS_PAUSE)

logmessage(f"Total {counter} blocks processed")


################
# post-process work : did in a juypter notebook, see "habitation_stats_embellish.ipynb"

