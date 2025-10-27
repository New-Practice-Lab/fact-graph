# Fact Graph getting and setting demo

This demo (based on the IRS's upstream Fact Graph repo) shows how to load
a fact dictionary and interactively set and retrieve its values.

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

## Updating the Demo

If you make changes to the Fact Graph Scala code, rebuild and copy the JavaScript:

```bash
# From the project root
sbt fastOptJS

# From the demo directory
bash copy-fg.sh
```
