# geosadak_api_launch.py
# 3 March 2022 by Nikhil VJ, https://nikhilvj.co.in

from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # https://fastapi.tiangolo.com/tutorial/cors/
from fastapi.staticfiles import StaticFiles # static html files deploying
from brotli_asgi import BrotliMiddleware # https://github.com/fullonic/brotli-asgi

app = FastAPI()

# allow cors - from https://fastapi.tiangolo.com/tutorial/cors/
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# enable Brotli compression. Better for json payloads, supported by most browsers. Fallback to gzip by default. from https://github.com/fullonic/brotli-asgi
app.add_middleware(BrotliMiddleware)

# can add modules having api calls below

# import api_sample
import api_regions
import api_habitations
import api_overpass
import api_geospatial
import api_feedback

# https://fastapi.tiangolo.com/tutorial/static-files/
app.mount("/gpx", StaticFiles(directory="gpx", html = False), name="static2")


# html=True is needed for defaulting to index.html. From https://stackoverflow.com/a/63805506/4355695
app.mount("/", StaticFiles(directory="html", html = True), name="static")
