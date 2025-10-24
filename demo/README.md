# Fact Graph Demo

This directory contains web-based demos for the Fact Graph JavaScript library.

## Available Demos

1. **Generic Fact Graph Demo** (`generic_demo/index.html`) - Included in the IRS original repo,
this is a general-purpose interface for loading any fact dictionary and manually setting/getting facts.

2. **AGI Calculator Demo** (`agi_demo/agi-demo.html`) - An interactive calculator for computing Adjusted Gross Income with a user-friendly form. See [agi_demo/AGI-DEMO-README.md](./agi_demo/AGI-DEMO-README.md) for details.

3. **EITC Eligibility Checker** (`eitc_demo/eitc-demo.html`) - Check eligibility for the Earned Income Tax Credit based on 2024 tax year rules. Demonstrates complex tax logic with income limits, age requirements, and filing status rules. See [eitc_demo/EITC-DEMO-README.md](./eitc_demo/EITC-DEMO-README.md) for details.

4. **Dinner Check Splitter Demo** (`dinner_check_demo/dinner-check-demo.html`) - A fun bill-splitting calculator with birthday rules. Demonstrates how the same Fact Graph engine works for non-tax domains! See [dinner_check_demo/DINNER-CHECK-README.md](./dinner_check_demo/DINNER-CHECK-README.md) for details.

## How to Run

1. Start a local web server from the project root directory:
   ```bash
   python3 -m http.server 8000
   ```

2. Open your browser to:
   - Generic demo: [http://localhost:8000/demo/generic_demo/index.html](http://localhost:8000/demo/generic_demo/index.html)
   - AGI Calculator: [http://localhost:8000/demo/agi_demo/agi-demo.html](http://localhost:8000/demo/agi_demo/agi-demo.html)
   - EITC Eligibility Checker: [http://localhost:8000/demo/eitc_demo/eitc-demo.html](http://localhost:8000/demo/eitc_demo/eitc-demo.html)
   - Dinner Check Splitter: [http://localhost:8000/demo/dinner_check_demo/dinner-check-demo.html](http://localhost:8000/demo/dinner_check_demo/dinner-check-demo.html)

## How to Use

### 1. Load a Fact Dictionary

Click **"Choose Files"** and select the `all-facts.xml` file in this directory (or any other valid Fact Dictionary XML file).

The demo will:
- Parse the XML into a FactDictionary
- Create a new FactGraph instance
- Populate the autocomplete list with all available fact paths

### 2. Set Facts

To set a fact value:
1. Enter a fact path (e.g., `/refundViaAch`) in the "Fact Path" field
2. Enter a value in the "Value" field (e.g., `true`)
3. Click **"Save"**

The graph will be updated and displayed in the "Current Graph" section below.

### 3. Get Facts

To retrieve a fact value:
1. Enter a fact path in the "Get Facts" section
2. Click **"Get"**

The result will be displayed below the form.

## Available Fact Paths

The demo includes `all-facts.xml` which contains many fact definitions. Some examples you can try:

- `/refundViaAch` - Boolean value for direct deposit preference
- `/payViaAch` - Boolean value for ACH payment preference
- `/bankAccount` - Bank account information (complex type)

You can see all available paths in the autocomplete dropdown when you click on the fact path input fields.

## Updating the Demo

If you make changes to the Fact Graph Scala code, rebuild and copy the JavaScript:

```bash
# From the project root
sbt fastOptJS

# From the demo directory
bash copy-fg.sh
```

## Troubleshooting

**Nothing happens when I click "Save" or "Get":**
- Check the browser console (F12) for JavaScript errors
- Make sure you've loaded a Fact Dictionary first
- Verify the fact path exists in your dictionary

**XML fails to load:**
- Make sure you're running from a web server (not file://)
- Check that the XML file is valid Fact Dictionary format
