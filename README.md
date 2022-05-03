# PMGSY Data <> OSM comparison app

Live website: https://server.nikhilvj.co.in/pmgsy/  
OpenAPI doc: https://server.nikhilvj.co.in/pmgsy/docs  

This app (a backend + a webpage frontend) aims to bridge gaps between PMGSY data release and OpenStreetMap data by displaying both in one place and showing differences between them.


## Phase 1
- Starting with Habitations data
- A read-only interface for now where user can select the block and data within that block is fetched
- Data is displayed in both map and table form, with interaction between the two
- Doing distance comparison and highlighting the OSM rural places that are far away from PMGSY Habitations
- Choose a block either by using dropdowns, or right-click / press-hold on the map and load the block at that lat-long.


## Notes / Caveats:
- A "far away" place at the border might be near to a habitation on the other side of the border in an adjoining block. So, judge at your own discretion
- Thick black border on the map is India int'l boundary as per shapefile shared on https://surveyofindia.gov.in/pages/outline-maps-of-india . Precision of the same is lesser at higher zooms, but it's official so going with it. If you want it fixed, pls go get it fixed at the mentioned official govt website first.


## Tech stack
- Python FastApi framework used to make the backend and serve the static frontend
- Vanilla HTML/JS for frontend
- Database on PostGreSQL, deployed via docker
- Geopandas / shapely python libs used for various geospatial functions
- Hosted on a SSDNodes server


## Credits
Created in April 2022 by Nikhil VJ (answerquest), Kaisyn Consultancy and Training Pvt Ltd.  

Using data from [PMGSY Open Data Release](https://geosadak-pmgsy.nic.in/opendata),  
Collected at https://github.com/datameet/pmgsy-geosadak,  
And imported into a PostGreSQL DB as per this script https://github.com/answerquest/import_geosadak made by me earlier.  

If you would like to support such projects, consider making a one-contribution on:
**UPI: 9766692835@okbizaxis**

