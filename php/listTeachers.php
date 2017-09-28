<?php
	chdir(__DIR__);

	require_once "../gapi/vendor/autoload.php";
	putenv("GOOGLE_APPLICATION_CREDENTIALS=oauth_service_account.json");

	$client = new Google_Client();
	$client->useApplicationDefaultCredentials();
	$client->setApplicationName("Conference Planner");
	$client->setScopes(Google_Service_Directory::ADMIN_DIRECTORY_USER_READONLY);

	$client->setSubject("admin@ishstudents.in");

	$usersService = new Google_Service_Directory($client);

	$params = array(
		"orderBy" => "givenName",
		"domain" => "ishyd.org",
		"sortOrder" => "ASCENDING",
		"maxResults" => "500"
	);

	$teachersNames = array();

	$users = $usersService->users->listUsers($params);
	foreach($users->getUsers() as $user) {
        if( (strpos($user->getName()->getFullName(), "ISH") === false) && (strpos($user->getName()->getFullName(), "ISACI") === false) && (strpos($user->getName()->getFullName(), "Admin") === false) && (strpos($user->getName()->getFullName(), "Hyderabad") === false) && (strpos($user->getName()->getFullName(), "Production") === false) ) {
        	$teachersNames[] = $user->getName()->getFullName();
		}
	}
	$pageToken = $users->getNextPageToken();
	$params["pageToken"] = $pageToken;
	while($pageToken != "") {
		$users = $usersService->users->listUsers($params);
		foreach($users->getUsers() as $user) {
			if( (strpos($user->getName()->getFullName(), "ISH") === false) && (strpos($user->getName()->getFullName(), "ISACI") === false) && (strpos($user->getName()->getFullName(), "Admin") === false) && (strpos($user->getName()->getFullName(), "Hyderabad") === false) && (strpos($user->getName()->getFullName(), "Production") === false) ) {
	        	$teachersNames[] = $user->getName()->getFullName();
			}
		}

		$pageToken = $users->getNextPageToken();
		$params["pageToken"] = $pageToken;
	}

	$jTableResult = array();
    $jTableResult["Result"] = "OK";
	$jTableResult["Records"] = $teachersNames;

	echo json_encode($jTableResult);
?>
