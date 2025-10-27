# Fact Graph Modification Workflow

This document demonstrates the workflow for changing tax calculations in the Fact Graph system.

## Example: Making Non-Citizens Eligible for Direct File

### Current State

Direct File eligibility requires:
- Age 16 or older **AND**
- U.S. Citizenship

### Desired Change

Direct File eligibility should only require:
- Age 16 or older

---

## Step-by-Step Workflow

### 1. Identify the Fact Definition

Find the fact you need to change in the XML dictionary:

**File**: `demo/exampleAgiFacts.xml` or `shared/src/test/resources/exampleAgiFacts.xml`

**Current Definition**:
```xml
<Fact path="/eligibleForDirectFile">
    <Name>Eligible To File Taxes in the US</Name>
    <Description>If the filer is a US citizen and 16 or older</Description>
    <Derived>
        <All>
            <Dependency path="/age16OrOlder" />
            <Dependency path="/isUsCitizen" />
        </All>
    </Derived>
</Fact>
```

The `<All>` operator means both dependencies must be true (logical AND).

### 2. Modify the XML

**New Definition**:
```xml
<Fact path="/eligibleForDirectFile">
    <Name>Eligible To File Taxes in the US</Name>
    <Description>If the filer is 16 or older</Description>
    <Derived>
        <Dependency path="/age16OrOlder" />
    </Derived>
</Fact>
```

Now it only depends on age, citizenship is no longer required.

### 3. Update Tests

**File**: `jvm/src/test/scala/gov/irs/factgraph/ExampleAgiSpec.scala`

**Before**:
```scala
test("Taxpayer is 16 or older and not a US Citizen") {
  val graph = makeGraphWith(
    yearOfBirth -> 2009,
    isUsCitizen -> false,
  )

  val isEligibleForDirectFile = graph.get(eligibleForDirectFile)
  assert(!isEligibleForDirectFile.value.contains(true))  // Expects NOT eligible
}
```

**After**:
```scala
test("Taxpayer is 16 or older and not a US Citizen") {
  val graph = makeGraphWith(
    yearOfBirth -> 2009,
    isUsCitizen -> false,
  )

  val isEligibleForDirectFile = graph.get(eligibleForDirectFile)
  assert(isEligibleForDirectFile.value.contains(true))   // Now expects eligible!
}
```

### 4. Run Tests

```bash
# Run the specific test file
sbt "factGraphJVM/testOnly *ExampleAgiSpec"

# Or run all tests
sbt test
```

### 5. Test in the Web Demo

For the JavaScript/web demo:

```bash
# No recompilation needed! Just refresh the browser
# The demo loads exampleAgiFacts.xml directly
open http://localhost:8000/demo/agi-demo.html
```

Test the change:
1. Enter Date of Birth: `1990-01-01`
2. **Uncheck** "U.S. Citizen"
3. Click "Calculate AGI"
4. Result should show: **"Eligible for Direct File: Yes"**

---

## More Complex Examples

### Example 2: Change AGI Calculation to Include Deductions

**Current**:
```xml
<Fact path="/totalAdjustedGrossIncome">
    <Derived>
        <Subtract>
            <Minuend>
                <Add>
                    <Dependency path="/totalWages" />
                    <Dependency path="/totalInterestIncome" />
                    <Dependency path="/total1099Income" />
                </Add>
            </Minuend>
            <Subtrahends>
                <Dependency path="/totalAdjustments" />
            </Subtrahends>
        </Subtract>
    </Derived>
</Fact>
```

**Add Standard Deduction** (new writable fact):
```xml
<Fact path="/standardDeduction">
    <Name>Standard Deduction</Name>
    <Description>Standard deduction amount</Description>
    <Writable>
        <Dollar/>
    </Writable>
</Fact>

<Fact path="/totalAdjustedGrossIncome">
    <Derived>
        <Subtract>
            <Minuend>
                <Add>
                    <Dependency path="/totalWages" />
                    <Dependency path="/totalInterestIncome" />
                    <Dependency path="/total1099Income" />
                </Add>
            </Minuend>
            <Subtrahends>
                <Dependency path="/totalAdjustments" />
                <Dependency path="/standardDeduction" />
            </Subtrahends>
        </Subtract>
    </Derived>
</Fact>
```

### Example 3: Add Validation (Limits)

Add a maximum income limit:

```xml
<Fact path="/totalWages">
    <Name>Total Wages</Name>
    <Description>Total Wages earned in tax year</Description>
    <Writable>
        <Dollar/>
        <Limit type="Max">
            <Dollar>10000000.00</Dollar>
            <Context>
                <Message>Wages cannot exceed $10 million</Message>
                <Level>Error</Level>
            </Context>
        </Limit>
        <Limit type="Min">
            <Dollar>0.00</Dollar>
            <Context>
                <Message>Wages cannot be negative</Message>
                <Level>Error</Level>
            </Context>
        </Limit>
    </Writable>
</Fact>
```

### Example 4: Conditional Logic (Switch)

Make eligibility depend on income:

```xml
<Fact path="/eligibleForDirectFile">
    <Name>Eligible For Direct File</Name>
    <Derived>
        <Switch>
            <!-- Case 1: If AGI > $200k, not eligible -->
            <Case>
                <When>
                    <GreaterThan>
                        <Left>
                            <Dependency path="/totalAdjustedGrossIncome" />
                        </Left>
                        <Right>
                            <Dollar>200000.00</Dollar>
                        </Right>
                    </GreaterThan>
                </When>
                <Then>
                    <Boolean>false</Boolean>
                </Then>
            </Case>

            <!-- Case 2: Otherwise check age and citizenship -->
            <Case>
                <When>
                    <True/>
                </When>
                <Then>
                    <All>
                        <Dependency path="/age16OrOlder" />
                        <Dependency path="/isUsCitizen" />
                    </All>
                </Then>
            </Case>
        </Switch>
    </Derived>
</Fact>
```

---

## Key Benefits of This Approach

1. **Declarative** - Express tax logic in XML, not imperative code
2. **Testable** - XML changes are validated by tests
3. **Auditable** - Git history shows exactly what logic changed
4. **No Recompilation** - Web apps reload XML without rebuilding
5. **Type Safe** - Fact Graph validates types and dependencies
6. **Reusable** - Same XML works for JVM and JavaScript platforms

---

## Available Operations

The Fact Graph supports 60+ operations. Common ones:

### Arithmetic
- `<Add>`, `<Subtract>`, `<Multiply>`, `<Divide>`
- `<Min>`, `<Max>`, `<Sum>`, `<Average>`

### Comparison
- `<Equal>`, `<NotEqual>`
- `<GreaterThan>`, `<LessThan>`
- `<GreaterThanOrEqual>`, `<LessThanOrEqual>`

### Logic
- `<All>` (AND), `<Any>` (OR), `<Not>`
- `<Switch>` (conditional branches)

### Collections
- `<Filter>`, `<Find>`, `<Count>`
- `<Map>`, `<Sum>` (aggregation)

### String
- `<Concat>`, `<Contains>`, `<Match>` (regex)

### Date
- `<AddDays>`, `<SubtractDays>`
- Access: `/dateOfBirth/year`, `/dateOfBirth/month`, `/dateOfBirth/day`

---

## Documentation

- **Architecture**: See `CLAUDE.md` for full architecture overview
- **XML Schema**: `docs/FactDictionaryModule.rng` (if available)
- **Test Examples**: `jvm/src/test/scala/gov/irs/factgraph/ExampleAgiSpec.scala`
- **CompNode Types**: `shared/src/main/scala/gov/irs/factgraph/compnodes/`

---

## Workflow Summary

```
┌─────────────────────────────────────────────┐
│ 1. Edit XML Fact Dictionary                │
│    - Modify fact definitions                │
│    - Add new facts                          │
│    - Change calculations                    │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 2. Update Tests                             │
│    - Modify expected values                 │
│    - Add new test cases                     │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 3. Run Tests                                │
│    sbt "factGraphJVM/testOnly *AgiSpec"     │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 4. Test in Demo (optional)                  │
│    - Refresh browser                        │
│    - No rebuild needed for XML changes      │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 5. Deploy                                   │
│    - No application code changes!           │
│    - Just deploy updated XML                │
└─────────────────────────────────────────────┘
```

## When You DO Need Code Changes

You only need to modify Scala/JavaScript code when:

1. **Adding a new writable fact type** (beyond the built-in types)
2. **Adding a new operation/CompNode** (beyond the 60+ existing ones)
3. **Adding UI fields** in the demo (e.g., new input fields)
4. **Custom validation logic** not expressible in XML

Otherwise, all tax logic changes are XML-only!
