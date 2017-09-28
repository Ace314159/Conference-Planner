var auth2;
var googleAuth;
var name = "";
var user = undefined;
var domain = "ishyd.org";
var interval = 5;
var first = "";
var studentNames = [];
var teacherNames = [];
var selectedTeacher = "123ADSFSA";
var adminNames = ["Patrick Dempsey", "Divya Katikaneni", "Sudha Patel", "Sunayana Upadhyaya", "Anil Tiwari", "Santosh Yennati", "Lincy Saji", "Kavya DBM"];

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
            Teacher: {
                title: "Teacher",
                width: "16.6%",
                type: "text",
                display: function(data) {
                    return data["record"]["Teacher"];
                }
            },
            Student: {
                title: "Student",
                width: "16.6%",
                type: 'text',
                display: function(data) {
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"] + "---name").replace(/ /g, "_");
                    if(data["record"]["Student"] === "None") {
                        return "<input class='studentName' id='" + id + "' style='width:98%;' type='text' />";
                    } else {
                        return "<span id='" + id + "'>" + data["record"]["Student"] + "</span>";
                    }
                }
            },
            Time: {
                title: 'Start Time',
                width: '16.6%',
                type: 'datetime',
                display: function(data) {
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"] + "---stime").replace(/ /g, "_");
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
                width: '16.6%',
                type: 'datetime',
                display: function(data) {
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"] + "---etime").replace(/ /g, "_");
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
                width: '16.6%',
                display: function(data) {
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"] + "---time").replace(/ /g, "_");
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
                width: '16.6%',
                display: function (data) {
                    var value = data["record"]["Available"];
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"]).replace(/ /g, "_");
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
    $.post("php/listTeachers.php", undefined, function(data) {
        teacherNames = JSON.parse(data)["Records"];
        $("#search").autocomplete({
            source: teacherNames,
            select: function(e, ui) {
                $("#search").val(ui["item"].value);
                selected = true;
                $("#container").jtable('reload');
                selectedTeacher = ui["item"].value;
            },
            response: function(e, ui) {
                try {
                    first = ui["content"][0]["value"];
                } catch(e) {

                }
            }
        });
    });
    $("#search").on("input", function() {
        if($("#search").val() == "") {
            $("#container").jtable('load');
        } else {
            $("#container").jtable('reload');
        }
    });
    $("#search").on("keypress", function(e) {
        if(e.keyCode == 13) {
            $("#search").val(first);
            $("#search").blur();
            selected = true;
            $("#container").jtable('reload');
        }
    });

    window.setInterval(function() {
        $('#container').jtable('reload');
    }, 60000);
});

function initGapi() {
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

    var tName = (teacherNames.indexOf($("#search").val()) < 0) ? "1aklasklasdjfkl" : $("#search").val();
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
    });
    if($("body").hasClass("loading")) {
        $("body").removeClass("loading");
    }
    return deferred;
}

function add(e) {
    $("body").addClass("loading");
    var isTenMin = $(document.getElementById($(e).attr("id") + "---time")).val() == "10" ? "1" : "";
    id = $(e).attr("id").replace(/_/g, " ").split("!---!");
    var studentName = $(document.getElementById($(e).attr("id") + "---name")).val();
    $('#container').jtable('reload', function() {
        if($.inArray(name, adminNames) >= 0) {
            if($(e).length) {
                //id = $(e).attr("id").replace(/_/g, " ").split("!---!");
                //var studentName = $(document.getElementById($(e).attr("id") + "---name")).val();
                if(!studentName) {
                    createDialog("No Student Name", "Please enter a valid student name.", "ui-icon-alert");
                    $("body").removeClass("loading");
                    return;
                }
                $.post("php/select.php", {teacher: selectedTeacher, time: id[1], student: studentName, isTenMin: isTenMin}, function(data) {
                    data = JSON.parse(data);
                    $('#container').jtable('reload');
                    if(data["Message"] < 1) {
                        createDialog("Time slot Taken", "This time slot has already been taken for that student.", "ui-icon-alert");
                        $("body").removeClass("loading");
                    } else {
                        prevSearch = "";
                        $("body").removeClass("loading");
                        $('#container').jtable('reload');
                        //$("#search").val("");
                        createDialog("Success!", "You have taken this time slot.", "ui-icon-check");
                    }
                });
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
    if($.inArray(name, adminNames) >= 0) {
        var id = $(e).attr("id").replace(/_/g, " ").split("!---!");
        var isTenMin = $(document.getElementById($(e).attr("id") + "---time")).text() == "10 minutes" ? "1" : "";
        $.post("php/remove.php", {teacher : selectedTeacher, time : id[1], student : $(document.getElementById($(e).attr("id") + "---name")).text(), isTenMin: isTenMin}, function(data) {
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
    if($.inArray(googleUser.getBasicProfile().getName(), adminNames) >= 0) {
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