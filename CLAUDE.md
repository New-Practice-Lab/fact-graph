# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Fact Graph Architecture Overview

This document provides a comprehensive guide to the Fact Graph architecture for AI assistance and development understanding.

## Project Overview

**Fact Graph** is a production-ready knowledge graph engine for modeling and calculating tax law computations. It is written in Scala 3 and compiles to both JVM and JavaScript platforms, enabling it to be used in Java/Kotlin applications as well as web/Node.js applications.

**Key Purpose**: To provide a declarative way to model tax logic that can be easily updated, validated, and applied to taxpayer scenarios without hard-coding domain logic into applications.

## Core Components

### 1. Fact Dictionary (`FactDictionary.scala`)

The **Fact Dictionary** is the definition layer that describes all available facts and how they are computed.

**Key Responsibilities**:
- Load and parse XML-based fact definitions
- Maintain a map of `Path` → `FactDefinition`
- Freeze itself after loading (prevent modifications)
- Provide metadata about the dictionary (version, test mode)
- Support path resolution with wildcards for collections

**Key Methods**:
```scala
def getDefinition(path: String): FactDefinition | Null
def apply(path: Path): Option[FactDefinition]
def getMeta(): MetaConfigTrait
def freeze(): Unit
```

**XML Format**: Facts are defined in XML with structure like:
```xml
<Fact path="/income">
<Writable type="Dollar" />
</Fact>
<Fact path="/taxes/owed">
<Derived type="Add">
<Dependency path="/taxes/federal" />
<Dependency path="/taxes/state" />
</Derived>
</Fact>
```

### 2. Fact Definition (`FactDefinition.scala`)

A **Fact Definition** is a template/blueprint for a single fact in the dictionary. It is NOT an instance—it's the schema.

**Key Responsibilities**:
- Hold a builder function for creating `CompNode` expressions
- Store limit specifications for validation
- Provide lazy-evaluated metadata about the fact
- Support path-based lookup of child definitions

**Key Properties**:
```scala
val value: CompNode          // The computed/stored value expression
val path: Path              // Abstract path (e.g., /income)
val limits: Seq[Limit]      // Validation constraints
val typeNode: String        // Type of computation (e.g., "DollarNode")
val isBoolean: Boolean      // Whether the fact is boolean-valued
val size: Factual.Size      // Single or Multiple (for collections)
```

### 3. Graph (`Graph.scala`)

A **Graph** is an instance of a tax scenario. It represents one taxpayer's filing or situation.

**Key Responsibilities**:
- Maintain the root `Fact` instance
- Cache computed results and fact lookups for performance
- Delegate to a `Persister` for reading/writing writable fact values
- Provide high-level access APIs (get, set, delete, validate)
- Support debugging and introspection of fact computations

**Key Methods**:
```scala
def get(path: String): Result[Any]           // Get a single fact
def getVect(path: String): MaybeVector[...]  // Get collection results
def set(path: String, value: WritableType)   // Set a writable fact
def delete(path: String)                      // Delete a fact
def explain(path: String): Explanation        // Explain computation
def save(): (Boolean, Seq[LimitViolation])   // Validate and persist
```

**Caching Strategy**:
- `factCache`: Maps paths to `Fact` instances
- `resultCache`: Maps paths to computed `Result` values
- `overriddenFacts`: In-memory overrides for test dictionaries

### 4. Fact (`Fact.scala`)

A **Fact** is an instance node in the graph representing a concrete value in a tax scenario.

**Key Responsibilities**:
- Evaluate its `CompNode` expression to get computed values
- Support path navigation (child lookup, parent traversal)
- Support setting values for writable facts
- Validate against limits
- Generate explanations of how values were computed
- Support collection operations (wildcards, member access)

**Key Methods**:
```scala
def get: MaybeVector[Result[value.Value]]    // Evaluate the fact
def set(a: WritableType)                     // Set writable fact value
def validate(): Seq[LimitViolation]          // Validate against limits
def delete(): Unit                            // Delete a fact
def apply(path: Path): MaybeVector[Result[Fact]]  // Navigate to child
def explain: MaybeVector[Explanation]        // Explain computation
```

**Path Navigation**: Facts implement a sophisticated path navigation system supporting:
- Child facts (e.g., `/income/wages`)
- Collection members (e.g., `/jobs/#uuid-123`)
- Wildcards for collections (e.g., `/jobs/*`)
- Relative navigation (`..` for parent)
- Aliases for collections

### 5. CompNode (`compnodes/CompNode.scala`)

A **CompNode** is the type-safe computation node representing how a value is computed or stored.

**Key Responsibilities**:
- Wrap an `Expression[Value]` with type information
- Provide compile-time and runtime type checking
- Extract child nodes for path navigation
- Support switching between different computation branches
- Support dependencies on other facts

**CompNode Types**:
- **Writable Nodes**: `WritableNode` - facts that can be directly written to
- **Derived Nodes**: Various operations and transformations
- **Constant Nodes**: Fixed values (booleans, numbers, etc.)
- **Collection Nodes**: `CollectionNode` for managing collections
- **Operation Nodes**: Arithmetic, logic, comparison, aggregation, etc.

**CompNode Factory Pattern**:
```scala
trait CompNodeFactory:
val Key: String
def fromDerivedConfig(e: CompNodeConfigTrait): CompNode
```

Over 60 operation nodes are registered (Add, Multiply, Filter, Maximum, etc.)

### 6. Expression (`Expression.scala`)

An **Expression** is the underlying algebraic structure representing any computation in Fact Graph.

**Expression Types** (ADT):
```scala
enum Expression[A]:
case Constant(a: Option[A])
case Writable(klass: Class[A])
case Dependency(path: Path)
case Switch(cases: List[(Expression[Boolean], Expression[A])])
case Extract(f: Result[X] => Result[A])
case Unary(x: Expression[X], op: UnaryOperator[A, X])
case Binary(lhs: Expression[L], rhs: Expression[R], op: BinaryOperator[A, L, R])
case Arity4(arg1, arg2, arg3, arg4, op)
case Reduce(xs: List[Expression[A]], op: ReduceOperator[A])
case ConditionalList(options: List[(Expression[Boolean], Expression[String])])
case Aggregate(x: Expression[X], op: AggregateOperator[A, X])
case Collect(path: Path, x: Expression[X], op: CollectOperator[A, X])
```

**Key Methods**:
```scala
def get(using Factual): MaybeVector[Result[A]]         // Evaluate
def getThunk(using Factual): MaybeVector[Thunk[Result[A]]]  // Lazy eval
def explain(using Factual): MaybeVector[Explanation]   // Generate explanation
def isWritable: Boolean                                  // Check if writable
```

### 7. Path (`Path.scala`)

A **Path** is an immutable sequence of path items representing a location in the fact graph.

**Path Items**:
- **Child**: Named fact (e.g., `income`, `jobs`)
- **Wildcard**: Collection reference (e.g., `*`)
- **Member**: Specific collection member by UUID (e.g., `#uuid-123`)
- **Parent**: Parent reference (`..`)
- **Unknown**: Unknown collection member (during lookup)

**Key Operations**:
```scala
def :+(item: PathItem): Path     // Append item
def ++(other: Path): Path         // Concatenate paths
def asAbstract: Path              // Convert UUIDs to wildcards
def isAbstract: Boolean           // Check if path contains no UUIDs
def isWildcard: Boolean           // Check if path contains wildcards
def getMemberId: Option[UUID]     // Extract UUID if present
```

**Examples**:
- `/income` - abstract path to income fact
- `/jobs/#a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p` - specific job instance
- `/jobs/*` - all jobs (wildcard)
- `/` - root

### 8. Result & Monads

The Fact Graph uses several monadic structures for handling computations:

#### Result[A]
```scala
enum Result[+A]:
case Complete(v: A)      // Fully computed value
case Placeholder(v: A)   // Computed but incomplete dependencies
case Incomplete          // No value (missing required inputs)
```

**Completeness**: Indicates whether all required inputs were available for computation. Placeholder results have "placeholder" values when dependencies are incomplete.

#### MaybeVector[A]
```scala
enum MaybeVector[+A]:
case Single(x: A)                    // Single result
case Multiple(vect: Vector[A], complete: Boolean)  // Multiple results
```

**Purpose**: Handles both single facts (like `/income`) and collection results (like `/jobs/*`).

**Vector Operations**: Implements `vectorize` operations to ensure all vectors have same length before combining.

#### Thunk[A]
A lazy-evaluation wrapper for deferred computation:
```scala
final class Thunk[A](f: () => A):
def get: A = f()
```

### 9. Limits (`limits/Limit.scala`)

**Limits** are validation constraints on writable facts.

**Limit Types**:
- `Min` / `Max` - Numeric bounds
- `MinLength` / `MaxLength` - String length bounds
- `MaxCollectionSize` - Collection size bounds
- `Match` - Regex matching
- `Contains` - Value containment

**Limit Structure**:
```scala
trait Limit:
val limiter: BooleanNode
val context: LimitContext
def run()(using Factual): Option[LimitViolation]
```

**Limit Factory Pattern**: Extensible via registry
```scala
object Limit:
def register(f: LimitFactory): Unit = ...
```

### 10. Operators (`operators/`)

The Fact Graph has a sophisticated operator system for computations:

#### UnaryOperator[A, X]
Maps `Expression[X]` → `Expression[A]` (e.g., `Not`, `Length`, `AsString`)

#### BinaryOperator[A, L, R]
Maps `(Expression[L], Expression[R])` → `Expression[A]` (e.g., `Add`, `Equal`)

#### Arity4Operator[A, W, X, Y, Z]
Maps 4 expressions to result

#### ReduceOperator[A]
Reduces a list of expressions to a single result (e.g., `Min`, `Max`)

#### AggregateOperator[A, X]
Aggregates across collection items (e.g., `Sum`, `Count`)

#### CollectOperator[A, X]
Collects items matching a condition

**All operators support**:
- `.apply()` - eager evaluation
- `.thunk()` - lazy evaluation
- `.explain()` - explanation generation

### 11. Persister (`persisters/Persister.scala`)

A **Persister** is responsible for reading and writing fact values, with pluggable backends.

**Key Responsibilities**:
- Get saved results for writable facts
- Set/delete fact values
- Serialize/deserialize to JSON
- Validate consistency with dictionary

**Implementations**:
- `InMemoryPersister` - In-memory storage (default)
- Platform-specific variants (JVM and JS)

**Key Methods**:
```scala
def getSavedResult[A](path: Path, klass: Class[A]): Result[A]
def setFact(fact: Fact, value: WritableType): Unit
def deleteFact(fact: Fact, deleteSubpaths: Boolean = false): Unit
def save(): (Boolean, Seq[LimitViolation])
def toJson(indent: Int = -1): String
```

### 12. Types (`types/`)

Fact Graph defines tax-specific value types, all supporting cross-platform validation:

**Built-in Types**:
- `Dollar` - Monetary values (opaque BigDecimal with validation)
- `Day` - Dates (LocalDate with arithmetic)
- `Days` - Duration in days
- `Rational` - Rational numbers
- `Enum` / `MultiEnum` - Enumerated choices
- `Tin` / `Ein` - Tax IDs
- `Pin` / `IpPin` - PIN types
- `EmailAddress` - Email with validation
- `PhoneNumber` / `E164Number` - Phone numbers
- `Address` - Address structure
- `BankAccount` - Bank account info
- `Collection` - Generic collections of items
- `CollectionItem` - Items in collections
- `Writable` - Catch-all for all writable types

**Type Safety**: Each type includes validation and serialization via `upickle.ReadWriter`

## Data Flow & Request Path

### Typical Computation Flow

```
User Request: graph.get("/income/wages")

▼
Graph.get() finds or creates Fact at path

▼
Fact.get() evaluates its CompNode expression

├─ If Expression.Writable: → Persister.getSavedResult()

├─ If Expression.Dependency: → Recursively resolve dependency path
→ Repeat Fact.get() on that path

├─ If Expression.Binary: → Recursively evaluate both operands
→ Apply binary operator

└─ If Expression.Aggregate/Collect: → Resolve collection path
→ Iterate collection items
→ Apply operator

▼
Expression.get() returns MaybeVector[Result[A]]

├─ Complete: All dependencies available
├─ Placeholder: Some dependencies missing
└─ Incomplete: Required inputs not available

▼
Result cached in Graph.resultCache

▼
Return to user
```

### Setting a Value

```
User Request: graph.set("/income/wages", Dollar("50000"))

▼
Graph.set() validates and calls Fact.set()

▼
Fact.set() checks if writable

▼
Fact.graph.persister.setFact(fact, value)

▼
InMemoryPersister stores value in internal map

▼
Graph.save() validates all limits

▼
Return success and any LimitViolations
```

## Module Organization

### Directory Structure

```
fact-graph/
├── shared/src/main/scala/gov/irs/factgraph/
├── Fact.scala                      # Graph node class
├── FactDictionary.scala            # Definitions container
├── FactDefinition.scala            # Single fact template
├── Graph.scala                     # Scenario instance
├── Expression.scala                # Computation expressions
├── Path.scala                      # Path navigation
├── Factual.scala                   # Common trait
├── Explanation.scala               # Computation tracing

├── compnodes/                      # Computational nodes (~60 types)
├── CompNode.scala              # Base trait & factory
├── WritableNode.scala          # Writable facts
├── BooleanNode.scala           # Boolean constants
├── DollarNode.scala            # Dollar operations
├── Add.scala, Multiply.scala   # Arithmetic operators
├── Filter.scala, Find.scala    # Collection operators
└── ...

├── operators/                      # Operator implementations
├── Operator.scala              # Base trait
├── UnaryOperator.scala
├── BinaryOperator.scala
├── AggregateOperator.scala
└── ...

├── limits/                         # Validation constraints
├── Limit.scala                 # Base trait
├── LimitFactory.scala
├── Min.scala, Max.scala
├── LimitViolation.scala
└── ...

├── types/                          # Tax-specific value types
├── Day.scala, Dollar.scala
├── Enum.scala, MultiEnum.scala
├── Tin.scala, Ein.scala
├── Collection.scala
├── Writable.scala              # Type union
└── ...

├── monads/                         # Functional structures
├── Result.scala                # Complete/Placeholder/Incomplete
├── MaybeVector.scala           # Single/Multiple results
└── Thunk.scala                 # Lazy computation

├── persisters/                     # Data storage backends
├── Persister.scala             # Trait
├── InMemoryPersister.scala     # Shared impl
└── TypeContainer.scala

├── definitions/                    # Configuration structures
├── FactDictionaryConfigTrait.scala
└── fact/
├── FactConfigTrait.scala
├── WritableConfigTrait.scala
├── CompNodeConfigTrait.scala
└── LimitConfigTrait.scala

└── util/                           # Utilities
├── Validation.scala
├── Math.scala
└── Seq.scala

├── jvm/src/main/scala/gov/irs/factgraph/
└── persisters/
└── InMemoryPersisterJava.scala # JVM-specific impl

├── js/src/main/scala/gov/irs/factgraph/
├── JSGraph.scala                   # JS-specific Graph
├── JSFactDictionary.scala          # JS-specific loading
├── persisters/
└── InMemoryPersisterJS.scala   # JS-specific impl
├── types/                          # JS type factories
├── DayFactory.scala
├── DollarFactory.scala
└── ...
└── utils/
└── ConversionUtils.scala
```

### Cross-Platform Structure

The project uses **Scala.js** with `CrossType.Full` for seamless JVM/JS compilation:

- **Shared** (`shared/src/main/scala`): Core library code
- **JVM** (`jvm/src/main/scala`): JVM-specific implementations
- **JS** (`js/src/main/scala`): JavaScript/Node.js-specific implementations

Key differences:
- Date/time handling (Java LocalDate vs JavaScript Date)
- Serialization (upickle for JSON)
- Type factories for runtime instantiation in JS

## Key Design Patterns

### 1. Sealed Trait + Case Class (ADT)
Used for type-safe enumerations:
- `Result[A]` enum
- `MaybeVector[A]` enum
- `Expression[A]` enum
- `PathItem` sealed trait

### 2. Factory Pattern
Extensible operator/node registration:
```scala
private val factories = mutable.Map(defaultFactories.map(_.asTuple)*)
def register(f: CompNodeFactory): Unit = factories.addOne(f.asTuple)
```

### 3. Context Functions (using/given)
Used to thread dependencies like `Factual` and `FactDictionary`:
```scala
def get(using Factual): MaybeVector[Result[A]] = ...
def fromConfig(e: CompNodeConfigTrait)(using Factual)(using FactDictionary): CompNode = ...
```

### 4. Extension Methods
Type enhancements for ergonomics:
```scala
extension (x: Dollar)
def +(y: Dollar): Dollar = ...
```

### 5. Opaque Types
Type-safe aliases without runtime overhead:
```scala
opaque type Dollar = BigDecimal
```

### 6. Lazy Evaluation & Caching
Deferred computation with memoization:
```scala
lazy val value: CompNode = cnBuilder
val resultCache = mutable.HashMap[Path, MaybeVector[Result[Any]]]()
```

### 7. Vectorization
Handling both single values and collections uniformly:
```scala
enum MaybeVector[+A]:
case Single(x: A)
case Multiple(vect: Vector[A], c: Boolean)
```

## Type Safety Features

1. **CompNode type parameter**: Each node knows its value type
2. **Expression[A]**: Type-safe computation expressions
3. **Limit/Operator generics**: Type-checked constraints and operations
4. **Class[A] tracking**: Runtime type information for validation
5. **Writable type union**: Exhaustive set of persistable types

## Performance Considerations

1. **Caching**:
- Fact instances cached by path
- Computation results cached
- Dictionary lookups memoized

2. **Lazy Evaluation**:
- Thunks defer computation
- Lazy properties avoid unnecessary work
- Expression evaluation only on demand

3. **Vector Handling**:
- Vectorization ensures constant-time collection operations
- Length validation prevents mixed-size operations

4. **Cross-Platform**:
- JS build ~400KB without extra dependencies
- Scala.js produces optimized JavaScript

## Testing

The project uses **ScalaTest** with comprehensive specs:
- Type-specific tests (`DollarSpec.scala`, `DaySpec.scala`)
- Operation tests (`BinaryOperatorSpec.scala`)
- Limit tests (`MaxSpec.scala`)
- Entire dictionary tests (`FactDictionarySpec.scala`)
- Both JVM and JS test suites

## Extension Points

### Adding a New CompNode
1. Create `MyNode.scala` extending `CompNodeFactory`
2. Implement `fromDerivedConfig()` method
3. Register with `CompNode.register(MyNode)`

### Adding a New Operator
1. Create operator class implementing `UnaryOperator[A, X]`, `BinaryOperator[A, L, R]`, etc.
2. Implement `apply()` and `thunk()` methods
3. Register via factory pattern

### Adding a New Limit
1. Create `MyLimit.scala` implementing `Limit`
2. Create corresponding `LimitFactory`
3. Register with `Limit.register()`

### Custom Persister
1. Implement `Persister` trait
2. Provide to `Graph(dictionary, customPersister)`

## Common Development Tasks

### Understanding a Computation
1. Use `graph.explain(path: String)` to trace how value is computed
2. Check `FactDefinition.value` to see the CompNode expression
3. Follow `Expression` type cases to understand dependencies

### Adding a New Fact
1. Define in fact dictionary XML
2. Declare as `<Writable>` (user-input) or `<Derived>` (computed)
3. Add limits if validating user input
4. Test with specs

### Debugging
1. `graph.debugFact(path)` - Pretty-print fact computation with values
2. `graph.debugFactRecurse(path)` - Recursively expand all dependencies
3. Examine `graph.resultCache` to see cached results
4. Check `graph.explain()` for computation trace

## Versioning & Releases

- **Current Version**: 3.1.0-SNAPSHOT
- **Scala Version**: 3.3.6
- **Key Dependency**: fs2-data-xml for XML parsing
- **Published To**: Maven local repository via `sbt publishLocal`

## References

- **Architecture ADR**: `docs/fact-graph-3.1-adr.md`
- **Contributing Guide**: `CONTRIBUTING.md`
- **Onboarding Guide**: `ONBOARDING.md`
- **ScalaTest Docs**: https://www.scalatest.org/
- **Scala XML Docs**: https://www.scala-lang.org/api/2.12.19/scala-xml/
