const functions = require('firebase-functions');


exports.verifyTimeSlot = functions.firestore.document("/Schools/{schoolID}/TimeSlots/{timeSlotID}").onCreate(doc => {
	const newTimeSlot = doc.data();
	const timeSlotsDB = doc.ref.parent;
	if(newTimeSlot.verified) return;
	let promises = [
		// Check if a time slot with this student teacher pair already exists
		timeSlotsDB.where("student.id", "==", newTimeSlot.student.id).where("teacher.id", "==", newTimeSlot.teacher.id).
		where("verified", "==", true).orderBy("time.start").get().then(querySnapshot => {
			if(querySnapshot.empty) {
				return Promise.resolve(0);
			} else {
				return Promise.reject(new Error(querySnapshot.docs[0].get("timestamp").toMillis()));
			}
		}),
		// Check if a student's time slot clashes with the new time slot
		timeSlotsDB.where("student.id", "==", newTimeSlot.student.id).
		where("verified", "==", true).orderBy("time.start").get().then(querySnapshot => {
			let errorCode;
			querySnapshot.forEach(doc => {
				let startTime = doc.data().time.start.toMillis();
				let endTime = startTime + doc.data().time.length.toMillis();
				if(startTime <= newTimeSlot.time.start && endTime >= newTimeSlot.time.start || 
				   startTime >= newTimeSlot.time.start && startTime <= newTimeSlot.time.start + newTimeSlot.time.length) {
					errorCode = doc.get("timestamp").toMillis();
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
				let startTime = doc.data().time.start.toMillis();
				let endTime = startTime + doc.data().time.length.toMillis();
				if(startTime <= newTimeSlot.time.start && endTime >= newTimeSlot.time.start || 
				   startTime >= newTimeSlot.time.start && startTime <= newTimeSlot.time.start + newTimeSlot.time.length) {
					errorCode = doc.get("timestamp").toMillis();
				}
			});
			if(errorCode === undefined) return Promise.resolve(0);
			return Promise.reject(new Error(errorCode));
		}),
	];
	return Promise.all(promises).then(data => {
		return doc.ref.update({"verified": true});
	}).catch(error => {
		if(newTimeSlot.timestamp.toMillis() < parseInt(error.message)) {
			return doc.ref.update({"verified": true});
		} else {
			return doc.ref.delete();
		}
	});
});
