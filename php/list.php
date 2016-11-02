<?php
	$r;
	$m;
	$db;
	$rows = array();
	$teachers = array('""');
	$waitInterval = 300;
	$timesInterval = 300;
	$times = array();
	$numOfTeachers = 23;
	$count = 0;

	try {
	    $db = new PDO("mysql:host=localhost;dbname=confrence_planner;charset=utf8mb4", "pub", "");
	    $selected = new PDO("mysql:host=localhost;dbname=confrence_planner;charset=utf8mb4", "reset", "NyKFRFwYNUU85TGj");
	    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $selected->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	    $r = "OK";
	    $search = "1";
	    $avail = "(0, 1)";
	    $my = "";
	    $name = "";
	    if(isset($_POST["avail"])) {
	    	$avail = $_POST["avail"];
	    } if(isset($_POST["my"])) {
	    	$my = $_POST["my"];
	    } if(isset($_POST["student"])) {
	    	$student = $_POST["student"];
	    } if(isset($_POST["search"])) {
	    	$search = $_POST["search"];
	    	if($search === "" && $avail === "(1)" && $my === "") {
	    		$search = "1";
	    	}
	    }

	    $stmt = $selected->prepare("SELECT `Teacher`, UNIX_TIMESTAMP(`Time`) FROM `selected` WHERE `Student` = ?");
	    $stmt->execute(array($student));
	    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
	    	$teachers[] = $selected->quote($row["Teacher"]);
	    	$pl = $row["UNIX_TIMESTAMP(`Time`)"];
	    	for($i = $pl - $waitInterval; $i <= $pl + $waitInterval; $i += $timesInterval) {
	    		$times[] = $i;
	    	}
	    }

		$stmt = $db->prepare('SELECT `Teacher`, `Time`, `Available`, `Student` FROM `confrences` WHERE `Teacher` LIKE ? AND `Available` IN '.$avail.$my.' AND `Teacher` NOT IN ('.implode(", ", $teachers).') ORDER BY `Teacher`, `Time` ASC LIMIT '.$_POST['jtStartIndex'].', '.$_POST['jtPageSize']);
		$stmt->execute(array("%$search%"));
	    foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
	    	if(!in_array(strtotime($row["Time"]), $times)) {
	    		$row["Available"] = ($row["Available"] == 1) ? "Yes" : "No";
	    		$row["Student"] = ($row["Student"] == null) ? "None" : $row["Student"];
		    	$rows[] = $row;
	    	} else {
	    		$count++;
	    	}
	    }
	    $stmt = $db->prepare('SELECT `Teacher`, `Time`, `Available`, `Student` FROM `confrences` WHERE `Teacher` LIKE ? AND `Available` IN '.$avail.$my);
		$stmt->execute(array("%$search%"));
    } catch(PDOException $e) {
    	$m = $e->getMessage();
    	$r = "ERROR";
    }

    $jTableResult = array();
    $jTableResult["Result"] = $r;
    if($r === "OK") {
    	$jTableResult["Records"] = $rows;
    	$jTableResult["TotalRecordCount"] = $stmt->rowCount() - ($count * $numOfTeachers);
    } else {
    	$jTableResult["Message"] = $m;
    	$jTableResult["TotalRecordCount"] = 0;
    }

	print json_encode($jTableResult);
	$db = null;