<?php
	$r;
	$m;
	$db;
	$rows = array();

	try {
	    $db = new PDO("mysql:host=localhost;dbname=ishydorg_conference_planner", "ishydorg_akash", "xR8OfckrfTDUjBvm");
	    $selected = new PDO("mysql:host=localhost;dbname=ishydorg_conference_planner", "ishydorg_akash", "xR8OfckrfTDUjBvm");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $selected->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $teacher = "1aklasklasdjfkl";
	    if(isset($_POST["teacher"])) {
	    	$teacher = $_POST["teacher"];
	    }

		$stmt = $db->prepare('SELECT `Student`, `Time`, `Available` FROM `conferences` WHERE `Teacher` LIKE ? ORDER BY `Time`, `Student` ASC LIMIT '.$_POST['jtStartIndex'].', '.$_POST['jtPageSize']);
		$stmt->execute(array("%$teacher%"));
	    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    		$row["Available"] = ($row["Available"] == 1) ? "Yes" : "No";
	    	$row["Student"] = ($row["Student"] == null) ? "None" : $row["Student"];
		    $rows[] = $row;
	    }
    } catch(PDOException $e) {
    	$m = $e->getMessage();
    	$r = "ERROR";
    }

    $jTableResult = array();
    $jTableResult["Result"] = $r;
    if($r === "OK") {
    	$jTableResult["Records"] = $rows;
    	$jTableResult["TotalRecordCount"] = $stmt->rowCount();
    } else {
    	$jTableResult["Message"] = $m;
    	$jTableResult["TotalRecordCount"] = 0;
    }

	print json_encode($jTableResult);
	$db = null;