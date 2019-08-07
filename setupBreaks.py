import sys
import json
from datetime import datetime

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

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
allTeacherIDs = dict.fromkeys(teacherIDs, 0)

schoolRefData = schoolRef.get().to_dict()
schoolRefData[breaksStartID] = {}
schoolRefData[breaksEndID] = {}
schoolRefData[breaksGroupsID] = {}

with open("breaks.json", "r") as f:
	breaksData = json.load(f)

print("Teachers who need to sign in:")
for i, group in enumerate(breaksData):
	schoolRefData[breaksStartID][str(i)] = [datetime.strptime(start + " +0530", "%m/%d/%y %H:%M %z") for start in group["breakStarts"]]
	schoolRefData[breaksEndID][str(i)] = [datetime.strptime(end + " +0530", "%m/%d/%y %H:%M %z") for end in group["breakEnds"]]
	for teacherID in group["teachers"]:
		if teacherID in teacherIDs:
			schoolRefData[breaksGroupsID][str(teacherIDs[teacherID])] = i
			allTeacherIDs[teacherID] += 1
		else:
			print(teacherID)
print()
print("Teachers who are not in breaks:")
for teacherName, num in allTeacherIDs.items():
	if num <= 0:
		print(teacherName)

schoolRef.set(schoolRefData)
