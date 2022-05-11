# globals.py

from fastapi import HTTPException
import commonfuncs as cf

ipTracker = {}

defaultRateLimit = 5

def logIP(X_Forwarded_For, action, limit=defaultRateLimit):
    global ipTracker
    if not X_Forwarded_For:
        X_Forwarded_For = 'localhost'

    if not ipTracker.get(X_Forwarded_For, False):
        ipTracker[X_Forwarded_For] = {action: cf.getTime()}
        return
    else:
        if not ipTracker[X_Forwarded_For].get(action, False):
            ipTracker[X_Forwarded_For][action] = cf.getTime()
            return
        else:
            # check last usage
            lastHit = ipTracker[X_Forwarded_For][action]
            age = cf.checkAge(lastHit)
            if age <= limit:
                raise HTTPException(status_code=400, detail=f"Rate limited, pls try after {limit} secs")
            else:
                ipTracker[X_Forwarded_For][action] = cf.getTime()
                return
    