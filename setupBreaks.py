import sys

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

schoolsID = "Schools"
teachersID = "Teachers"
breaksStartID = "breaksStart"
breaksEndID = "breaksStart"

if len(sys.argv) != 2:
    raise ValueError("Need to specify school as first argument")
school = sys.argv[1]

# Use the service account
cred = credentials.Certificate('teacher_breaks_account.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

schoolRef = db.collection(schoolsID).document(school)
teachersRef = schoolRef.collection(teachersID)
schoolRefData = schoolRef.get().to_dict()
numGroups = len(schoolRefData[breaksStartID])

# Create the groups
teachers = list(teachersRef.get())
groups = {}
teachersLen = len(teachers)
groupLen = teachersLen // numGroups
rem = teachersLen % numGroups

i = 0
count = 0
while i < teachersLen:
    if count < rem:
        selected = teachers[i:i + groupLen + 1]
        i += 1
    else:
        selected = teachers[i:i + groupLen]
    i += groupLen
    for teacher in selected:
        groups[teacher.id] = count
    count += 1

# Add the groups to the database
schoolRefData["breaksGroups"] = groups
schoolRef.set(schoolRefData)
