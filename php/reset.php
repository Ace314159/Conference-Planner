<?php
	$db;

	try {
	    $db = new PDO("mysql:unix_socket=localhost;dbname=confrence_planner;charset=utf8mb4", $_GET["pass"], $_GET["word"]);
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $startDay = $_GET["sDay"];
	    $endDay = $_GET["eDay"];
	    $startTime = $_GET["sTime"] - 19800;
	    $endTime = $_GET["eTime"] - 19800;
	    $interval = $_GET["interval"];
	    $teachers = explode(",", $_GET["teachers"]);
	    $day = 86400;
	    $query = "INSERT INTO `confrences`(`Teacher`, `Time`, `Available`, `Student`) VALUES";

	    //$db->query("TRUNCATE `confrences");
	    foreach($teachers as $cTeacher) {
	    	for($cDay = $startDay; $cDay <= $endDay; $cDay += $day) {
	    		for($cTime = $startTime; $cTime <= $endTime; $cTime += $interval) {
	    			//echo gmdate("Y-m-d H:i:s", $cDay + $cTime) . "<br>";
	    			$query = $query . " (" . $db->quote($cTeacher) . ", FROM_UNIXTIME('" . ($cDay + $cTime) . "'), '1', NULL),";
	    		}
	    	}
	    }

	    $db->query(substr($query, 0, -1));
	    echo "DONE!";
    } catch(PDOException $e) {
    	echo $e->getMessage();
    }

	$db = null;