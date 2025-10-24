# Dinner Check Splitter Demo

An interactive calculator that splits a dinner bill fairly, with a special birthday rule - people celebrating birthdays don't pay!

## Overview

This demo showcases how the Fact Graph library can be used for **non-tax calculations**. It's a complete example of using Fact Graph in a different domain (social dining/bill splitting) with the exact same codebase.

## The Rule

- **If today is YOUR birthday**: You owe $0 🎉
- **Otherwise**: You pay your share = Total Bill ÷ (Total People - Birthday People)

People celebrating birthdays get their meal free, and the cost is split among everyone else.

## Files

- `dinner-check-facts.xml` - The fact dictionary with bill-splitting rules
- `dinner-check-demo.html` - The web interface
- `dinner-check-loader.js` - JavaScript logic for the demo

## How to Run

1. Start a local web server from the project root:
   ```bash
   python3 -m http.server 8000
   ```

2. Open your browser to:
   ```
   http://localhost:8000/demo/dinner-check-demo.html
   ```

## How to Use

### 1. Enter Bill Information

- **Total Bill Amount**: The total cost of the meal (e.g., $100.00)
- **Number of People**: How many people are at the table, including you? (e.g., 4)

### 2. Enter Birthday Information

- **Today is my birthday!**: Check this box if today is YOUR birthday
- **Other People Celebrating Birthdays**: How many OTHER people (besides you) have birthdays today? (e.g., 0)

### 3. Calculate

Click **"Calculate My Share"** to see:
- Your share of the bill
- Whether it's your birthday
- How much each person pays
- How many people are splitting the bill
- How much you saved (if it's your birthday!)

## Example Scenarios

### Scenario 1: It's Your Birthday! 🎉

```
Total Bill: $120.00
Number of People: 4
Today is my birthday: ✓ (checked)
Other People Celebrating Birthdays: 0

Results:
- Your Share: $0.00 (Happy Birthday!)
- Per Person: $40.00
- People Paying: 3 (4 total - 1 birthday person)
- Amount Saved: $40.00
```

### Scenario 2: Someone Else's Birthday

```
Total Bill: $120.00
Number of People: 4
Today is my birthday: ☐ (unchecked)
Other People Celebrating Birthdays: 1

Results:
- Your Share: $40.00
- Per Person: $40.00
- People Paying: 3 (4 total - 1 birthday person)
- Is Your Birthday?: No
```

### Scenario 3: No Birthdays

```
Total Bill: $100.00
Number of People: 5
Today is my birthday: ☐ (unchecked)
Other People Celebrating Birthdays: 0

Results:
- Your Share: $20.00
- Per Person: $20.00
- People Paying: 5
- Is Your Birthday?: No
```

### Scenario 4: Multiple Birthdays

```
Total Bill: $150.00
Number of People: 6
Today is my birthday: ☐ (unchecked)
Other People Celebrating Birthdays: 2

Results:
- Your Share: $37.50
- Per Person: $37.50
- People Paying: 4 (6 total - 2 birthday people)
- Is Your Birthday?: No
```

### Scenario 5: Your Birthday + Others

```
Total Bill: $200.00
Number of People: 6
Today is my birthday: ✓ (checked)
Other People Celebrating Birthdays: 1

Results:
- Your Share: $0.00 (Happy Birthday!)
- Per Person: $50.00
- People Paying: 4 (6 total - 2 birthday people)
- Amount Saved: $50.00
```

## Technical Details

### Fact Graph Structure

This demo defines the following facts in `dinner-check-facts.xml`:

**Writable Facts** (user inputs):
- `/totalBill` - Dollar amount
- `/numPeople` - Integer (total people including user)
- `/isYourBirthday` - Boolean (is today your birthday?)
- `/otherBirthdayPeople` - Integer (OTHER people celebrating birthdays, not including you)

**Derived Facts** (computed):
- `/totalBirthdayPeople` - Integer
  - If `isYourBirthday`: 1 + `otherBirthdayPeople`
  - Otherwise: `otherBirthdayPeople`

- `/numPayingPeople` - Integer
  - `numPeople - totalBirthdayPeople`

- `/perPersonShare` - Dollar
  - `totalBill ÷ numPayingPeople` (with division-by-zero protection)

- `/userShare` - Dollar
  - If `isTodayUserBirthday`: $0.00
  - Otherwise: `perPersonShare`

- `/amountSaved` - Dollar
  - If `isTodayUserBirthday`: `perPersonShare`
  - Otherwise: $0.00

- `/birthdayMessage` - String
  - Displays a friendly message based on birthday status

### Key XML Patterns Used

#### 1. Boolean Logic with Add
```xml
<Switch>
  <Case>
    <When>
      <Dependency path="/isYourBirthday" />
    </When>
    <Then>
      <Add>
        <Int>1</Int>
        <Dependency path="/otherBirthdayPeople" />
      </Add>
    </Then>
  </Case>
  <Case>
    <When>
      <True/>
    </When>
    <Then>
      <Dependency path="/otherBirthdayPeople" />
    </Then>
  </Case>
</Switch>
```

#### 2. Conditional Logic (Switch)
```xml
<Switch>
  <Case>
    <When>
      <Dependency path="/isTodayUserBirthday" />
    </When>
    <Then>
      <Dollar>0.00</Dollar>
    </Then>
  </Case>
  <Case>
    <When>
      <True/>
    </When>
    <Then>
      <Dependency path="/perPersonShare" />
    </Then>
  </Case>
</Switch>
```

#### 3. Division with Protection
```xml
<Switch>
  <Case>
    <When>
      <LessThanOrEqual>
        <Left><Dependency path="/numPayingPeople" /></Left>
        <Right><Int>0</Int></Right>
      </LessThanOrEqual>
    </When>
    <Then><Dollar>0.00</Dollar></Then>
  </Case>
  <Case>
    <When>
      <True/>
    </When>
    <Then>
      <Divide>
        <Dividend><Dependency path="/totalBill" /></Dividend>
        <Divisors><Dependency path="/numPayingPeople" /></Divisors>
      </Divide>
    </Then>
  </Case>
</Switch>
```

#### 4. Data Validation (Limits)
```xml
<Writable>
  <Dollar/>
  <Limit type="Min">
    <Dollar>0.00</Dollar>
    <Context>
      <Message>Bill amount cannot be negative</Message>
      <Level>Error</Level>
    </Context>
  </Limit>
</Writable>
```

## Why This Demonstrates Fact Graph's Flexibility

1. **Non-Tax Domain**: This has nothing to do with taxes - it's social dining
2. **Same Codebase**: Uses the exact same `fg.js` and Fact Graph engine
3. **Date Operations**: Shows date component access and comparison
4. **Conditional Logic**: Demonstrates Switch statements for business rules
5. **Arithmetic**: Division, subtraction for financial calculations
6. **Validation**: Min/max limits on inputs
7. **User-Friendly**: Real-world application with helpful UI

## Modifying the Rules

Want to change the birthday rule? Just edit the XML!

### Example: Half Price on Your Birthday

Instead of free, make it 50% off:

```xml
<Fact path="/userShare">
  <Derived>
    <Switch>
      <Case>
        <When>
          <Dependency path="/isTodayUserBirthday" />
        </When>
        <Then>
          <Multiply>
            <Dependency path="/perPersonShare" />
            <Rational>
              <Numerator>1</Numerator>
              <Denominator>2</Denominator>
            </Rational>
          </Multiply>
        </Then>
      </Case>
      <Case>
        <When>
          <True/>
        </When>
        <Then>
          <Dependency path="/perPersonShare" />
        </Then>
      </Case>
    </Switch>
  </Derived>
</Fact>
```

### Example: Discount for Large Groups

Add a 10% discount for groups of 8 or more:

```xml
<Fact path="/groupDiscount">
  <Derived>
    <Switch>
      <Case>
        <When>
          <GreaterThanOrEqual>
            <Left><Dependency path="/numPeople" /></Left>
            <Right><Int>8</Int></Right>
          </GreaterThanOrEqual>
        </When>
        <Then>
          <Multiply>
            <Dependency path="/totalBill" />
            <Rational>
              <Numerator>1</Numerator>
              <Denominator>10</Denominator>
            </Rational>
          </Multiply>
        </Then>
      </Case>
      <Case>
        <When>
          <True/>
        </When>
        <Then><Dollar>0.00</Dollar></Then>
      </Case>
    </Switch>
  </Derived>
</Fact>

<Fact path="/discountedBill">
  <Derived>
    <Subtract>
      <Minuend><Dependency path="/totalBill" /></Minuend>
      <Subtrahends><Dependency path="/groupDiscount" /></Subtrahends>
    </Subtract>
  </Derived>
</Fact>
```

## Other Domains You Could Model

The same approach works for:
- **Loan calculators**: Interest rates, monthly payments, amortization
- **Tip calculators**: Service quality rules, split by payment method
- **Insurance quotes**: Age-based rates, coverage rules
- **Shipping costs**: Weight-based, distance-based, bulk discounts
- **Recipe scaling**: Ingredient amounts based on servings
- **Gym membership pricing**: Contracts, family plans, student discounts
- **Event ticketing**: Early bird discounts, group rates
- **Subscription pricing**: Tiered plans, annual discounts

## Learning Points

1. **Declarative Rules**: All logic is in XML, not code
2. **Type Safety**: Dollar, Int, Day types are validated
3. **Composable**: Facts build on other facts
4. **Testable**: Easy to write tests for different scenarios
5. **Maintainable**: Change rules without touching JavaScript
6. **Cross-Platform**: Same XML works in browser and backend

## Related Files

- **AGI Demo**: `agi-demo.html` - Tax calculation example
- **Generic Demo**: `index.html` - Upload any XML file
- **Workflow Guide**: `WORKFLOW-EXAMPLE.md` - How to modify calculations
- **Architecture**: `../CLAUDE.md` - Full system documentation

---

**Happy Bill Splitting! 🍽️💰**
