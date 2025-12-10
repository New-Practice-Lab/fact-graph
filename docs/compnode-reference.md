# Fact Graph CompNode Reference

This document lists all valid CompNode types that can be used in Fact Dictionary XML files.

## Table of Contents
- [Constants & Value Nodes](#constants--value-nodes)
- [Arithmetic Operations](#arithmetic-operations)
- [Comparison Operations](#comparison-operations)
- [Logical Operations](#logical-operations)
- [Aggregation Operations](#aggregation-operations)
- [String Operations](#string-operations)
- [Collection Operations](#collection-operations)
- [Date/Time Operations](#datetime-operations)
- [Control Flow](#control-flow)
- [References & Dependencies](#references--dependencies)

---

## Constants & Value Nodes

### Boolean Values
```xml
<True/>
<False/>
```

### Numeric Values
```xml
<Int>42</Int>
<Dollar>1000</Dollar>
<Rational>1/2</Rational>  <!-- Must use fraction notation (numerator/denominator), not decimals -->
```

**Important**: `<Rational>` values must be expressed as fractions (e.g., `1/2` for 50%, `15/100` for 15%, `5/10` for 50%), not as decimal values like `0.5`.

### Date/Time Values
```xml
<Day>2025-01-15</Day>
<Days>30</Days>
```

### Text Values
```xml
<String>Hello World</String>
<EmailAddress>user@example.com</EmailAddress>
<PhoneNumber>555-1234</PhoneNumber>
```

### Identification Numbers
```xml
<Tin>123-45-6789</Tin>
<Ein>12-3456789</Ein>
```

### Structured Data
```xml
<Address>123 Main St</Address>
<BankAccount>...</BankAccount>
<Enum>OptionValue</Enum>
<MultiEnum>Option1,Option2</MultiEnum>
```

### Collections
```xml
<Collection>
  <!-- Collection items -->
</Collection>
```

---

## Arithmetic Operations

All arithmetic operations take child nodes directly (not wrapped in `<Left>` or `<Right>`).

### Add
Sum multiple numeric values. Supports Int, Dollar, Rational, and mixed types.
```xml
<Add>
  <Dollar>100</Dollar>
  <Dollar>200</Dollar>
  <Dependency path="/someAmount"/>
</Add>
```

### Subtract
Subtract two values (first child minus second child).
```xml
<Subtract>
  <Dollar>1000</Dollar>
  <Dollar>250</Dollar>
</Subtract>
```

### Multiply
Multiply values together.
```xml
<Multiply>
  <Dollar>100</Dollar>
  <Rational>0.5</Rational>
</Multiply>
```

### Divide
Divide first value by second value.
```xml
<Divide>
  <Dollar>1000</Dollar>
  <Int>2</Int>
</Divide>
```

### Modulo
Get remainder of division.
```xml
<Modulo>
  <Int>17</Int>
  <Int>5</Int>
</Modulo>
```

### StepwiseMultiply
Multiply Dollar by Rational in steps to avoid rounding errors.
```xml
<StepwiseMultiply>
  <Multiplicand>
    <Dollar>1000</Dollar>
  </Multiplicand>
  <Rate>
    <Rational>0.15</Rational>
  </Rate>
</StepwiseMultiply>
```

### Rounding Operations
```xml
<Ceiling>
  <Rational>4.2</Rational>
</Ceiling>

<Floor>
  <Rational>4.8</Rational>
</Floor>

<Round>
  <Rational>4.5</Rational>
</Round>

<RoundToInt>
  <Rational>4.7</Rational>
</RoundToInt>

<TruncateCents>
  <Dollar>123.45</Dollar>
</TruncateCents>
```

---

## Comparison Operations

All comparison operations take two child nodes: first child and second child to compare.

### Equal
```xml
<Equal>
  <Dependency path="/filingStatus"/>
  <String>Single</String>
</Equal>
```

### NotEqual
```xml
<NotEqual>
  <Dependency path="/age"/>
  <Int>65</Int>
</NotEqual>
```

### GreaterThan
```xml
<GreaterThan>
  <Dependency path="/income"/>
  <Dollar>50000</Dollar>
</GreaterThan>
```

### GreaterThanOrEqual
```xml
<GreaterThanOrEqual>
  <Dependency path="/numChildren"/>
  <Int>2</Int>
</GreaterThanOrEqual>
```

### LessThan
```xml
<LessThan>
  <Dependency path="/age"/>
  <Int>18</Int>
</LessThan>
```

### LessThanOrEqual
```xml
<LessThanOrEqual>
  <Dependency path="/balance"/>
  <Dollar>1000</Dollar>
</LessThanOrEqual>
```

---

## Logical Operations

### All
Logical AND - all children must be true.
```xml
<All>
  <Dependency path="/hasSSN"/>
  <Dependency path="/isResident"/>
  <GreaterThan>
    <Dependency path="/income"/>
    <Dollar>0</Dollar>
  </GreaterThan>
</All>
```

### Any
Logical OR - at least one child must be true.
```xml
<Any>
  <Dependency path="/hasSSN"/>
  <Dependency path="/hasITIN"/>
</Any>
```

### Not
Logical NOT - negates a boolean value.
```xml
<Not>
  <Dependency path="/isDependent"/>
</Not>
```

---

## Aggregation Operations

### Maximum
Find maximum value from a collection.
```xml
<Maximum>
  <Dependency path="/incomeList"/>
</Maximum>
```

### Minimum
Find minimum value from a collection.
```xml
<Minimum>
  <Dependency path="/deductionList"/>
</Minimum>
```

### GreaterOf
Return the greater of two values.
```xml
<GreaterOf>
  <Dependency path="/standardDeduction"/>
  <Dependency path="/itemizedDeduction"/>
</GreaterOf>
```

### LesserOf
Return the lesser of two values.
```xml
<LesserOf>
  <Dependency path="/creditLimit"/>
  <Dependency path="/actualCredit"/>
</LesserOf>
```

---

## String Operations

### Paste
Concatenate strings with optional separator.
```xml
<Paste separator=" ">
  <Dependency path="/firstName"/>
  <Dependency path="/lastName"/>
</Paste>
```

### Length
Get string length.
```xml
<Length>
  <Dependency path="/name"/>
</Length>
```

### Trim
Trim and collapse whitespace.
```xml
<Trim>
  <Dependency path="/userInput"/>
</Trim>
```

### ToUpper
Convert to uppercase.
```xml
<ToUpper>
  <Dependency path="/state"/>
</ToUpper>
```

### StripChars
Strip specific characters from a string.
```xml
<StripChars>
  <String>123-45-6789</String>
</StripChars>
```

### Regex
Pattern matching with input and pattern.
```xml
<Regex>
  <Input>
    <Dependency path="/emailAddress"/>
  </Input>
  <Pattern>
    <String>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$</String>
  </Pattern>
</Regex>
```

### AsString
Convert compatible types to string (Enum, EmailAddress, Dollar, Ein, Tin).
```xml
<AsString>
  <Dependency path="/amount"/>
</AsString>
```

### AsDecimalString
Convert to decimal string representation.
```xml
<AsDecimalString>
  <Dependency path="/taxRate"/>
</AsDecimalString>
```

---

## Collection Operations

### CollectionSize
Get the size of a collection.
```xml
<CollectionSize>
  <Dependency path="/dependents"/>
</CollectionSize>
```

### CollectionSum
Sum all values in a collection.
```xml
<CollectionSum>
  <Dependency path="/monthlyIncomes"/>
</CollectionSum>
```

### Count
Count the number of true values in a boolean collection.
```xml
<Count>
  <Dependency path="/eligibilityChecks"/>
</Count>
```

### Filter
Filter a collection based on a condition.
```xml
<Filter path="/item">
  <GreaterThan>
    <Dependency path="/item/age"/>
    <Int>18</Int>
  </GreaterThan>
</Filter>
```

### Find
Find the first item in a collection matching a condition.
```xml
<Find path="/item">
  <Equal>
    <Dependency path="/item/status"/>
    <String>Active</String>
  </Equal>
</Find>
```

### FirstNCollectionItems
Get the first N items from a collection.
```xml
<FirstNCollectionItems>
  <Collection>
    <Dependency path="/allItems"/>
  </Collection>
  <Count>
    <Int>5</Int>
  </Count>
</FirstNCollectionItems>
```

### EnumOptionsSize
Get the size of enum options.
```xml
<EnumOptionsSize>
  <EnumOptionsNode path="/stateSelection"/>
</EnumOptionsSize>
```

### EnumOptionsContains
Check if an enum option exists.
```xml
<EnumOptionsContains>
  <Dependency path="/availableStates"/>
</EnumOptionsContains>
```

---

## Date/Time Operations

### Today
Get today's date (no children).
```xml
<Today/>
```

### LastDayOfMonth
Get the last day of a month.
```xml
<LastDayOfMonth>
  <Dependency path="/paymentDate"/>
</LastDayOfMonth>
```

### AddPayrollMonths
Add payroll months to a date.
```xml
<AddPayrollMonths>
  <Dependency path="/startDate"/>
</AddPayrollMonths>
```

---

## Control Flow

### Switch
Conditional switching with multiple cases. Each case has a `<When>` condition and a `<Then>` result.
```xml
<Switch>
  <Case>
    <When>
      <Equal>
        <Dependency path="/filingStatus"/>
        <String>Single</String>
      </Equal>
    </When>
    <Then>
      <Dollar>13850</Dollar>
    </Then>
  </Case>
  <Case>
    <When>
      <Equal>
        <Dependency path="/filingStatus"/>
        <String>MarriedFilingJointly</String>
      </Equal>
    </When>
    <Then>
      <Dollar>27700</Dollar>
    </Then>
  </Case>
  <Case>
    <When>
      <True/>
    </When>
    <Then>
      <Dollar>0</Dollar>
    </Then>
  </Case>
</Switch>
```

### Placeholder
Provide a default value when the source is incomplete.
```xml
<Placeholder>
  <Source>
    <Dependency path="/userProvidedValue"/>
  </Source>
  <Default>
    <Dollar>0</Dollar>
  </Default>
</Placeholder>
```

### IsComplete
Check if a value is complete (not incomplete/placeholder).
```xml
<IsComplete>
  <Dependency path="/requiredField"/>
</IsComplete>
```

---

## References & Dependencies

### Dependency
Reference another fact in the dictionary.
```xml
<!-- Reference in same module -->
<Dependency path="/otherFact"/>

<!-- Reference in different module -->
<Dependency module="moduleName" path="/factPath"/>
```

---

## Common Patterns

### Boolean Logic with Multiple Conditions
```xml
<All>
  <GreaterThanOrEqual>
    <Dependency path="/age"/>
    <Int>18</Int>
  </GreaterThanOrEqual>
  <LessThan>
    <Dependency path="/age"/>
    <Int>65</Int>
  </LessThan>
  <Equal>
    <Dependency path="/hasSSN"/>
    <True/>
  </Equal>
</All>
```

### Conditional Calculations
```xml
<Switch>
  <Case>
    <When>
      <Dependency path="/isEligible"/>
    </When>
    <Then>
      <Multiply>
        <Dependency path="/baseAmount"/>
        <Rational>0.5</Rational>
      </Multiply>
    </Then>
  </Case>
  <Case>
    <When>
      <True/>
    </When>
    <Then>
      <Dollar>0</Dollar>
    </Then>
  </Case>
</Switch>
```

### Income Range Checks
```xml
<All>
  <GreaterThan>
    <Dependency path="/income"/>
    <Dollar>0</Dollar>
  </GreaterThan>
  <LessThanOrEqual>
    <Dependency path="/income"/>
    <Dependency path="/incomeLimit"/>
  </LessThanOrEqual>
</All>
```

---

## Important Notes

1. **No `<Left>` or `<Right>` wrappers**: Arithmetic and comparison operations take direct child nodes, not wrapped in `<Left>/<Right>` elements.

2. **Type compatibility**: Ensure child nodes return compatible types. For example, `<Add>` can work with Dollar, Int, and Rational, but they must be numeric types.

3. **Boolean operations**: `<All>`, `<Any>`, and `<Not>` require BooleanNode children (from comparisons, dependencies to boolean facts, or `<True/>`/`<False/>`).

4. **Named children**: Some operations like `<Switch>`, `<Regex>`, `<StepwiseMultiply>`, and `<FirstNCollectionItems>` use specifically named child elements.

5. **Path references**: Use the `path` parameter for dependencies and collection operations like `<Filter>` and `<Find>`.

6. **Module references**: Use `module="moduleName"` attribute in `<Dependency>` to reference facts from other modules.
