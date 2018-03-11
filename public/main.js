var name = "";
var user = undefined;
var first = undefined;
var selected = false;
var curSearchableName = "";
var curSearchableID;
var prevSearchableName = "";
var searchables;
var myTimeSlots;
var searchablesTimeSlots;
var listMetadata;
var listRecords;
var selecting = false;
const containerID = "#container";
// Constants for listMetadata
const listTimesStart = "timesStart";
const listTimesEnd = "timesEnd";
const listBreaksGroups = "breaksGroups";
const listBreaksStart = "breaksStart";
const listBreaksEnd = "breaksEnd";
const listIntervals = "intervals";
// Constants for jTable data
const dataSearchable = "Searchable";
const dataStartTime = "StartTime";
const dataEndTime = "EndTime";
const dataTimeLength = "TimeLength"; // Used for my
const dataTimeLengths = "TimeLengths"; // Used elsewhere
// Constants for jTable Column ids
const endingSep = "---";
const endingSTime = "stime";
const endingETime = "etime";
const endingLength = "length";
const endingButton = "button";
const endingSearchable = "searchable";

$(document).ready(function() {
    $("body").addClass("loading");
    $("#login").css("left", $(window).width() - 145);
    gapi.load('auth2', initGapi);
    $(containerID).jtable({
        title: 'Conferences',
        paging: true,
        pageSize: 100,
        pageSizeChangeArea: false,
        animationsEnabled: false,
        loadingAnimationDelay: 0,
        columnSelectable: false,
        columnResizable: false,
        saveUserPreferences: false,
        recordsLoaded: function() {
            $(".timeSelect").selectmenu({
                change: function(e, ui) {
                    // IDs must all have the same root
                    var etimeID = e.target.id.slice(0, -endingLength.length) + endingETime; // Replaces endingLength with endingETime to create the id
                    var newEndTime = parseInt(e.target.id.slice(0, -endingSep.length - endingLength.length)) + // The slices removes the whole endingLength
                    parseInt(ui.item.value);
                    document.getElementById(etimeID).innerHTML = getTimeString(new Date(newEndTime));
                }
            });
            // Change the first column name to match the searchableType - before it was Teacher as a placeholder
            $(".jtable th:first-child .jtable-column-header-text").html(searchableType);
            if(userType === userTypeEnum.Admin) {
                $(".jtable th:first-child .jtable-column-header-text").html(userTypeEnum.Student);
            }
        },
        messages : {
            noDataAvailable: "Please enter a valid teacher name that you have not already booked a slot with.",
            loadingMessage: "Loading..."
        },
        actions: {
            listAction: list
        },
        fields: {
            Searchable: {
                title: "Teacher",
                width: "20%",
                type: 'text',
                display: function(d) {
                    var data = d.record;
                    var id = data[dataStartTime].getTime() + endingSep + endingSearchable;
                    if(data.hasOwnProperty(dataTimeLength)) {
                        return "<span id='" + id + "'>" + data[dataSearchable]  + "</span>";
                    } else {
                        if(userType === userTypeEnum.Admin) {
                            return "<input id='" + id + "' type='text' placeholder='Student Name' style='width:100%;' />";
                        } else {
                            return curSearchableName;
                        }
                    }
                }
            },
            Time: {
                title: 'Start Time',
                width: '20%',
                type: 'text', // Datetime converted to text
                display: function(d) {
                    var data = d.record;
                    var id = data[dataStartTime].getTime() + endingSep + endingSTime;
                    return "<span id='" + id + "'>" + getTimeString(data[dataStartTime])  + "</span>";
                }
            },
            ETime: {
                title: 'End Time',
                width: '20%',
                type: 'text', // Datetime converted to text
                display: function(d) {
                    var data = d.record;
                    var id = data[dataStartTime].getTime() + endingSep + endingETime;
                    return "<span id='" + id + "'>" + getTimeString(data[dataEndTime])  + "</span>";
                }
            },
            TimeSlotLength: {
                title: 'Time Slot Length',
                width: '20%',
                display: function(d) {
                    var data = d.record;
                    var id = data[dataStartTime].getTime() + endingSep + endingLength;
                    if($("#my").prop("checked") || data.hasOwnProperty(dataTimeLength)) {
                        return "<span id='" + id + "' data-value='" + data[dataTimeLength].getTime() +"'>" + data[dataTimeLength].getTime() / 60000 + " minutes</span>";
                    } else {
                        var out = "<select id='" + id + "' style='width:100%;' class='timeSelect'>"
                        var selected = "selected='selected'>";
                        for(let timeLength in data[dataTimeLengths]) {
                            if(data[dataTimeLengths][timeLength]) {
                                var disabled = "";
                            } else {
                                var disabled = " disabled";
                            }

                            var length = new Date(timeLength).getTime(); // convert it to a date if it already is not
                            out += "<option value='" + length + "'" + disabled + selected + length / 60000 + " minutes</option>";
                            selected = ">";
                        }
                        return out;
                    }
                }
            },
            Other: {
                title: 'Reserve Time Slot',
                width: '20%',
                display: function(d) {
                    var data = d.record;
                    var id = data[dataStartTime].getTime() + endingSep + endingButton;
                    var disabled = "ui-button-disabled ui-state-disabled";
                    if(canSignUp()) disabled = "";
                    if($("#my").prop("checked") || (data.hasOwnProperty(dataTimeLength) && userType === userTypeEnum.Admin)) {
                        return '<button class="ui-button ' +  disabled + '" id="' + id + '"onclick="remove(this.id)">Remove Time slot</button>';
                    } else {
                        return '<button class="ui-button ' +  disabled + '" id="' + id + '"onclick="select(this.id)">Reserve Time Slot</button>';
                    }
                }
            }

        }
    });
    
    // Ensures that first only exists if the autocomplete dropdown exists
    $("#search").on("input", function() {
        if($("#search").val() === "") {
            first = undefined;
        }
    });
    $("#search").on("keypress", function(e) {
        if(e.keyCode === 13 && first !== undefined) {
            $("#search").val(first);
            $("#search").trigger("searchableChanged");
            $("#search").blur();
            selected = true;
            $(containerID).jtable('load');
        }
    });
    $(".ui-checkboxradio").change(function() {
        if($("#my").prop("checked")) {
            $("#search").val("");
            $("#search").trigger("searchableChanged");
            prevSearchableName = "";
        }
        $(containerID).jtable("load");
    });

    // Ensures the searchablesTimeSlots changes
    $("#search").on("searchableChanged", function() {
        curSearchableName = $("#search").val();
        initSearchableTimeSlots();
    });

    // Sets initial states of checkboxes
    $("#avail").checkboxradio();
    $("#my").checkboxradio();
    $("#my").checkboxradio("disable");
});

function initGapi() {
    gapi.auth2.init({
      client_id: "684750547135-o6l6poe6v675tv6nqkbk79nj3fed636a.apps.googleusercontent.com",
      'scope': 'profile email'
    })
    gauth2 = gapi.auth2.getAuthInstance();
    user = gauth2.currentUser.get();
    gauth2.currentUser.listen(userChanged);
}
function userChanged() {
    if(gauth2.isSignedIn.get()) {
        $("#my").checkboxradio("enable");
        user = gauth2.currentUser.get();
        name = user.getBasicProfile().getName();
    } else {
        $("#my").checkboxradio("disable");
        $("#my").prop("checked", false);
        $("#my").checkboxradio("refresh");
    }
    $(containerID).jtable("load");
}

function initSearch(searchables) {
    $("#search").autocomplete({
        source: searchables,
        select: function(e, ui) {
            $("#search").val(ui["item"].value);
            $("#search").trigger("searchableChanged");
            selected = true;
            $(containerID).jtable('load');
        },
        response: function(e, ui) {
            try {
                first = ui["content"][0]["value"];
            } catch(e) {
                // Ensures that first exists only if the autocomplete dropdown exists
                first = undefined;
            }
        }
    });
    doneLoading();
}

function list(postData, jtParams) { // Time slot intervals must be multiple of one another
    var searchOwn = $("#my").prop("checked");
    if((listMetadata === undefined || (myTimeSlots === undefined && userType !== userTypeEnum.Admin) || searchablesTimeSlots === undefined || 
        (postData !== undefined && postData.clear)) &&
        (myTimeSlots === undefined || !searchOwn || (postData !== undefined && postData.clear))) {
        return {"Result": "OK", "Records": [], "TotalRecordCount": 0};
    }
    var curSearchableName = (selected) ? $("#search").val() : prevSearchableName;
    if(curSearchableName === "" && !searchOwn) return {"Result": "OK", "Records": [], "TotalRecordCount": 0};
    prevSearchableName = curSearchableName;
    selected = false;

    if(userType === userTypeEnum.Student) {
        var studentName = name;
        var teacherName = curSearchableName;
    } else if(userType === userTypeEnum.Teacher) {
        var studentName = curSearchableName;
        var teacherName = name;
    } else if(userType === userTypeEnum.Admin) {
        var studentName = "";
        var teacherName = name;
    }
    if(userType !== userTypeEnum.Admin) {
        for(let i = 0 ; i < myTimeSlots.length; i++) {
            if(myTimeSlots[i].student.name === studentName && myTimeSlots[i].teacher.name === teacherName && !searchOwn) {
                $("body").removeClass("loading");
                if(!selecting) {
                    createDialog("Already Reserved!", "You have already reserved a time slot with this " + searchableType.toLowerCase() + ".", "ui-icon-alert");
                }
                $("#search").val("");
                return {"Result": "OK", "Records": [], "TotalRecordCount": 0};   
            }
        }
    }

    if(searchOwn) {
        listRecords = [];
        for(let i = 0; i < myTimeSlots.length; i++) {
            let timeSlot = myTimeSlots[i];
            listRecords.push({
                [dataSearchable]: timeSlot[searchableType.toLowerCase()].name,
                [dataStartTime]: timeSlot.time.start,
                [dataEndTime]: new Date(timeSlot.time.start.getTime() + timeSlot.time["length"].getTime()),
                [dataTimeLength]: timeSlot.time["length"]
            });
        }
    } else if(listRecords === undefined) {
        listRecords = [];
        listMetadata[listIntervals].sort();
        var smallestInterval = listMetadata[listIntervals][0].getTime();
        // Loop through all the possible starting times incrementing by the smalest interval
        for(let i = 0; i < listMetadata[listTimesStart].length; i++) {
            for(let time = listMetadata[listTimesStart][i].getTime(); time < listMetadata[listTimesEnd][i].getTime(); time += smallestInterval) {
                // Create dictionary with possible intervals - they have a value of true, others have a value of false
                var possibleIntervals = {};
                var firstInterval = undefined;
                var invalidInterval = false;
                // Loop through all the intervals and see which one works for the selected starting time
                for(let j = 0; j < listMetadata[listIntervals].length; j++) {
                    var interval = listMetadata[listIntervals][j];
                    if(!invalidInterval) {
                        // Check if the selectd interval intersects with the searchable's already reserved time slots
                        for(let k = 0; k < searchablesTimeSlots.length; k++) {
                            var startTime = searchablesTimeSlots[k].time.start.getTime();
                            var endTime = searchablesTimeSlots[k].time.start.getTime() + searchablesTimeSlots[k].time["length"].getTime();
                            // <= and >= give a buffer of the smallest interval for students
                            if(userType === userTypeEnum.Teacher) { // Searchable is student
                                if(startTime <= time && endTime >= time || startTime >= time && startTime <= time + interval.getTime()) {
                                    invalidInterval = true;
                                    break;
                                }
                            } else {
                                if(startTime === time) {
                                    if(userType === userTypeEnum.Admin && interval.getTime() === smallestInterval) {
                                        listRecords.push({
                                            [dataSearchable]: searchablesTimeSlots[k].student.name,
                                            [dataStartTime]:  searchablesTimeSlots[k].time.start,
                                            [dataEndTime]: new Date(searchablesTimeSlots[k].time.start.getTime() + 
                                                searchablesTimeSlots[k].time["length"].getTime()),
                                            [dataTimeLength]: searchablesTimeSlots[k].time["length"]
                                        });
                                        time += searchablesTimeSlots[k].time["length"].getTime() - smallestInterval;
                                    }
                                    invalidInterval = true;
                                    break;
                                }
                            }
                        }
                    } 
                    if(!invalidInterval) {
                        // Use the correct break group
                        var breaksGroup = listMetadata[listBreaksGroups][curSearchableID];
                        // Check if the selected interval intersects with any of the breaks
                        for(let k = 0; k < listMetadata[listBreaksStart][breaksGroup].length; k++) {
                            var startTime = listMetadata[listBreaksStart][breaksGroup][k].getTime();
                            var endTime = listMetadata[listBreaksEnd][breaksGroup][k].getTime();
                            // <= and >= give a buffer of the smallest interval - makes the last time slot end at breakStart and next one start at 
                            // breakEnd + the smallest interval
                            if(startTime <= time && endTime >= time || startTime > time && startTime < time + interval.getTime()) {
                                invalidInterval = true;
                                break;
                            }
                        }
                    } if(!invalidInterval && userType !== userTypeEnum.Admin) {
                        // Check if the selected interval intersects with my already reserved time slots
                        for(let k = 0; k < myTimeSlots.length; k++) {
                            var myStartTime = myTimeSlots[k].time.start.getTime();
                            var myEndTime = myTimeSlots[k].time.start.getTime() + myTimeSlots[k].time["length"].getTime();
                            // <= and >= give a buffer of the smallest interval for students
                            if(userType === userTypeEnum.Student) {
                                if(myStartTime <= time && myEndTime >= time || myStartTime >= time && myStartTime <= time + interval.getTime()) {
                                    invalidInterval = true;
                                    break;
                                }
                            }
                        }
                    }

                    // Set values in possibleIntervals based on results
                    if(invalidInterval) {
                        possibleIntervals[interval] = false;
                        break;
                    } else {
                        possibleIntervals[interval] = true;
                        if(firstInterval === undefined) {
                            firstInterval = interval;
                        }
                    }
                }
                if(firstInterval === undefined) {
                    continue;
                }

                listRecords.push({
                    [dataSearchable]: curSearchableName,
                    [dataStartTime]: new Date(time),
                    [dataEndTime]: new Date(time + firstInterval.getTime()),
                    [dataTimeLengths]: possibleIntervals
                });
            }
        }
    }

    var sizedListRecords = listRecords.slice(jtParams["jtStartIndex"], jtParams["jtStartIndex"] + jtParams["jtPageSize"]);
    $("body").removeClass("loading");
    return {"Result": "OK", "Records": sizedListRecords, "TotalRecordCount": listRecords.length};
}

function select(id) {
    if(!canSignUp()) return;
    $("body").addClass("loading");
    selecting = true;
    var startTime = parseInt(id.slice(0, -endingSep.length - endingButton.length));
    var length = parseInt(document.getElementById(id.slice(0, -endingButton.length) + endingLength).value);
    var endTime = startTime + length;
    if(userType === userTypeEnum.Student) {
        var studentID = user.getId();
        var studentName = user.getBasicProfile().getName();
        var teacherID = curSearchableID;
        var teacherName = curSearchableName;
    } else if(userType === userTypeEnum.Teacher) {
        var studentID = curSearchableID;
        var studentName = curSearchableName;
        var teacherID = user.getId();
        var teacherName = user.getBasicProfile().getName();
    } else if(userType === userTypeEnum.Admin) {
        var inputText = document.getElementById(id.slice(0, -endingButton.length) + endingSearchable).value;
        var studentID = inputText.toLowerCase();
        var studentName = inputText;
        var teacherID = curSearchableID;
        var teacherName = curSearchableName;
    }
    var timestamp = new Date();
    selectServer({
        "student": {
            "id": studentID,
            "name": studentName
        },
        "teacher": {
            "id": teacherID,
            "name": teacherName
        }, "time": {
            "length": new Date(length),
            "start": new Date(startTime)
        }, "timestamp": timestamp,
           "verified": false
    }).then(function(doc) {
        selecting = false;
        $("#search").val("");
        prevSearchableName = "";
        $(containerID).jtable('load', {clear: true});
        createDialog("Success!", "You have taken this time slot.", "ui-icon-check");
        $("body").removeClass("loading");
    }).catch(function(error) {
        selecting = false;
        createDialog("Unknown Error!", error, "ui-icon-alert");
        $("body").removeClass("loading");
    });
}

function remove(id) {
    if(!canSignUp()) return;
    $("body").addClass("loading");
    var startTime = new Date(parseInt(id.slice(0, -endingSep.length - endingButton.length)));
    var length = new Date(parseInt(document.getElementById(id.slice(0, -endingButton.length) + endingLength).getAttribute("data-value")));
    var searchableName = document.getElementById(id.slice(0, -endingButton.length) + endingSearchable).innerHTML;
    var endTime = new Date(startTime.getTime() + length.getTime());

    if(userType === userTypeEnum.Student) {
        var studentName = user.getBasicProfile().getName();
        var teacherName = searchableName;
    } else if(userType === userTypeEnum.Teacher) {
        var studentName = searchableName;
        var teacherName = user.getBasicProfile().getName();
    } else if(userType === userTypeEnum.Admin) {
        var studentName = searchableName; // Under Student column
        var teacherName = curSearchableName;
    }

    deleteServer({
        studentName: studentName,
        teacherName: teacherName,
        timeStart: startTime,
        timeLength: length
    }).then(function() {
        $("#search").val("");
        prevSearchableName = "";
        $(containerID).jtable('load', {clear: true});
        createDialog("Success!", "The time slot from " + getTimeString(startTime) + " to " + getTimeString(endTime) + 
                     " has been deleted for " + searchableName + ".", "ui-icon-check");
        //$("body").removeClass("loading");
    }).catch(function(error) {
        createDialog("Unknown Error!", error, "ui-icon-alert");
        $("body").removeClass("loading");
    });
}


function onSignIn(googleUser) {
    if(checkDomain(googleUser.getBasicProfile().getEmail(), googleUser.getHostedDomain())) {
        $("body").addClass("loading");
        loaded = 0;
        fullyLoaded = 2;
        $(containerID).jtable('load');
        $("#login").css("display", "none");
        $("#logout").css("display", "inline-block");
        $("#logout").html("Log out <b><i>" + googleUser.getBasicProfile().getName() + "</b></i>");
        signInServer(googleUser);
    } else {
        gauth2.disconnect();
        gauth2.signOut();
        signOutServer();
        createDialog("Invalid Account", "Please log in with your school account.", "ui-icon-alert");
    }
}

function signOut() {
    name = "";
    user = undefined;
    $(containerID).jtable('load', {clear: true});
    gauth2.signOut().then(function () {
        $("#login").css("display", "block");
        $("#logout").css("display", "none");
    });
    signOutServer();
}

function createDialog(title, message, icon) {
    var dialog = $("<div>" + message + "</div>").dialog({
        draggable: false,
        modal: true,
        buttons: {
        Ok: function() {
            $(this).dialog("close");
            }
        }
    });
    dialog.data( "uiDialog" )._title = function(title) {
        title.html(this.options.title);
    };
    dialog.dialog('option', 'title', '<span class="ui-icon ' + icon + '"></span> ' + title);
}

function getTimeString(time) {
    return time.toLocaleString(navigator.language,
        {weekday: 'short', hour: '2-digit', minute: '2-digit', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone});
}

function canSignUp() {
    var curTime = new Date();
    return listMetadata.signupTimes[0] <= curTime && curTime < listMetadata.signupTimes[1];
}
