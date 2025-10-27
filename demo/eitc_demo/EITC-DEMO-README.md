# EITC Eligibility Checker Demo

A web application that determines eligibility for the Earned Income Tax Credit (EITC) using the Fact Graph engine.

## What is EITC?

The **Earned Income Tax Credit (EITC)** is a refundable tax credit for low to moderate income working individuals and families. The credit amount varies based on income, filing status, and number of qualifying children.

## Features

This demo checks EITC eligibility based on the **2024 tax year** rules and includes:

- **Filing Status**: Support for all filing statuses (Single, MFJ, MFS, HOH, QSS)
- **Income Tests**: Earned income, AGI, and investment income limits
- **Age Requirements**: Automatic age validation (25-64 for filers without qualifying children)
- **SSN Validation**: Checks for valid Social Security Numbers
- **Qualifying Children**: Supports 0-3+ qualifying children
- **Special Rules**: Includes special rule for separated spouses
- **Real-time Feedback**: Shows exactly which requirements are met or failed

## How to Use

### 1. Start a Web Server

From the project root directory:

```bash
python3 -m http.server 8000
```

### 2. Open the Demo

Navigate to: [http://localhost:8000/demo/eitc_demo/eitc-demo.html](http://localhost:8000/demo/eitc_demo/eitc-demo.html)

### 3. Fill Out the Form

Enter information about:

- **Filing Status** - How you're filing your taxes
- **Marital Status** - Whether you're married
- **Age** - Your age (and spouse's age if married)
- **SSN** - Whether you have valid SSNs for employment
- **Income** - Earned income, AGI, and investment income
- **Qualifying Children** - Number of children who qualify for EITC

### 4. Check Eligibility

Click "Check Eligibility" to see:

- ✓ **Eligible** or ✗ **Not Eligible** status
- Detailed breakdown of each requirement
- The specific income limit that applies to your situation
- Reason for ineligibility (if applicable)

## EITC Rules (2024 Tax Year)

### Income Limits

The EITC has different income limits based on filing status and number of qualifying children:

| Qualifying Children | Single/HOH/MFS | Married Filing Jointly |
|---------------------|----------------|------------------------|
| 0                   | $18,591        | $25,511                |
| 1                   | $49,084        | $56,004                |
| 2                   | $55,768        | $62,688                |
| 3 or more           | $59,899        | $66,819                |

### Investment Income Limit

Investment income must be **$11,600 or less** (interest, dividends, capital gains).

### Basic Requirements

To qualify for EITC, you must:

1. ✓ Have **earned income** from employment or self-employment
2. ✓ Have a **valid Social Security Number** for employment
3. ✓ Meet **income limits** (both earned income and AGI)
4. ✓ Have **investment income** below $11,600
5. ✓ Generally **not file Married Filing Separately** (unless special rule applies)
6. ✓ Not be claimed as a **dependent** on another person's return

### Age Requirements (Without Qualifying Children)

If you have **no qualifying children**, you must be:

- At least **25 years old** at the end of the tax year
- Under **65 years old** at the end of the tax year

(If married filing jointly, only one spouse needs to meet the age requirement)

### Special Rule for Separated Spouses

If you're married but lived apart from your spouse for the last 6 months of the year **AND** you have qualifying children, you may still qualify for EITC even if not filing jointly.

## Technical Details

### Fact Dictionary

The demo uses a simplified fact dictionary (`eitc-facts.xml`) extracted from the full U.S. tax code fact dictionary. It includes:

- **Writable Facts**: User inputs (filing status, age, income, etc.)
- **Derived Facts**: Calculated eligibility tests
- **Tax Year Constants**: 2024 income limits and thresholds

### Computation Flow

```
User Input → Fact Graph → Eligibility Rules → Result
```

1. User enters data via the web form
2. Data is set as writable facts in the graph
3. Fact Graph automatically computes derived facts
4. Final `/eitcQualified` fact indicates eligibility
5. `/failureReason` fact explains why if not eligible

### Key Facts in the Dictionary

- `/eitcQualified` - Final eligibility determination
- `/maybeEligibleForEitc` - Preliminary eligibility
- `/maybeEligibleForEitcBase` - Base requirements (income, SSN, etc.)
- `/maybeEligibleForEitcWithQc` - Eligibility with qualifying children
- `/maybeEligibleForEitcWithoutQc` - Eligibility without qualifying children
- `/filersAgeTestForEitcWithNoQC` - Age requirement for childless workers
- `/eitcIncomeLimit` - Applicable income limit based on situation
- `/failureReason` - Human-readable explanation of ineligibility

## Limitations

This demo is **simplified for educational purposes** and does not include:

- ❌ Detailed qualifying child tests (relationship, age, residency, support)
- ❌ Tiebreaker rules when multiple people can claim the same child
- ❌ Form 8862 requirements (for those with prior EITC denials)
- ❌ Disqualification periods for fraudulent claims
- ❌ Foreign earned income exclusions
- ❌ Combat pay elections
- ❌ Actual credit amount calculation

**For real tax filing, consult a tax professional or use official IRS tools.**

## Fact Graph Benefits

This demo showcases how the Fact Graph engine enables:

1. **Declarative Tax Logic** - Rules are defined in XML, not hard-coded
2. **Automatic Computation** - All derived facts calculated automatically
3. **Dependency Tracking** - Facts know what they depend on
4. **Real-time Validation** - Immediate feedback on eligibility
5. **Transparent Logic** - Can view exact graph state and computations
6. **Easy Updates** - Change tax rules by editing XML, not code

## Modifying the Rules

Want to see how changing tax law would affect eligibility? Edit `eitc-facts.xml`:

### Example: Increase Investment Income Limit

Change line with `/eitcInvestmentIncomeLimit`:

```xml
<!-- Before -->
<Dollar>11600</Dollar>

<!-- After -->
<Dollar>15000</Dollar>
```

The changes will take effect once you refresh the page.

### Example: Lower Age Minimum

Find `/primaryFilerAge25OrOlder` and change:

```xml
<!-- Before -->
<Int>25</Int>

<!-- After -->
<Int>21</Int>
```
