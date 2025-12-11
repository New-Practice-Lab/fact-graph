# Fact Graph Demo

This directory contains web-based demos for the Fact Graph JavaScript library.

## Available Demos

1. **Get/set Fact Graph demo** (`get_set_demo/index.html`) - Included in the IRS original repo,
this is a general-purpose form for loading any fact dictionary and manually setting/getting facts. See [get_set_demo/GET-SET-README.md](./agi_demo/AGI-DEMO-README.md) for details.

2. **AGI Calculator demo** (`agi_demo/agi-demo.html`) - Calculator for computing Adjusted Gross Income. See [agi_demo/AGI-DEMO-README.md](./agi_demo/AGI-DEMO-README.md) for details.

3. **EITC eligibility checker** (`eitc_demo/eitc-demo.html`) - Eligibility checker for the Earned Income Tax Credit based on 2024 tax year rules. Demonstrates complex tax logic with income limits, age requirements, and filing status rules. See [eitc_demo/EITC-DEMO-README.md](./eitc_demo/EITC-DEMO-README.md) for details.

4. **Dinner check splitter demo** (`dinner_check_demo/dinner-check-demo.html`) - Bill-splitting calculator with birthday rule (intended to demo how the Fact Graph engine can work with
non-tax fact dictionaries). See [dinner_check_demo/DINNER-CHECK-README.md](./dinner_check_demo/DINNER-CHECK-README.md) for details.

4. **Tax credit calculator** (`credit_calc/credit-calc.html`) - Estimates
combined amount of federal and state refundable tax credits. See [credit_calc/CREDIT-CALC-README.md](./credit_calc/CREDIT-CALC-README.md) for details.

## How to Run

### Development Server

For development, use the included development server that disables caching:

1. Start the development server from the demo directory:
   ```bash
   cd demo
   python3 dev_server.py
   ```

2. Open your browser to:
   - Generic get/set demo: [http://localhost:8000/get_set_demo/index.html](http://localhost:8000/get_set_demo/index.html)
   - AGI Calculator: [http://localhost:8000/agi_demo/agi-demo.html](http://localhost:8000/agi_demo/agi-demo.html)
   - EITC Eligibility Checker: [http://localhost:8000/eitc_demo/eitc-demo.html](http://localhost:8000/eitc_demo/eitc-demo.html)
   - Dinner Check Splitter: [http://localhost:8000/dinner_check_demo/dinner-check-demo.html](http://localhost:8000/dinner_check_demo/dinner-check-demo.html)
   - Tax Credit Calculator: [http://localhost:8000/credit_calc/credit-calc.html](http://localhost:8000/credit_calc/credit-calc.html)

The development server adds `Cache-Control` headers to prevent browser caching, so you'll see changes immediately without manually clearing your cache.

