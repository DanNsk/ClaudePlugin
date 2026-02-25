# Mermaid Diagram Examples

Comprehensive examples of common Mermaid diagram types with syntax.

## Flowchart

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Fix Issue]
    E --> B
    C --> F[End]
```

**Common Shapes:**
- `[Rectangle]` - Process
- `{Diamond}` - Decision
- `([Stadium])` - Start/End
- `[[Subroutine]]` - Subroutine
- `[(Database)]` - Database
- `((Circle))` - Circle

**Directions:** `TD` (top-down), `LR` (left-right), `BT` (bottom-top), `RL` (right-left)

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Database

    User->>API: Login Request
    activate API
    API->>Database: Validate Credentials
    activate Database
    Database-->>API: User Data
    deactivate Database
    API-->>User: JWT Token
    deactivate API

    Note over User,API: User is authenticated
```

**Arrow Types:**
- `->` - Solid line without arrow
- `-->` - Dotted line without arrow
- `->>` - Solid line with arrow
- `-->>` - Dotted line with arrow
- `-x` - Solid line with cross
- `--x` - Dotted line with cross

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }

    class Dog {
        +String breed
        +bark()
    }

    class Cat {
        +Boolean indoor
        +meow()
    }

    Animal <|-- Dog
    Animal <|-- Cat
```

**Relationships:**
- `<|--` - Inheritance
- `*--` - Composition
- `o--` - Aggregation
- `-->` - Association
- `--` - Link (solid)
- `..|>` - Realization
- `..>` - Dependency

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Success : Complete
    Processing --> Failed : Error
    Success --> [*]
    Failed --> Retry : Retry
    Retry --> Processing
    Failed --> [*] : Give Up
```

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses

    CUSTOMER {
        string customerId PK
        string name
        string email
    }

    ORDER {
        string orderId PK
        string customerId FK
        date orderDate
        float total
    }

    LINE-ITEM {
        string lineId PK
        string orderId FK
        string productId FK
        int quantity
    }
```

**Cardinality:**
- `||--||` - One to one
- `||--o{` - One to many
- `}o--o{` - Many to many
- `||..|{` - One to many (dotted)

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Requirements        :done, req, 2024-01-01, 2024-01-15
    Design             :active, des, 2024-01-10, 2024-01-25
    section Development
    Backend API        :dev1, 2024-01-20, 30d
    Frontend UI        :dev2, after dev1, 20d
    section Testing
    Integration Tests  :test, after dev2, 10d
    UAT               :after test, 5d
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Add feature scaffold"
    branch feature/auth
    checkout feature/auth
    commit id: "Add login"
    commit id: "Add logout"
    checkout develop
    merge feature/auth
    checkout main
    merge develop tag: "v1.0.0"
```

## Pie Chart

```mermaid
pie title Technology Stack Usage
    "TypeScript" : 45
    "Python" : 25
    "C#" : 20
    "Go" : 10
```

## User Journey

```mermaid
journey
    title User Onboarding Journey
    section Registration
      Visit homepage: 5: User
      Click signup: 3: User
      Fill form: 2: User
      Submit: 4: User, System
    section Verification
      Receive email: 5: System
      Click verify link: 4: User
      Account activated: 5: System
```

## Mindmap

```mermaid
mindmap
  root((CI/CD Pipeline))
    Source Control
      Git
      Branching Strategy
      Pull Requests
    Build
      Compile
      Unit Tests
      Code Analysis
    Deploy
      Staging
      Production
      Rollback Strategy
```

## Timeline

```mermaid
timeline
    title Product Development Timeline
    2024 Q1 : Planning Phase
             : Market Research
             : Requirements Gathering
    2024 Q2 : Development Phase
             : MVP Release
    2024 Q3 : Testing & Refinement
             : Beta Launch
    2024 Q4 : Production Release
             : Marketing Campaign
```

## C4 Context Diagram

```mermaid
C4Context
    title System Context Diagram

    Person(user, "User", "Application user")
    System(webapp, "Web Application", "Main application")
    System_Ext(email, "Email Service", "Sends notifications")
    System_Ext(payment, "Payment Gateway", "Processes payments")

    Rel(user, webapp, "Uses", "HTTPS")
    Rel(webapp, email, "Sends emails via", "SMTP")
    Rel(webapp, payment, "Processes payments via", "API")
```

## C4 Container Diagram

```mermaid
C4Container
    title Container Diagram

    Person(user, "User")

    Container_Boundary(app, "Application") {
        Container(web, "Web App", "React", "User interface")
        Container(api, "API", ".NET", "Business logic")
        ContainerDb(db, "Database", "PostgreSQL", "Data storage")
        Container(cache, "Cache", "Redis", "Session/cache")
    }

    Rel(user, web, "Uses")
    Rel(web, api, "Calls", "JSON/HTTPS")
    Rel(api, db, "Reads/Writes")
    Rel(api, cache, "Caches")
```

## Tips

1. **Escaping Special Characters:** Use quotes for labels with special chars: `A["Text with: special chars"]`
2. **Line Breaks:** Use `<br/>` for multi-line text
3. **Comments:** Use `%%` for comments in diagrams
4. **Subgraphs (Flowchart):** Group related nodes
```mermaid
flowchart TD
    subgraph Backend
        A[API] --> B[Database]
    end
    subgraph Frontend
        C[UI] --> D[State]
    end
    C --> A
```
