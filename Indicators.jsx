/*	Indicators: "main" JS file
	2011 version for untagged XML data files and table-specific XML lookup files
	Work started 4 April 2011
	Update 08 May 2012 (Mac and Windows paths)
	Updated to new servers, April 2017
	Updated to new styles, 2018
  Revised file locations, 2022
  Remove Ilex component dependencies, April-May 2022
  Cleaning up, August 2022

  *******************************************************
  I did some further rationalisation during February 2023
  *** THIS VERSION IS NOT LIVE ***
  As of Feb'23 the 'live' version is working perfectly well, so
  why fiddle?
  *This version* goes to the Git repo for checking and use IF
  further changes to the Indicators process are required.
  *******************************************************

  Update March'23 to delete rogue Haver source string attached to
  footnote of print Ecodata and digital Ecodata1 tables
  
  As of 2022, only three tables are drawn: ECODATA, MARKETS and COMMODITIES
  However, references persist in the code to the redundant POLL, etc

	"Stub" file passes 3 args
		isLocal to use local config file and paths
		isMac for Windows/Mac paths
    isTest -- if true, override file datestamp with Jan 1 2099 (20990101)

	STRUCTURE:
		DECLARATIONS
			CONSTANTS
			GLOBALS
		ROOT FUNCTION: Indicators
		START-UP FUNCTIONS
		TEXT FUNCTIONS
			drawText
*/

// ************
// DECLARATIONS
// ************

// *** CONSTANTS ***

// GENERAL
const c_authorName = "Donald Hounam";
const c_authorPhone = "07825 994445";

// PATHS
// I need paths to the configuration file, Mac/Window
// On Mac I can refer to server or local config file
// PATH TO LOCAL DEV SETUP CHANGED FEB'24
const c_configFileMacLocal = "~/Development/Indicators/Indicators_config.xml";
// NETWORK PATHS CHANGE LATER, FOR DEPLOYMENT (but basically, just lose the '2023' suffix)
const c_configFileMacServer = "/Volumes/Data/Indicators/Indicators_config.xml";
// Windows has only a server version
const c_configFileWindows = "/T/Indicators/Indicators_config.xml";

// Tab character
const c_tabChar = "	";
// Path separator
const c_pS = "/";
// Filename elements
const c_fileID = "_INT";
const c_extension = ".eps";

// Two spaces between footnote and source strings
const c_betweenFootnoteAndSource = ".  ";
// New-line marker in source
// New-line substitutions in footnotes
// Allows for "@" and "&" prefix
const c_newlineSpace = "@newline ";
const c_newlineNoSpace = "@newline";
const c_newlineAmpSpace = "&newline ";
const c_newlineAmpNoSpace = "&newline";
const c_return = String.fromCharCode(13);

// Some colour objects
// Positive/negative-value rectangle colours
const c_posCMYK = {
	cyan: 0,
	yellow: 0,
	magenta: 0,
	black: 15
}
const c_negCMYK = {
	cyan: 0,
	yellow: 30,
	magenta: 30,
	black: 0
}
var c_blackTextCMYK = makeColourObject([0,0,0,100]);
var c_greyTextCMYK = makeColourObject([0,0,0,75]);

// Development var: we stop looping thro data lines after this value
// with or without foot matter. Reset to, say, 10...
var c_stopWithFootMatter = 1000;
var c_stopNoFootMatter = 1000;

// "The Economist" for italics
const c_ecoString = "The Economist";
// String for zero values
const c_zeroConst = "nil";

// Dynamic dates in lookup file headers. Constants match strings in
// lookup file headers. These aren't currently used: dates come in
// with XML
const c_shortDateMarker = "@shortdate"		// Mmm dd/th
const c_thisYearMarker = "@thisyear"
const c_lastYearMarker = "@lastyear"
const c_endLastYearMarker = "@endlastyear"	// Dec 31st yyyy

// Array of month names
const c_MonthArray = ["Jan","Feb","March","April","May","June","July","Aug","Sept","Oct","Nov","Dec"];

// INFERENTIAL: line at which Bonds headers begin
// This should probably be in the config file...
const c_marketsBondsCount = 38;

// Array of footnote symbols used
const c_symbolMatchArray = ["†","‡","§","¶"];
// Spaces inserted when footnotes are appended to values that
// appear in coloured rects; and amount by which to adjust tab
const c_footnoteSpaces = "     ";		// 5 spaces
const c_footnoteSpaceTabTweak = 8.16;

// Line cap/miter defaults (used for shapes)
const c_defaultLineEnd = 0;
const c_defaultLineMiter = 0;
const c_defaultLineMiterLimit = 6;

// Date-stamp for test-file naming
const c_testDate = '20990101';
// Rogue source string to delete from Ecodata footnotes
const c_rogueSourceString = ' Source Source: Haver Analytics ';
// Another inferential tweak, Oct'23, string appends to footnote
// in ECODATA and ECODATA1
const c_ecoDataExtraNote = ' Note: Euro area consumer prices are harmonised.'

// *** GLOBALS ***

// Mac or Windows config file:
var g_configFile;
// Paths defined in config file
var g_sourcePath;
var g_lookupPath;
var g_targetPath;
// Subfolders in target folder
var g_prnFolder;
var g_webFolder;
var g_devFolder;

/*  XML objects
		table definitions (from config file)
		table data (from database)
		lookup definitions
*/
var g_tableConfigObj;	// defines root name; holds processing flag
						// and defines targets
var g_fontConfigObj;	 // "fonts" node of config file
var g_dataXMLObj;
var g_lookupXMLObj;

// The document object (init'd when a new doc is opened)
var g_myDoc;

// Fonts lookup object
// I declare all fonts used (currently 4: book, medium, bold and italic) in the
// configuration file.
var g_fontsObj = new Object();

// Text box references
var g_iFrame;	            // "Current"
var g_iFrame1;	          // Remember for 2-col tables
var g_iFrame2;
var g_iTextBox;	          // Text box in which I'm working
								          // (for Markets, this changes)

// MARKETS specifics:
var g_iTextBox2;		      // Additional text box for RESERVES ONLY
var g_firstbaseHeight	    //  Baseline remembered in col 1 to pick up in any 2nd col
var g_hasSecondTextBox;	  // 2nd text box flag
var g_textBox2JumpCount;	// dataLine count at which we "jump" to any second text box
								          // (set beyond all human decency by default)

var g_Attributes;		      // Current paragraph attributes object

// Overall line counter (headers/data/source)
var g_lineCount = 1;

// Header flag (turned off after headers drawn; used by getRule)
var g_isHeader;
// First data line flag (for firstLeading)
var g_firstData;
// Data counter
var g_dataCount;
// Tint box counter
var g_tintBoxCounter;
// Current line baseline tracker
var g_baseHeight;
// Document view
var iView;
// Text overprints
var g_overprintText;
// Global holder for top of on/off tint box; initially undefined
var g_tintBoxTop;
// Four layers
var g_backLayer;
var g_rectLayer;
var g_lineLayer;
var g_textLayer;

// Section end and bottom dataline flags
// g_sectionEnd is true to force tinting to start at top of data block
var g_sectionEnd;
var g_finalDataItemFlag;

// _______________
// Rules and tints

// Flags in lookup file
var g_hasTints;		  // general flag
var g_everyOther;	  // true for alternating tints; false for section-based

// VPos for top of any tint (everyOther or not; "on" or "off"
// This is set to baseline as we drop down headers, so that
// it's set to the position of the final header rule...
var g_tintTopPos;
// VPos for bottom of any tint
var g_tintBottomPos = 0;
// Tinting flag alternates on and off
var g_tintOnFlag;

// Left of current text box
// This is used as "anchor" for drawing rules
var g_rStart;

// Boolean g_isLocal is set in fcn Indicators(), from the param sent by the calling stub
// If TRUE:
//	I'm running an entirely local test, using the "localPaths" node of a local config file
// If FALSE:
//	I'm processing a "live" XML file, outputting to the workflow...
// 	...and I use the "serverMacPaths" or "serverWinPaths" node of the config file...
//	 ...depending on the Mac/Windows flag set in the stub file
var g_isLocal;
// MAC/WINDOWS flag
var g_isMac;
// TEST FLAG
var g_isTest;

// Flag tripped by checkbox in dialog. If true, export files are dated to previous week...
// Now removed (see fcn setTablesToProcess)
// var g_previousWeekFlag = false;

// "Miss" string counter increments each time we hit a missing value
// Set to zero for each table; reports at end
var g_missCounter;
// Colour object for emphasising Misses
var g_missColourObj = makeColourObject([0,100,100,0]);
// And since we might colour up Misses, we need a default colour:
var g_blackColourObj = makeColourObject([0,0,0,100]);
// And, for grey text...
var g_greyColourObj = makeColourObject([0,0,0,75]);

// Added Apr 2015: flag for special URL appended to print Poll source:
var g_addPollURL;

// Overprint flag
var g_overprintStroke = true;

// Flag to prevent extended looping on failing AI_Primitives 'make-' handlers
var g_primitiveError=false;

// Extendscript debug flag
// $.level = 1;


// *********
// FUNCTIONS
// *********

/*
	Indicators
		Main function, called from stub file
		Calls three startup routines--
		*	readConfig
				Reads in configuration file (location hard-coded above)
    * extractFontsUsed
        Gets font objects
		*	setTablesToProcess
				Displays table-selection dialog
				Updates array to indicate which tables to process
		*	runMainTableLoop
				Runs through the array, calling functions to process individual tables

  For each table whose "process" flag has been set to true, runMainTableLoop
  calls processTable
    This calls a sequence of functions, particularly:
      *	getIData
        reads in data for one table
      *	getILookup
        reads in lookup file for one table
      *	openIFile
        opens template and creates background + flash
      *	makeIBox
        duplicates background box as text frame

    drawText
      Called from Indicators to add text to text object, line by line
      This calls:
        doSourcesTweak -	inferential tweak of sources range
        initBaseLine	-	calc baseline of first line
        buildLine		-	controls entering 1 para
        drawRule		-	draws header underline
        checkRule		-	checks source for successive underlines, which indicate a rule
        setAttributes
        drawRuleAcross	-	draws data rule
        doTint			-	draws background tinted box(es)
          removed: setFName		- 	font name
        defaultParaObject	default para attributes
        extractPAs
        iTranslate		-	Windows/Mac character conversion
*/

// INDICATORS
// Top-level function called from local stub Indicators.jsx
// This calls a series of child functions through setup, processing and saving...
function Indicators(isLocal, isMac, isTest)
{
	// Set the "Server" flag
	g_isLocal = isLocal;

  // First: determine which config file to use
  // Paths to local and network config files are defined as constants, above
	// Mac/Windows:
	g_isMac = isMac;
	// On Mac, I can use server or local config file
	if (g_isMac) {
		if (g_isLocal) {
			g_configFile = c_configFileMacLocal;
		} else {
			g_configFile = c_configFileMacServer;
		}
	}
	else {
    // Windows only uses server config
    if (g_isLocal) {
      // Locally under Windows? Nope.
      alert('There is currently no provision for local development under Windows. Sorry...');
      return;
    } else {
      g_configFile = c_configFileWindows;
    }
	}

    // Test flag (legacy catch)
    if (typeof isTest === 'undefined') {
        g_isTest = true;
    } else {
        g_isTest = isTest;
    }

	// 1)
	// Read in configuration file
	// This includes names, targets and processing flag for each table
	// Also defines all paths to source, temp and target folders
	if (!readConfig()) {return};

  // 2)
  // Extract fonts defined in config file
	// These are inserted as objects in the g_fontsObj object
	// I can now retrieve as required, on the fly...
	extractFontsUsed();

	// 3)
	// Which Indicators do we process?
	// This function constructs the table-selection dialog and
	// updates g_tableConfigObj to determine which tables to process
	if (!setTablesToProcess()) {return};

  // 4)
	// g_tableConfigObj contains a series of objects, each of whose "process"
	// property is "true" if we want to process it...
	// Loop through tables, processing those where "process" is true
	runMainTableLoop();
}
// INDICATORS ends

// ***********
// CONFIG FILE
// ***********

// READ CONFIG
// Called from Indicators. Reads config XML file
// then calls decodeConfigXML to unpick it
function readConfig()
{
	// Read it in:
	var configXMLObj = readXMLFile(g_configFile);
	if (configXMLObj) {
		// Now "translate" the XML file
		return decodeConfigXML(configXMLObj);
	}
	else {
		// File not read in
		var msg = "Failed to read in configuration file. "
		alert(msg);
		return false;
	}
}
// READ CONFIG ends

// DECODE CONFIG XML
// Called from readConfig to decode config file
function decodeConfigXML(o)
// Param is xml object from config file
{
	// Table names
	g_tableConfigObj = o.tables.table;
	// Paths
  // There was previous provision for a separate test path structure. That was ditched early 2022
  // in favour of datestamping test files to 20990101
  // if (g_isTest) {
  //   // Test
  //   if (g_isMac) {
  //     g_sourcePath = o.testMacPaths.sourcePath.toString();
  //     g_lookupPath = o.testMacPaths.lookupPath.toString();
  //     g_prnFolder = o.testMacPaths.prnFolder.toString();
  //     // g_webFolder = o.testMacPaths.webFolder.toString();
  //     g_digFolder = o.testMacPaths.digFolder.toString();
  //   }
  //   else {
  //     g_sourcePath = o.testWinPaths.sourcePath.toString();
  //     g_lookupPath = o.testWinPaths.lookupPath.toString();
  //     g_prnFolder = o.testWinPaths.prnFolder.toString();
  //     // g_webFolder = o.testWinPaths.webFolder.toString();
  //     g_digFolder = o.testWinPaths.digFolder.toString();
  //   }
  // } else { 
  // Local-dev or network
  if (g_isLocal) {
      // My local dev paths
      g_sourcePath = o.localPaths.sourcePath.toString();
      g_lookupPath = o.localPaths.lookupPath.toString();
      g_prnFolder = o.localPaths.prnFolder.toString();
      // g_webFolder = o.localPaths.webFolder.toString();
      g_digFolder = o.localPaths.digFolder.toString();
  } else {
      // Live paths, input from Research server, output to Graphics for Mac and Windows
      if (g_isMac) {
        g_sourcePath = o.serverMacPaths.sourcePath.toString();
        g_lookupPath = o.serverMacPaths.lookupPath.toString();
        g_prnFolder = o.serverMacPaths.prnFolder.toString();
        // g_webFolder = o.serverMacPaths.webFolder.toString();
        g_digFolder = o.serverMacPaths.digFolder.toString();
      } else {
        g_sourcePath = o.serverWinPaths.sourcePath.toString();
        g_lookupPath = o.serverWinPaths.lookupPath.toString();
        g_prnFolder = o.serverWinPaths.prnFolder.toString();
        // g_webFolder = o.serverWinPaths.webFolder.toString();
        g_digFolder = o.serverWinPaths.digFolder.toString();
    }
  }

	// There's a problem with remote working, where Research appears, not as a volume,
	// but as a folder in the EdShared volume. So test if we can see Research...
	// ...and if not, insert "EdShared"...
    if (g_isMac) {
        if (!File(g_sourcePath).exists) {
            g_sourcePath = g_sourcePath.replace("/Research/","/EdShared/Research/");
        }
    }

	// Fonts
	g_fontConfigObj = o.fonts;
	// Initialise para attributes object with valid default values
	g_Attributes = new defaultParaObject(o.defaultAttributes);
	return true;
}
// DECODE CONFIG XML

// DEFAULT PARA OBJECT
// Called from decodeConfigXML
// Initialises a paragraph attributes object with
// default values. Done once, for all.
// Arg is the defaultAttributes node of the config file
function defaultParaObject(attributeNode)
{
	var defaultO = attributeNode	//g_configXMLObj.defaultAttributes;
	this.leading = getLeading(defaultO);
	this.tabs = getTabs(defaultO)
	this.hScale = getHScale(defaultO);
	this.fontName=getFontName(defaultO);
	this.fontSize = getFontSize(defaultO);
	this.baseline = getBaseline(defaultO);
  // On 2nd param, see below
	this.generalRB = getRuleBelow(defaultO, false);
}
// DEFAULT PARA OBJECT ends

// *****
// FONTS
// *****

// EXTRACT FONTS USED
// Called from Indicators, once config file has been read in
function extractFontsUsed() {
	// "List" of fonts for all tables is in g_ConfigObj.fonts.font
	// as a series of strings
	// I want to append objects to the g_fontsObj global so that, say,
	// g_fontsObj["OfficinaSanITC_Bold"] is the OfficinaSanITC-Bold font object
	//	NOTE: I can't have hyphens in object names, so I substitute underline/hyphen
	for each(var f in g_fontConfigObj.font) {
		var oName = f.@name.toString();
		var fName = f.@f.toString().replace("_", "-");
		eval( "g_fontsObj." + oName + " = setFName('" + fName + "')" );
	}

}
// EXTRACT FONTS USED ends


// ***************
// TABLE SELECTION
// ***************

// SET TABLES TO PROCESS
// Called from Indicators
// Displays dialog to update array with tables to process
function setTablesToProcess()
{
	// Returned value:
	var gotTables = false;

	// Number of tables
	var tLen = g_tableConfigObj.length();

	var dW = 420
	var dH = 350;
	// Vertical positions
	var headTop = 0;
	var headHeight = 30;
	var cbGrpTop = 35;
	var cbGrpHeight = 20 * tLen;
	var okCancelTop = 500;
	var okCancelHeight = 50;

	// Contents of (very inexact) processing time alert
	var timePrefix = "Estimated time: "
	var defaultProcessingText = "No tables selected for processing..."

	// Dialog
	var dlg = new Window("dialog", "Select the tables you want to process...");
	dlg.size = [dW, dH];	// width, depth
	dlg.margins = [0,0,0,0];
	dlg.orientation = 'column';

	// Group across top of window for headers
	var hGrp = dlg.add("group", undefined, {orientation: 'row'});
	hGrp.bounds = {x:0, y:0, width:420, height:30};
	// Option indicator headers
	var pTxt = hGrp.add("statictext", undefined, "Print",);
	pTxt.bounds = {x:215, y:10, width:50, height:20}
	var wTxt = hGrp.add("statictext", undefined, "Web",);
	wTxt.bounds = {x:265, y:10, width:50, height:20}
	var dTxt = hGrp.add("statictext", undefined, "Devices",);
	dTxt.bounds = {x:310, y:10, width:50, height:20}

	// Overall group for checkboxes
	var cbGrp = dlg.add("group", undefined, {orientation: 'row'});
	cbGrp.bounds = {x:0, y:cbGrpTop, width:420, height:cbGrpHeight};

	// Sub-groups of cbGrp
	// Group contains "active" table checkboxes
	var tGrp = cbGrp.add("group", undefined, {orientation: 'column'});
	tGrp.alignment = 'left';
	tGrp.bounds = {x:0, y:0, width:200, height:cbGrpHeight};
	// Group contains disabled target checkboxes:
	//	Print
	var pGrp = cbGrp.add("group", undefined, {orientation: 'column'});
	pGrp.alignment = 'left';
	pGrp.bounds = {x:220, y:0, width:50, height:cbGrpHeight};
	//	Web
	var wGrp = cbGrp.add("group", undefined, {orientation:"column"});
	wGrp.bounds = {x:270, y:0, width:50, height:cbGrpHeight};
	//	Devices
	var dGrp = cbGrp.add("group", undefined, {orientation:"column"});
	dGrp.bounds = {x:320, y:0, width:50, height:cbGrpHeight};

	// For time taken to process ALL tables:
	// 	(this will display if user sets "Process all" on)
	var totalTime = 0;
	// And web-only time:
	var webOnlyTime = 0;
	// No poll:
	var noPollTime = 0;

	// Loop on table definitions
	var yPos = 0;
	// And a counter for subsequent reference
	var i = 0;
	for each (var tObj in g_tableConfigObj) {
		// Table checkbox with names
		var tCB = tGrp.add('checkbox', undefined, tObj.@displayName);
		tCB.bounds = {x:10, y:yPos, width:200, height:15};
		totalTime += parseInt(tObj.@seconds);
		if (tObj.@web == "true") {
			webOnlyTime += parseInt(tObj.@seconds);
		}
		if (tObj.@id !== "tabPOLL") {
            noPollTime += parseInt(tObj.@seconds);
		}

		// Checkbox event handler
		tCB.onClick = function() {
			// Loop through all table definition checkboxes collecting processing times
			var pLen = g_tableConfigObj.length();
			var secs = 0;
			for (var i = 0; i < pLen; i ++ ) {
				if (tGrp.children[i].value) {
					secs += parseInt(g_tableConfigObj[i].@seconds);
				}

			}
			if (secs == 0) {
				processText.text = defaultProcessingText;
			}
			else {
				var m = Math.floor(secs/60);  	// The minutes
				var s = (secs % 60).toString();   // The balance of seconds
				var timeString = "";
				if (m > 0) {timeString = m.toString() + " min, "};
				timeString += s + "s";
				processText.text = timePrefix + timeString;
			}
		}

		// Print option indicator
		prnCB = pGrp.add('checkbox', undefined, "");
		prnCB.bounds = {x:0, y:yPos, width:20, height:15};
		prnCB.value =  (tObj.@prn == "true");
		prnCB.enabled = false;
		// Web option indicator
		webCB = wGrp.add('checkbox', undefined, "");
		webCB.bounds = {x:0, y:yPos, width:20, height:15};
		webCB.value =  (tObj.@web == "true");
		webCB.enabled = false;
		// Device option indicator
		devCB = dGrp.add('checkbox', undefined, "");
		devCB.bounds = {x:0, y:yPos, width:20, height:15};
		devCB.value =  (tObj.@dev == "true");
		devCB.enabled = false;
		// Adjust vPos
		yPos += 20;
	}

	// Convert total time to minutes
	var m = Math.floor(totalTime/60);  	// The minutes
	var s = (totalTime % 60).toString();   // The balance of seconds
	if (m > 0) {
		totalTime = m.toString() + " min, ";
	}
	else {
		totalTime = "";
	}
	totalTime += s + "s";

	// Ditto no-poll time
	m = Math.floor(noPollTime/60);  	// The minutes
	s = (noPollTime % 60).toString();   // The balance of seconds
	if (m > 0) {
		noPollTime = m.toString() + " min, ";
	}
	else {
		noPollTime = "";
	}
	noPollTime += s + "s";

	// Ditto web-only time
	m = Math.floor(webOnlyTime/60);  	// The minutes
	s = (webOnlyTime % 60).toString();   // The balance of seconds
	if (m > 0) {
		webOnlyTime = m.toString() + " min, ";
	}
	else {
		webOnlyTime = "";
	}
	webOnlyTime += s + "s";

	var xTop = cbGrpTop + cbGrpHeight + 30;
	var xGrp = dlg.add("group", undefined, {orientation: 'column'});
	//xGrp.bounds = {x:0, y:0, width:0, height:100};
	xGrp.height = 100;

	// Process all button
	var allCB = dlg.add('checkbox', undefined, "Process all");
	allCB.bounds = {x:0, y:okCancelTop - 150, width:200, height:15};
	allCB.onClick = function() {
// 		if (allCB.value) {
//~ 			noPoll.value = false;
//~ 			webOnly.value = false;
//~ 		}
		for (var i = 0; i < tLen; i ++ ) {
			tGrp.children[i].value = allCB.value;
		}
		if (allCB.value) {
			processText.text = timePrefix + totalTime;
		}
		else {
			processText.text = defaultProcessingText;
		}
	}

	// Process web only button
  //~ 	var webOnly = dlg.add('checkbox', undefined, "Process web only");
  //~ 	webOnly.bounds = {x:0, y:okCancelTop - 150, width:200, height:15};
  //~ 	webOnly.onClick = function() {
  //~ 		if (webOnly.value) {
  //~ 			allCB.value = false;
  //~ 		}
  //~ 		// If web marker is on, set checkbox
  //~ 		for (var i = 0; i < tLen; i ++ ) {
  //~ 			tGrp.children[i].value = wGrp.children[i].value;
  //~ 		}
  //~ 		if (webOnly.value) {
  //~ 			processText.text = timePrefix + webOnlyTime;
  //~ 		}
  //~ 		else {
  //~ 			processText.text = defaultProcessingText;
  //~ 		}
  //~ 	}

	// Processing time string
	processText = xGrp.add("staticText", undefined, defaultProcessingText);
	//processText.bounds = {x:10, y:okCancelTop - 100, width:300, height:15}

	// ***"Previous week" button***
	// Removed
	//var pwGrp = dlg.add("group", undefined, {orientation: 'column'});
	//var previousWeekCB = pwGrp.add('checkbox', undefined, "Use last week's date");
	//previousWeekCB.onClick = function() {
	//	g_previousWeekFlag = previousWeekCB.value;
	//}

	// OK/Cancel buttons
	var btnGrp = dlg.add("group", undefined, {orientation: 'row'});
	btnGrp.bounds = {x:105, y:okCancelTop, width:210, height:okCancelHeight}
	var cancelBtn = btnGrp.add("button", [0, 10, 80, 40], "Cancel", {name: "cancel"});
	var okBtn = btnGrp.add("button", [100, 10, 180, 40], "OK", {name: "ok"});

	// Contingency alert: deletes once we're finished with contingency
	if (g_isLocal) {
		cStr = "Using local config file and test data";
	}
	else {
		var cStr = "";
	}

	var cTxt = dlg.add("statictext", undefined, cStr,);

	// OK and Cancel button click events close dialog
	okBtn.onClick = function() {
		// Loop through table definitions, setting the "process" property
		// to the value of the corresponding "active" checkbox
		for (var i = 0; i < tLen; i ++ ) {
			g_tableConfigObj[i].@process = tGrp.children[i].value;
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

// ***********************
// PROCESS SELECTED TABLES
// ***********************

// RUN MAIN TABLE LOOP
// Called from Indicators
// Loops through the "g_tableConfigObj" Tables object
// processing as determined in dialog
function runMainTableLoop()
{
	for each (tObj in g_tableConfigObj) {
		if (tObj.@process == "true") {
			resetDefaults()
			processTable(tObj);
		}
	}
}
// RUN MAIN TABLE LOOP ends

// RESET DEFAULTS
// Called from runMainTableLoop
// Resets globals to defaults for each fresh table we process...
function resetDefaults() {
	g_hasSecondTextBox = false;
	g_textBox2JumpCount = 5000
	g_isHeader = true;
	g_firstData = false;
	g_dataCount = 1;
	g_tintBoxCounter = 1;
	g_overprintText = true;
	g_sectionEnd = true;
	g_finalDataItemFlag = false;
	g_hasTints = false;
	g_everyOther = false;
	g_tintTopPos = 0;
	g_tintOnFlag = true;
	g_lineCount = 1;
	g_missCounter = 0;
}
// RESET DEFAULTS ends

// PROCESS TABLE
// Called from runMainTableLoop *** TO PROCESS ONE TABLE ***
// Param is table object from config file
function processTable(tableObj)
{
    // Mod Apr 2015: set flag to draw print POLL extra URL string:
    // NOTE: "===" always returns false in ExtendScript...
    // POLL is no longer generated, anyway
    if (tableObj.@id == "tabPOLL") {
        g_addPollURL = true;
    }
    else {
        g_addPollURL = false;
    }

  // A)
	// Open Indicators source file
	if (!getIData(tableObj.@source)) {return};

	// B)
	// Open corresponding lookup file
	// Commodities has a split property that tells us to refer to
	// an array of "col" objects that tell us which lookup file to use...
	// Check for split:
	if (tableObj.@split.toLowerCase() == "true") {
		// Get number of data columns in data file
    // Checking first 2 lines (in case 1st is only 1 element)
    var lenA = g_dataXMLObj.data.dataitems[0].dataitem.length()
    var lenB = g_dataXMLObj.data.dataitems[1].dataitem.length()
		var colNo = Math.max(lenA, lenB)
		for each (var cItem in tableObj.col) {
			if (parseInt(cItem.@count) == colNo) {
				var tID = cItem.@lookup.toString();
			}
		}
		// If no match was found for number of cols in data file, abort
		if (tID == undefined) {
			alert("Unable to match a lookup file to the number of columns in data file " + tableObj.@id);
			return;
		}
	}
	else {
		tID = tableObj.@id;
	}
	// Get lookup file
	if (!getILookup(tID)) {return};

	// *** So:
	//	data XML is in g_dataXMLObj
	//	lookup XML is in g_lookupXMLObj
	// ***

	// C)
	// Open template and create background box + flash
	// Also duplicate background box as text frame (twice for RESERVES)
	if (!openIFile()) {return};
	if (!makeIBox()) {return};

	// D)
	// I now have one or more text boxes
	// I re-assign and name text box 1 as my text "target"
	try {
		// I originally used point text; but using a text box allows automatic
		// wrapping of sources...
		// Turn existing path into textFrame (for T7 this is first of two...)
		g_iFrame = g_textLayer.textFrames.areaText(g_iTextBox);
		g_iFrame.name = "Text block 1";
		// And for future ref, if 2-cols:
		g_iFrame1 = g_iFrame;

	}
	catch (err) {return};

	// So g_iFrame now identifies the text box where I'm working...

	// E)
	// Enter and format text, line by line...
	if (!drawText()) {return};

	// F)
	// Save prn/web/dev version(s) to output folder(s)
	saveTables(tableObj);

	// G)
	// "Miss" alert
	if (g_missCounter > 0) {
		var mStr = tableObj.@id + " included " + g_missCounter + " Miss";
		if (g_missCounter > 1) {mStr += "es"};
		alert(mStr + "\n\nClick OK to continue. When all tables have been processed, please check the Illustrator file and advise Research.");
	}

}
// PROCESS TABLE

// GET I-DATA
// Called from processTable to read in data file for ONE table
// Param is file root (eg "tab_POLL")
function getIData(fileRoot)
{
	// Complete source file path (separators verified in Utilities)
	var theFile = checkSep(g_sourcePath) + fileRoot + ".xml";
	// Check file's existence
	if (!checkPath(theFile, true)) {return false};

	// File exists. Read it in, pass to global and report result
	g_dataXMLObj = readXMLFile(theFile);
	if (g_dataXMLObj) {
		return true;
	}
	else {
		// File not read in
		var msg = "Failed to read in source file " + fileRoot;
		alert(msg);
		return false;
	}
}
// GET I-DATA ends

// GET I-LOOKUP
// Called from processTable to read in lookup file for ONE table
// Param is file root (eg "tab_POLL")
function getILookup(fileRoot)
{
	// Complete source file path
	var s = g_lookupPath + fileRoot + "_lookup.xml";
	// Check separators and file's existence
	// (functions in Utilities)
	var theFile = checkSep(s);
	if (!checkPath(theFile, true)) {return false};

	// Read it in:
	g_lookupXMLObj = readXMLFile(theFile);
	if (g_lookupXMLObj) {
		return true;
	}
	else {
		// File not read in
		var msg = "Failed to read in lookup file for " + fileRoot;
		alert(msg);
		return false;
	}
}
// GET I-LOOKUP ends

// *** ILLUSTRATOR DOCUMENT SETUP ***
//	openIFile:  opens blank file
//	makeIBox:  creates basic furniture: background box, flash and text box(es)

// OPEN I-FILE
// Called from processTable to open a blank Illustrator file
function  openIFile()
{
	var w = Number(g_lookupXMLObj.layout.backBox.@width);
	var h = Number(g_lookupXMLObj.layout.backBox.@height);
	g_myDoc = documents.add(DocumentColorSpace.CMYK, w, h);
	// Define three layers
	g_backLayer = g_myDoc.layers[0];
	g_backLayer.name = "Background";
	g_rectLayer = g_myDoc.layers.add();
	g_rectLayer.name = "Rects";
	g_lineLayer = g_myDoc.layers.add();
	g_lineLayer.name = "Lines";
	g_textLayer = g_myDoc.layers.add();
	g_textLayer.name = "Text";
	return true;
}
// OPEN I-FILE ends

// MAKE I-BOX
// Called from processTable to create background box
function makeIBox()
{
	// Grab the layout node from the lookup file
	var layout = g_lookupXMLObj.layout
	// BACKGROUND BOX
	// Position and size of box are extracted from lookup file
	// and packed into an array
	var sizeArray = [
		Number(layout.backBox.@y),
		Number(layout.backBox.@x),
		Number(layout.backBox.@width),
		Number(layout.backBox.@height)
	]
	// Fill
	var cmykFillArray = [
		parseInt(layout.backBox.@fillC),
		parseInt(layout.backBox.@fillM),
		parseInt(layout.backBox.@fillY),
		parseInt(layout.backBox.@fillK)
	]
	// Stroke
	var cmykStrokeArray = [
		parseInt(layout.backBox.@strokeC),
		parseInt(layout.backBox.@strokeM),
		parseInt(layout.backBox.@strokeY),
		parseInt(layout.backBox.@strokeK)
	]

	// Draw box:
	// Background box is global object
	g_iBackBox = makeRect(g_backLayer, sizeArray,
		true, cmykFillArray,
		false, 0, cmykStrokeArray,
		"Background box 1", "Background box 1");
	// Document view -- set centre point and a decent zoom
	iView = g_myDoc.views[0];
	iView.centerPoint = Array(
			sizeArray[1] + (sizeArray[2] / 2),
			sizeArray[0] - (sizeArray[3] / 2)
		);
	// BACKGROUND BOX ends

	// FLASH (if any)
	if (layout.flash.@exists == "true") {
		// Geometry: origin is background box's top left, change only width and height
		sizeArray[2] = Number(layout.flash.@width);
		sizeArray[3] = Number(layout.flash.@height);

		// Repopulate fill array
		cmykFillArray[0] = parseInt(layout.flash.@fillC);
		cmykFillArray[1] = parseInt(layout.flash.@fillM);
		cmykFillArray[2] = parseInt(layout.flash.@fillY);
		cmykFillArray[3] = parseInt(layout.flash.@fillK);

		g_iFlashBox = makeRect(g_backLayer, sizeArray,
		true, cmykFillArray,
		false, 0, cmykStrokeArray,
		"Flash", "Flash");
	}
	// FLASH ends

	// TEXT BOX
	// Create duplicate of background box for text:
	g_iTextBox = g_iBackBox.duplicate();
	// Adjust margins
	g_iTextBox.top -= parseFloat(layout.margins.@top);
	g_iTextBox.height -= ( parseFloat(layout.margins.@top) + parseFloat(layout.margins.@bottom) );
	g_iTextBox.left += parseFloat(layout.margins.@left);
	g_iTextBox.width -= ( parseFloat(layout.margins.@left) + parseFloat(layout.margins.@right) );
	g_iTextBox.name = "Text box";
	g_iTextBox.move(g_textLayer, ElementPlacement.PLACEATBEGINNING)
	g_rStart = g_iTextBox.left;
	//g_rEnd = g_rStart + g_iTextBox.width;

	// RESERVES creates duplicate text box and sets both
	// to half-width. Flag and specific details in lookup file
	// I'm filling all globals
	if (layout.textBox2.@exists == "true") {g_hasSecondTextBox = true}
	if (g_hasSecondTextBox) { makeIBox2() };
	return true;
}
// MAKE I-BOX ends

// MAKE I-BOX 2
// Called from makeIBox to create 2nd text box, if any
// Also fills all globals for a 2nd data column...
function makeIBox2() {
	// Layout node in lookup file
	var layout = g_lookupXMLObj.layout;
	// I originally set l/h text box to half, then dup'd...
	// g_iTextBox.width = (g_iTextBox.width/2) - ( parseFloat(layout.textBox2.@gutterWidth) / 2);
	// g_iTextBox2 = g_iTextBox.duplicate();
	// g_iTextBox2.width = g_iTextBox.width;
	// ...but now I keep l/h box to full width, to extend headers
	g_iTextBox2 = g_iTextBox.duplicate();
	g_iTextBox2.width = (g_iTextBox.width/2) - ( parseFloat(layout.textBox2.@gutterWidth) / 2);
	g_iTextBox2.left += (g_iTextBox.width/2) + ( parseFloat(layout.textBox2.@gutterWidth) / 2);
	// Back on track...
	g_iTextBox2.top -= (parseFloat(layout.textBox2.@textBox2Top));
	g_iTextBox2.height = parseFloat(layout.textBox2.@textBox2Height);
	// Adjust ruler widths -- ALTHOUGH REALLY I SHOULD BE USING VALUES SET IN LOOKUP, NON?
	// So comm'd out
	// g_rEnd = g_rStart + g_iTextBox.width;
	g_textBox2JumpCount = parseInt(layout.textBox2.@textBox2JumpCount);
}
// MAKE I-BOX 2 ends

// *** ILLUSTRATOR SET-UP ENDS

// *** MAIN TEXT FUNCTIONS ***
//	drawText controls main text controllers
//	-	drawHeaders
//  - drawDividers
//	-	drawData
//  - drawFootMatter

////////////
// DRAW TEXT
// Called from Indicators. Text object exists (g_iFrame).
// Raw data are in g_dataXMLObj. Lookup is in g_lookupXMLObj
// Adds text line by line, setting attributes...
function drawText()
{
	// Initialise para attributes object with valid default values
	//g_Attributes = new defaultParaObject();

	// Default tint stuff. Do we have tints, and if so are they everyOther or section-based?
	g_hasTints = (g_lookupXMLObj.layout.backTint.@exists.toString().toLowerCase() === 'true');
	if (g_hasTints) {
		g_everyOther = (g_lookupXMLObj.layout.backTint.@everyOther.toString().toLowerCase() === 'true');
	}

  // HEADERS
	// These are entirely defined in the lookup file
	if (!drawHeaders()) {return false};
	// And header DIVIDERS
	if (!drawDividers()) {return false};

  // DATA
	// Values from data file; formatting from lookup file
	// Data is tructured as data / dataitems / dataitem
	// Each "dataitem" node has a "value" property and an optional "footnote" property
	// All other properties (fontName/Size, etc) from lookup...
	if (!drawData(g_lookupXMLObj.id)) {return false};
	if(!drawFootMatter()) {return false};

	// Still here?
	return true;
}
// DRAW TEXT ends

// DRAW HEADERS
// Called from drawText to control drawing HEADERS
function drawHeaders()
{
	// Header values come from DATA file
	// Formatting from LOOKUP file
	// Both files have a "headers" node
	// In LOOKUP file, "headers" node has any number of "header" children, identified by a name property: "header1" etc.
	// In DATA file, the "headers" node has numbered subnodes, "header1", "header2", etc.
	//	containing a series of "h" nodes defining header strings
	var dataHeaders = g_dataXMLObj.headers;
	// But -- MOD JUNE 2018 -- Markets looks inside a <root> node...
	// This is a loose check for undefined
	if (dataHeaders == undefined) {
		dataHeaders = g_dataXMLObj.root.headers;
	}
  // Inferential tweak Mar'24: in Print Markets,
  // header 3, change 'index' to 'Index'
  if (g_lookupXMLObj.id == 'tabMARKETSPRINT') {
    var iStr = dataHeaders['header3'].h[3];
    if (iStr == 'index') {
      dataHeaders['header3'].h[3] = 'Index';
    }
  }
  // More inferential tweaks July'24:
  //    Print EcoData (100) and
  //    right-hand Digital EcoData (102)
  // in headers, change 'latest,%' to 'latest, %'
  if (g_lookupXMLObj.id == 'tabECODATA') {
    var iStr = dataHeaders['header4'].h[8];
    if (iStr == 'latest,%') {
      dataHeaders['header4'].h[8] = 'latest, %';
    }
  }
  if (g_lookupXMLObj.id == 'tabECODATA2') {
    var iStr = dataHeaders['header5'].h[2];
    if (iStr == 'latest,%') {
      dataHeaders['header5'].h[2] = 'latest, %';
    }
  }
	var lookupHeaders = g_lookupXMLObj.headers.header;
	// I have to loop on one or the other. But since there are more properties rattling around
	// inside the lookup file, let's loop on that...
	var hCount = 1;
  // Flag set to false after first header (whichever it is)
  // so that baseline is set at kick-off
  // Added Feb'24, when EcoData dropped H1
  var firstHeaderDrawn = true;
	for each(var thisH in lookupHeaders) {
    // As of Mar'24, EcoData tables ignore the first header
    // so 'exists' flag introduced
    var drawHeader = (thisH.exists == "true");
    if (drawHeader) {
      // So thisH is a node from the lookup file defining all properties for 
      // one line of headers. It will have a series of leading, fontName, etc. properties
      // and a "subRanges" node which defines individual headers in that one line...
      // Init Array to pass individual header string objects in
      var stringArray = [];
      // Get number of individual headers in this line from the lookup
      var sLen = thisH.subRanges.subRange.length();

      if (sLen == 1) {
          stringArray.push(thisH.subRanges.subRange);
          stringArray[0].@value = dataHeaders["header" + hCount].h[0];
      }
      else {
        for (var i = 0; i < sLen; i ++) {
          var thisSR = thisH.subRanges.subRange[i];
          var hID = "header" + hCount.toString();
          thisSR.@value = dataHeaders[hID].h[i]
          stringArray.push(thisSR);
        }
      }
      drawOneLine(stringArray, thisH, "header");
      // Initialise baseline tracker on first para:
      // if (thisH.@name == "header1") {
      if (firstHeaderDrawn) {
        initBaseLine(thisH);
      }
      g_lineCount ++;	// increment line counter
      hCount ++;		 // and head count
      firstHeaderDrawn = false;
    } else {
      // g_lineCount ++;
      hCount ++;
    }

	}

	// After last header, initialise top position for any tints
	// This is aligned to the general rule-across below the headers block
	// I need the rule offset for the final header. However, I have to work round the fact
	// that there may be one or more "ruleBelow" notes. So...
	if (thisH.rules.ruleBelow.length == 1) {
		// Just one ruleBelow:
		g_tintTopPos = g_baseHeight - Number(thisH.rules.headerRule.@offset);
	}
	else {
		// More than one: use first only
		g_tintTopPos = g_baseHeight - Number(thisH.rules.headerRule[0].@offset);
	}
	// And turn off header flag
	g_isHeader = false;
	return true;
}
// DRAW HEADERS ends

// INSERT MARKET BONDS HEADER
// This is the kludge for the headers for the bonds senction at the
// bottom of the Markets table. It inserts three
// lines of headers...
function insertMarketBondsHeader() {
	// Force tint on:
	g_tintOnFlag = true;
	// For now: just get content
	var bondHeaders = g_dataXMLObj.headers2;
	// But -- MOD JUNE 2018 -- Markets looks inside a <root> node...
	// Loose equality
	if (bondHeaders == undefined) {
		bondHeaders = g_dataXMLObj.root.headers2;
	}
	var lookupHeaders = g_lookupXMLObj.bondHeaders.header;
	var hCount = 21;
	for each(var thisH in lookupHeaders) {
		// So thisH is a node from the lookup file defining all properties for
		// one line of headers. It will have a series of leading, fontName, etc. properties
		// and a "subRanges" node which defines individual headers in that one line...
		var stringArray = [];
		// Get number of individual headers in this line from the lookup
		var sLen = thisH.subRanges.subRange.length();

		if (sLen == 1) {
				stringArray.push(thisH.subRanges.subRange);
				stringArray[0].@value = bondHeaders["header" + hCount].h;
		}
		else {
			for (var i = 0; i < sLen; i ++) {
				var thisSR = thisH.subRanges.subRange[i];
				var hID = "header" + hCount.toString();
				thisSR.@value = bondHeaders[hID].h[i]
				stringArray.push(thisSR);
			}
		}
		drawOneLine(stringArray, thisH, "header");
		hCount++;
	}
	// And there's an inferential tweak to the stripe behind the 1st header,
	// for which I want a 'first' tint height
  // Mod Feb'24: check that there ARE tints!
  if (g_hasTints) {
    var bStripe = g_backLayer.pathItems["Tint box 20"];
    var firstH = Number(g_lookupXMLObj.layout.backTint.@firstHeight);
    var otherH = Number(g_lookupXMLObj.layout.backTint.@height);
    // Move up by the difference:
    var upBy = firstH - otherH;
    bStripe.top += upBy;
    bStripe.height = firstH;
  }
	// Now: can I force decimal places below here...?
	g_lookupXMLObj.data.subRanges.subRange[2].@dPlaces = 0;
	g_lookupXMLObj.data.subRanges.subRange[3].@dPlaces = 0;
}
// INSERT MARKET BONDS HEADER ends

// DRAW DIVIDERS
// Called from drawText, immediately after drawHeaders
// to draw vertical dividers in header range
function drawDividers()
{
	var dividers = g_lookupXMLObj.dividers;
	// Some tables have no header dividers, so...
	if (typeof dividers == 'undefined') {
		return;
	}
	var w = Number(dividers.width);
	var cols = dividers.colours;
	var colArray = Array(
		Number(cols.c),
		Number(cols.m),
		Number(cols.y),
		Number(cols.k)
	);
	var lEnd = Number(dividers.lineEnd);
	var lineEnd = c_defaultLineEnd;	// line end style
	// Everything except x-pos defined outside the loop
	// Coords as 2-element array, each an array of x,y
	var y1 = Number(dividers.y1);
	var y2 = Number(dividers.y2);
	var lefts = dividers.lefts.left;
	var s = "Head divider ";
	for (var i = 0; i < lefts.length(); i++) {
		var x = Number(lefts[i]);
		var rArray = Array(
			Array(x, y1),
			Array(x, y2)
		);
		makeLine(g_lineLayer, rArray, false, colArray,
				true, w, colArray,
				lEnd, c_defaultLineMiter, c_defaultLineMiterLimit,
				s + i, s + i, undefined);
	}
	return true;
}
// DRAW DIVIDERS ends

// DRAW DATA
// Called from drawText to put DATA BLOCK on the page
function drawData(tableID)
{
	// Get default data-line attributes from lookup file
	// (This defines attributes for ALL data lines, with an array of subRange definitions)
	var dataLUObj = g_lookupXMLObj.data;
	// Get raw data (values + optional appended footnotes) from data file
	var data = g_dataXMLObj.data.dataitems;

	// Set global flag on for first loop
	g_firstData = true;

	// When we start the data block, g_tintTopPos is set to the VPos of the general rule below headers
	// This is start position for any tints, everyOther or section-based

	// Loop "line by line" (ie thro XML dataitems) thro data
	for each (var thisD in data) {
		// So thisD is XML for a single line, consisting of a series of "dataitem" nodes
		// each of which contains a single "value" and an optional "footnote"

		// Check for jump to 2nd text box
		if (g_hasSecondTextBox) {
			if (g_dataCount == g_textBox2JumpCount) {

				try {
					// Retarget to 2nd box (as textFrame)
					g_iFrame = g_textLayer.textFrames.areaText(g_iTextBox2);
					g_iFrame.name = "Text block 2";
					g_rStart = g_iFrame.left;
					g_baseHeight = g_firstbaseHeight;
					// Remember as section top
					g_tintTopPos = g_baseHeight;
					// But tweak for rule offset...
					// ...using the offset value of the style set as "default"
					// Name of default style:
//~ 					var defRule = g_lookupXMLObj.data.rules.@defaultRule;
					// Its offset value:
//~ 					var baseTweak = parseFloat(g_lookupXMLObj.data.rules[defRule].@offset);
					// g_baseHeight += baseTweak;
					// Force tint on/off at top of new column
					g_tintOnFlag = (g_lookupXMLObj.layout.textBox2.@startWithTint == 'true');
					// And for future ref, if 2-cols:
					g_iFrame2 = g_iFrame;
				}
				catch (err) {return};
			}
			// And -- very inferential, this -- check for the bonds
			// header in Markets
			if (g_dataCount == c_marketsBondsCount) {
				insertMarketBondsHeader();
			}
		} else {
			if (tableID == "tabMARKETSDEVICES") {
				if (g_dataCount == c_marketsBondsCount) {
					insertMarketBondsHeader();
				}
			}
		}

		// Final data item flag (remember, we're counting lines from 1):
		if ( g_dataCount == (data.length() ) ) {
			g_finalDataItemFlag = true;
		}

		// Check for section end
		g_sectionEnd = false;
		for each (var sb in dataLUObj.sectionBreaks.sectionBreak) {
			if (g_dataCount == parseInt(sb)) {
				g_sectionEnd = true;
				break;
			}
		}

		// Initialise array in which data value objects will be passed on to drawOneLine()
		var stringA = [];
		var sLen = thisD.dataitem.length();

		// Loop through individual "dataitem" objects -- ie by sub-strings in each line
			// The problem is that I have a potential mismatch between the number of dataitems exported from the database
			// and the number of columns. This occurs with the POLL, which has "/" inter-markers, with their own tab value
			// So for each data item, I have to check for an [i + 1] item in the lookup with a "hardValue"
		// So I need two counters. The loop below will be controlled by the value of "i", representing elements in the array of dataitems
		// But a separate counter, luCounter, will track elements in the lookup file's subRange...
		var luCounter = 0;
		for (var i = 0; i < sLen; i ++) {
			// Value from data
			var dataObj = thisD.dataitem[i];
			// Get corresponding node from lookup file
			var luObj = dataLUObj.subRanges.subRange[luCounter];
			if (luObj != undefined) {
				// Get sub-range-specific attributes from lookup
				// and append them to each string XML object...
				// Font name
				if ( luObj.@fontName != undefined ) {
					dataObj.@fontName = luObj.@fontName
				}
				// Font size
				if ( luObj.@fontSize != undefined ) {
					dataObj.@fontSize = luObj.@fontSize;
				}
				// Append string to previous?
				if ( luObj.@appendToPrevious != undefined ) {
					dataObj.@appendToPrevious = luObj.@appendToPrevious;
				}

				// Number?
				if (luObj.@isNumber != undefined) {
					dataObj.@isNumber = luObj.@isNumber;
				}
				// Show "+" flag
				if ( luObj.@showPlus != undefined) {
					dataObj.@showPlus = luObj.@showPlus;
				}
				// Precision
				if ( luObj.@dPlaces != undefined) {
					dataObj.@dPlaces = luObj.@dPlaces;
				}
				// Precision overrule flag
				if ( luObj.@overruleDPs != undefined) {
					dataObj.@overruleDPs = luObj.@overruleDPs;
				}
				// Parentheses
				if ( luObj.@hasParenth != undefined) {
					dataObj.@hasParenth = luObj.@hasParenth;
				}
				// Plus/minus rect
				if (luObj.@rLeft != undefined) {
					dataObj.@rLeft = luObj.@rLeft;
					dataObj.@rWidth = luObj.@rWidth;
				}
				// Fill
				if (luObj.@fill != undefined) {
					dataObj.@fill= luObj.@fill;
				}


				// Append "property-rich" sub-string xml object to array
				stringA.push(dataObj);

				// If the ***next*** node in the lookup/subRange is a hard value
				// process it now and increment the lookup counter. I pull the
				// subRange node out of the lookup object and, if it has a
				// "hardRange" string, pass that to a new "value" attribute
				// Then I sort of fool the line-processing function drawOneLine
				// into thinking it's another data value...
				var nextluObj = dataLUObj.subRanges.subRange[luCounter + 1];
				if (nextluObj != undefined) {
					if ( nextluObj.@hardValue != undefined ) {
						// Copy the hardValue string (in POLL, "/") to value
						nextluObj.@value = nextluObj.@hardValue;
						// Append to the array
						stringA.push(nextluObj);
						// Exceptional increment on lookup counter keeps us in position in the lookup file
						luCounter ++;
					}
					// Another special for "explicit" (ie Commodities)
					// We "jump" the special subRange for the possible extra tab
					if (dataLUObj.explicit == "true") {
						if (i == 0) {luCounter ++};
					}
				}
			}
			else {
				alert("Mismatch between number of data items and tab stops defined in lookup file. Please check xml file...");
				return false;
			}
			// And do default increment on lookup counter
			luCounter ++;
		}

		// Call function to draw current line with:
		//	rich strings
		//	general lookup properties for a data line
		//	"data" identifying string
		drawOneLine(stringA, dataLUObj, "data");
		g_dataCount ++;
		g_lineCount ++;	// increment line counter

		// And set global flag off after first loop
		g_firstData = false;

		// To speed things up... max counter set at top
    // will end processing without drawing foot matter
		if (g_dataCount > c_stopNoFootMatter) {return false};
		// This flag curtails number of data lines drawn,
    // but draws foot matter
		if (g_dataCount > c_stopWithFootMatter) {return true};
	}
	return true;
}
// DRAW DATA ends

// DRAW FOOT MATTER
// Called from drawText to control drawing SOURCE AND FOOTNOTE AT BOTTOM OF TABLE
// Mod 06Mar2012 puts source before footnotes
function drawFootMatter()
{
	// Assemble footnote and source strings
	var fStr = g_dataXMLObj.footnote;
	if ( (fStr == null) || (fStr == undefined) ) {fStr = ""};
	var sStr = g_dataXMLObj.source;
	if ( (sStr == null) || (sStr == undefined) ) {sStr = ""};
	if ( (fStr == "") && (sStr == "") ) {return true};

	// Character conversion
	fStr = iTranslate(fStr);
	sStr = iTranslate(sStr);

    // Append url to print version of poll
    if (g_addPollURL) {
        sStr += ".  For more countries, go to: Economist.com/markets";
    }

	// Now check whether we're dealing with a two-col table
	// which may have text at the bottom of both cols
//~ 	if (g_hasSecondTextBox) {
//~ 		// Loop: col A then col B
//~ 		for (var i = 0; i < 2; i ++) {
//~ 			if (i == 0) {
//~ 				var footInfo = g_lookupXMLObj.layout.textBox2.col1Footer;
//~ 				var fFrame = g_iFrame1;
//~ 			}
//~ 			else {
//~ 				var footInfo = g_lookupXMLObj.layout.textBox2.col2Footer;
//~ 				fFrame = g_iFrame2;
//~ 			}
//~ 			if (footInfo.@exists.toString() == "true") {
//~ 				switch (footInfo.@contents.toString()) {
//~ 					case "source":
//~ 						s = sStr;
//~ 						break;
//~ 					case "footnote":
//~ 						s = fStr;
//~ 						break;
//~ 					default:
//~ 						s = fStr;
//~ 						if (sStr != "") { s += (c_betweenFootnoteAndSource + sStr) };
//~ 				}
//~ 				appendFootString( s, fFrame, parseFloat(footInfo.@firstLeading) );
//~ 			}
//~ 		}
//~ 	}
//~ 	else {
		// Single column. Glue source & footnote together and shove into the only text box
		if (sStr == "") {
			sStr = fStr;
		}
		else if (fStr != "") {
			sStr += c_betweenFootnoteAndSource + fStr;
		}
		appendFootString(sStr, g_iFrame, parseFloat(g_lookupXMLObj.foot.firstLeading));
//~ 	}
	return true;
}
// DRAW FOOT MATTER ends

// APPEND FOOT STRING
// Called from drawFootMatter
function appendFootString(fStr, targBox, fLead) {
	// fStr is string to append
	// targ is target text box
	// fLead is leading for first line

	// Substitute hard returns for newline marker
	// Allows for various markers
	fStr = fStr.replace(c_newlineSpace, c_return);
	fStr = fStr.replace(c_newlineNoSpace, c_return);
	fStr = fStr.replace(c_newlineAmpSpace, c_return);
	fStr = fStr.replace(c_newlineAmpNoSpace, c_return);

  
  // ECODATA & ECODATA1 append inferential string to footnote
  // Added Oct'23
  var id = g_lookupXMLObj.id;
	if (id == 'tabECODATA' || id == 'tabECODATA1') {
		fStr += c_ecoDataExtraNote;
	}

	// Create paragraph object (with no contents)
	var footPara = targBox.paragraphs.add("");

	// Get GENERAL PARAGRAPH ATTRIBUTES (tabs, leading...)
	// which are plonked into g_Attributes
	extractPAs(g_lookupXMLObj.foot);

	// Append string to line on page
	footRange = footPara.characters.add(fStr);
	// Apply default LINE attributes to subrange
	// ("itemNo" param is false; pretend we're not first item in line
	// to prevent underline being drawn...
	setDefaultAttributes(footRange, 1);
	// Italicise "The Economist"
	italiciseEco(footRange);
  // Deal with the rogue source string that can pop up
  // in EcoData/EcoData1 footnote
  deleteRogueSourceString(footRange);

	// Leading for first line
	try {
		if (footRange.lines.length == 1) {
			footRange.leading = fLead;
		}
		else {
			footRange.lines[0].leading = fLead;
		}
	}
	catch (err) {
		try {
			footRange.characters[0].leading = fLead;
		}
		catch (err) {
			alert("An error occurred setting footnote leading. Please set leading for first line of footnotes by hand...");
		}
	}

	// Footnote symbols
	for (var i = 0; i < footRange.characters.length; i ++) {
		var r = footRange.characters[i];
		// Cheap & nasty evasion of any issues matching characters in list of symbols
		// by embedding in TRY...
		if (r.contents != "*") {
			try {
				if ( isSymbol(r.contents) ) {
					// Comm'd out, Oct '18, since we now have 'adjusted' footnotes sympbols in the font
					// Yes, this is a kludge. Short on time, though...
					// symbolConvert(r);
				}
			}
			catch (error) {};
		}
	}
	return true;
}
// DRAW FOOT MATTER ends

function isSymbol(s)
{
	for each (var symb in c_symbolMatchArray) {
		if (s == symb) { return true };
	}
	return false;
}


// **************************
// Text-setting functions end
// **************************


// ***********
// SAVE TABLES
// ***********
// Called from main Indicators function
// Saves each table to drop folder
// File format is "YYYYMMDD_INTnnn.eps"
// Saturday's date; constant "INT" section id; number from config file table definition
// Test files set date to '20990101'
function saveTables(tObj)
// Arg is table definition from config file
{
	// Get "this" issue's date from system (as date obj)
	var currentDate = getNextSaturday();
	var sName = dateToYYYYMMDD(currentDate);
  
  // During testing, Feb 2022, force date to 1 Jan 2099
  if (g_isTest) {
    sName = c_testDate;
  }
	
  // Underscore and section id
	sName += c_fileID;
	// Table number
	sName += tObj.@code;
	// File name
	var fName = sName + c_extension;

	// Set up output array
	var saveArray = [];
	if (tObj.@prn == "true") {
		saveArray.push(g_prnFolder + fName);
	}

  // OK, so this is a kludge. Originally we saved separate files for
  // WEB and DEVICES. However, from Feb'22 we save a single 'digital'
  // version. In practice, if the user selects one of the digital options,
  // 2 flags are set: web and devices. Rather than have to recode the
  // dialog box and struggle with the debugger, I'm simply 'combining'
  // the two previous options into the single, new 'digital' output
  // (In practice, both flags will be the same: true or false)
	if (tObj.@web == "true" || tObj.@dev == "true") {
		saveArray.push(g_digFolder + fName);
	}

	for each (sF in saveArray) {
		// Not that I do anything with the result...
		var exportResult = saveFile(sF);
	}
}
// SAVE TABLES ends

// GET NEXT SATURDAY
// Called from saveTables. Returns next Saturday (as Date object)...
// unless it's after noon on Thursday, when it skips to Saturday following
function getNextSaturday()
{
	// Today's date + time
	var myNow = new Date();
	// Pull out day (Sun=0 to Sat=6) and hour
	var myDay = myNow.getDay();
	var myHour = myNow.getHours();
  // Day and week in ms
  var oneDay = 1000 * 60 * 60 * 24;
  var oneWeek = oneDay * 7;
	// Time to Saturday in ms
	var toSat = (6 - myDay) * oneDay;
	// Issue date is Saturday; get as time in ms
	var issueTime = myNow.getTime() + toSat;
	// For (Kindle) Indicators, anything after end of Friday (ie, on Saturday) is next week
	if (myDay > 5) {issueTime += oneWeek};
	// Return default-issue Saturday as date
	return new Date(issueTime);
}
// GET NEXT SATURDAY ends

// DATE TO YYYY MM DD
// Called from saveTables
// Passed a date object, returns yyyymmdd string
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

// SAVE FILE
// Called from saveTables to save active document
function saveFile(fName)
// Arg is complete path to which to save active document (g_myDoc)
{
	try {
		var fileSpec = new File(fName);
		var saveOptions = new EPSSaveOptions();

		saveOptions.compatibility = Compatibility.ILLUSTRATOR14;
		saveOptions.preview = EPSPreview.COLORMACINTOSH;
		saveOptions.overprint = PDFOverprint.PRESERVEPDFOVERPRINT;
		saveOptions.embedAllFonts = true;
		saveOptions.includeDocumentThumbnails = true;
		saveOptions.cmykPostScript = true;
		saveOptions.postscript = EPSPostScriptLevelEnum.LEVEL2;

		g_myDoc.saveAs(fileSpec,saveOptions);
	}
	catch (err) {
		alert("An error occurred when I attempted to save file:\n\n" + fName)
		return false;
	}
	return true;
}
// SAVE FILE ends

// *****************
// TABLE SAVING ENDS
// *****************


// *** SUBSIDIARY TEXT FUNCTIONS ***

// INIT BASELINE
// Called from drawHeaders when header1 has been drawn
// Duplicates and outlines the first para, gets height of tallest character
// and moves the text frame down to 'meet' that baseline
function initBaseLine(firstDrawnHeader)
{
  var baseline = Number(firstDrawnHeader.leading)
	// I'm about to squeeze the text frame, which can mess up the
	// font size et al. So remember...
	var oldSize = Number(firstDrawnHeader.fontSize);
	// var oldHScale = g_iFrame.paragraphs[0].characterAttributes.horizontalScale;
	var oldHScale = Number(firstDrawnHeader.hScale);
	// Get top of textframe (before we move it), and set global baseline
	var top = g_iFrame.top;
	g_baseHeight = top - baseline;
	// Duplicate and outline
	var tempFrame = g_iFrame.duplicate();
	var tempO = tempFrame.createOutline();
	// Get height of tallest character, which AI will have aligned to top of text box
	var hArray = [];
	for (i = 0; i < tempO.compoundPathItems.length; i++) {
		hArray.push(tempO.compoundPathItems[i].height);
	}
	var charHeight = Math.max.apply(Math, hArray);
	// Move textbox down to get desired baseline
	var moveText = baseline - charHeight;
	g_iFrame.top -= moveText;
	g_iFrame.height -= moveText;
	// Reset size, hScale and leading:
	g_iFrame.paragraphs[0].characterAttributes.size = oldSize;
	g_iFrame.paragraphs[0].characterAttributes.horizontalScale = oldHScale;
	g_iFrame.paragraphs[0].characterAttributes.leading = baseline;  // oldLeading;
	// Remove the evidence
	tempO.remove();
}
// INIT BASELINE ends


// *** FUNCTIONS TO DRAW LINE OF TEXT ***
//	drawHeaders and drawData, at least, converge here on:
//		DRAW_ONE_LINE
//		which does what it says in the tin
//		It calls:
//			setSubRangeAttributes, which calls:
//			symbolConvert
//			setDefaultAttributes


// DRAW ONE LINE
// Called from:
//	drawHeaders
//	drawData
// Controls drawing a single line
function drawOneLine(stringArray, lookupO, whichSection)
// Arguments are:
//	Array of sub-string-defining xml objects, each of which has a value property; some also have formatting properties (fontName, superscript...)
//	corresponding general LINE lookup object
//	section identifier: "header", "data" or "source"
{
	var mySubRange;			// subrange on page to reformat
	// Create paragraph object (with no contents)
	thisPara = g_iFrame.paragraphs.add("");

	// Get GENERAL PARAGRAPH ATTRIBUTES (tabs, leading...)
	// which are plonked into g_Attributes
	extractPAs(lookupO);

	// Each line inherits baseline of *previous* line in g_baseHeight

	// Initial tabs and - for dataLines - explicit attributes
	// Is there an initial tab?
	// Do data lines have an explicit fontName or ignore blanks?
	//	(These are all for COMMODITIES; the noTabs attribute prevents West Texas Intermediate pushing in tabs and turning the line...)
	var initialTabFlag = false;
	var oneStringFlag = false;
	if (whichSection == "header") {
		// For headers, this is flagged individually
		initialTabFlag = (lookupO.initialTab == "true");
	}
	else {
		if (lookupO.explicit == "true") {
			var eStyle = lookupO.explicitStyles.r[g_dataCount - 1]
			// For data, if the "explicit" flag is true, individual lines may have initial tab and special font

			// Get initialTab flag from explicitStyles list
			initialTabFlag = eStyle.@initialTab == "true";
			// Explicit dataLine attributes also include breaking after first string
			oneStringFlag = eStyle.@oneString == "true";
			// And special font name
			var specialFontName = eStyle.@fontName;
			g_Attributes.fontName = specialFontName.toString();
			var eLeading = parseFloat(eStyle.@leading);
			if (!isNaN(eLeading)) {
					g_Attributes.leading = eLeading
			}
		}
	}
	if (initialTabFlag) {
		// Plonk in a tab and set default para leading
		thisPara.characters.add(c_tabChar);
		thisPara.leading = g_Attributes.leading;
	}

	// Loop by "items" in one line
	// Each "item" is an xml object whose "value" property is the string to slap on to the page
	// and which may have other properties that define formatting for this sub-range only

	// Reset baseline
	// Extract leading and decrement baseline height (so it matches baseline of this para)
	// Should we increment? Because head 1 and box2 line 1 don't...

  var incrementBase = true;
	if (g_Attributes.leading != undefined) {
		if (g_lineCount == 1) {
			incrementBase = false;
		}
		else if (g_hasSecondTextBox && (g_dataCount == g_textBox2JumpCount)) {
			incrementBase = false;
		}
	}
	if (incrementBase) {
		g_baseHeight -= g_Attributes.leading;
	}

	if (g_firstData) {
		// And remember it for top of any 2nd column
		g_firstbaseHeight = g_baseHeight;
	}

  for (var j = 0; j < stringArray.length; j ++) {
		// Extract the actual string (as xml)
		var s = stringArray[j].@value.toString();
		// Keep a copy for plus/minus testing
		var originalS = s;
		// Convert xml object to string; convert any marker to date...
		// ...and convert any rogue characters
		if (whichSection == "header") {
			if (s.search("@") == 0) {
				switch (s) {
					// THIS DOESN'T HANDLE FOOTNOTE SYMBOLS ATTACHED TO MARKERS
					// BUT PROBABLY NOT AN ISSUE, SINCE I SHAN'T BE USING DATE MARKERS, ANYWAY
					case c_shortDateMarker:
						s = makeShortDate();
						break;
					case c_thisYearMarker:
						s = makeThisYear();
						break;
					case c_lastYearMarker:
						s = makeLast();
						break;
					case c_endLastYearMarker:
						s = makeEndLastYear();
						break;
					default:
						alert("Function drawOneLine encountered unknown dynamic date marker: " + s);
				}
			}
			// I think this goes here, to handle symbols on header strings
			s = iTranslate(s);
		}

		// Other attributes
		//	Don't forget the "@" prefix
		var fn = stringArray[j].@fontName;
		var fs = stringArray[j].@fontSize;
		var ss = stringArray[j].@superscript;
    var isNo = stringArray[j].@isNumber;
		var sP = stringArray[j].@showPlus;
		var dP = parseInt(stringArray[j].@dPlaces);
		var oDP = stringArray[j].@overruleDPs;
		var fill = stringArray[j].@fill;
		var hScale = stringArray[j].@hScale;
		// Rect attributes (careful: can be undefined - see below)
		var rLeft = stringArray[j].@rLeft;
		var rWidth = stringArray[j].@rWidth;

		var drawRect = true;
		if (isNaN(s) || (Number(s) == 0) ) {
			drawRect = false;
		} else {
				drawRect = roundedValIsZero(s, dP);
		}

		// Back tint (and rect) props
		var bt = g_lookupXMLObj.layout.backTint;
		// I need a bottom, from current baseline
		var rBottom = g_baseHeight;
		var baseTweak = bt.@offset;
		rBottom -= baseTweak;
		// Height is explicit
		var rHeight = parseFloat(bt.@height);
		// ...unless...
		if ((g_dataCount == 1) || (g_dataCount == g_textBox2JumpCount)) {
			rHeight = parseFloat(bt.@firstHeight);
		}
		// I want a top and a height. So...
		var rTop = rBottom + rHeight;
		// Negative val?
		var isNeg = Number(s) < 0;

    if (drawRect) {
      if (rLeft != undefined) {
        // Vals as numbers
				rLeft = Number(rLeft);
				rWidth = Number(rWidth);
				var rectProps = {
          top: rTop,
					left: rLeft,
					width: rWidth,
					height: rHeight,
					isNeg: isNeg,
					val: s
				};
				drawPlusMinusRect(rectProps);
			}
		}
    
		// Values from the data file should have separate footnotes
		// So before we attach those, do any formatting
		if (whichSection == "data") {
			// s is a string. Do any numberformat conversions...
			if (s.length > 0) {
				if (isNo == "true") {
					if (!isNaN(s)) {
						s = myNumberFormat(s, dP, sP, oDP);
					}
				}
			}
			// FOOTNOTE?
			if (stringArray[j].@footnote != undefined) {
				// Footnote as string, converted to Mac character set
				var f = iTranslate( stringArray[j].@footnote.toString() );
				// If value appears against a coloured rect, we have to
				// insert spaces to move the footnote symbol clear...
				var spaces = "";
				var spacesTabTweak = 0;
				if (rLeft != undefined) {
						spaces = c_footnoteSpaces;
						spacesTabTweak = c_footnoteSpaceTabTweak;
				}
				// Get tab tweak for footnote symbol(s)
				// Only if right-aligned
				if (g_Attributes.tabs[j].alignment == TabStopAlignment.Right) {
					// Tweak for spaces
					g_Attributes.tabs[j].position += spacesTabTweak;
					// Tweak for symbol(s)
					g_Attributes.tabs[j].position += symbolTabTweak(f);
				}
				s += (spaces + f);
			}

			// For POLL brackets:
			// Comm'd out Mar'18, since Poll is dropped
//~ 			if (stringArray[j].@hasParenth != undefined) {
//~ 				if (stringArray[j].@hasParenth.toString() == "true") {
//~ 					if (s.length > 0) {
//~ 						s = "(" + s + ")";
//~ 					}
//~ 				}
//~ 			}

		}

		if (j > 0) {
			// After first string, add explicit tab, unless otherwise instructed
			// (Poll appends a second header to the first)
			if (stringArray[j].@appendToPrevious == 'true') {
				thisPara.characters.add("  ")
			}
			else {
				thisPara.characters.add(c_tabChar)
			}
		}

		// Append string to line on page
		mySubRange = thisPara.characters.add(s);
		// Apply default LINE attributes to subrange
		// *** setDefaultAttributes also deputises rules and tints
		// isLast flag forces tab setting for para on last string only
		//	(when all inferential footnote tabbing adjustments have been made for the line)
		var isLast = ( j == (stringArray.length - 1) );
		setDefaultAttributes(mySubRange, j, isLast);
		// Header may need to italicise "The Economist"
		if (whichSection == "header") {
			italiciseEco(mySubRange);
		}
		// Apply SUBRANGE-SPECIFIC attributes to subrange
    setSubRangeAttributes(mySubRange, fn, fs, ss, fill, hScale, isNo);

		// If we're setting "explicit" rules and the flag is set
		// to draw only the first string, break now
		if (oneStringFlag) {return};
	}
}
// DRAW ONE LINE ends

// DRAW PLUS MINUS RECT
// Called from drawOneLine
// Draws a single plus/minus rectangle behind a value
function drawPlusMinusRect(rProps) {
	// Param is an object with properties top, left, width, height, isNeg and val
	// Coords array
	var rArray = [
		rProps.top,
		rProps.left,
		rProps.width,
		rProps.height
	];
	// Adjust for Markets box 2
	if (g_lineCount > (g_textBox2JumpCount + 3)) {
		var move = Number(g_lookupXMLObj.layout.textBox2.@plusMinusRectMove);
		rArray[1] += move;
	}
	// Name
	var s = "Plus-minus rect " + rProps.val;
	// CMYK vals
	var cmykVals = c_posCMYK;
	if (rProps.isNeg) {
		cmykVals = c_negCMYK;
	}
	var cmykArray = [
		cmykVals.cyan,
		cmykVals.magenta,
		cmykVals.yellow,
		cmykVals.black
	]
	var rect = makeRect(g_rectLayer, rArray,
		true, cmykArray,
		false, 0, cmykArray,
		s, s);
}
// DRAW PLUS MINUS RECT ends

// SET SUB-RANGE ATTRIBUTES
// Called from drawOneLine to apply sub-range-specific attributes
// to each subrange as it is appended to current line of text
function setSubRangeAttributes(mySR, fontN, fontS, superS, fill, hScale, isNo)
// Args:	a subrange of text (just added to current paragraph range)
//		  and a series of attributes (which may be undefined) ***AS XML***
//			font name
//			font size
//			superscript
//			fill (black/grey)
//			horizontal scaling
{
	// Font name
	if (fontN != undefined) {
		var myFont = getFName(fontN.toString());
		mySR.characterAttributes.textFont = myFont;
	}
	// Font size
	if (fontS != undefined) {
		mySR.characterAttributes.size = parseFloat(fontS);
	}
	// Superscript
	if (superS != undefined) {
		mySR.characterAttributes.baselineShift = parseFloat(superS);
	}
  // Tabular lining on numbers, but trap 'nil' and 'na'
  if ((isNo == "true") && (mySR.contents.search("n") < 0)) {
    mySR.characterAttributes.figureStyle = FigureStyleType.TABULAR;
  } else {
    mySR.characterAttributes.figureStyle = FigureStyleType.DEFAULTFIGURESTYLE;
  }

	// "Miss" test. Increment counter and colour red
	// If not a miss, text may be grey...
	if ( mySR.contents.search("Miss") >= 0 ) {
		g_missCounter ++;
		mySR.characterAttributes.fillColor = g_missColourObj;
	}
	else if ( fill == 'grey') {
		mySR.characterAttributes.fillColor = g_greyColourObj;
	}

	if (hScale != undefined) {
		mySR.characterAttributes.horizontalScale = parseFloat(hScale);
	}

	// Footnote checking. There is an inconsistency between--
  //  - headers, derived from my lookup, which come with footnote string attached...
	//  - data strings, where the footnote is a separate attribute.
	// For consistency, I change fontsize and superscript to all strings, header or data, with the footnote symbols suffixed
	// Footnotes are at end of any string; and are single or double ("*", "**")
	// Loop from end of string; break once we encounter a non-symbol character...
	var rLen = mySR.characters.length - 1;
	for (var i = rLen; i > 0; i --) {
		var r = mySR.characters[i];
		// Ignore asterisk and plus signs (which will throw a RegExp-type syntax error)
		if ( (r.contents != "*") && (r.contents != "+") && (r.contents != "(") ) {
			// Point
			if (r.contents != ".") {
				// But embed in try 'coz other characters (e.g. "(") throw syntax error -- and there's a limit to what I can cover
				try {
					if ( isSymbol(r.contents) ) {
						// Comm'd out Oct 2018. Footnote symbols are already adjusted
						// symbolConvert(r);
					}
				}
				catch (error) {};
			}
			else {
				// Break on first non-footnote char
				break;
			}
		}
	}


}
// SET SUB-RANGE ATTRIBUTES ends

// SYMBOL CONVERT
// Called from setSubRangeAttributes to tweak footnote symbols
// Inferential. I suppose settings could move to a general lookup file
// But on the other hand, I could treat this as the general lookup file...
function symbolConvert(symb)
// Argument is a text range whose contents is a single "symbol" character
{/*
	if (s == "*") {
		symb.characterAttributes.baselineShift = 2;
		symb.characterAttributes.size -= 2;
	}
	if (s == "†") {
		symb.characterAttributes.baselineShift = 2;
		symb.characterAttributes.size -= 2;
	}
	if (s == "‡") {
		symb.characterAttributes.baselineShift = 2;
		symb.characterAttributes.size -= 2;
	}
	if (s == "§") {
		symb.characterAttributes.baselineShift = 2;
		symb.characterAttributes.size -= 2;
	}
	*/
	symb.characterAttributes.size = g_Attributes.footnotes.fontSize;
	symb.characterAttributes.baselineShift = g_Attributes.footnotes.superscript;
}
// SYMBOL CONVERT ends


// SET DEFAULT ATTRIBUTES
// Called from drawOneLine to apply default line attributes
// to each subrange as it is appended to current line of text
// Headers and dataLines
function setDefaultAttributes(myP, itemNo, isLastItem)
// Args:	a subrange of text (just added to current paragraph range)
//		  number (from zero) of subrange in paragraph
//		  true if last item
{

	var myFont = getFName(g_Attributes.fontName);					// font name (function in Utilities)
	myP.characterAttributes.textFont = myFont;
	myP.characterAttributes.size = g_Attributes.fontSize;			// font size
	myP.characterAttributes.fillColor = g_blackColourObj;		  // Hard-coded default text color
	// But...
	if (g_Attributes.fill == 'grey') {
		myP.characterAttributes.fillColor = g_greyColourObj;		 // ...or use grey
	}
	myP.characterAttributes.autoLeading = false;					// leading
	myP.leading = g_Attributes.leading;
	myP.characterAttributes.horizontalScale = g_Attributes.hScale;	// hScale
	myP.characterAttributes.baselineShift = g_Attributes.baseline;	// baseline
	if (isLastItem) {myP.paragraphAttributes.tabStops = g_Attributes.tabs};			// tab stops -- last item only, once all inferential (footnote) adjustment have been made
	myP.characterAttributes.overprintFill=g_overprintText;			// overprint (hard-set at top)

	// Indent added Mar '18. Makes the initial tab kinda redundant...
	if (typeof g_Attributes.indent !== 'undefined') {
		myP.paragraphAttributes.leftIndent = g_Attributes.indent;
	}

	// Any rule below line only drawn when first subrange in para
	// is processed:
	if (itemNo == 0) {
		if (g_Attributes.generalRB != undefined) {
			for each(ruleDefinition in g_Attributes.generalRB) {
				drawRuleAcross(ruleDefinition);
			}
		}
	}
}
// SET DEFAULT ATTRIBUTES ends


// *** RULE BELOW AND TINT FUNCTIONS ***
//	drawRuleAcross
//	doTint

// DRAW RULE ACROSS
// Called from setDefaultsAttributes to draw each rule
// below headers and data lines...
function drawRuleAcross(rDef)
// Arg is ruler definition
{
	var rArray = Array(1);			// co-ords array (contains 2 subarrays for start and end)
	var thisRule;

	var lineEnd = c_defaultLineEnd;	// line end style
	// Dotted line has round ends
	if (rDef[1] == "Dot") {lineEnd = 2};

	var s = "Rule across:" + g_lineCount;

	// All rule attributes are in g_Attributes.generalRule which is an array--
	//	0	strokeWidth
	//	1	style (Solid/Dot/Dash/None)
	//	2	offset (distance of rule below baseline)
	//	3	array of cmyk vals
	//	4	array: dot length & gap (empty for Solid/None)
	//	5	array: start & end h-coords

	// Ruler position, offset from current baseline
	var rulerPos = g_baseHeight - Number(rDef[2]);

	var bt = g_lookupXMLObj.layout.backTint;

	// Explicit tint height:
	var height = parseFloat(bt.@height);
	// ...unless...
	if ((g_dataCount == 1) || (g_dataCount == g_textBox2JumpCount)) {
		height = parseFloat(bt.@firstHeight);
	}
	// Tint baseline no longer follows rule
	var tTop = g_baseHeight - bt.@offset + height;

	/*  Tint notes
		I have flags for the sort of tint I'm drawing: everyOther or section
		I always have a global, g_tintTopPos, set to wherever the last section bottomed
		And a flag, g_tintOnFlag that switches on and off
	*/

	// If we're in data block, are we drawing tints? (Poll doesn't have them)
	if (!g_isHeader && g_hasTints) {
		if (g_lookupXMLObj.data.explicit == "true") {
			// Explicit tints are defined for every line...
			var tintFlag = (g_lookupXMLObj.data.explicitStyles.r[g_dataCount - 1].@tint == "true")
			if (tintFlag) {
					doTint( tTop, height );
			}
			else {
				g_tintTopPos = rulerPos;
			}
		}
		else {
			// Non-explicit
			// Every other line, or by section?
			if (g_everyOther) {
				// Every other line? If the switch is "on", draw it
				if (g_tintOnFlag) {
					doTint( tTop, height );
				}
				// Reverse the switch; reset top position
				g_tintOnFlag = !g_tintOnFlag;
				g_tintTopPos = rulerPos;
			}
			else {
				// Sections. If the switch is "on", I need to check whether we've reached a section end
				// (section ends are determined right up the chain, in drawData
				if (g_sectionEnd) {
					if (g_tintOnFlag) {
						doTint( tTop, height );
					}
					// Reverse the switch; reset top position
					g_tintTopPos = rulerPos;
					g_tintOnFlag = !g_tintOnFlag;
				}
			}
		}
	}

	if (rDef[1] != "None") {
		try {
			// Rule coords (h-pos'ns were remembered when box was created)
			rArray = [
				[rDef[5][0], rulerPos],
				[rDef[5][1], rulerPos]
			];
			// Another condition, for Commods, where rulers move down
			// on some lines
			if (!g_isHeader && (g_lookupXMLObj.data.explicit == "true")) {
				var rTweak = parseFloat(g_lookupXMLObj.data.explicitStyles.r[g_dataCount - 1].@rTweak);
				if (!isNaN(rTweak)) {
					rArray[0][1] -= rTweak;
					rArray[1][1] -= rTweak;
				}
			}
			thisRule = makeLine(g_lineLayer, rArray, false, rDef[3],
				true, rDef[0], rDef[3],
				lineEnd, c_defaultLineMiter, c_defaultLineMiterLimit,
				s, s, rDef[4]);
		}
		catch (err) {return false};
	}
	return true
}
// DRAW RULE ACROSS ends

// DO TINT
// Called from drawRuleAcross to draw tinted background box
function doTint(tintTop, height)
// Args are top and height
{
	// Create array (t,l,w,h)
	// (Left is textbox left)
	// July'18: tint boxes move in on devices
	var tintLeft = Number(g_lookupXMLObj.layout.backTint.@left)
	var tbArray = [
		tintTop,
		g_rStart + tintLeft,
		g_iFrame.width,
		height
	];
	var s = "Tint box " + g_tintBoxCounter;
	// CMYK vals
	var bt = g_lookupXMLObj.layout.backTint;
	var cmykArray = [
		parseInt(bt.@fillC),
		parseInt(bt.@fillM),
		parseInt(bt.@fillY),
		parseInt(bt.@fillK)
	];

	// Kludge for Markets.
	// (Box 1 is set to full width (so that I can run headers across),
	// so I have to overwrite with a specific value)
	if (!isNaN(Number(bt.@width))) {
		tbArray[2] = Number(bt.@width);
	}

	var tb = makeRect(g_backLayer, tbArray,
		true, cmykArray,
		false, 0, cmykArray,
		s, s);

	// Increment counter
	g_tintBoxCounter ++;
}
// DO TINT

// *** LOOKUP ATTRIBUTES EXTRACTION ***
// defaultParaObject is called once from decodeConfigXML to initialise g_Attributes
// extractPAs is called for every line to update g_Attributes
//	both call a series of sub-functions to extract
//	specific properties from the lookup file
//	and pack them into g_Attributes
//		getLeading
//		getTabs
//		getHScale
//		getFontName
//		getFontSize
//		getBaseline
//		getRuleBelow, which (since one line can have more than one rule-below) calls
//			extractRBs, to extract properties for a single rule-below


// EXTRACT PAS
// Gets attributes for one "paragraph" and sets them as properties of
// the global object "g_Attributes"
function extractPAs(paraObj)
//	Arg is an object from the lookup file defining attributes for current para
{
	var s;		// temporary attribute holder

	// I look for each attribute in the object
	// If it isn't found, the subroutine returns undefined
	// Only overwrite existing object property if NOT undefined...
	// Leading
	s = getLeading(paraObj);
	if (!isNaN(s)) {g_Attributes.leading = s};
	// Tabs
	s = getTabs(paraObj);
	if (s != undefined) {g_Attributes.tabs = s};
	// H-scaling
	s = getHScale(paraObj);
	if (!isNaN(s)) {g_Attributes.hScale = s};
	// Font name
	s = getFontName(paraObj);
	if (!(s == undefined)) {g_Attributes.fontName = s};

	// Font size
	s = getFontSize(paraObj);
	if (!isNaN(s)) {
		g_Attributes.fontSize = s;
	}

	// Text fill colour
	s = getFill(paraObj);
	if (s !== undefined) {
		g_Attributes.fill = s;
	}

	// Baseline
	s = getBaseline(paraObj);
	if (!isNaN(s)) {g_Attributes.baseline = s};

	// Offset for plus/minus rect
  // (Actually, this doesn't seem to get used...)
	s = getRectOffset(paraObj);
	if (!isNaN(s)) {g_Attributes.rectOffset = s};

	// Rule below
	// (Note that g_Attributes.generalRB can be undefined, in which case no rule is drawn)
	g_Attributes.generalRB = getRuleBelow(paraObj)

	// Footnote fontSize and superscript
	g_Attributes.footnotes = getFootnotes(paraObj);

	// Indent added Mar '18. Makes the initial tab kinda redundant...
	// By default (prevents hangover from any prev. table)
	g_Attributes.indent = 0;
	s = getIndent(paraObj);
	if (!isNaN(s)) {
		g_Attributes.indent = s;
	}
}
// EXTRACT PAS ends


// GET FOOTNOTES
// Called from extractPAs
// Returns a "footnotes" object with fontsize and superscript as numbers
function getFootnotes(o)
{
	var fObj = new Object();
	// Look for actual settings
	if (o.footnotes != undefined) {
		fObj.fontSize = parseFloat(o.footnotes.@fontSize);
		fObj.superscript = parseFloat(o.footnotes.@superscript);
	}
	else {
		// Use standard but alert
		fObj.fontSize = parseFloat(o.fontSize);
		fObj.superscript = 0;
		alert("Footnote settings not found. Using default fontsize and no superscript")
	}
	return fObj;
}
// GET FOOTNOTES ends

// GET LEADING
// Called from extractPAs
// Returns number (if attribute not found, returns NaN)
function getLeading(o)
{
	if (g_firstData) {
		// First line of data uses firstLeading
		var s = parseFloat(o.firstLeading);
	}
	else {
		var s = parseFloat(o.leading);
	}
	return s;
}
// GET LEADING ends

// GET TABS
// Called from extractPAs
// Returns Array of TabInfo objects
// If no tabs found, returns undefined
function getTabs(o)
{
	var tArray = [];	// All-tabs object to return
	var tNo = o.subRanges.subRange.length();
	// If no tabs found, return vestigial object
	if (tNo == 0) {
		var tsI = new TabStopInfo();
		tsI.position = 0;
		tsI.alignment = TabStopAlignment.Left;
		tArray.push(tsI);
		return tArray;
	}

	// Still here? Series of tabs...
	try {
		// Create TabInfo object
		for (var i = 0; i < tNo; i ++) {
			var tabO = o.subRanges.subRange[i];
			var tsI = new TabStopInfo();
			// 2 attributes: position & alignment
			tsI.position = parseFloat(tabO.@position);
			if (tabO.@alignment == "Left") {
					tsI.alignment = TabStopAlignment.Left;
			}
			else if (tabO.@alignment == "Center") {
					tsI.alignment = TabStopAlignment.Center;
			}
			else if (tabO.@alignment == "Right") {
					tsI.alignment = TabStopAlignment.Right;
			}
			else {
					tsI.alignment = TabStopAlignment.Decimal;
			}
			tArray.push(tsI);
		}
		return tArray;
	}
	catch (err) {return undefined}
}
// GET TABS ends

function getIndent(o)
{
	var s = parseFloat(o.indent);
	return s;
}

// GET H-SCALE
// Called from extractPAs
// Returns number (if attribute not found, returns NaN)
function getHScale(o)
{
	var s = parseFloat(o.hScale);
	return s;
}
// GET H-SCALE ends

// GET FONT NAME
// Called from extractPAs
// Returns string (returns undefined if no attribute found)
function getFontName(o)
{
	var s = o.fontName;
	return s;
}
// GET FONT NAME ends

// GET FONT SIZE
// Called from extractPAs
function getFontSize(o)
{
	var s = parseFloat(o.fontSize);
	return s;
}
// GET FONT SIZE ends

// GET FILL
// Called from extractPAs
function getFill(o)
{
	return o.fill;
}
// GET FILL ends

// GET BASELINE
// Called from extractPAs
function getBaseline(o)
{
	var s = parseFloat(o.baseline);
	return s;
}
// GET BASELINE ends

// GET RECT OFFSET
// Called from extractPAs
function getRectOffset(o)
{
	return parseFloat(o.rectOffset);
}
// GET BASELINE ends

// GET RULE-BELOW
// Called from extractPAs to get rule-below properties for current para
// For each rule below current para (remember: headers can have several rules below)
// it calls extractRBs to extract properties, then packs the definition object into an array
// which it returns...
function getRuleBelow(o)
{
	// Headers have one rule style only
	if (g_isHeader) {
		var rb = o.rules.headerRule;
	}
	else {
		// Data lines have various choices of rule styles
		// I define four basic styles:
		//	noRule
    //  minorRule
		//	dotRule
		//	dashRule
		//	solidRule
		// If o.rules.@explicit is true, rules are defined on a line-by-line basis in the explicitRules node
		// I can refer to these as o.explicitRules[g_dataCount - 1]
		// If o.rules.@explicit is false, I default to three properties, which define which of the styles
		// listed above to use "normally", at section ends and at the bottom of the table
		// Well, that's the theory
		//
		// So, are we "explicit"
		if (o.explicit == "true") {
			// Get ruleStyle definition from explicitRules list and look it up
			// in general data rule definitions
			var rStr = o.explicitStyles.r[g_dataCount - 1].@ruleStyle;
			rStr = rStr.toString();
			rb = o.rules[rStr];
			// Indentation
			if (rStr != "noRule") {
				var rIndent = parseFloat(o.explicitStyles.r[g_dataCount - 1].@indentRule);
				try {
					rb.@start = rIndent;
				}
				catch (err) {};
			}
		}
		else {
			// Not explicit
			// Bottom of table?
			if (g_finalDataItemFlag) {
				rStr = o.rules.@finalRule;
			}
			// Section end
			else if (g_sectionEnd) {
				rStr = o.rules.@sectionRule;
			}
			// Default
			else {
				rStr = o.rules.@defaultRule;
			}
			rStr = rStr.toString();
			rb = o.rules[rStr];
		}
	}
	// No rule: return undefined
	if (rb == undefined) {return undefined};

	// Still here? I should have either:
	//	1) a single node, with a length() of 1
	//	2) a node object with a length() > 1, thro which I can loop
	var rbArray = [];
	if (rb.length() == 1) {
		rbArray.push(extractRBs(rb));
	}
	else {
		for each (var oneRB in rb) {
			rbArray.push(extractRBs(oneRB));
		}
	}
	return rbArray
}
// GET RULE-BELOW ends

// EXTRACT RBs
// Called from getRuleBelow to extract properties of a single rule-below
// Returned as an array of properties
function extractRBs(rbO)
// Arg:	rule definition node
{
	// Style
	var styleName = rbO.@style.toString();

	// Width and offset
	var tArray = [];
	tArray.push(parseFloat(rbO.@width));
	tArray.push(styleName);
	tArray.push(parseFloat(rbO.@offset));

	// CMYK vals are in a sub-array
	var cmykArray = [
		parseInt(rbO.@strokeC),
		parseInt(rbO.@strokeM),
		parseInt(rbO.@strokeY),
		parseInt(rbO.@strokeK)
	]
	tArray.push(cmykArray);

	// Array for dot/dash length/gap
	// (Array remains empty for Solid or None)
	var dArray = [];
	if ( (styleName == "Dot") || (styleName == "Dash") ) {
		dArray.push(parseFloat(rbO.@dotLength))
		dArray.push(parseFloat(rbO.@dotGap))
	}
	tArray.push(dArray);

	// Array for start and end
	// (vals in lookup are added to table box's x value)
	var hArray = [];
	hArray.push(g_rStart + parseFloat(rbO.@start))
	hArray.push(g_rStart + parseFloat(rbO.@end))
	tArray.push(hArray);

	return tArray;

}
// EXTRACT RBs


// *** DYNAMIC DATE FUNCTIONS end ***

// SYMBOL TAB TWEAK
// Right-aligned strings have to have tab-position adjusted if they have an attached footnote symbol
// Param is a string containing footnote symbols ("*", "**", etc.)
// These can be in combination ("*†")
function symbolTabTweak(fStr) {
	// First, break down any combination into an array
	// Eg, convert "*††§§§" to "*,††,§§§"
	var fArray = [];
	var prevPos = 0;
	for (var currentPos = 1; currentPos < fStr.length; currentPos ++) {
		var a = fStr.charAt(currentPos - 1);
		var b = fStr.charAt(currentPos);
		if (b != a) {
			var f = fStr.substring(prevPos, currentPos);
			fArray.push(f);
			prevPos = currentPos;
		}
	}
	// And the final set:
	f = fStr.substring(prevPos, currentPos);
	fArray.push(f);

	// Initialise var to hold "tweak" value which will be returned
	var tweakVal = 0;

	// Now loop through the array
	for each(var fs in fArray) {
		switch (fs) {
			case "*":
				tweakVal += 2.66;
				break;
			case "**":
				tweakVal += 5.08;
				break;
			case "***":
				tweakVal += 7.5;
				break;
			case "†":
				tweakVal += 2.5;
				break;
			case "††":
				tweakVal += 3.58;
				break;
			case "†††":
				tweakVal += 6.2;
				break;
			case "‡":
				tweakVal += 1.83;
				break;
			case "‡‡":
				tweakVal += 3.58
				break;
			case "‡‡‡":
				tweakVal += 4.08;
				break;
			case "§":
				tweakVal += 1.58;
				break;
			case "§§":
				tweakVal += 3;
				break;
			case "§§§":
				tweakVal += 4.5;
				break;
			case "¶":
				tweakVal += 2;
				break;
			default:
				alert("I have encountered an unfamiliar footnote symbol: \"" + fStr + "\"\n" +
					"If this is an allowed footnote symbol, it should be included in the list in function symbolTabTweak\n\n" +
					"Processing will continue, please check the output...");
		}
	}

	return tweakVal;
}
// SYMBOL TAB TWEAK ends

// ROUNDED VAL IS ZERO
// Checks whether, if a number is rounded to the set number of DPs,
// it will be zero (e.g. "-0.03" -> -0.0 -> 0)
function roundedValIsZero(val, dP) {
	var result = false;
	if (!isNaN(val)) {
		// Force to number and round as string
		var valAsNum = parseFloat(val).toFixed(dP);
		// Back to number and test against zero
		if (parseFloat(valAsNum) !== 0) {
			result = true;
		}
	}
	return result;
}


// MY NUMBER FORMAT
// Passed a numeric data value, returns it as a string with thou separator,
// appropriate number of DPs, preceding "+" (if required)...
// Param 2 is no of DPs
// Param 3 is showPlus
// Param 4 is overruleDPs flag
function myNumberFormat(nStr, myDP, mySP, orDP) {
	// Convert to number
	var n = parseFloat(nStr);
	// Zero converts now and returns
	if (n == 0) {return c_zeroConst};
	// Thou separator flag
	var thouPlus = (n >= 1000);
	// Plus flag
	var isPlus = (n > 0);
	// Minus flag
	var isMinus = (n < 0);
	// Decimal places
	if (myDP == undefined) {
		var myDP = 1;
	}
	else {
		myDP = parseInt(myDP)
	}

	// But decimal places may overrule. Confession: I find this confusing, so
	// the story is:
	//	by default, all numbers in any data column are formatted to the number of dps defined in the dPlaces flag
	//	however, most columns need to impose a second rule, whereby:
	//		numbers 10 or above are formatted to 1dp
	//		numbers 100 or above are rounded to an integer
	//	So I have a second flag: overruleDPs which in most cases is "true", forcing that 2nd rule
	//	(An example of the flag being "false" is Ecodata/Interest rates, which is always formatted to the set 2 dPlaces)
	if (orDP != undefined) {
		if (orDP == "true") {
			if ( (n >= 100) || (n <= -100) ) {
				myDP = 0;
			}
			else if ( (n >= 10) || (n <= -10) ) {
				myDP = 1;
			}
		}
	}
	
	// Another kludge added Oct 2018 to force no-DPs on Markets US bonds values
	// (which otherwise inherit default column dps)
	var id = g_lookupXMLObj.id.toLowerCase();
	if (id.search("markets") >= 0) {
		if (g_dataCount >= c_marketsBondsCount) {
			myDP = 0;
		}
	}

	// Convert to string to set no of DPs
	var s = n.toFixed(myDP);
	// Function in Utilities does thousands separator
	if (thouPlus) {
		s = formatNumberBy3(s);
	}

	// Another Oct '18 kludge.
	// Value may be, say, a raw value of -0.03, which has been rounded (above)
	// to a 1dp string: "-0.0". That wants to be 'nil'...
	var strAsNum = parseFloat(s);
	if (strAsNum === 0) {
		return c_zeroConst;
	}

	// Is there a preceding plus sign?
	if (mySP.toString() == "true") {
		if (!isNaN(s)) {
			if (isPlus) {s = "+" + s};
		}
	}

	// Minus signs convert to en-dash, if set in lu
	if (g_lookupXMLObj.general.enDashes == "true") {
		if (!isNaN(s)) {
			if (isMinus) {s = "–" + Math.abs(s)};
		}
	}

	return s;
}
// MY NUMBER FORMAT ends

// =============== FUNCTIONS IMPORTED FROM ILEX MODULES ===================
// Note: Ilex was the suite of Indicators macros that preceded the development
// of Silver Bullet. Until mid-2022, we included a number of funcctions from
// Ilex components. Now that Ilex is redundant, these functions brought indoors

// MAKE COLOUR OBJECT
// Passed a CMYK array, returns a colour object
function makeColourObject(cA)
{
	//Set color values for the CMYK object
	// Then wrap the color in a standard color object
	var myCol = new CMYKColor();
	myCol.cyan = cA[0];
	myCol.magenta = cA[1];
	myCol.yellow = cA[2];
	myCol.black = cA[3];
	return myCol;
}
// MAKE COLOUR OBJECT ends

// SET F-NAME
// Looks for font name in application's list
// If not found, sets font to first in list. Returns font object.
function setFName(fName)
{
	var fontFlag = false;
	// Default font is first in application's list
	var myF = app.textFonts[0];
	var i;
	for (i = 0; i < app.textFonts.length; i ++) {
	    	if (app.textFonts[i].name == fName) {
			// Font found -- apply
	      	myF = app.textFonts[i];
			return myF;
   		}
	}
	// Still here? Font not found so return default font object
	return myF;
}
// SET F-NAME ends


// =============================================
// ILLUSTRATOR PRIMITIVES
// Functions to draw basic shapes in Illustrator
//    makeRect
//    makeLine
//    setPathAttributes
//    setAttributeError
// =============================================

// MAKE RECT
// Args are	context, points array (top, left, width, height),
//			fill flag, fill colour array (c,m,y,k),
//			stroke flag, stroke width, stroke colour array (c,m,y,k),
//			object name; object note string
//			stroke dash; rotation
function makeRect(docRef,rectPath,fFlag,fCols,sFlag,sWidth,sCols,rectName,rectNote,sDash,rotateBy,isHidden)
{
	// if (!(rotateBy==undefined)) {listArgs(arguments)}
	var xCa;
	var yCa;
	var xCb;
	var yCb;
	var cMove;
	try {
		// Draw the path
		// rectangle params are top, left, width, height
		var pathRef = docRef.pathItems.rectangle(rectPath[0],rectPath[1],rectPath[2],rectPath[3],);
		// Rotation
		if (!(rotateBy == undefined)) {
			// There's some sort of rotation bug in Illy, whereby it doesn't seem to rotate
			// by its true centre (unless it's at 0,0!)
			// So I note current centre, rotate and force the centre back to where I want it
			// But I can only do this if strokWidth is zero, so...
			// (final sW is set by setPathAttributes, called just below)
      // (This Illy bug may have been fixed, but I haven't checked lately... and
      // anyway, I can't think of any requirement for rotation in Indicators)
			pathRef.strokeWidth = 0;
			// Remember current centre
			xCa = pathRef.left + (pathRef.width/2);
			yCa = pathRef.top - (pathRef.height/2);
			// Rotate (position will change)
			pathRef.rotate(rotateBy, true, undefined, undefined, undefined, Transformation.CENTER);
			// Get new centre
			xCb = pathRef.left + (pathRef.width/2);
			yCb = pathRef.top - (pathRef.height/2);
			cMove = xCa - xCb;
			pathRef.left += cMove;
			cMove = yCa - yCb;
			pathRef.top += cMove;
			// Which leaves unstroked path in (hopefully) correct position
		}

		// Sub-function sets other attributes (fill, stroke, ID)
		// (So overrides zero stroke set by any rotation)
		if (!setPathAttributes(pathRef,fFlag,fCols,sFlag,sWidth,sCols,
			c_defaultLineEnd,c_defaultLineMiter,c_defaultLineMiterLimit,rectName,rectNote,sDash,isHidden)) {
			// To prevent repeated error reports:
			if (!g_primitiveError) {
				setAttributeError(rectNote);
				g_primitiveError = true;
			}
		}
	}
	catch (err) {
		// If an error occurs, I check the flag. If this is the first error of this type, I sound the alarm
		// But reset the flag to prevent the error being repeated
		if (!g_primitiveError) {
			alert("This error occurred when I tried to draw item " + rectName + " (from makeRect)");
			g_primitiveError = true;
		}
	}
	// Return path item:
	return pathRef;
}
// MAKE RECT ends

// MAKE LINE
// Args are 	layer/group, points array (a series of x/y pairs),
//				fill flag, fill colour array (c,m,y,k),
//				stroke flag, stroke width, stroke colour array (c,m,y,k),
//				butt end (0,1,2) miter, miter limit (1 - ...),
//				object name; object note string
//				dash pattern array
//	Can deal with lines longer than setEntirePath's 1000-pt limit
function makeLine(context,linePath,fFlag,fCols,sFlag,sWidth,sCols,sEnd,sMiter,sMiterLimit,sName,sNote,sDash)
{
	// listArgs(arguments)
	var maxPoints = 1000;
	var pathRef;
	var myPts;
	var itemFlag = true;
	try {
		// How many points in the path?
		if (linePath.length > maxPoints) {
			// If more than the 1000 points that setEntirePath can handle,
			// extract first 1000 points and draw them in one fell swoop
      // (again: this won't happen in Indicators)
			myPts = linePath.slice(0, maxPoints);
			pathRef = context.pathItems.add();
			pathRef.setEntirePath(myPts);
			// Then, beyond the 1000-pt limit, add points one-by-one!
			for (var i = maxPoints; i < linePath.length; i ++) {
				var newPoint = pathRef.pathPoints.add();
				newPoint.anchor = linePath[i];
				newPoint.leftDirection = newPoint.anchor;
				newPoint.rightDirection = newPoint.anchor;
				newPoint.pointType = PointType.CORNER;
			}
		}
		else {
			// Less than 1000 points: draw entire path
			pathRef = context.pathItems.add();
			pathRef.setEntirePath(linePath);
		}

		// Sub-function sets other attributes (fill, stroke, ID)
		if (!setPathAttributes(pathRef,fFlag,fCols,sFlag,sWidth,sCols,sEnd,sMiter,sMiterLimit,sName,sNote,sDash)) {
			if (!g_primitiveError) {
				setAttributeError(sNote);
				g_primitiveError = true;
			}
			s = "Unknown error"
			itemFlag = false;
		}
	}
	catch (err) {
		var s = err
		itemFlag = false;
	}
	if (!itemFlag) {
		if (!g_primitiveError) {
			myAlert(s + "\nThis error occurred when " + c_I + " tried to draw item " + sName + " (from makeLine)", s);
			g_primitiveError = true;
		}
	}
	return pathRef;
}
// makeLine ends

/* --------------------------------------------
   --------------------------------------------
   ----- Second-level primitive functions ----- */

// SET PATH ATTRIBUTES function
// This is called by all path-creating functions: RECTANGLE, CIRCLE, WEDGE, LINE (not text)
// Sets fill and stroke attributes; name and note-string
// Does nothing about orientation...
function setPathAttributes(theObject,fFlag,fCols,sFlag,sWidth,sCols,sEnd,sMiter,sMLimit,oName,oNote,pDash,isHidden)
// Args: object; fill Flag, CMYK,
//		stroke flag, width, CMYK, line ends, miterjoin, miterlimit;
//		object name, note;
//		line dash, joins
{
	var dashA;
	//listArgs(arguments)
	try {
		// Fill
		theObject.filled=fFlag;
		theObject.name=oName;
		// Overprint? I've thrown a kludgy flag at the note properties
		// of bar and column rects. It looks as though Illy has started to
		// overprint elements by default; so this forces overprinting off
		// for bars and columns, where I've appended 'overprint-off' to
		// the note property
		// If this breaks, comment out next 2 lines and line 544
		var overPrint = oNote.search('overprint-off') < 0;
		oNote.replace('overprint-off', '');
		theObject.note=oNote;
		if (fFlag) {
			myCol = makeColourObject(fCols);
			theObject.fillColor = myCol;
			// theObject.fillOverprint = overPrint;
			// Nope: apparently we ALWAYS turn overprinting off
			theObject.fillOverprint = false;
		}
		// Stroke
		theObject.stroked = sFlag;
		// Hidden?
		if (isHidden === undefined) {
			isHidden = false;
		}
		theObject.hidden = isHidden;
		if (sFlag) {
			with (theObject) {

				strokeWidth=sWidth;				// width
				myCol = makeColourObject(sCols);

				strokeColor = myCol;

				if (sEnd == 2) {								// line end
					strokeCap = StrokeCap.ROUNDENDCAP;
				}
				else if (sEnd == 1) {
					strokeCap = StrokeCap.PROJECTINGENDCAP;
				}
				else {
					strokeCap = StrokeCap.BUTTENDCAP;
				}

				if (sMiter == 2) {							// join
					strokeJoin = StrokeJoin.ROUNDENDJOIN;
				}
				else if (sMiter == 1) {
					strokeJoin = StrokeJoin.BEVELENDJOIN;
				}
				else {
					strokeJoin = StrokeJoin.MITERENDJOIN;
				}
				strokeMiterLimit=sMLimit;						// miter limit

				// Dash. Documentation says that the strokeDashes property requires
				// an object; but this raises an error. So I just create an array
				//
				// If no dash, rather than an empty object, {}, as documented, create an empty array
				if ((pDash == undefined) || (pDash[0] == 0)) {
					dashA = Array();
				}
				else {
					// Array of values: dash & gap
					dashA = Array(pDash.length);
					for (i = 0; i < dashA.length; i ++) {
						dashA[i] = pDash[i];
					}
				}

				// Kludgy mod Jan 2018 to overprint lines, if unfilled and black
				if (!fFlag) {
					if (sCols[3] > 90) {						
						strokeOverprint = g_overprintStroke;
					} else {
						strokeOverprint = false;
					}
				}

				try {
					strokeDashes = dashA;
				}
				catch (err) {};
			}
		}
		// If we've got here:
		return true;
	}
	catch (err) {
		// listArgs(arguments)
		return false;
	}
}
// End SET PATH ATTRIBUTES

// SET ATTRIBUTE ERROR Function reports errors setting item attributes
// Called from rectangle, ellipse, circle, etc.
//
function setAttributeError (theItem)
{
	msg = "An error occurred setting the attributes of this item. " +
	"It may not have been drawn correctly...";
	myAlert (msg, theItem);
}
// End SET ATTRIBUTE ERROR


// *********
// UTILITIES
// *********

// READ XML FILE
// ExtractS XML data from a file
function readXMLFile(fName) {
	var myF = new File(fName);
	if (myF.exists) {
		myF.open("r");
		myF.seek(0);
		var xmlText = myF.read ();
		var o = new XML (xmlText);
		return o;
	}
	else {return undefined};
}
// READ XML FILE ends

// CHECK SEP
// Checks that any folder path ends with a separator
function checkSep(pToCheck)
// Arg is path string
{
	// Get string length and position of last occurrence of separator
  var x = pToCheck.length - 1 ;
  var y = pToCheck.lastIndexOf(c_pS);
  // If final char isn't separator, add one:
	if(! (x == y)) {
		pToCheck += c_pS;
	}
	return pToCheck;
}
// CHECK SEP ends

// CHECK PATH
// Function verifies existence of a folder or file; returns true or false
function checkPath(thePath, mustExist)
// Args:		path as string
//			    true if path MUST exist
{
	if (mustExist) {
		if (!File(thePath).exists) {
			msg = "Unable to find file or folder:\n     " + thePath;
			msg += "\n\nIf it is on a server, make sure that this is mounted. ";
			msg += "Otherwise please verify paths and try again. If this error ";
			msg += "persists, contact " + c_authorName;
			alert (msg);
			return false;
		}
	}
	return true;
}
// CHECK PATH ends

// I-TRANSLATE
// Entirely inferential function to convert rogue characters
// in source file to what we want to see (mostly footnote symbols)
function iTranslate(it)
{
	// The Excel contingency macros currently convert the
	// footnote symbols (†‡§) into strings
	// Database output to come...
	//	Note that € and ampersand are exported from Excel contingency
	//	as unicode, so are ignored here
	// Shortened...
	var transPairs = [
		[/xlDagger/g, "†"],
		[/xlDoubleDagger/g, "‡"],
		[/xlHook/g, "§"],
		[/xlPilcrow/g, "¶"]
	];
	// Convert incoming XML object to string
	it = it.toString();
	for (var i in transPairs) {
		it = it.replace(transPairs[i][0],transPairs[i][1]);
	}
	return it;
}
// I-TRANSLATE ends

// ITALICISE ECO
// Finds and italicises "The Economist"
// NOTE: THIS CURRENTLY HANDLES ONLY ONE OCCURRENCE...
function italiciseEco(eRange)
{
	var s = eRange.contents;
	// Look for tag in contents; if not found, return
	var eFound = s.search(c_ecoString);
	if (eFound < 0) {return eRange};

	// Still here? Range contains Eco string...
	// ...get subrange length
	var eLen = c_ecoString.length;
	// Regular expresssion excludes EIU
    // (I use the regex to find the string, then I have to isolate it as a range)
    myRe = /The Economist(?!\sIntelligence)/g;
	// ...and empty range to return
	var returnedRange;
	// Run reg exp.
	var sResult = myRe.exec(s);
    if (sResult == null) {
        return eRange;
    }
    // Now isolate the range object
	var ecoRange = eRange.characters[sResult.index];
	ecoRange.length = eLen;
	// Use existing font to decide which italic font to use
	if (ecoRange.characterAttributes.textFont.name.search("Bol") > 0) {
		var myFont = getFName("EconomistSans_BoldItalic");
	}
	else if (ecoRange.characterAttributes.textFont.name.search("Med") > 0) {
		var myFont = getFName("EconomistSans_MediumItalic");
	}
	else if (ecoRange.characterAttributes.textFont.name.search("Lig") > 0) {
		var myFont = getFName("EconomistSans_LightItalic");
	}
	else {
		myFont = getFName("EconomistSans_RegularItalic");
	}
	ecoRange.characterAttributes.textFont = myFont;
}
// ITALICISE ECO ends

// DELETE ROGUE SOURCE STRING
// Entirely inferential function to remove a rogue source
// string that keeps getting appended to EcoData/EcoData1 raw XML
function deleteRogueSourceString(fRange) {
  var cont = fRange.contents;
  // Look for string in contents; if not found, return
  var sFound = cont.search(c_rogueSourceString);
  if (sFound < 0) {return fRange};
  // Still here? Range contains string, so get length
  var sLen = c_rogueSourceString.length;
  // Get index of rogue range
  myRe = new RegExp(c_rogueSourceString);
  var sResult = myRe.exec(cont);
  var rogueRange = fRange.characters[sResult.index];
  rogueRange.length = sLen;
  // See: https://ai-scripting.docsforadobe.dev/jsobjref/TextRange.html#textrange-remove
  rogueRange.remove();
}
// DELETE ROGUE SOURCE STRING ends

// GET F-NAME
// Retrieves named font object from g_fontsObj
function getFName(f) {
	return g_fontsObj[f];
}
// GET F-NAME ends

// *** DYNAMIC DATE FUNCTIONS ***

// MAKE SHORT DATE
// Called whenever we trip over "@shortdate" dynamic date marker
// Returns today's date in dd Mmm/th format
function makeShortDate() {
	var d = new Date();
	var s = c_MonthArray[d.getMonth()] + " " + thDate(d.getDate());
	return s;
}
// MAKE SHORT DATE ends

// MAKE THIS YEAR
// Responds to "@thisyear" dynamic date marker
// with current year as yyyy
function makeThisYear() {
	var d = new Date();
	var s = d.getFullYear().toString();
	return s;
}
// MAKE THIS YEAR ends

// MAKE LAST YEAR
// Responds to "@lastyear" dynamic date marker
// with previous year as yyyy
function makeLastYear() {
	var d = new Date();
	var s = d.getFullYear() - 1;
	return s.toString();
}
// MAKE LAST YEAR ends

// MAKE END LAST YEAR
// Responds to "@endlastyear" dynamic date marker
// with 31st Dec of last year
function makeEndLastYear() {
	var d = new Date();
	var s = d.getFullYear() - 1;
	return "31st Dec " + s.toString();
}
// MAKE END LAST YEAR ends

// TH DATE
// Called from makeDate to convert "1" to "1st", etc.
function thDate(d) {
	switch (d.toString) {
		case "1":
			return " 1st";
		case "2":
			return " 2nd"
		case "3":
			return " 3rd"
		case "21":
			return " 21st";
		case "22":
			return " 22nd"
		case "23":
			return " 23rd"
		case "31":
			return " 31st";
		default:
			return " " + d + "th";
	}
}
// TH DATE ends

/*
FORMAT NUMBER BY 3
Author: Robert Hashemian
http://www.hashemian.com/
You can use this code in any manner so long as the author's
name, Web address and this disclaimer is kept intact.
********************************************************
Usage Sample:
<script language="JavaScript" src="http://www.hashemian.com/js/NumberFormat.js"></script>
<script language="JavaScript">
document.write(formatNumberBy3("1234512345.12345", ".", ","));
</script>
*/
// Function to format a number with separators. returns formatted number.
// num - the number to be formatted
// decpoint - the decimal point character. if skipped, "." is used
// sep - the separator character. if skipped, "," is used
function formatNumberBy3(num, decpoint, sep) {
  // check for missing parameters and use defaults if so
  if (arguments.length == 3) {
	dPlaces = -1;
  }
  if (arguments.length == 2) {
	dPlaces = -1;
    sep = ",";
  }
  if (arguments.length == 1) {
	dPlaces = -1;
    sep = ",";
    decpoint = ".";
  }
	// trap negatives before converting to string
	// (to prevent scales displaying, e.g., "-,100")
	var isNeg = false;
	if (num < 0) {
		isNeg = true;
		// No, don't do this here: -1.0 gets changed to 1, and the .0 is lost...
		// num = Math.abs(num);
	}

  // need a string for operations
  num = num.toString();
  // separate the whole (poss'y neg) number and the decimal fraction (if any)
  a = num.split(decpoint);
  // Integer portion, without the minus:
  x = a[0].replace("-","");
  y = a[1]; // decimal portion
  z = "";

  if (typeof(x) != "undefined") {
    // reverse the digits. regexp works from left to right.
    for (i=x.length-1;i>=0;i--) {
      z += x.charAt(i);
		}
    // add separators. but undo the trailing one, if there
    z = z.replace(/(\d{3})/g, "$1" + sep);
    if (z.slice(-sep.length) == sep) {
      z = z.slice(0, -sep.length);
		}
    x = "";
    // reverse again to get back the number
    for (i=z.length-1;i>=0;i--) {
      x += z.charAt(i);
		}
    // add the fraction back in, if it was there
    if (typeof(y) != "undefined" && y.length > 0) {
      x += decpoint + y;
		}
  }
	if (isNeg) {
		x = "-" + x;
	}
return x;
}
// FORMAT NUMBERS BY 3 ends