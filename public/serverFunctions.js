// Firestore DB Names
const schoolsID = "Schools";
const timeSlotsID = "TimeSlots";
// Important Constants
var school;
var domains = undefined;
var domainsBySchool = {};
var searchablesIDs;
var userType;
var searchableType;
const userTypeEnum = Object.freeze({"Student": "Student", "Teacher": "Teacher", "Admin": "Admin"});
const config = {
    apiKey: "AIzaSyBEMMPQRdApq7b8YwpAEwwtqmYO8C2aJKY",
    authDomain: "conference-planner-1.firebaseapp.com",
    databaseURL: "https://conference-planner-1.firebaseio.com",
    projectId: "conference-planner-1"//,
    //storageBucket: "conference-planner-1.appspot.com",
    //messagingSenderId: "684750547135"
};
var loaded = 0; // Changed again in onSignIn
var fullyLoaded = 1; // Changed again in onSignIn
//var serverURL = "http://localhost:8000";
// Firebase Stuff
firebase.initializeApp(config);
var db = firebase.firestore();
var schoolDB;
var timeSlotsDB;
var timeSlotsDBUnsubscribe;
var userDB;
var searchablesDB;
var searchablesTimeSlotsUnsubscribe;
getDomains();

// Ensures that everything is done loading before making website usable
function doneLoading() {
	if(++loaded === fullyLoaded) {
		$("body").removeClass("loading");
		$('#container').jtable('load', undefined, function() {
        	$("body").removeClass("loading");
    	});
	} else if(loaded > fullyLoaded) {
		console.log("More than " + fullyLoaded + " loaded!");
	}
}

// Auth Stuff
function renderGButton() {
	if(domains !== undefined) {
		gapi.signin2.render("login", {
	        "scope": "profile email",
	        "onsuccess": onSignIn
  		});
  		doneLoading();
	}
}

function signInServer(googleUser) {
	var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
	    unsubscribe();
	    if (!isUserEqual(googleUser, firebaseUser)) { // Check if user is already signed into firebase
	        var credential = firebase.auth.GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
	        firebase.auth().signInWithCredential(credential).then(function() {
				onSignInServer(googleUser);
	        }, function(error) {
	      	    signOut();
	      	    createDialog(error.code, error.message, "ui-icon-alert");
	        });
	    } else {
			onSignInServer(googleUser);
		}
  	});
}

function onSignInServer(googleUser) {
	// Sets Firestore DBs - Value of userTypeEnum (userType) used as it is plural
	schoolDB = db.collection(schoolsID).doc(school);
	timeSlotsDB = schoolDB.collection(timeSlotsID);
	searchablesDB = schoolDB.collection(searchableType + "s");
	if(userType == userTypeEnum.Admin) {
		searchablesDB = schoolDB.collection("Teachers");
		// Get Teacher Names
		$("body").addClass("loading");
		searchablesDB.get().then(function(querySnapshot) {
			searchables = [];
			searchablesIDs = [];
			querySnapshot.forEach(function(doc) {
				searchables.push(doc.data().name);
				searchablesIDs.push(doc.id);
			});
			initSearch(searchables);
			$("#myL").hide();
			$("body").removeClass("loading");
		});
	} else {
		$("#myL").show();
		userDB = schoolDB.collection(userType + "s").doc(googleUser.getId());

		// Add User to Firebase DB
		userDB.set({
			name: googleUser.getBasicProfile().getName(),
			ref: userDB
		});

		// Get Searchables
		$("body").addClass("loading");
		searchablesDB.get().then(function(querySnapshot) {
			searchables = [];
			searchablesIDs = [];
			querySnapshot.forEach(function(doc) {
				searchables.push(doc.data().name);
				searchablesIDs.push(doc.id);
			});
			initSearch(searchables);
			$("body").removeClass("loading");
		});

		// Set Listener for myTimeSlots
		timeSlotsDB.where(userType.toLowerCase() + ".id", "==", googleUser.getId())
		.where("verified", "==", true).orderBy("time.start").onSnapshot(function(querySnapshot) {
			$("body").addClass("loading");
			myTimeSlots = [];
			querySnapshot.forEach(function(doc) {
				myTimeSlots.push(doc.data());
			});
			$(containerID).jtable("reload");
			$("body").removeClass("loading");
			if(loaded > fullyLoaded) {
				console.log(10);
				doneLoading();
			}
		}, function(err) {
			
		});
		timeSlotsDBUnsubscribe = timeSlotsDB.where(userType.toLowerCase() + ".id", "==", googleUser.getId()).
		where("verified", "==", true).orderBy("time.start").onSnapshot(function() {});
	}

	// Get listMetadata
	schoolDB.get().then(function(doc) {
		listMetadata = doc.data();
		doneLoading();
	});
}

function isUserEqual(googleUser, firebaseUser) {
  if (firebaseUser) {
    var providerData = firebaseUser.providerData;
    for(var i = 0; i < providerData.length; i++) {
      if(providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()) {
        return true;
      }
    }
  }
  return false;
}

function signOutServer() {
	school = "";
	schoolDB = undefined;
	userDB = undefined;
	searchables = [];

	// Detach listener for myTimeSlots
	if(timeSlotsDBUnsubscribe !== undefined) timeSlotsDBUnsubscribe();
	cleanSearchableTimeSlots();
	// Reset data
	listMetadata = undefined;
	myTimeSlots = undefined;
	searchablesTimeSlots = undefined;
	firebase.auth().signOut();
}


// DB Stuff
function getDomains() {
	db.collection("Misc").doc("EmailDomains").get().then(function(doc) {
		domains = doc.data();
		domainsBySchool = {};
		for(var domain in domains) {
			if(domains.hasOwnProperty(domain)) {
				var data = domains[domain];
				domainsBySchool[data[0]] = {};
				domainsBySchool[data[0]][data[1]] = domain;
			}
		}
		if(gapi) {
			renderGButton();
		}
	});
}

function checkDomain(emailAddress, domain) {
	if(domains === undefined) {
        createDialog("Still Loading!", "We are still loading! Please try again.", "ui-icon-alert");
	} else {
		school = domains[domain][0];
		if(domains[school].indexOf(emailAddress) > -1) {
			userType = userTypeEnum.Admin
			searchableType = userTypeEnum.Teacher;
			$("body").removeClass("loading");
			return true;
		} else if(domain in domains) {
			userType = userTypeEnum[domains[domain][1]];
			if(userType === userTypeEnum.Student) {
				searchableType = userTypeEnum.Teacher;
			} else if(userType === userTypeEnum.Teacher) {
				searchableType = userTypeEnum.Student;
				// Replace all instances of Teacher with Student
				$("#search").attr("placeholder", $("#search").attr("placeholder").replace(/Teacher/g, "Student"));
			}
			$(containerID).jtable('option', 'title', "Student");
			$("body").removeClass("loading");
			return true;
		} else {
			$("body").removeClass("loading");
			return false;
		}
	}
}

function initSearchableTimeSlots() {
	$("body").addClass("loading");
	cleanSearchableTimeSlots();
	if(curSearchableName === "") {
		return;
	}
	curSearchableID = searchablesIDs[searchables.indexOf(curSearchableName)];
	timeSlotsDB.where(searchableType.toLowerCase() + ".id", "==", curSearchableID)
	.where("verified", "==", true).orderBy("time.start").onSnapshot(function(querySnapshot) {
		searchablesTimeSlots = [];
		querySnapshot.forEach(function(doc) {
			searchablesTimeSlots.push(doc.data());
		});
		listRecords = undefined;
		$(containerID).jtable("reload");
	});
	searchablesTimeSlotsUnsubscribe = timeSlotsDB.where(searchableType.toLowerCase() + ".id", "==", curSearchableID)
	.where("verified", "==", true).orderBy("time.start").onSnapshot(function() {});
}

function cleanSearchableTimeSlots() {
	searchablesTimeSlots = undefined;
	listRecords = undefined;
	if(searchablesTimeSlotsUnsubscribe !== undefined) {
		searchablesTimeSlotsUnsubscribe();
	}
}

function selectServer(timeSlotData) {
	return timeSlotsDB.add(timeSlotData);
}

function deleteServer(timeSlotData) {
	return timeSlotsDB.where("student.name", "==", timeSlotData.studentName).where("teacher.name", "==", timeSlotData.teacherName)
	.where("time.start", "==", timeSlotData.timeStart).where("time.length", "==", timeSlotData.timeLength).get().then(function(querySnapshot) {
		if(querySnapshot.empty || querySnapshot.size > 1) {
			return Promise.reject("Could not delete!");
		} else {
			return querySnapshot.docs[0].ref.delete();
		}
	});
}
