# api_regions.py

import os, time, json
from typing import Optional, List
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi import HTTPException, Header, Path
import pandas as pd

from geosadak_api_launch import app
import commonfuncs as cf
import dbconnect
from globalvars import logIP


############

@app.get("/API/statesList", tags=["regions"])
def statesList(X_Forwarded_For: Optional[str] = Header(None)):
    logIP(X_Forwarded_For, 'statesList', limit=3)

    s1 = f"""select distinct "STATE_ID", "STATE_NAME"
    from block order by "STATE_NAME"
    """
    arr1 = dbconnect.makeQuery(s1, output='list')
    return { 'states': arr1 }


############

@app.get("/API/districtsList/{STATE_ID}", tags=["regions"])
def districtsList(STATE_ID: str, X_Forwarded_For: Optional[str] = Header(None) ):
    logIP(X_Forwarded_For, 'districtsList', limit=3)

    s1 = f"""select distinct "DISTRICT_ID", "DISTRICT_NAME" 
    from block 
    where "STATE_ID" = '{STATE_ID}'
    order by "DISTRICT_NAME"
    """
    arr1 = dbconnect.makeQuery(s1, output='list')
    return {'districts': arr1}


############

@app.get("/API/blocksList", tags=["regions"])
def districtsList(STATE_ID: str, DISTRICT_ID: Optional[str]=None, X_Forwarded_For: Optional[str] = Header(None)):
    # list all blocks - by state and optionally by district also

    logIP(X_Forwarded_For, 'blocksList', limit=3)

    whereParams = []
    whereParams.append(f""" "STATE_ID" = '{STATE_ID}' """)
    orderParams = f""" "DISTRICT_NAME","BLOCK_NAME" """
    
    if DISTRICT_ID: 
        whereParams.append(f""" "DISTRICT_ID" = '{DISTRICT_ID}' """)
        orderParams = f""" "BLOCK_NAME" """
    
    s1 = f"""select "DISTRICT_ID", "DISTRICT_NAME", "BLOCK_ID", "BLOCK_NAME"
    from block 
    where {' AND '.join(whereParams)}
    order by {orderParams}
    """
    arr1 = dbconnect.makeQuery(s1, output='list')
    return {'blocks': arr1}

############


