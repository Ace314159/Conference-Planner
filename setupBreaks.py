import sys
import json
from datetime import datetime

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth

schoolsID = "Schools"
teachersID = "Teachers"
breaksStartID = "breaksStart"
breaksEndID = "breaksEnd"
breaksGroupsID = "breaksGroups"

if len(sys.argv) != 2:
	sys.argv.append("ISH")
	# raise ValueError("Need to specify school as first argument")
school = sys.argv[1]

# Use the service account
cred = credentials.Certificate('firebase_admin_service_account.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

schoolRef = db.collection(schoolsID).document(school)
teachersRef = schoolRef.collection(teachersID)

teacherIDs = {teacher.to_dict()["email"]: teacher.id for teacher in teachersRef.get()}

schoolRefData = schoolRef.get().to_dict()
schoolRefData = {}
schoolRefData[breaksStartID] = {}
schoolRefData[breaksEndID] = {}
schoolRefData[breaksGroupsID] = {}

with open("breaks.json", "r") as f:
	breaksData = json.load(f)

for i, group in enumerate(breaksData):
	schoolRefData[breaksStartID][str(i)] = [datetime.strptime(start, "%m/%d/%y %H:%M") for start in group["breakStarts"]]
	schoolRefData[breaksEndID][str(i)] = [datetime.strptime(end, "%m/%d/%y %H:%M") for end in group["breakEnds"]]
	for teacherID in group["teachers"]:
		if teacherID in teacherIDs:
			schoolRefData[breaksGroupsID][str(teacherIDs[teacherID])] = i
		else:
			print(teacherID)

schoolRef.set(schoolRefData)
