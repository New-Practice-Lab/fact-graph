# AGI Calculator Demo

A calculator for computing Adjusted Gross Income (AGI) using the IRS Fact Graph engine.

## Overview

This demo demonstrates how to use an AGI-related fact dictionary (copied from the
[test suite of the upstream IRS repo](https://github.com/IRS-Public/fact-graph/blob/main/shared/src/test/resources/exampleAgiFacts.xml)) to calculate AGI based on form input. The
form collects income sources and personal information and then automatically computes:

- **Adjusted Gross Income (AGI)** - Total income minus adjustments
- **Age** - Calculated from year of birth
- **Eligibility for Direct File** - Based on age and citizenship status

## Files

- `agi-demo.html` - The main HTML page with the input form and results display
- `agi-loader.js` - JavaScript that loads the fact dictionary and handles calculations
- `exampleAgiFacts.xml` - The fact dictionary defining AGI calculation rules

## How to Run

1. Make sure you have the compiled JavaScript files in the demo directory:
   ```bash
   # From the project root
   sbt fastOptJS

   # From the demo directory
   bash copy-fg.sh
   ```

2. Start a local web server from the project root:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your browser to:
   ```
   http://localhost:8000/demo/agi-demo.html
   ```

## How to Use

### 1. Enter Income Information

- **Total Wages**: W-2 income from employment
- **Total Interest Income**: Interest from savings, bonds, etc.
- **Total 1099 Income**: Freelance, contractor, or self-employment income

### 2. Enter Adjustments

- **Total Adjustments**: Deductions like student loan interest, IRA contributions, educator expenses, etc.

### 3. Enter Personal Information

- **Date of Birth**: Your birth date (required) - used to calculate age for tax year 2025
- **U.S. Citizen**: Check if you are a U.S. citizen

### 4. Calculate

Click the **"Calculate AGI"** button to:
- Compute your Adjusted Gross Income
- Calculate your age
- Determine eligibility for Direct File (age 16+ and U.S. citizen)

### 5. View Results

The results section will display:
- Your calculated AGI (green if positive, red if negative)
- Your age as of tax year 2025
- Whether you are 16 or older
- Your eligibility for Direct File
- (Optional) The complete graph data in JSON format

## Technical Details

### Fact Graph Structure

The AGI calculation is defined in `exampleAgiFacts.xml` with these key facts:

**Writable Facts** (user inputs):
- `/totalWages` - Dollar amount
- `/totalInterestIncome` - Dollar amount
- `/total1099Income` - Dollar amount
- `/totalAdjustments` - Dollar amount
- `/dateOfBirth` - Date (year is extracted from this in JavaScript to set `/yearOfBirth`)
- `/isUsCitizen` - Boolean

**Derived Facts** (computed):
- `/totalAdjustedGrossIncome` = (wages + interest + 1099) - adjustments
- `/age` = taxYear (2025) - yearOfBirth
- `/age16OrOlder` = age >= 16
- `/eligibleForDirectFile` = age16OrOlder AND isUsCitizen

### Implementation Notes

The demo automatically derives the year of birth from the date of birth field:
- User enters only the date of birth (e.g., "1990-01-01")
- JavaScript extracts the year (1990) and sets both `/dateOfBirth` and `/yearOfBirth` facts
- The XML fact dictionary uses `/yearOfBirth` to calculate age
- This simplifies the user interface while maintaining compatibility with the existing fact definitions

### Value Handling

The demo handles:
- **Dollar values**: Formatted as currency with 2 decimal places
- **Boolean values**: Displayed as "Yes" or "No" with color coding
- **Negative AGI**: Displayed in red to indicate negative values
- **Incomplete values**: Shown as "-" when required inputs are missing

## Extending the Demo

To add more facts or modify the calculation:

1. Edit `exampleAgiFacts.xml` to add new fact definitions
2. Update `agi-demo.html` to add form fields for new writable facts
3. Update `agi-loader.js` to set the new facts and display results
4. Recompile if needed: `sbt fastOptJS && bash demo/copy-fg.sh`

## Related Files

- Main demo: `index.html` - Generic fact graph interface
- Original test spec: `jvm/src/test/scala/gov/irs/factgraph/ExampleAgiSpec.scala`
- Fact dictionary: `shared/src/test/resources/exampleAgiFacts.xml`
