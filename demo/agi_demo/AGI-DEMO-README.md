# AGI Calculator Demo

An interactive web-based calculator for computing Adjusted Gross Income (AGI) using the Fact Graph engine.

## Overview

This demo showcases how the Fact Graph library can be used to model and calculate tax computations in a web application. It provides a user-friendly form for entering income sources and personal information, then automatically computes:

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

## Example Scenarios

### Scenario 1: Basic W-2 Employee
```
Total Wages: $50,000
Total Interest Income: $1,500
Total 1099 Income: $3,000
Total Adjustments: $2,000
Date of Birth: 1990-01-01
U.S. Citizen: Yes

Expected AGI: $52,500
Age: 35
Eligible for Direct File: Yes
```

### Scenario 2: High Adjustments
```
Total Wages: $10,000
Total Interest Income: $1,500
Total 1099 Income: $3,000
Total Adjustments: $20,000
Date of Birth: 2009-01-01
U.S. Citizen: Yes

Expected AGI: -$5,500 (negative AGI)
Age: 16
Eligible for Direct File: Yes
```

### Scenario 3: Under 16
```
Total Wages: $5,000
Date of Birth: 2010-06-15
U.S. Citizen: Yes

Expected AGI: $5,000
Age: 15
Eligible for Direct File: No (under 16)
```

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

## Troubleshooting

**The page loads but nothing happens when I submit:**
- Check the browser console (F12) for JavaScript errors
- Ensure you're running from a web server, not opening the file directly (file://)
- Verify that `fg.js` and the compiled Scala.js output are present

**AGI calculation seems wrong:**
- Verify all inputs are numeric (no dollar signs or commas)
- Remember that adjustments are *subtracted* from total income
- Check the Graph JSON to see all computed values

**Eligibility shows "No" when expected:**
- Verify you checked "U.S. Citizen"
- Confirm year of birth makes you 16 or older in 2025
- Both conditions must be true for eligibility

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
