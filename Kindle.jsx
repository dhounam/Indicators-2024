/*	
		Source path is assembled from:
		1) a hard coded root (c_fRoot, line 54)
		2) dated sub-elements. These are created by a function:
				extendTablePath, line 199

		Original version created 26 July 2011

		Update 05.09.2011
		Dialog box
		Adapt to restyle, which has alternate tints and
			rules separating sections...

		"Stubbed" 27.10.2011. This "main" file
		is now called by stubs on individual machines...

		*** Update 2 Apr 2013 adds Commodities ***
		This table processes via lesserKindle and unsplitTableTints
		Basically, it gets saved to the target folder with no changes...
		*** Poll of Forecasters added 3 Apr; same rules ***

		Update 14 Apr 2014 adds new function fixFootMatter, which
		inferentially fixes a problem (Table 1 only?) whereby the line
		turns get shifted in source/footnote para, so that the 2nd line
		inherits 1st lines deeper leading...

		Update 3 Apr 2017 redirects to new "Data" server for "Ilex master"...
		Update 10 July 2017 redirects to new "Graphics" server for "Ilex master"...
		
		Further updates, September 2018 for Revamp
		Also works with alternative local/server file structures

    Updated 2022 for revised path structure and rationalised arguments

	I'm handling four files:
	NAME	   		SOURCE FILE			   OUTPUT FILES
	EcoData1	 	ddmmyyyy_INT101	 	111, 121, 131
	EcoData2		ddmmyyyy_INT102	 	112, 122, 132
	Markets			ddmmyyyy_INT200		 210, 220, 230
	Commodities	ddmmyyyy_INT400		 410
  */

// Redundant ExtendScript debug flag
// $.level=1;

// CONSTANTS
// Test files are datestamped to 1 Jan 2099
var c_testDate = '20990101';

// File root string
var c_fRoot = "INT";
// File name separator
var c_fSeparator = '_';

// PATHS ARE HARD-CODED
// Local or server
// *** Source folder ***
var c_tableFolderLocal = "~/Desktop/Indicators-2023/kindle-source/"
var c_tableFolderServer = "/Volumes/Graphics/Images/5_Workflow_Out/The Economist/"
var c_tableFolderServerExtension = "/Web/eps/"
// *** Target folder: ***
var c_kindleFolderLocal = "~/Desktop/Indicators-2023/kindle-output/"
var c_kindleFolderServer = "/Volumes/Graphics/Images/3_Digital_Content_Platform/"

// Name of single block of text (Was "Text block" until Table 7 divided...
var c_tName = "Text block 1";

// GLOBALS
// LINE ARRAY
// Complete look-up array, which is modified on the fly
// Values are expressed in lines
// Each element in the main array corresponds to a single Table (Ecodata 1, Ecodata 2, Markets)
// 	(these are the only tables that split)
// Each element in turn consists of a six-element sub-array comprising:
//	0 	   - the number of HEADER lines)
//	1/2/3	- three SECTION LENGTH sub-sub-arrays for each section (A/B/C), each
// 	  		 listing the number of lines in each sub-section. For Markets, section 3's
//				 third array-value (5) is the number of lines in the US bonds appendix, which
//				 I'm treating as another section
//	4	    - the NUMBER of the file to read in and export...
//	5	    - the NAME of the table
//	6	    - a boolean, default false, set to TRUE if user checks table for processing
//          in the dialog box
//
//	Unsplit tables (Commodities) have first four elements empty...
//
//	0=EcoData1		101
//	1=EcoData2	  102
//	2=Markets   	201
//	3=Commodities 401
var g_lineArray = [
	[5,Array(5,10),Array(7,12),Array(5,4),"101","Ecodata 1","false"],
	[5,Array(5,10),Array(7,12),Array(5,4),"102","Ecodata 2","false"],
	[4,Array(8,10),Array(10,3),Array(4,2,5),"201","Markets","false"],
	[,,,,"401","Commodities","false"]
]
// Note that Commodities doesn't split. 401 is inferentially changed to 411 in 'Kindled' file name

var g_tableFolder = '';
var g_kindleFolder = '';
var g_splitFlag;				  // true=split tables; false=don't split
var g_kDoc;							  // Document object
var g_tNo;							  // Number of table to process
var g_backBox;						// Background box object
var g_leading;						// Text data range leading
var g_extraFirstLeading;	// Extra leading for first line of data range
var g_linesDeleted;				// Deleted lines counter
var g_backLayer;					// Background layer object
var g_ruleArray;					// Array of h-rules to move up
var msg;								  // General purpose
var g_tNameRoot;					// Table root name (YYYYwwINTn [omitting final "nn.eps"])
var g_firstDataLine;			// Index (from zero) of first data line

// TEST FLAG
var g_isTest;

// KINDLE
// Called from stub file
// isLocal flags local/server
// isTest flags test only
function Kindle(isLocal, isTest)
{
  // Test flag determines file dating
  // (Test files are datestamped to 20990101)
  if (typeof isTest === 'undefined') {
    g_isTest = false;
  } else {
    g_isTest = isTest;
  }

	var alertDone = false;			      // Flag for "done" alert
	var u = app.userInteractionLevel;	// Dialogs off
	app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

	// 1)
	// Check hard-coded paths
	if (!kindlePaths(isLocal)) {return};

  // 2)
	// Choose Table. Function returns false if none chosen
	// If true, flags tripped in g_lineArray
	if (!setTablesToProcess()) {return};

	// Still here?
	for (var i = 0; i < g_lineArray.length; i ++) {
		if (g_lineArray[i][6]) {
			g_tNo = i + 1;
			alertDone = forkKindle();
		}
	}

  if (alertDone) {alert("All done!")};

	// Reset dialogs flag
	app.userInteractionLevel = u;
}

// ********************************************************************
// PRELIMINARY FUNCTIONS

// KINDLE PATHS
// Called from KINDLE
// Checks that hard-coded source and target folders exist
function kindlePaths(isLocal)
{
	// Local or server paths...
	if (isLocal) {
		g_tableFolder = c_tableFolderLocal;
		g_kindleFolder = c_kindleFolderLocal;
	} else {
		g_tableFolder = c_tableFolderServer;
		g_kindleFolder = c_kindleFolderServer;
	}
	// Extend source folder down the hierarchy to a dated folder:
	extendTablePath();
	if (!checkPath(g_tableFolder)) {
		msg = g_tableFolder + "\nI can't access the root source folder. Please make sure the volume is mounted "
			+ "and that the dated subfolders exist...";
		alert(msg);
		return false;
	}
	if (!checkPath(g_kindleFolder)) {
		msg = g_kindleFolder + "\nI can't access the root Kindle drop-in folder. Please make sure the volume is mounted...";
		alert(msg);
		return false;
	}
	// Still here?
	return true;
}
// KINDLE PATHS ends

// EXTEND TABLE PATH
// Called from kindlePaths
// Extends table path (set as global to 'root' at top of file,
// to find a dated subfolder...
function extendTablePath() {
	var dNow, extPath, y, m, d, dStr;
	dNow = getNextSaturday();
	// Year as yyyy
	y = dNow.getFullYear();
	// Month as mm; from 1
	m = "00" + (dNow.getMonth() + 1);
	m = m.substr(m.length-2);
	// Date as dd
	d = "00" + dNow.getDate();
	d = d.substr(d.length-2);

	// Path extension -- for testing?
  if (g_isTest) {
    dStr = c_testDate;
  } else {
    dStr = y + m + d;
  }  
  
  // The path is extended with the date string and a constant:
	// extPath = dStr + "/" + dStr + "_InfoG/";
	extPath = dStr + c_tableFolderServerExtension;
	// Append extension to global: complete path to dated source folder
	g_tableFolder += extPath;
}
// EXTEND TABLE PATH ends

// SET TABLES TO PROCESS
// Displays dialog to update array with tables to process
function setTablesToProcess()
{
	// Returned value:
	var gotTables = false;
	// Number of tables
	var tLen = g_lineArray.length;

	// Dialog
	var dlg = new Window("dialog", "Select the tables you want to process...");
	dlg.size = [300, 250];	// width, depth
	dlg.margins = [20,30,20,20];
	dlg.orientation = 'column';
	// Overall group for checkboxes
	var cbGrp = dlg.add("group", undefined, {orientation: 'row'});
	cbGrp.bounds = {x:0, y:0, width:260, height:100};
  // Loop on table definitions
	var yPos = 0;
	for (var i = 0; i < tLen; i ++) {
		// Table checkbox with names
		var tCB = cbGrp.add('checkbox', undefined, g_lineArray[i][5]);
		tCB.bounds = {x:10, y:yPos, width:200, height:15};
		// Adjust vPos
		yPos += 20;
	}
	// Process all button
	var allCB = dlg.add('checkbox', undefined, "Process all");
	allCB.bounds={x:10, y:yPos + 10, width:100, height:15};
	allCB.onClick = function() {
		for (var i = 0; i < tLen; i ++ ) {
			cbGrp.children[i].value = allCB.value
		}
	}
	// OK/Cancel buttons
	var btnGrp = dlg.add("group", undefined, {orientation: 'row'});
	btnGrp.bounds = {x:105, y:yPos + 20, width:210, height:50}
	var cancelBtn = btnGrp.add("button", [0, 10, 80, 30], "Cancel", {name: "cancel"});
	var okBtn = btnGrp.add("button", [100, 10, 180, 30], "OK", {name: "ok"});

	// OK and Cancel button click events close dialog
	okBtn.onClick = function() {
		// Loop through table definitions array, setting "process" flag
		// to the value of the corresponding "active" checkbox
		for (var i = 0; i < tLen; i ++ ) {
			g_lineArray[i][6] = cbGrp.children[i].value;
		}
		gotTables = true;
		dlg.close();
	}
	cancelBtn.onClick = function() {
		dlg.close();
	}
	dlg.show();
	return gotTables;
}
// SET TABLES TO PROCESS ends

// IS SPLIT TABLE
// Checks selected Table number against array to determine whether this is a splittable table
function isSplitTable()
{
	var isST = true;
	var gT = g_lineArray[g_tNo-1][0];
	// If Table has empty array...
	if (gT == undefined) {isST = false};
	return isST;
}
// IS SPLIT TABLE ends

// FORK KINDLE
// Called from Kindle to determine whether table is splittable
// and to call appropriate processes...
// Table number is in global g_tNo
function forkKindle()
{
	// Check whether this is a splittable table
	// If so, run the complete process and save
	// If not, just tweak tints and save
	try {
		if (isSplitTable()) {
			return fullKindle();
		}
		else
		{
			return lesserKindle();
		}
		return true;
	}
	catch (err) {return false};
}
// FORK KINDLE ends

// ********************************************************************
// Main KINDLE controllers
// 		* fullKindle splits file and saves each section as separate file
//		* lesserKindle just changes tints and saves entire file

// FULL KINDLE
// Called from forkKindle. Controls section passes through the file
function fullKindle()
{
	var i;	// Counter
	try {
		for (i = 1; i < 4; i ++) {
			// Reset for each section pass:
			g_linesDeleted = 0;
			g_ruleArray = new Array();

			// Open source file
			if (!getSourceTable()) {
				return false;
			}
			else {
				if (kSplit(i)) {
					if (saveKindle(i)) {
						g_kDoc.close(SaveOptions.DONOTSAVECHANGES);
					}
				}
			}
		}
		return true;
	}
	catch (err) {return false};
}
// FULL KINDLE ends

// LESSER KINDLE
// Called from forkKindle to process non-split file
// Just re-tints and saves
function lesserKindle()
{
	try {
		// Open source file
		if (!getSourceTable()) {
			return false;
		}
		else {
			if (unsplitTableTints()) {
				if (saveKindle(undefined)) {
					g_kDoc.close(SaveOptions.DONOTSAVECHANGES);
				}
			}
			else {
				g_kDoc.close(SaveOptions.DONOTSAVECHANGES);
			}
		}
	return true;
	}
	catch (err) {return false};
}
// LESSER KINDLE


// ********************************************************************
// COMMON HANDLERS
// Shared by both split and non-split tables

// GET SOURCE TABLE
// Opens source file
function getSourceTable()
{
	var f;
	// Complete source file path
	var theFile = tFileName();
	if (theFile == undefined) {
		return false;
	}
	// File exists. Open it, read-only:
	f = new File(theFile);
	f.readonly = true;
	g_kDoc = app.open(f, DocumentColorSpace.CMYK);
	if (g_kDoc == undefined) {return false};
	return true;
}
// GET SOURCE TABLE ends

// T FILE NAME
// Returns name of an existing source file
function tFileName()
{
	var f;					// Name of sought table file
	var fullPath;		// Complete path to return

	// Get "this" issue's date from system (as date obj)
	var currentDate = getNextSaturday();
	var sName = dateToYYYYMMDD(currentDate);  
  // But, for testing:
  if (g_isTest) {
    sName = c_testDate;
  }
	// Separator (currently underscore)
	sName += c_fSeparator;
	f = sName + c_fRoot;
	// Reserve file root for target file name [see function saveKindle(), below]
	g_tNameRoot = f;
	// Complete source file name
	var tNo = g_lineArray[g_tNo - 1][4]
	f += (tNo + ".eps");

  // Prefix full path
	fullPath = g_tableFolder + f;
	if (!checkPath(fullPath)) {
		msg = f + "\nI can't find this file in the source folder\n\n(full path is " +
    fullPath + ")...";
		alert(msg);
		return undefined
	}
	// Still here? file exists
	return fullPath;
}
// T FILE NAME ends

// SAVE KINDLE
// Saves kindled file as EPS
function saveKindle(n)
// Called from fullKindle or lesserKindle
// Arg is split-section number (1, 2 or 3) to append to file name
// If n is undefined, save without split-section suffix
// (File root name is reserved in global g_tNameRoot in format YYYYmmDD_INTn
//	This function appends two digits and ".eps")
{
	var fName, idNo;
	try {
		// Set artboard to background box
		var abArray = [
			g_backBox.left, 					 	 		// left
			g_backBox.top,					  				// top
			g_backBox.left + g_backBox.width,	 // right
			g_backBox.top - g_backBox.height	// bottom
		];		
		g_kDoc.artboards[0].artboardRect = abArray;
	}
	catch (err) {
		alert(fName + ":\nI failed to set the crop box correctly. Please fix by hand...");
	}

	// Added July 2018: delete rects group
	try {
		var rectsLayer = g_kDoc.layers['Rects'];
		rectsLayer.remove();
	}
	catch(err) {};


	// Save
	try {
		// File name
		if (n == undefined) {
			// Unsplit; no section number, so hard-codes to '1' (401 to 411)
			fName = g_kindleFolder + g_tNameRoot;				//"00.eps";
			idNo = g_lineArray[g_tNo - 1][4];
      // Inferentially substitute '1'
      idNo = idNo.charAt(0) + '1' + idNo.charAt(2);
			fName += (idNo + ".eps");
		}
		else {
			// Split files overwrite 1/2/3 into 2nd number of id
			// So g_tNameRoot is something like "20110813_INT"
			// I append table number from g_lineArray
			fName = g_kindleFolder + g_tNameRoot;
			idNo = g_lineArray[g_tNo - 1][4];
			idNo = idNo.charAt(0) + n + idNo.charAt(2);
			fName += (idNo + ".eps");
		}

		// File object
		var kF = new File(fName);

		// Save as EPS
		var saveOpts = new EPSSaveOptions();
		saveOpts.embedAllFonts = true;
		g_kDoc.saveAs(kF, saveOpts);

		return true;
	}
	catch (err) {
		alert(fName + ":\n...file save failed");
		return false;
	}
}
// SAVE KINDLE ends

// ********************************************************************
// SPLIT-ONLY HANDLERS
// Functions called from fullKindle to carry out split processes

// K SPLIT
// Called from fullKindle to control a split (1-3) on the open table
// Calls various sub-functions to carry out specific tasks
function kSplit(kNo)
// Arg is split number (1-3)
{
	var kcArray;		// Array of lines at which to split
	var tRange;		  // Text range
	var i;			    // Counter
	var tBox;

	try {
		// PRELIMINARIES
		// Stuff I need to know about the table
		g_backLayer = g_kDoc.layers["Background"];
		try {
			g_backBox = g_backLayer.pathItems["Background box 1"];
		}
		catch (err) {
			try {
				g_backBox = g_backLayer.pathItems["Background box"];
			}
			catch (err) {
				Alert("Unable to identify background box, so can't proceed...");
				return false;
			}
		}
		// Text range
		tRange = g_kDoc.textFrames[c_tName];

		// Work out split points (as line numbers)
		// Retrieve sub-array listing no. of lines in headers, Section 1, Section 2, Section 3, id, name
		kcArray = g_lineArray[g_tNo-1];
		// Index of first data line, based on number of headers
		g_firstDataLine = kcArray[0];

		// Define top and bottom snip-lines, according to section (A/B/C)
		switch (kNo) {
			case 1:
				topA = undefined;
				topB = undefined;
				bottomA = sumLines(kcArray,1);
				bottomB = sumLines(kcArray,3);
				break;
			case 2:
				topA = kcArray[0];
				topB = sumLines(kcArray,1)
				bottomA = sumLines(kcArray,2);
				bottomB = sumLines(kcArray,3);
				break;
			case 3:
				topA = kcArray[0];
				topB = sumLines(kcArray,2);
				bottomA = undefined;
				bottomB = undefined;
				break;
		}

		// Get leading
		// This is complicated by the fact that first data line may have
		// a different leading from the others
		// Get "normal" leading: for 2nd data line use no. of header rows + 1
		g_leading = tRange.paragraphs[(kcArray[0] + 1)].characterAttributes.leading;
		// First data line leading
		g_extraFirstLeading = (tRange.paragraphs[(kcArray[0])].characterAttributes.leading) - g_leading;

		// PROCESSING
		// Delete unwanted lines from text range
		if (!cutParas(topA, topB, bottomA, bottomB, tRange)) {return false};

		// Horizontal rules are in "Lines" layer
		// Delete unwanted...
		rLayer = g_kDoc.layers["Lines"];
		if (!cutHRules(topA, topB, bottomA, bottomB, rLayer)) {return false};

		// Amount by which to reduce height of text box, based on leading
		// and adjusted for extra leading on first data line:
		var reduceBy = (g_linesDeleted * g_leading) - g_extraFirstLeading;
		// Reduce height of text box
		tRange.textPath.height -= reduceBy;

		if (!tidyHRules(rLayer, kNo)) {return false};

		// Reduce height of background box
		// (Number of lines deleted * leading; allowing for extra leading on first data line)
		g_backBox.height -= ((g_linesDeleted * g_leading) - g_extraFirstLeading);

		// Tint boxes
		// As far as I can see, all I need to do is work out how many I need...
		// ...and delete the rest
		// How many lines?
		var lineCount = arraySum(kcArray[kNo])
		var tCount = Math.round(lineCount/2);
		// Loop thro back layer, deleting "excess" tints
		for (i = g_backLayer.pathItems.length - 1; i >= 0; i --) {
			tBox = g_backLayer.pathItems[i];
			if (tBox != g_backBox) {
				var s = tBox.name.replace("Tint box ","");
				var tNo = parseInt(s);
				if (tNo <= tCount) {
					// Tint box is "in range": make grey
					// Comm'd out
					// tBox.fillColor = makeGrayObject(10);
				}
				else {
					// Tint box is out of range: delete
					tBox.remove();
				}
			}
		}
		// Append section number to title string
		tRange.paragraphs[0].contents = tRange.paragraphs[0].contents + " (" + kNo + " of 3)";
		// Inferential tweak to fix leading on foot matter
		fixFootMatter(tRange);
		return true;
	}
	catch (err) {return false};
}
// K-SPLIT ends

// FIX FOOT MATTER
function fixFootMatter(tRange) {
	var fPara, lCount, thisLine, i, bestLead;
	// Isolate footmatter para. This may consist of several lines...
	fPara = tRange.paragraphs[tRange.paragraphs.length - 1];
	lCount = fPara.lines.length;
	// If there's more  line of foot matter...
	if (lCount > 1) {
		// Get leading of last line
		bestLead = fPara.lines[lCount - 1].leading;
		// Loop down to 2nd line, forcing leading
		for (i = lCount - 1; i > 0; i --) {
			fPara.lines[i].leading = bestLead;
		}
		// Failsafe, if only two lines, prevents excessive leading
		// on 2nd line by forcing inferentially to 7...
		if (lCount === 2) {
			if (fPara.lines[1].leading === fPara.lines[0].leading) {
				fPara.lines[1].leading = 7;
			}
		}
	}
}
// FIX FOOT MATTER ends

// SUM LINES
// Called from kSplit
// Calculates the number of lines to be processed
function sumLines(inArray, n)
// Args are:
//		array from which to extract numbers
//		number of elements in array to add up
//			(this array consists of number [header rows] followed by
//			  a series of sub-arrays of numbers)
{
	var i;
	// My first array element should always be a single number --
	//		the number header rows
	// (if not, I'm in trouble anyway)
	var mySum = inArray[0];
	// Now add up the relevant arrays...
	for (i = 1; i <= n; i ++) {
		mySum += arraySum(inArray[i]);
	}
	return mySum;
}

// CUT PARAS
// Called from kSplit to delete top and/or bottom text ranges
function cutParas(aA, aB, zA, zB, t)
// Args are:
//	top line of top section to cut
//	bottom line of top section to cut
//	top line of bottom section to cut
//	bottom line of bottom section to cut
//	text range
{
	try {
		// DELETE REDUNDANT TEXT
		// Bottom
		if (zA != undefined) {
			for (i = zB -1; i >= zA; i --) {
				t.paragraphs[i].remove();
				g_linesDeleted ++;
			}
		}
		// Top section
		if (aA != undefined) {
			for (i = aB -1; i >= aA; i --) {
				t.paragraphs[i].remove();
				g_linesDeleted ++;
			}
		}
		t.paragraphs[g_firstDataLine].leading = (g_leading + g_extraFirstLeading);
		return true;
	}
	catch (err) {return false};
}
// CUT PARAS ends

// CUT H RULES
// Called from kSplit to delete top and/or bottom ranges of horizontal rules
function cutHRules(aA, aB, zA, zB, rL)
// Args are:
//	top line of top section to cut
//	bottom line of top section to cut
//	top line of bottom section to cut
//	bottom line of bottom section to cut
//	layer containing horizontal rules
{
	var thisR;
	var n;
	var pattern = /\s+/g;
	//$.bp();
	try {
		// DELETE REDUNDANT LINES
		// Bottom
		if (zA != undefined) {
			for (i = rL.pathItems.length - 1; i >=0; i--) {
				thisR = rL.pathItems[i];
				// Get rule name; split at colon; trim number...
				var rNameArray = thisR.name.split(":");
				// Mod, July 2018, excludes vertical header dividers in EcoData
				if (rNameArray.length > 1) {
					n = rNameArray[1];
					n = parseInt(n.replace(pattern,""));
					if ((n > zA) && (n <= zB)) {
						// prev was "< zB"
						thisR.remove();
					}
					else {
						if (!isNaN(n)) {
							if (n > g_lineArray[g_tNo - 1][0]) {
								// Do it on aA/aB loop only
								//g_ruleArray.push(thisR);
							}
						}
					}
				}
			}
		}
		// Top
		if (aA != undefined) {
			for (i = rL.pathItems.length - 1; i >=0; i--) {
				thisR = rL.pathItems[i];
				// Get rule name; split at colon; trim number...
				var rNameArray = thisR.name.split(":");
				if (rNameArray.length > 1) {
				n = rNameArray[1];
					n = parseInt(n.replace(pattern,""));
					if ((n > aA) && (n <= aB)) {
						// prev was "< aB"
						thisR.remove();
					}
					else {
						if (!isNaN(n)) {
							if (n > g_lineArray[g_tNo - 1][0]) {
								g_ruleArray.push(thisR);
							}
						}
					}
				}
			}
		}
		return true;
	}
	catch (err) {return false};
}
// CUT H RULES ends

// TIDY H RULES
// Called from kSplit
// Sets last line to solid and moves "floating" horizontal rules up (sections 2 and 3 only)
function tidyHRules(rL,sNo)
// Args are:
//		layer containing horizontal rules
//		current section
{
	var h;
	var i;
	var thisR;
	var bottomLine;
	var hMove;
//$.bp()
	try {
		h = g_backBox.top;
		// Move up floating rules
		hMove = 0;
		for (i = 1; i < sNo; i ++) {
			hMove += arraySum(g_lineArray[g_tNo - 1][i]);
		}
		hMove = hMove * g_leading

		for (i = 0; i < g_ruleArray.length; i ++) {
			try {
				g_ruleArray[i].top += hMove;
			}
			catch (err) {};
		}

		// To identify the bottom line...
		// Loop by lines in the layer
		for (i = 0; i < rL.pathItems.length; i++) {
			// Winkle out the bottom line by comparing positions
			thisR = rL.pathItems[i];
			if (thisR.top < h) {
				bottomLine = thisR;
				h = thisR.top;
			}
		}

		// Set last line to solid:
		bottomLine.strokeDashes = Array()
		return true;
	}
	catch (err) {return false};
}
// TIDY H RULES ends

// RESIZE T-BOX
// Called from kSplit to reset size of first tint box
// and duplicate it and resize for any subsequent boxes...
function resizeTBox(tb, sNo)
// Args are:
//		the "top" tinted box object
//		the section number (1-3)
{
	var tbDepth;
	var tbArray;
	var i;
	var newBox;
	var bTop;

	try{
		bTop = tb.top;
		// Get array of sub-section line-counts
		// 		(2 elements -- on/off -- except section 3 of table 5 which has 5 elements: on/off/on/off/on)
		//		(NB: because sub-array ignores a first header line-count, sNo does not subtract 1...)
		tbArray = g_lineArray[g_tNo - 1][sNo];

		for (i = 0; i < tbArray.length; i ++) {
			// Get number of lines in Array
			// Multiply by leading
			tbDepth = tbArray[i] * g_leading;
			if (i == 0) {tbDepth += g_extraFirstLeading};

			// Looping thro array from zero
			// So *even* elements correspond to *odd* tinted subsections (1, 3, 5...)
			if ((i % 2) == 0) {
				// Odd-numbered subsections have a tinted box...
				if (i == 0) {
					// First box is already in place
					tb.height = tbDepth;
				}
				else {
					// Subsequent boxes are copies of original
					newBox = tb.duplicate(tb.parent);
					newBox.top = bTop;
					newBox.height = tbDepth;
				}
			}
			// Increment distance down...
			bTop -= tbDepth;
		}
		return true;
	}
	catch (err) {return false};
}
// RESIZE T-BOX ends


// *******************************************************************************************
// Non-split functions

// UN-SPLIT TABLE TINTS
// Called from lesserKindle. Code is intensely inferential.
// Was for Commodities only, but no longer does anything,
// since we don't seem to retint any more.
// Simply returns true
function unsplitTableTints()
{
	var tBox;
	try {
		// Back layer and back box
		// *** IMPORTANT: declared globally ***
		g_backLayer = g_kDoc.layers["Background"];
		g_backBox = g_backLayer.pathItems["Background box 1"];
		/*
		for (i = g_backLayer.pathItems.length - 1; i >= 0; i --) {
			tBox = g_backLayer.pathItems[i];
			if (tBox === g_backBox) {
				tBox.fillColor = makeGrayObject(0);
			}
			else {
				// All tinted boxes are greyed
				tBox.fillColor = makeGrayObject(10);
			}
		}
		*/

		// I've also commented out some ancient code that handled a red flash
		/*
		if (g_tNo == 2) {
			//g_backLayer.pathItems["Flash"].fillColor = makeGrayObject(100)
		}
		*/
		return true;
	}
	catch (err) {
		alert("Table " + g_tNo + "\nSomething went wrong when I tried to convert the tint boxes to grayScale. " +
			"The table will be closed unsaved...");
		return false;
	}
}
// UN-SPLIT TABLE TINTS ends

// *******************************************************************************************
// UTILITY FUNCTIONS

// MAKE GRAY OBJECT
// Returns a % grayScale object
function makeGrayObject(n)
// Arg is percent gray
{
	var gC = new GrayColor();
	gC.gray = n;
	return(gC);
}
// MAKE GRAY OBJECT ends

// CHECK PATH
// Checks existence of folder or file; returns true or false
// Called from kindlePaths and tFileName
// No alert
function checkPath(thePath)
// Arg:		path as string
{
	if (!File(thePath).exists) {
		return false;
	}
	return true;
}
// CHECK PATH ends

// ARRAY SUM
// Passed an array, simply adds and returns its contents
// Called from sumLines and tidyHRules
function arraySum(a)
{
	var i;
	var n = 0;
	for (i = 0; i < a.length; i ++) {
		n += a[i]
	}
	return n;
}
// ARRAY SUM ends

// GET NEXT SATURDAY
// Called from extendTablePath and tFileName
// Returns next Saturday (as Date object)...
function getNextSaturday()
{
	// Today's date + time
	var myNow = new Date();
	// Pull out day (Sun=0 to Sat=6) and hour
	var myDay = myNow.getDay();
	var myHour = myNow.getHours();
  
	// Time to Saturday in ms
  var lDay = 1000 * 60 * 60 * 24;	// One day
	var toSat = (6 - myDay) * lDay;
	// Issue date is Saturday; get as time in ms
	var issueTime = myNow.getTime() + toSat;

	// Issue date is Saturday; get as time in ms
	var issueTime = myNow.getTime() + toSat;
	// For Kindle, anything after end of Friday (ie, on Saturday) is next week
  var lWeek = lDay * 7;	 // One week
	if (myDay > 5) {issueTime += lWeek};
	// Return default-issue Saturday as date
	return new Date(issueTime);
}
// GET NEXT SATURDAY ends

// DATE TO YYYY MM DD
// Called from tFileName
// Passed a date object, returns yyyy-mm-dd string
function dateToYYYYMMDD(dObj)
{
	var myDate = new Date(dObj);
	var m = (myDate.getMonth() + 1).toString();
	if (m.length == 1) {m = "0" + m};
	var d = (myDate.getDate()).toString();
	if (d.length == 1) {d = "0" + d};
	var dStr = myDate.getFullYear().toString() + m + d;
	return dStr;
}
// DATE TO YYYY MM DD ends
