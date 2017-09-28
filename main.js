var auth2;
var name = "";
var user = undefined;
var domain = "ishstudents.in";
var interval = 5;
var first = "";
var selected = false;
var prevSearch = "";

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
    gapi.load('auth2', initGapi);
    $("#container").jtable({
        title: 'Conferences',
        paging: true,
        pageSize: 200,
        pageSizeChangeArea: false,
        animationsEnabled: false,
        loadingAnimationDelay: 2000,
        messages : {
            noDataAvailable: "Please enter a valid teacher name that you have not already booked a slot with.",
            loadingMessage: "Loading..."
        },
        actions: {
            listAction: list
        },
        fields: {
            Teacher: {
                title: "Teacher",
                width: "20%",
                type: 'text'
            },
            Time: {
                title: 'Start Time',
                width: '20%',
                type: 'datetime',
                display: function (data) {
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"] + "---stime").replace(/ /g, "_");
                    var s = data["record"]["Time"].slice(0, -3);
                    var pl = s.split(" ");
                    var d = pl[0].split("-");
                    var t = pl[1].split(":");
                    var dt = new Date(d[0], d[1], d[2], t[0], t[1]);
                    return "<span id='" + id + "' data-time='" + dt.toString() +"'>" + dt.toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit', timezone:'Asia/Kolkata'})  + "</span>";
                }
            }/*,
            Available: {
                title: 'Available',
                width: '22%',
                type: 'text',
                display: function (data) {
                    var value = data["record"]["Available"];
                    var id = "b" + data["record"]["Teacher"] + "!---!" + data["record"]["Time"];
                    return "<span id='" + id + "'>" + value  +"</span>";
                }
            },
            Student: {
                title: 'Student Wtih Time Slot',
                width: '22%',
                type: 'text'
            }*/,
            ETime: {
                title: 'End Time',
                width: '20%',
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
                width: '20%',
                display: function(data) {
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"] + "---time").replace(/ /g, "_");
                    if($("#my").prop("checked")) {
                        var tenMin = "<span id='" + id + "'>10 minutes</span>";
                        var fiveMin = "<span id='" + id + "'>5 minutes</span>";
                        return (data["record"]["IsTenMin"]) ? tenMin : fiveMin;
                    } else {
                        var tenMinDisabled = (data["record"]["10Min?"]) === "Yes" ? "" : " disabled='disabled'";
                        return "<select id='" + id + "' style='width:100%;' class='timeSelect'>" + 
                        "<option value='5' selected='selected'>5 minutes</option><option value='10' " + tenMinDisabled + ">10 minutes</option></select>";
                    }
                }
            },
            Other: {
                title: 'Reserve Time Slot',
                width: '20%',
                display: function (data) {
                    var value = data["record"]["Available"];
                    var id = (data["record"]["Teacher"] + "!---!" + data["record"]["Time"]).replace(/ /g, "_");
                    if(value === "No") {
                        try {
                            if(name == data["record"]["Student"]) {
                                return '<button class="ui-button" id="' + id + '"onclick="remove(this)">Remove Time slot</button>';
                            } else {
                                return '<button class="ui-button ui-state-disabled">Remove Time Slot</button>';
                            }
                        } catch(e) {
                            return '<button class="ui-button ui-state-disabled">Reserve Time Slot</button>';
                        }
                    } else {
                        return '<button class="ui-button" id="' + id + '"onclick="select(this)">Reserve Time Slot</button>';
                    }
                }
            }

        }
    });
    $('#container').jtable('load', undefined, function() {
        $("body").removeClass("loading");
    });
    $.post("php/listTeachers.php", undefined, function(data) {
        $("#search").autocomplete({
            source: JSON.parse(data)["Records"],
            select: function(e, ui) {
                $("#search").val(ui["item"].value);
                selected = true;
                $("#container").jtable('reload');
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
    $(".ui-checkboxradio").change(function() {
        //$("#search").val("");
        if($("#my").prop("checked")) {
            $("#search").val("");
            prevSearch = "";
        }
        $("#container").jtable("reload");
    });

    window.setInterval(function() {
        $('#container').jtable('reload');
    }, 60000);

    $("#avail").checkboxradio();
    $("#my").checkboxradio();
    $("#my").checkboxradio("disable");
});

function initGapi() {
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
    $('#container').jtable("reload");
}
function list(postData, jtParams) {
    var se = (selected) ? $("#search").val() : prevSearch;
    selected = false;
    prevSearch = se;
    var m =  $("#my").prop("checked") ? ' AND `Student` = "' + name + '"' : "";
    var av = (m === "") ? "(1)" : "(1, 0)"; //$("#avail").prop("checked") ? "(1)" : "(0, 1)";
    var s = (m == "") ? name : "";
    var deferred = new $.Deferred();
    $.post("php/list.php", {search : se, avail : av, my : m, student: s, jtStartIndex : jtParams["jtStartIndex"], jtPageSize : jtParams["jtPageSize"]}, function(data) {
        deferred.resolve(JSON.parse(data));
    });
    deferred.then(function(data) {
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
        if(data["TotalRecordCount"] === 0) {
            //$("tr, .jtable-goto-page").eq(1).first().text("You have already reserved a time slot for this teacher.");
        } else {
            //$("tr, .jtable-goto-page").eq(1).first().text("Please enter a valid teacher name.");
        }
    })
    if($("body").hasClass("loading")) {
        $("body").removeClass("loading");
    }
    return deferred;
}

function select(e) {
    $("body").addClass("loading");
    var isTenMin = $(document.getElementById($(e).attr("id") + "---time")).val() == "10" ? "1" : "";
    $('#container').jtable('reload', function() {
        if(user.getHostedDomain() == domain) {
            if($(e).length) {
                id = $(e).attr("id").replace(/_/g, " ").split("!---!");
                $.post("php/select.php", {teacher: id[0], time: id[1], student: user.getBasicProfile().getName(), isTenMin: isTenMin}, function(data) {
                    console.log(data);
                    data = JSON.parse(data);
                    $('#container').jtable('reload');
                    if(data["Message"] < 1) {
                        createDialog("Time slot Taken", "This time slot has been taken.", "ui-icon-alert");
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
    if(user.getHostedDomain() == domain) {
        var id = $(e).attr("id").split("_").join(" ").split("!---!");
        var isTenMin = $(document.getElementById($(e).attr("id") + "---time")).text() == "10 minutes" ? "1" : "";
        $.post("php/remove.php", {teacher : id[0], time : id[1], student : name, isTenMin: isTenMin}, function(data) {
            data = JSON.parse(data);
            $('#container').jtable('reload');
            if(data["Message"] > 0) {
                $("body").removeClass("loading");
                createDialog("Success!", "The time: " + id[1] + " has been deleted for the teacher: " + id[0] + ".", "ui-icon-check");
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