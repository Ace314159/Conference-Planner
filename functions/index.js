const functions = require('firebase-functions');


exports.verifyTimeSlot = functions.firestore.document("/Schools/{schoolID}/TimeSlots/{timeSlotID}").onCreate(e => {
	const newTimeSlot = e.data.data();
	const timeSlotsDB = e.data.ref.parent;
	if(newTimeSlot.verified) return;
	let promises = [
		// Check if a time slot with this student teacher pair already exists
		timeSlotsDB.where("student.id", "==", newTimeSlot.student.id).where("teacher.id", "==", newTimeSlot.teacher.id).
		where("verified", "==", true).orderBy("time.start").get().then(querySnapshot => {
			if(querySnapshot.empty) {
				return Promise.resolve(0);
			} else {
				return Promise.reject(new Error(querySnapshot.docs[0].get("timestamp").getTime()));
			}
		}),
		// Check if a student's time slot clashes with the new time slot
		timeSlotsDB.where("student.id", "==", newTimeSlot.student.id).
		where("verified", "==", true).orderBy("time.start").get().then(querySnapshot => {
			let errorCode;
			querySnapshot.forEach(doc => {
				let startTime = doc.data().time.start.getTime();
				let endTime = startTime + doc.data().time.length.getTime();
				if(startTime <= newTimeSlot.time.start && endTime >= newTimeSlot.time.start || 
				   startTime >= newTimeSlot.time.start && startTime <= newTimeSlot.time.start + newTimeSlot.time.length) {
					errorCode = doc.get("timestamp").getTime();
				}
			});
			if(errorCode === undefined) return Promise.resolve(0);
			return Promise.reject(new Error(errorCode));
		}),
		// Check if a teacher's time slot clashes with the new time slot
		timeSlotsDB.where("teacher.id", "==", newTimeSlot.teacher.id).
		where("verified", "==", true).orderBy("time.start").get().then(querySnapshot => {
			let errorCode;
			querySnapshot.forEach(doc => {
				let startTime = doc.data().time.start.getTime();
				let endTime = startTime + doc.data().time.length.getTime();
				if(startTime <= newTimeSlot.time.start && endTime >= newTimeSlot.time.start || 
				   startTime >= newTimeSlot.time.start && startTime <= newTimeSlot.time.start + newTimeSlot.time.length) {
					errorCode = doc.get("timestamp").getTime();
				}
			});
			if(errorCode === undefined) return Promise.resolve(0);
			return Promise.reject(new Error(errorCode));
		}),
	];
	return Promise.all(promises).then(data => {
		return e.data.ref.update({"verified": true});
	}).catch(error => {
		if(newTimeSlot.timestamp.getTime() < parseInt(error.message)) {
			return e.data.ref.update({"verified": true});
		} else {
			return e.data.ref.delete();
		}
	});
});
