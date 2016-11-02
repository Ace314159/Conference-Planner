<?php
	$db;
	$r;
	$m;

	try {
	    $db = new PDO("mysql:host=localhost;dbname=confrence_planner;charset=utf8mb4", "pub", "");
	    $selected = new PDO("mysql:host=localhost;dbname=confrence_planner;charset=utf8mb4", "reset", "NyKFRFwYNUU85TGj");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $selected->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $teacher = $_POST["teacher"];
	    $time = $_POST["time"];
	    $student = $_POST["student"];

		$stmt = $db->prepare("UPDATE `confrences` SET `Available` = 1,`Student` = NULL WHERE `Teacher` = ? AND `Time` = ?");
	    $stmt->execute(array($teacher, $time));

	    $m =  $stmt->rowCount();

	    if($m > 0) {
	    	$stmt = $selected->prepare("DELETE FROM `selected` WHERE `Student` = ? AND `Teacher` = ? AND `Time` = ?");
	    	$stmt->execute(array($student, $teacher, $time));
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