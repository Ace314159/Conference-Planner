import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

import datetime
import matplotlib.pyplot as plt


schoolsID = "Schools"
timeSlotsID = "TimeSlots"
school = "ISH"

# Use the service account
cred = credentials.Certificate('firebase_admin_service_account.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

schoolRef = db.collection(schoolsID).document(school)
timeSlotsRef = schoolRef.collection(timeSlotsID)

timeSlots = timeSlotsRef.order_by("timestamp", direction=firestore.Query.ASCENDING).get()
times = []
amounts = []
for amount, timeSlot in enumerate(timeSlots):
	times.append(timeSlot.to_dict()["timestamp"])
	amounts.append(amount)

plt.plot(times, amounts)
plt.xlabel("Time Booked")
plt.ylabel("Number of Bookings")
plt.show()
