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
	    $secondTime = -1;

	    if($isTenMin) {
    		$secondTime = date("Y-m-d H:i:s", (strtotime($time)+300));
	    	$times = "('$time', '$secondTime')";
	    } else {
	    	$times = "('$time')";
	    }

	    $stmt = $selected->prepare("SELECT COUNT(1) FROM `selected` WHERE `Time` IN ".$times." AND `Student` = ?");
	    $stmt->execute(array($student));
	    $timeSlotAlreadyReserved = $stmt->fetch(PDO::FETCH_NUM)[0] > 0;
	    if($timeSlotAlreadyReserved) {
	    	$m = 0;
	    } else {
			$stmt = $db->prepare("UPDATE `conferences` SET `Available` = 0,`Student` = ? WHERE `Teacher` = ? AND `Time` IN ".$times." AND `Available` = 1 AND `Student` IS NULL;");
		    $stmt->execute(array($student, $teacher));

		    $m =  $stmt->rowCount();

		    if($isTenMin && $m != 2) {
		    	$db->prepare("UPDATE `conferences` SET `Available` = 1,`Student` = NULL WHERE `Teacher` = ? AND `Time` IN ".$times." AND `Available` = 0 AND `Student` = ?")->execute(array($teacher, $student));
		    	$selected->prepare("DELETE FROM `selected` WHERE `Student` = ? AND `Teacher` = ? AND `Time` IN ".$times)->execute(array($student, $teacher));
		    	$m = 0;
		    } else if($m > 0) {
		    	if($secondTime == -1) {
		    		$stmt = $selected->prepare("INSERT INTO `selected`(`Student`, `Teacher`, `Time`) VALUES (?, ?, ?)");
		        	$stmt->execute(array($student, $teacher, $time));
		    	} else {
		    		$stmt = $selected->prepare("INSERT INTO `selected`(`Student`, `Teacher`, `Time`) VALUES (?, ?, ?), (?, ?, ?)");
		        	$stmt->execute(array($student, $teacher, $time, $student, $teacher, $secondTime));
		    	}
		    }
		}
    } catch(PDOException $e) {
    	$m = 0;
    	$r = "ERROR";
    	//$r = $e->getMessage();
    }

    $jTableResult = array();
    $jTableResult["Result"] = $r;
    $jTableResult["Message"] = $m;

	print json_encode($jTableResult);

	$db = null;
?>