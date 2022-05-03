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



#########

# # powerful but not really useful - instead breaking down by state, district

# @app.get("/API/regionsList", tags=["regions"])
# def regionsList():
#     s1 = f"""select "BLOCK_ID", "BLOCK_NAME", 
#     "DISTRICT_ID", "DISTRICT_NAME", 
#     "STATE_ID", "STATE_NAME"
#     from block
#     order by "STATE_NAME", "DISTRICT_NAME", "BLOCK_NAME"
#     """
#     df1 = dbconnect.makeQuery(s1, output='df')

#     states = df1[['STATE_ID','STATE_NAME']].copy().drop_duplicates()
#     districts = df1[['STATE_ID','DISTRICT_ID','DISTRICT_NAME']].copy().drop_duplicates()

#     # returnD = {
#     #     'states': states.to_csv(orient='records'),
#     #     'districts': states.to_dict(orient='records'),
#     #     'blocks': df1.to_dict(orient='records')
#     # }

#     returnD = {
#         'states': states.to_csv(index=False),
#         'districts': districts.to_csv(index=False),
#         'blocks': df1.to_csv(index=False)
#     }
#     return returnD

############

@app.get("/API/statesList", tags=["regions"])
def statesList():
    s1 = f"""select distinct "STATE_ID", "STATE_NAME"
    from block order by "STATE_NAME"
    """
    arr1 = dbconnect.makeQuery(s1, output='list')
    return {'states': arr1}


############

@app.get("/API/districtsList/{STATE_ID}", tags=["regions"])
def districtsList(STATE_ID: str):
    s1 = f"""select distinct "DISTRICT_ID", "DISTRICT_NAME" 
    from block 
    where "STATE_ID" = '{STATE_ID}'
    order by "DISTRICT_NAME"
    """
    arr1 = dbconnect.makeQuery(s1, output='list')
    return {'districts': arr1}


############

@app.get("/API/blocksList", tags=["regions"])
def districtsList(STATE_ID: str, DISTRICT_ID: Optional[str]=None):
    # list all blocks - by state and optionally by district also
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


