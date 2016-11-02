<!DOCTYPE html>
<html>
<meta name="google-signin-client_id" content="684750547135-2pqtk2f57t7if9jkt2nkcng0m8lrm6h9.apps.googleusercontent.com">
<head>
	<title>Conference Planner</title>
	<noscript>Please enable javascript.</noscript>
	<script src="https://apis.google.com/js/platform.js"></script>
	<script type="text/javascript" src="jquery.min.js"></script>
	<script type="text/javascript" src="jquery-ui/jquery-ui.min.js"></script>
	<script type="text/javascript" src="jtable/jquery.jtable.min.js"></script>
	<script type="text/javascript" src="main.js"></script>
	<link rel="stylesheet" type="text/css" href="main.css" />
	<link rel="stylesheet" type="text/css" href="jquery-ui/jquery-ui.min.css" />
	<link rel="stylesheet" type="text/css" href="jquery-ui/jquery-ui.theme.min.css" />
	<link rel="stylesheet" type="text/css" href="jtable/jtable.min.css" />
	<meta name="viewport" content="width=1920, initial-scale=1">
</head>

<body>
	<div class="g-signin2" data-onsuccess="onSignIn" id="login"></div>
	<a class="g-signout2" id="logout" onclick="signOut()">Log out</a>
	<input type="text" class="ui-widget" id="search" placeholder="Teacher Name"/>
    <!--<label for="avail" class="ui-checkboxradio-label" id="availL">Only show available time slots</label>
	<input type="checkbox" name="avail" id="avail" class="ui-checkboxradio" />!-->
    <label for="my" class="ui-checkboxradio-label" id="myL">Only show my reserved time slots</label>
	<input type="checkbox" name="my" id="my" class="ui-checkboxradio" />
	<div id="container"></div>
	<div class="modal"></div>
</body>
</html>