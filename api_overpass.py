# api_overpass

import os, time, json, requests
from typing import Optional, List
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi import HTTPException, Header, Path
import pandas as pd
from urllib.parse import urlencode, quote_plus

from geosadak_api_launch import app
import commonfuncs as cf
import dbconnect

MAX_LAT_SPAN = 3
MAX_LON_SPAN = 3
OSM_additional_columns = ['name','place','population','postal_code','wikidata','wikipedia','source','is_in','addr:country','addr:postcode']

#########

class overpass_payload(BaseModel):
    lat1: float
    lon1: float
    lat2: float
    lon2: float

@app.post("/API/overpass", tags=["overpass"])
def overpass_api(r: overpass_payload ):
    global MAX_LAT_SPAN
    global MAX_LON_SPAN
    global OSM_additional_columns

    # validations
    if not cf.validateLL(r.lat1, r.lon1) or not cf.validateLL(r.lat2, r.lon2):
        raise HTTPException(status_code=400, detail="Invalid lat longs for bounding box")
    if r.lat1 > r.lat2:
        raise HTTPException(status_code=400, detail="Might wanna switch the latitudes around?")
    if r.lon1 > r.lon2:
        raise HTTPException(status_code=400, detail="Might wanna switch the longitudes around?")

    # check if area is too big
    
    if (r.lat2 - r.lat1 > MAX_LAT_SPAN) or (r.lon2 - r.lon1 > MAX_LON_SPAN):
        raise HTTPException(status_code=400, detail="Too big a bounding box; please go smaller")
    
    return overpass(r.lat1, r.lon1, r.lat2, r.lon2) # outsource to a function for re-use by other parts of program

    
def overpass(lat1, lon1, lat2, lon2):
    BBOX = f"{lat1},{lon1},{lat2},{lon2}"

    url = "https://overpass-api.de/api/interpreter"
    headers = {
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    payloadText = f"""
    [out:json][timeout:25];
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
    # print(payload)

    response = requests.request("POST", url, headers=headers, data=payload)
    # print(response.text)
    try:
        osmD = response.json()
    except:
        cf.logmessage(response.text)
        raise HTTPException(status_code=400, detail="Invalid response from overpass server")
    # print(osmD)

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