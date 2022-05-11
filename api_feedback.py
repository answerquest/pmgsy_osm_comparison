# api_feedback

import os, time, json
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
    habitation_uid: str
    category: str
    content: str
    submitter_name: str
    submitter_email: str
    submitter_phone: str
    lat: Optional[float] = None
    lon: Optional[float] = None

@app.post("/API/feedback1", tags=["feedback"])
def feedback1(req: feedback1_payload ):
    logIP(X_Forwarded_For,'feedback1', limit=60)

    cf.logmessage("feedback1 POST API call")

    return {}


@app.get("/API/ipcheck", tags=["feedback"])
def ipcheck():
    print(ipTracker)
    return ipTracker
