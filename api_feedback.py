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


#########
# FUNCTIONS

##################
# APIs

@app.get("/API/registerSession", tags=["feedback"])
def registerSession():
	return cf.makeUID(10)


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
	cf.logmessage("feedback1 POST API call")

	return {}