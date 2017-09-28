<?php
	$db;
	$r;
	$m;

	try {
	    $db = new PDO("mysql:host=localhost;dbname=ishydorg_conference_planner", "ishydorg_akash", "xR8OfckrfTDUjBvm");
	    $selected = new PDO("mysql:host=localhost;dbname=ishydorg_conference_planner", "ishydorg_akash", "xR8OfckrfTDUjBvm");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $selected->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $teacher = $_POST["teacher"];
	    $time = $_POST["time"];
	    $student = $_POST["student"];
	    $isTenMin = $_POST["isTenMin"];

	    if($isTenMin) {
    		$secondTime = date("Y-m-d H:i:s", (strtotime($time)+300));
	    	$times = "('$time', '$secondTime')";
	    } else {
	    	$times = "('$time')";
	    }

		$stmt = $db->prepare("UPDATE `conferences` SET `Available` = 1,`Student` = NULL WHERE `Teacher` = ? AND `Time` IN $times");
	    $stmt->execute(array($teacher));

	    $m =  $stmt->rowCount();

	    if($m > 0) {
	    	$stmt = $selected->prepare("DELETE FROM `selected` WHERE `Student` = ? AND `Teacher` = ? AND `Time` IN $times");
	    	$stmt->execute(array($student, $teacher));
	    }
    } catch(PDOException $e) {
    	$m = $e->getMessage();
    	$r = "ERROR";
    }

    $jTableResult = array();
    $jTableResult["Result"] = $r;
    $jTableResult["Message"] = $m;

	print json_encode($jTableResult);

	$db = null;
?>
