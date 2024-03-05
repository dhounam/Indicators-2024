// Indicators: "stub" JS file for LIVE server version of Indicators, using current datestamp
// Windows version

// NOTE: THIS STUB HAS NOT BEEN NETWORK TESTED

// Include SERVER copy of Indicators_2022.jsx:
#include "/Volumes/Data/Indicators-2022/Indicators_2022.jsx"

// $.level=1;

// isLocal is true to read in local config file, and use 'local' paths
// False to read in network config file, and use Mac/Windows paths

// isMac is Mac/Windows flag

// isTest=true for testing, which will override file dates to use 
// 1 Jan 2099 (20990101), locally or over network

//	*****************************
//	*** EDIT THESE LINES ONLY ***
const isLocal = false;
const isMac = false;
const isTest = false;
//	*****************************

try {
	// Call top-level function
	Indicators(isLocal, isMac, isTest);
}
catch (error) {
	alert(error)
	alert("Unable to process anything. Start by checking that all volumes are mounted. If that doesn't work, scream for Donald (07825 994445)...")
}