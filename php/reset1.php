<?php
	$db;
	ob_start();
	include("listTeachers.php");
	ob_end_clean();

	try {
	    $db = new PDO("mysql:host=localhost;dbname=ishydorg_conference_planner;charset=utf8mb4", $_GET["pass"], $_GET["word"]);
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $startDay = $_GET["sDay"];
	    $endDay = $_GET["eDay"];
	    $startTime = $_GET["sTime"];
	    $endTime = $_GET["eTime"];
	    $interval = $_GET["interval"];
	    $teachers = $teachersNames;
	    $day = 86400;
	    $query = "INSERT INTO `conferences`(`Teacher`, `Time`, `Available`, `Student`) VALUES";

	    $db->query("TRUNCATE `conferences`");
            $db->query("TRUNCATE `selected`"); 
	    foreach($teachers as $cTeacher) {
	    	for($cDay = $startDay; $cDay <= $endDay; $cDay += $day) {
	    		for($cTime = $startTime; $cTime < $endTime; $cTime += $interval) {
	    			echo gmdate("Y-m-d H:i:s", $cDay + $cTime) . "<br>";
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
?>
