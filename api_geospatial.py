# api_geospatial

import os, time, json, requests
from typing import Optional, List
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi import HTTPException, Header, Path

import pandas as pd
import geopandas as gpd
import io
from shapely.geometry import shape


from geosadak_api_launch import app
import commonfuncs as cf
import dbconnect

from api_habitations import habitations
from api_overpass import overpass

METERS_CRS = 7755

root = os.path.dirname(__file__)
gpxFolder = os.path.join(root,'gpx')
os.makedirs(gpxFolder, exist_ok=True)

#########
# FUNCTIONS

def makegpd(x,lat='latitude',lon='longitude'):
    gdf = gpd.GeoDataFrame(x, geometry=gpd.points_from_xy(x[lon],x[lat]), crs="EPSG:4326")
    # gdf.drop(columns=[lat,lon], inplace=True)
    return gdf


def fetchConvexHull(B, proximity=1000):
    global METERS_CRS
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
    where "BLOCK_ID"='{B}'
    """
    holder2 = dbconnect.makeQuery(s5, output='oneValue')
    return holder2


##################
# APIs

@app.get("/API/loadRegion/{BLOCK_ID}", tags=["geospatial"])
def loadRegion(BLOCK_ID: str):
    s1 = f"""select ST_AsGeoJSON(geometry) from block 
    where "BLOCK_ID" = '{BLOCK_ID}'
    """
    res = dbconnect.makeQuery(s1, output='oneValue')

    if not res:
        cf.logmessage(f"No block boundary found for {BLOCK_ID}, fallback to habitations data buffered convex hull")
        res = fetchConvexHull(BLOCK_ID, proximity=1000)
        if not res:
            raise HTTPException(status_code=400, detail="No data")
    try:
        geo = json.loads(res)
    except:
        raise HTTPException(status_code=400, detail="Could not load geo data")
    return geo


@app.get("/API/boundaryGPX/{BLOCK_ID}", tags=["geospatial"])
def boundaryGPX(BLOCK_ID: str):
    # to do: if not already made, create a (simplified!) .GPX file of a region and save it in the gpx static folder for access from OSM editor
    
    if os.path.isfile(os.path.join(gpxFolder,f"{BLOCK_ID}.gpx")):
        return {'created':False }

    s1 = f"""select ST_AsGeoJSON(geometry) from block 
    where "BLOCK_ID" = '{BLOCK_ID}'
    """
    res = dbconnect.makeQuery(s1, output='oneValue')
    if not res:
        cf.logmessage(f"No block boundary found for {BLOCK_ID}, fallback to habitations data buffered convex hull")
        res = fetchConvexHull(BLOCK_ID, proximity=1000)
        if not res:
            raise HTTPException(status_code=400, detail="No data")
    try:
        geo = json.loads(res)
    except:
        raise HTTPException(status_code=400, detail="Could not load geo data")

    bdf1 = gpd.GeoDataFrame({'geometry':[shape(geo).simplify(0.001)]}, crs="EPSG:4326")
    # simplify it also - makes for a much smaller size

    bdf1.boundary.to_file(os.path.join(gpxFolder,f"{BLOCK_ID}.gpx"), 'GPX')
    return {'created':True }

##################

@app.get("/API/blockFromMap/{lat}/{lon}", tags=["geospatial"])
def blockFromMap(lat: float, lon:float):
    # select * from block where ST_Contains(geometry, ST_Point(81.914,26.503,4326))
    s1 = f"""select "BLOCK_ID", "BLOCK_NAME", "DISTRICT_ID", "DISTRICT_NAME", 
    "STATE_ID", "STATE_NAME"
    from block
    where ST_Contains(geometry, ST_Point({lon},{lat},4326))
    """
    regionD = dbconnect.makeQuery(s1, output='oneJson')
    return regionD



#########

class comparison1_payload(BaseModel):
    STATE_ID: str
    BLOCK_ID: str
    proximity: Optional[int] = 1000
    outlier_habitations: Optional[bool] = False
    # shape_buffer: Optional[int] = 1000

@app.post("/API/comparison1", tags=["geospatial"])
def comparison1(r: comparison1_payload ):
    global METERS_CRS
    returnD = {}

    # step 1: fetch boundary
    t1 = time.time()
    boundary1 = loadRegion(r.BLOCK_ID)
    boundsT = shape(boundary1).bounds
    # looks like: (79.686591005, 10.982368874, 79.858169814, 11.193869573) so lon, lat, lon, lat
    
    # not doing: buffering the boundary
    # bdf1 = gpd.GeoDataFrame({'geometry':[shape(boundary1)]}, crs="EPSG:4326")
    # bdf2 = bdf1.to_crs(METERS_CRS).buffer(r.shape_buffer).to_crs(4326)
    # boundsT = bdf2.total_bounds


    # step 2: fetch data from OSM
    t2 = time.time()
    osmHolder = overpass(boundsT[1], boundsT[0], boundsT[3], boundsT[2])
    if not osmHolder.get('num'):
        # no data from OSM? quit here only
        raise HTTPException(status_code=400, detail="No overpass data found")
    odf1 = pd.read_csv(io.BytesIO(osmHolder.get('osm_locations').encode('UTF-8'))).fillna('')
    odf2 = makegpd(odf1, lat='lat',lon='lon')


    # step 3: fetch habitations data
    # do habitations fetch after overpass, to save the trouble in case there's no data from overpass
    t3 = time.time()
    habHolder = habitations(r.STATE_ID, r.BLOCK_ID)
    hdf1 = pd.read_csv(io.BytesIO(habHolder.get('data').encode('UTF-8'))).fillna('')
    hdf2 = makegpd(hdf1)


    # ok NOW start the geospatial work
    t4 = time.time()

    # step 4: clip OSM data down to the boundary
    # https://geopandas.org/en/stable/docs/reference/api/geopandas.GeoSeries.within.html
    # for many-to-one, get target in shapely shape format, not gpd
    odf3 = odf2[odf2.within(shape(boundary1))].copy().reset_index(drop=True)
    if(len(odf3) < len(odf1)): 
        cf.logmessage(f"OSM: {len(odf1)} places to {len(odf3)} after clipping by buffered boundary")
    # check if nothing in odf3 ?
    if not len(odf3):
        returnD['num_OSM_near'] = 0
        returnD['num_OSM_far'] = 0
        return returnD


    # step 5: buffer the habitation data to <proximity> radius
    hdf3 = hdf2.to_crs(METERS_CRS).buffer(r.proximity).to_crs(4326)


    # step 6: turn it to a single blob
    buffer1 = hdf3.unary_union
    # from https://pygis.io/docs/e_buffer_neighbors.html


    # step 7: get the OSM data points that fall within this buffered blob
    odf4 = odf3[odf3.within(buffer1)].copy()
    returnD['num_OSM_near'] = len(odf4)
    if len(odf4):
        odf4['proximity'] = 'near'
        returnD['OSM_near'] = odf4.drop(columns='geometry').to_csv(index=False)


    # step 8: get the OSM data points that fall outside of this buffered blob
    odf5 = odf3[~odf3.within(buffer1)].copy()
    returnD['num_OSM_far'] = len(odf5)
    if len(odf5):
        odf5['proximity'] = 'far'
        returnD['OSM_far'] = odf5.drop(columns='geometry').to_csv(index=False)
    

    t5 = time.time()
    #######
    if r.outlier_habitations:
        # do reverse proximity check: buffer and make a blob of all the OSM places, 
        # then do a within check with Habitations data.
        # find which Habitations are within proximity of OSM places, and which are the outliers.
        odf10 = odf3.to_crs(METERS_CRS).buffer(r.proximity).to_crs(4326)
        buffer2 = odf10.unary_union
        hdf10 = hdf2[hdf2.within(buffer1)].copy()
        returnD['num_Hab_near'] = len(hdf10)
        if len(hdf10):
            returnD['habitations_near'] = hdf10['id'].tolist()

        hdf11 = hdf2[~hdf2.within(buffer1)].copy()
        returnD['num_Hab_far'] = len(hdf11)
        if len(hdf11):
            returnD['habitations_far'] = hdf11['id'].tolist()

    t6 = time.time()

    returnD['time_region_fetch'] = round(t2-t1,3)
    returnD['time_osm_fetch'] = round(t3-t2,3)
    returnD['time_habitations_fetch'] = round(t4-t3,3)
    returnD['time_geospatial1'] = round(t5-t4,3)
    if r.outlier_habitations: returnD['time_geospatial2'] = round(t6-t5,3)
    returnD['time_total'] = round(t6-t1,3)
    
    return returnD


