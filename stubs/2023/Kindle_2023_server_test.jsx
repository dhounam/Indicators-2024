/*	Kindle: "visible" JS stub file
	'Server' test version (will force file datestamp to '20990101')
	Flags refactored Aug'22
*/

// Main code file on server
#include "/Volumes/Data/Indicators-2023/Kindle_2023.jsx"

// Access server version
var isLocal = false;
// Test flag
var isTest = true;

try {
	Kindle(isLocal, isTest);
}
catch (error) {
	alert("Unable to process anything. Start by checking that the Data server is mounted. If that doesn't work, scream for Donald (07825 994445)...")
}