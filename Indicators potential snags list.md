# Indicators: potential snags
As of June 2021, it is proposed that the Indicators macros should be replaced with a Python script, generating PDF output. This is a fairly random list of some of the snag points that the developer might encounter
## Markets table: two blocks of text in print version
(Note: in the code file, the Markets table is referred to, for historical reasons, never corrected, as ‘Reserves’.)
The existence of this second text block is flagged in the lookup file (tabMARKETSPRINT\_lookup.xml), along with the various properties that define it (including the number of the data-row at which to switch to the right-hand block)
## Markets table: bonds section
Not so long ago, out of nowhere, somebody had a Bright Idea and an additional ‘bonds’ section was added to the bottom of the right-hand block of the Markets table. The content for this section -- headers and all -- is simply appended to the raw XML data file. So…
I define the data-row at which the switch to the bonds section occurs as a hard-coded variable: (c_marketsBondsCount = 38)
There is a specific, inferential function (insertMarketBondsHeader) to format the bonds section headers
## Red flash
Originally some tables presented red Economist flashes at top left. I don’t think we use these any more, but there is still provision for them in the code and in the lookup files
## Headers
These flow in, like the basic data, literally row by row. Formatting, extracted from the relevant lookup file, includes column-specific fontsize, emphasis, horizontal-scaling, justification, etc.
Dates (e.g. rightmost column of Markets) arrive as tags:
- "@shortdate"		Mmm dd/th
- "@thisyear"
- "@lastyear"
- "@endlastyear"	Dec 31st yyyy
The suffixes (‘st’, ‘nd’, ‘rd’, ‘th’) are appended inferentially and literally (e.g. ‘31’ → ‘31st’)
## Section breaks
Solid horizontal lines, defined by row-number in the table-specific lookup.
## Plus signs
At one stage, some columns marked positive values with a ‘+’. This doesn’t seem to be the case any more, but it is still provided for.
## Number formatting
By default, all numbers in any data column are formatted to the number of dps defined in the dPlaces flag in the table-specific lookup. However, most columns then impose a second rule, whereby:
- numbers 10 or above are formatted to 1dp
- numbers 100 or above are rounded to an integer
So a second flag: overruleDPs (in most cases "true") forces that 2nd rule (see, for example, Economic Data / Currency units per $)
Zeros are expressed as ‘nil’ (evaluated after formatting)
## Non-numeric values
The XML data can include these values:
- ‘na’
- ‘Miss’ (see below)
- a hyphen ‘-’
- an empty string (Economic data, last column for ‘United States’)
I suspect that this is simply a missing value that has been overlooked because it comes at the end of a row and therefore has no knock-on effect...
## Hard returns in sources and footnotes
These can be flagged in the raw XML as ‘@newline’ or, apparently, as ‘&newline’. However, it looks as though everything is allowed to wrap automatically.
## ‘The Economist’
The string ‘The Economist’ is inferentially italicised (e.g. Commodities header 2)
## Initial tab
Once upon a time, as I recall, some data rows needed an initial tab. This has been replaced by an indent.
## Background row tints
Both Economic data and Markets put a pale blue tint behind alternate rows (starting with ‘on’).
Commodities, however, observes the ‘explicit’ flag (see above) and sets the tint on or off for each row (allowing ‘Sterling index’ to be tinted, after ‘Metals)
## Pink and blue rectangles
These indicate positive and negative values. I draw them at the same time as the overlaying values, for obvious reasons.
If, when a negative number is rounded to the set number of dps, it evaluates as zero (e.g. "-0.03" -\> -0.0 -\> 0), the rectangle is drawn blue.
## Footnote symbols
Values in the raw XML are dataItems with 2 properties:
\<dataitem value="13.24" footnote="†††"/\>
Two rules apply:
- By default, if the footnote is appended to a right-justifed value, there’s a tabbing adjustment, to preserve alignment.
- If, in addition, the value overlays a pink or blue rectangle
	- the footnote is moved a set number of spaces to the right (defined as a constant: string of five spaces)
	- the tabbing is further adjusted (constant: hard-coded value)
(See, for example, Economic data / Interest rates)
## Misses
During test runs, the database may send an absent value as ‘Miss’. This is interpreted literally, but emphasised in red.