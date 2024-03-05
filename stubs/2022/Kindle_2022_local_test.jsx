/*	Kindle: "visible" JS stub file
	Local test version will datestamp files '20990101'
	Flags refactored Aug'22
*/

// Local Kindle_2022.jsx in development:
#include "~/Desktop/Indicators-2022/Kindle_2022.jsx"

// Work locally
var isLocal = true;
// Test flag
var isTest = true;

try {
	Kindle(isLocal, isTest);
}
catch (error) {
	alert("Unable to process anything. Start by checking that the Data server is mounted. If that doesn't work, scream for Donald (07825 994445)...")
}