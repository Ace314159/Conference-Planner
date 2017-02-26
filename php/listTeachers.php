<?php
	$r;
	$m;
	$db;
	$rows = array();

	try {
	    $r = "OK";
	    $db = new PDO("mysql:host=localhost;dbname=ishydorg_conference_planner", "ishydorg_akash", "xR8OfckrfTDUjBvm");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

	    $stmt = $db->query('SELECT DISTINCT `Teacher` FROM `conferences` ORDER BY `Teacher` ASC');
	    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
	    	$rows[] = utf8_encode($row["Teacher"]);
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

	echo json_encode($jTableResult);
	$db = null;