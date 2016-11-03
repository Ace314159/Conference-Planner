<?php
	$r;
	$m;
	$db;
	$rows = array();

	try {
		$r = "OK";
	    $db = new PDO("mysql:unix_socket=localhost;dbname=confrence_planner;charset=utf8mb4", "pub", "");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		$stmt = $db->query('SELECT DISTINCT `Teacher` FROM `confrences` ORDER BY `Teacher` ASC');
	    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
	    	$rows[] = $row["Teacher"];
	    }
    } catch(PDOException $e) {
    	$m = $e->getMessage();
    	$r = "ERROR";
    }

    $jTableResult = array();
    $jTableResult["Result"] = $r;
    if($r === "OK") {
    	$jTableResult["Records"] = $rows;
    } else {
    	$jTableResult["Message"] = $m;
    }

	print json_encode($jTableResult);
	$db = null;