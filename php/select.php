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

		$stmt = $db->prepare("UPDATE `conferences` SET `Available` = 0,`Student` = ? WHERE `Teacher` = ? AND `Time` = ? AND `Available` = 1 AND `Student` IS NULL");
	    $stmt->execute(array($student, $teacher, $time));

	    $m =  $stmt->rowCount();

	    if($m > 0) {
	    	$stmt = $selected->prepare("INSERT INTO `selected`(`Student`, `Teacher`, `Time`) VALUES (?, ?, ?)");
	        $stmt->execute(array($student, $teacher, $time));
	    }
    } catch(PDOException $e) {
    	$m = 0;
    	$r = "ERROR";
    }

    $jTableResult = array();
    $jTableResult["Result"] = $r;
    $jTableResult["Message"] = $m;

	print json_encode($jTableResult);

	$db = null;