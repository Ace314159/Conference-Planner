import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

import datetime


class TimeSlot(object):
	def __init__(self, student, teacher, time, timestamp, verified):
		self.student = student
		self.teacher = teacher
		self.time = time
		self.timestamp = timestamp
		self.verified = verified

	@staticmethod
	def from_dict(source):
		return TimeSlot(source["student"], source["teacher"], source["time"], source["timestamp"], source["verified"])

	def to_dict(self):
		return {
			"student": self.student,
			"teacher": self.teacher,
			"time": self.time,
			"timestamp": self.timestamp,
			"verified": self.verified
		}

	def __repr__(self):
		tzDiff = datetime.timedelta(hours=5, minutes=30)
		return "{} signed up for {} from {} for {} min at {} - {}".format(self.student["name"], self.teacher["name"],
			(self.time["start"] + tzDiff).strftime("%m/%d/%y %I:%M %p"), self.time["length"].timestamp() // 60,
			(self.timestamp + tzDiff).strftime("%m/%d/%y %I:%M %p"), "verified" if self.verified else "not verified")


schoolsID = "Schools"
timeSlotsID = "TimeSlots"
school = "ISH"

# Use the service account
cred = credentials.Certificate('firebase_admin_service_account.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

schoolRef = db.collection(schoolsID).document(school)
timeSlotsRef = schoolRef.collection(timeSlotsID)

timeSlots = timeSlotsRef.where("teacher.name", "==", "David Schalm").get()
for timeSlot in timeSlots:
	print(TimeSlot.from_dict(timeSlot.to_dict()))
