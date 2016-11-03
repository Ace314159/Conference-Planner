<?php
	$db;
	$r;
	$m;

	try {
	    $db = new PDO("mysql:unix_socket=localhost;dbname=confrence_planner;charset=utf8mb4", "pub", "");
	    $selected = new PDO("mysql:unix_socket=localhost;dbname=confrence_planner;charset=utf8mb4", "reset", "NyKFRFwYNUU85TGj");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $selected->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $teacher = $_POST["teacher"];
	    $time = $_POST["time"];
	    $student = $_POST["student"];

		$stmt = $db->prepare("UPDATE `confrences` SET `Available` = 0,`Student` = ? WHERE `Teacher` = ? AND `Time` = ? AND `Available` = 1 AND `Student` IS NULL");
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