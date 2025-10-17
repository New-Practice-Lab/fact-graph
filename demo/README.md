# Fact Graph Demo

This is a simple web-based demo for the Fact Graph JavaScript library.

## How to Run

1. Start a local web server from the project root directory:
   ```bash
   python3 -m http.server 8000
   ```

2. Open your browser to [http://localhost:8000/demo/index.html](http://localhost:8000/demo/index.html)

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
