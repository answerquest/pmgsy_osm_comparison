# api_users

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


class authenticate_payload(BaseModel):
    code: str

@app.post("/API/authenticate", tags=["users"])
def feedback1(req: authenticate_payload, X_Forwarded_For: Optional[str] = Header(None)):
    cf.logmessage("authenticate POST API call")

    # req.code
    # make api call to OSM to authenticate, using the client secret etc
    # get the access token
    # make another api call to OSM to fetch the userid and username
    # check and add/update DB entries
    # return to frontend the username and access_token

    return {'status':'ok'}

