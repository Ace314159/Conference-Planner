var auth2;
var name = "";
var user = undefined;
var domain = "ishstudents.in";
var interval = 5;

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
        pageSize: 120,
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
                width: "25%",
                type: 'text'
            },
            Time: {
                title: 'Start Time',
                width: '25%',
                type: 'datetime',
                display: function (data) {
                    var dt = new Date(data["record"]["Time"].slice(0, -3)); 
                    return dt.toDateString() + ", "  + dt.toLocaleTimeString().replace(":00 ", " ");
                }
            },
            ETime: {
                title: 'End Time',
                width: '25%',
                type: 'datetime',
                display: function(data) {
                    var dt = new Date(data["record"]["Time"].slice(0, -3));
                    dt.setMinutes(dt.getMinutes() + interval); 
                    return dt.toDateString() + ", "  + dt.toLocaleTimeString().replace(":00 ", " ");
                }
            },
            Other: {
                title: 'Reserve Time Slot',
                width: '25%',
                display: function (data) {
                    var value = data["record"]["Available"];
                    var id = data["record"]["Student"] + "!---!" + data["record"]["Time"].replace(/ /g, "_");
                    if(value === "Yes") {
                        return '<button class="ui-button ui-state-disabled">Remove Time Slot</button>';
                    } else {
                        return '<button class="ui-button" id="' + id + '"onclick="remove(this)">Remove Time Slot</button>';
                    }
                }
            }

        }
    });
    $('#container').jtable('load', undefined, function() {
        $("body").removeClass("loading");
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
    var tName = (name == "") ? "1aklasklasdjfkl" : name;
    $.post("php/teacher.php", {teacher : tName, jtStartIndex : jtParams["jtStartIndex"], jtPageSize : jtParams["jtPageSize"]}, function(data) {
        deferred.resolve(JSON.parse(data));
    });
    deferred.then(function(data) {
        
    })
    return deferred;
}

function remove(e) {
    $("body").addClass("loading");
    if(user.getHostedDomain() == domain) {
        var id = $(e).attr("id").replace(/_/g, " ").split("!---!");
        $.post("php/remove.php", {teacher : name, time : id[1], student : id[0]}, function(data) {
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