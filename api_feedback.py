# api_feedback

import os, time, json, requests
from typing import Optional, List
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi import HTTPException, Header, Path
import pandas as pd

from geosadak_api_launch import app
import commonfuncs as cf
import dbconnect
from globalvars import logIP, ipTracker


#########
# FUNCTIONS

##################
# APIs

@app.get("/API/registerSession", tags=["feedback"])
def registerSession(X_Forwarded_For: Optional[str] = Header(None) ):
    logIP(X_Forwarded_For,'registerSession', limit=60)
    return {'sessionId': cf.makeUID(10)}


class feedback1_payload(BaseModel):
    ref_id: str
    category: str
    STATE_ID: str
    DISTRICT_ID: str
    BLOCK_ID: str
    feedback1_submitter_name: str
    feedback1_submitter_phone: str
    feedback1_submitter_email: str
    feedback1_changeName: Optional[str] = None
    feedback1_changePopulation: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    feedback1_comments: Optional[str] = None
    


@app.post("/API/feedback1", tags=["feedback"])
def feedback1(req: feedback1_payload, X_Forwarded_For: Optional[str] = Header(None)):
    logIP(X_Forwarded_For,'feedback1', limit=60)

    cf.logmessage("feedback1 POST API call")
    if not X_Forwarded_For: X_Forwarded_For = 'localhost'
    print(req)

    iCols = []
    iVals = []

    uid = cf.makeUID(6)
    iCols.append('uid')
    iVals.append(f"'{uid}'")    

    iCols.append('ref_id')
    iVals.append(f"'{req.ref_id}'")

    iCols.append('category')
    iVals.append(f"'{req.category}'")

    iCols.append('ip')
    iVals.append(f"'{X_Forwarded_For}'")

    iCols.append('name')
    iVals.append(f"'{req.feedback1_submitter_name}'")

    iCols.append('phone')
    iVals.append(f"'{req.feedback1_submitter_phone}'")

    iCols.append('email')
    iVals.append(f"'{req.feedback1_submitter_email}'")

    iCols.append('state_id')
    iVals.append(f"'{req.STATE_ID}'")

    iCols.append('district_id')
    iVals.append(f"'{req.DISTRICT_ID}'")

    iCols.append('block_id')
    iVals.append(f"'{req.BLOCK_ID}'")

    iCols.append('ts')
    iVals.append(f"CURRENT_TIMESTAMP")

    if req.feedback1_comments:
        iCols.append('comments')
        iVals.append(f"'{req.feedback1_comments}'")
    
    if req.feedback1_changeName:
        iCols.append('name_change')
        iVals.append(f"'{req.feedback1_changeName}'")
    
    if req.feedback1_changePopulation:
        iCols.append('pop_change')
        iVals.append(f"{req.feedback1_changePopulation}")
    
    if req.lat and req.lon:
        iCols.append('geometry')
        iVals.append(f"ST_GeomFromText('POINT({req.lon} {req.lat})',4326)")

    i1 = f"""insert into feedback ({','.join(iCols)} ) values 
    ({','.join(iVals)})
    """
    print(i1)
    dbconnect.execSQL(i1)

    return {'status':'ok'}


@app.get("/API/ipcheck", tags=["feedback"])
def ipcheck():
    print(ipTracker)
    return ipTracker


########

class feedback2_payload(BaseModel):
    ref_id: str
    category: str
    STATE_ID: str
    DISTRICT_ID: str
    BLOCK_ID: str
    feedback2_submitter_name: str
    feedback2_submitter_phone: str
    feedback2_submitter_email: str
    feedback2_name: Optional[str] = None
    feedback2_population: Optional[int] = None
    feedback2_comments: Optional[str] = None
    


@app.post("/API/feedback2", tags=["feedback"])
def feedback2(req: feedback2_payload, X_Forwarded_For: Optional[str] = Header(None)):
    logIP(X_Forwarded_For,'feedback2', limit=60)

    cf.logmessage("feedback2 POST API call")
    if not X_Forwarded_For: X_Forwarded_For = 'localhost'
    print(req)

    iCols = []
    iVals = []

    uid = cf.makeUID(6)
    iCols.append('uid')
    iVals.append(f"'{uid}'")    

    iCols.append('ref_id')
    iVals.append(f"'{req.ref_id}'")

    iCols.append('category')
    iVals.append(f"'{req.category}'")

    iCols.append('ip')
    iVals.append(f"'{X_Forwarded_For}'")

    iCols.append('name')
    iVals.append(f"'{req.feedback2_submitter_name}'")

    iCols.append('phone')
    iVals.append(f"'{req.feedback2_submitter_phone}'")

    iCols.append('email')
    iVals.append(f"'{req.feedback2_submitter_email}'")

    iCols.append('state_id')
    iVals.append(f"'{req.STATE_ID}'")

    iCols.append('district_id')
    iVals.append(f"'{req.DISTRICT_ID}'")

    iCols.append('block_id')
    iVals.append(f"'{req.BLOCK_ID}'")

    iCols.append('ts')
    iVals.append(f"CURRENT_TIMESTAMP")

    if req.feedback2_comments:
        iCols.append('comments')
        iVals.append(f"'{req.feedback2_comments}'")
    
    if req.feedback2_name:
        iCols.append('name_change')
        iVals.append(f"'{req.feedback2_name}'")
    
    if req.feedback2_population:
        iCols.append('pop_change')
        iVals.append(f"{req.feedback2_population}")
    
    i1 = f"""insert into feedback ({','.join(iCols)} ) values 
    ({','.join(iVals)})
    """
    print(i1)
    dbconnect.execSQL(i1)

    return {'status':'ok'}

