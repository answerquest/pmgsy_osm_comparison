# api_habitations

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

@app.get("/API/habitations", tags=["habitations"])
def habitations(STATE_ID: str, BLOCK_ID: str, DISTRICT_ID: Optional[str]=None):
    
    whereParams = []
    whereParams.append(f""" "STATE_ID" = '{STATE_ID}' """)

    if DISTRICT_ID:
        whereParams.append(f""" "DISTRICT_I" = '{DISTRICT_ID}' """)

    whereParams.append(f""" "BLOCK_ID" = '{BLOCK_ID}' """)

    s1 = f"""select id, "HAB_ID", "STATE_ID", "DISTRICT_I","BLOCK_ID", "HAB_NAME", "TOT_POPULA",
    ST_Y(geometry) as latitude, 
    ST_X(geometry) as longitude
    from habitation
    where {' AND '.join(whereParams)}
    order by "HAB_NAME"
    """
    df1 = dbconnect.makeQuery(s1, output='df', keepCols=True)
    df1['latitude'] = df1['latitude'].apply(lambda x: round(x,5))
    df1['longitude'] = df1['longitude'].apply(lambda x: round(x,5))

    returnD = {'data': df1.to_csv(index=False)}
    return returnD

