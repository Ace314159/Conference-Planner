var auth2;
var googleAuth;
var name = "";
var user = undefined;
var domain = "ishyd.org";
var interval = 5;
var first = "";
var studentNames = [];

$(document).ready(function () {
    try {
        gapi;
    } catch(e) {
        $("body").empty();
        var a = setInterval(function() {
            createDialog("Adblock is causing problems!", "Please disable your adblock. There are no ads on this site. Thank you for your cooperation.", "ui-icon-alert");
            clearInterval(a);
        }, 100);
        return;
    }
    $("body").addClass("loading");
    $("#login").css("left", $(window).width() - 145);
    gapi.load('client:auth2', initGapi);
    $("#container").jtable({
        title: 'Conferences',
        paging: true,
        pageSize: 200,
        pageSizeChangeArea: false,
        animationsEnabled: false,
        loadingAnimationDelay: 2000,
        messages : {
            noDataAvailable: "No students have reserved any time slots.",
            loadingMessage: "Loading..."
        },
        actions: {
            listAction: list
        },
        fields: {
            Student: {
                title: "Student",
                width: "20%",
                type: 'text',
                display: function(data) {
                    if(data["record"]["Student"] === "None") {
                        var id = (data["record"]["Student"] + "!---!" + data["record"]["Time"] + "---name").replace(/ /g, "_");
                        return "<input class='studentName' id='" + id + "' style='width:98%;' type='text' />";
                    } else {
                        return data["record"]["Student"];
                    }
                }
            },
            Time: {
                title: 'Start Time',
                width: '20%',
                type: 'datetime',
                display: function(data) {
                    var id = (data["record"]["Student"] + "!---!" + data["record"]["Time"] + "---stime").replace(/ /g, "_");
                    var s = data["record"]["Time"].slice(0, -3);
                    var pl = s.split(" ");
                    var d = pl[0].split("-");
                    var t = pl[1].split(":");
                    var dt = new Date(d[0], d[1], d[2], t[0], t[1]);
                    return "<span id='" + id + "' data-time='" + dt.toString() + "'>" + dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'})  + "</span>";
                }
            },
            ETime: {
                title: 'End Time',
                width: '20%',
                type: 'datetime',
                display: function(data) {
                    var id = (data["record"]["Student"] + "!---!" + data["record"]["Time"] + "---etime").replace(/ /g, "_");
                    var s = data["record"]["Time"].slice(0, -3);
                    var pl = s.split(" ");
                    var d = pl[0].split("-");
                    var t = pl[1].split(":");
                    var dt = new Date(d[0], d[1], d[2], t[0], t[1]);
                    if(data["record"]["IsTenMin"]) {
                        dt.setMinutes(dt.getMinutes() + interval*2);
                    } else {
                        dt.setMinutes(dt.getMinutes() + interval);
                    }
                    return "<span id='" + id + "'>" + dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'})  + "</span>";
                }
            },
            TimeSlotLength: {
                title: 'Time Slot Length',
                width: '20%',
                display: function(data) {
                    var id = (data["record"]["Student"] + "!---!" + data["record"]["Time"] + "---time").replace(/ /g, "_");
                    if(data["record"]["Student"] === "None") {
                        return "<select id='" + id + "' style='width:100%;' class='timeSelect'>" + 
                        "<option value='5' selected='selected'>5 minutes</option><option value='10'>10 minutes</option></select>";
                    } else {
                        var tenMin = "<span id='" + id + "'>10 minutes</span>";
                        var fiveMin = "<span id='" + id + "'>5 minutes</span>";
                        return (data["record"]["IsTenMin"]) ? tenMin : fiveMin;
                    }
                }
            },
            Other: {
                title: 'Reserve Time Slot',
                width: '20%',
                display: function (data) {
                    var value = data["record"]["Available"];
                    var id = data["record"]["Student"] + "!---!" + data["record"]["Time"].replace(/ /g, "_");
                    if(value === "Yes") {
                        return '<button class="ui-button" id="' + id + '" onclick="add(this)">Add Time Slot</button>';
                    } else {
                        return '<button class="ui-button" id="' + id + '" onclick="remove(this)">Remove Time Slot</button>';
                    }
                }
            }

        }
    });
    $('#container').jtable('load', undefined, function() {
        $("body").removeClass("loading");
    });
    $.post("php/listStudents.php", undefined, function(data) {
        studentNames = JSON.parse(data)["Records"];
        $(".studentName").autocomplete({
            source: studentNames,
            select: function(e, ui) {
                $(e).val(ui["item"].value);
            },
            response: function(e, ui) {
                try {
                    first = ui["content"][0]["value"];
                } catch(e) {

                }
            }
        });
    });

    window.setInterval(function() {
        $('#container').jtable('reload');
    }, 60000);
});

function initGapi() {
    gapi.client.init({
        "apiKey": "AIzaSyBEMMPQRdApq7b8YwpAEwwtqmYO8C2aJKY",
        "clientId": "684750547135-o6l6poe6v675tv6nqkbk79nj3fed636a.apps.googleusercontent.com",
        "scope": "profile email https://www.googleapis.com/auth/admin.directory.user.readonly",
        "discoveryDocs": ["https://www.googleapis.com/discovery/v1/apis/admin/directory_v1/rest"]
    });
    gauth2 = gapi.auth2.getAuthInstance();
    user = gauth2.currentUser.get();
    gauth2.currentUser.listen(userChanged);
}
function userChanged() {
    if(gauth2.isSignedIn.get()) {
        user = gauth2.currentUser.get();
        name = user.getBasicProfile().getName();
    }
    $('#container').jtable("reload");
}
function list(postData, jtParams) {
    var deferred = new $.Deferred();
    var tName = (name == "") ? "1aklasklasdjfkl" : name;
    $.post("php/teacher.php", {teacher : tName, jtStartIndex : jtParams["jtStartIndex"], jtPageSize : jtParams["jtPageSize"]}, function(data) {
        deferred.resolve(JSON.parse(data));
    });
    deferred.then(function() { 
        $(".timeSelect").selectmenu({
            change: function(e) {
                if($(e.target).val() === "10") {
                    var dt = new Date($(document.getElementById(e.target.id.slice(0, -7) + "---stime")).data("time"));
                    dt.setMinutes(dt.getMinutes() + interval*2);
                    $(document.getElementById(e.target.id.slice(0, -7) + "---etime")).html(dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'}));
                } else {
                    var dt = new Date($(document.getElementById(e.target.id.slice(0, -7) + "---stime")).data("time"));
                    dt.setMinutes(dt.getMinutes() + interval);
                    $(document.getElementById(e.target.id.slice(0, -7) + "---etime")).html(dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'}));
                }
            }
        });
        $(".timeSelect").each(function(i, obj) {
            if($(obj).val() === "10") {
                    var dt = new Date($(document.getElementById(obj.id.slice(0, -7) + "---stime")).data("time"));
                    dt.setMinutes(dt.getMinutes() + interval*2);
                    $(document.getElementById(obj.id.slice(0, -7) + "---etime")).html(dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'}));
                } else {
                    var dt = new Date($(document.getElementById(obj.id.slice(0, -7) + "---stime")).data("time"));
                    dt.setMinutes(dt.getMinutes() + interval);
                    $(document.getElementById(obj.id.slice(0, -7) + "---etime")).html(dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'}));
                }
        });
        $(".studentName").on("keypress", function(e) {
            if(e.keyCode == 13) {
                $(this).val(first);
                $(this).blur();
            }
        });
        $(".studentName").autocomplete({
            source: studentNames,
            select: function(e, ui) {
                $(e).val(ui["item"].value);
            },
            response: function(e, ui) {
                try {
                    first = ui["content"][0]["value"];
                } catch(e) {

                }
            }
        });
    });
    if($("body").hasClass("loading")) {
        $("body").removeClass("loading");
    }
    return deferred;
}

function add(e) {
    $("body").addClass("loading");
    var isTenMin = $(document.getElementById($(e).attr("id") + "---time")).val() == "10" ? "1" : "";
    $('#container').jtable('reload', function() {
        if(user.getHostedDomain() == domain) {
            if($(e).length) {
                id = $(e).attr("id").replace(/_/g, " ").split("!---!");
                var studentName = $(document.getElementById($(e).attr("id") + "---name")).val();
                if(studentNames.indexOf(studentName) > -1) {
                    $.post("php/select.php", {teacher: user.getBasicProfile().getName(), time: id[1], student: studentName, isTenMin: isTenMin}, function(data) {
                    data = JSON.parse(data);
                    $('#container').jtable('reload');
                    if(data["Message"] < 1) {
                        createDialog("Time slot Taken", "This time slot has already been taken for that student.", "ui-icon-alert");
                        $("body").removeClass("loading");
                    } else {
                        prevSearch = "";
                        $("body").removeClass("loading");
                        $('#container').jtable('reload');
                        $("#search").val("");
                        createDialog("Success!", "You have taken this time slot.", "ui-icon-check");
                    }
                });
                } else {
                    createDialog("Invalid Name", "Please use the student name found in their email address", "ui-icon-alert");
                    $("body").removeClass("loading");
                }
            } else {
                createDialog("Time slot Taken", "This time slot has been taken.", "ui-icon-alert");
                $("body").removeClass("loading");
            }
        } else {
            createDialog("Invalid Account", "Please log in with your school account.", "ui-icon-alert");
            $("body").removeClass("loading");
        }
    });
}

function remove(e) {
    $("body").addClass("loading");
    var isTenMin = $(document.getElementById($(e).attr("id") + "---time")).val() == "10" ? "1" : "";
    if(user.getHostedDomain() == domain) {
        var id = $(e).attr("id").replace(/_/g, " ").split("!---!");
        $.post("php/remove.php", {teacher : name, time : id[1], student : id[0], isTenMin: isTenMin}, function(data) {
            data = JSON.parse(data);
            $('#container').jtable('reload');
            if(data["Message"] > 0) {
                $("body").removeClass("loading");
                createDialog("Success!", "The time: " + id[1] + " has been deleted for the student: " + id[0] + ".", "ui-icon-check");
                $('#container').jtable('reload');
            } else {
                $("body").removeClass("loading");
                createDialog("Failure!", "An unknown error has occurred. Please try again.", "ui-icon-alert");
            }
        });
    } else {
        $("body").removeClass("loading");
    }
}

function onSignIn(googleUser) {
    if(googleUser.getHostedDomain() == domain) {
        $('#container').jtable('reload');
        $("#login").css("display", "none");
        $("#logout").css("display", "inline-block");
        $("#logout").html("Log out <b><i>" + googleUser.getBasicProfile().getName() + "</b></i>");
    } else {
        gauth2.disconnect();
        gauth2.signOut();
        createDialog("Invalid Account", "Please log in with your school account.", "ui-icon-alert");
    }
}

function signOut() {
    name = "";
    user = undefined;
    $('#container').jtable("reload");
    gauth2.signOut().then(function () {
        $("#login").css("display", "block");
        $("#logout").css("display", "none");
    });
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