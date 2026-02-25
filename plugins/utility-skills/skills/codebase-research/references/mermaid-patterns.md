# Mermaid Diagram Patterns

Templates and patterns for generating consistent diagrams in codebase documentation.

---

## System Architecture Diagrams

### Basic System Diagram

```mermaid
graph TB
    subgraph "Clients"
        Client1[Client Type 1]
        Client2[Client Type 2]
    end

    subgraph "Application Layer"
        App1[Service 1]
        App2[Service 2]
    end

    subgraph "Data Layer"
        DB[(Database)]
        Cache[(Cache)]
    end

    Client1 --> App1
    Client2 --> App1
    App1 --> App2
    App1 --> DB
    App1 --> Cache
```

### Layered Architecture

```mermaid
graph TB
    subgraph "Presentation"
        API[Web API]
        UI[Web UI]
    end

    subgraph "Business"
        BL[Business Logic]
        Domain[Domain Models]
    end

    subgraph "Infrastructure"
        DAL[Data Access]
        External[External Services]
    end

    subgraph "Persistence"
        DB[(Database)]
        Files[/File Storage/]
    end

    API --> BL
    UI --> API
    BL --> Domain
    BL --> DAL
    BL --> External
    DAL --> DB
    External --> Files
```

### Microservices Architecture

```mermaid
graph TB
    subgraph "Gateway"
        GW[API Gateway]
    end

    subgraph "Services"
        Svc1[User Service]
        Svc2[Order Service]
        Svc3[Payment Service]
    end

    subgraph "Messaging"
        Queue[/Message Queue/]
        Events[/Event Bus/]
    end

    subgraph "Data"
        DB1[(Users DB)]
        DB2[(Orders DB)]
        DB3[(Payments DB)]
    end

    GW --> Svc1
    GW --> Svc2
    GW --> Svc3
    Svc1 --> DB1
    Svc2 --> DB2
    Svc3 --> DB3
    Svc2 --> Queue
    Queue --> Svc3
    Svc1 --> Events
    Svc2 --> Events
    Svc3 --> Events
```

---

## Component Diagrams

### Single Component Dependencies

```mermaid
graph LR
    Component[Component Name]

    subgraph "Project Dependencies"
        Dep1[Library 1]
        Dep2[Library 2]
    end

    subgraph "External"
        Ext1[(Database)]
        Ext2[External API]
    end

    Component --> Dep1
    Component --> Dep2
    Component --> Ext1
    Component --> Ext2
```

### Component with Bidirectional Connections

```mermaid
graph LR
    Component[Component]

    Inbound1[Client A] --> Component
    Inbound2[Client B] --> Component
    Component --> Outbound1[Service X]
    Component --> Outbound2[Service Y]
    Component <--> Bidirectional[Hub]
```

### Component Internal Structure

```mermaid
graph TB
    subgraph Component[Component Name]
        Controller[Controllers]
        Service[Services]
        Repository[Repositories]
        Model[Models]

        Controller --> Service
        Service --> Repository
        Repository --> Model
    end

    External[(Database)] --> Repository
```

---

## Data Flow Diagrams

### Request-Response Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant S as Service
    participant R as Repository
    participant D as Database

    C->>A: HTTP Request
    A->>S: Process Request
    S->>R: Query Data
    R->>D: SQL Query
    D-->>R: Result Set
    R-->>S: Domain Objects
    S-->>A: Response DTO
    A-->>C: HTTP Response
```

### Async Processing Flow

```mermaid
sequenceDiagram
    participant A as API
    participant Q as Queue
    participant W as Worker
    participant S as External Service

    A->>Q: Publish Message
    A-->>A: Return Accepted
    Q-->>W: Consume Message
    W->>S: Process
    S-->>W: Result
    W->>Q: Ack Message
```

### Event-Driven Flow

```mermaid
sequenceDiagram
    participant P as Producer
    participant B as Event Bus
    participant C1 as Consumer 1
    participant C2 as Consumer 2

    P->>B: Publish Event
    par Parallel Delivery
        B->>C1: Deliver Event
        B->>C2: Deliver Event
    end
    C1-->>B: Ack
    C2-->>B: Ack
```

---

## Dependency Graphs

### Simple Dependency Graph

```mermaid
graph TD
    A[Component A]
    B[Component B]
    C[Component C]
    D[Component D]

    A --> B
    A --> C
    B --> D
    C --> D
```

### Dependency Graph with Layers

```mermaid
graph TD
    subgraph "Layer 1"
        A1[App 1]
        A2[App 2]
    end

    subgraph "Layer 2"
        B1[Lib 1]
        B2[Lib 2]
    end

    subgraph "Layer 3"
        C1[Core]
    end

    A1 --> B1
    A1 --> B2
    A2 --> B2
    B1 --> C1
    B2 --> C1
```

### Circular Dependency Warning

```mermaid
graph LR
    A[Component A]
    B[Component B]
    C[Component C]

    A --> B
    B --> C
    C -.->|CIRCULAR| A

    style C fill:#ff6b6b
    linkStyle 2 stroke:#ff0000,stroke-width:2px
```

---

## Node Shapes Reference

Use consistent shapes for different entity types:

```mermaid
graph LR
    Service[Service/Application]
    Library[Library]
    Database[(Database)]
    Queue[/Message Queue/]
    Storage[/File Storage/]
    External{{External Service}}
    Decision{Decision Point}
```

### Shape Usage Guide

| Entity Type | Shape | Syntax |
|-------------|-------|--------|
| Service/App | Rectangle | `[Name]` |
| Library | Rectangle | `[Name]` |
| Database | Cylinder | `[(Name)]` |
| Queue/Topic | Parallelogram | `[/Name/]` |
| File Storage | Parallelogram | `[/Name/]` |
| External API | Hexagon | `{{Name}}` |
| Decision | Diamond | `{Name}` |
| Subgraph | Group box | `subgraph "Name"` |

---

## Styling Patterns

### Highlight Critical Components

```mermaid
graph LR
    A[Normal]
    B[Warning]
    C[Critical]

    A --> B --> C

    style B fill:#fff3cd
    style C fill:#f8d7da
```

### Connection Types

```mermaid
graph LR
    A[A] --> B[B]
    C[C] -.-> D[D]
    E[E] ==> F[F]
    G[G] --text--> H[H]

    %% --> solid arrow
    %% -.-> dotted arrow (optional/weak)
    %% ==> thick arrow (important)
    %% --text--> labeled arrow
```

---

## Complete Examples

### E-Commerce System

```mermaid
graph TB
    subgraph "Frontend"
        Web[Web App<br/>React]
        Mobile[Mobile App<br/>React Native]
    end

    subgraph "API Gateway"
        Gateway[Kong Gateway]
    end

    subgraph "Microservices"
        Users[User Service<br/>Node.js]
        Products[Product Service<br/>.NET]
        Orders[Order Service<br/>.NET]
        Payments[Payment Service<br/>Go]
        Notifications[Notification Service<br/>Python]
    end

    subgraph "Messaging"
        Kafka[/Apache Kafka/]
    end

    subgraph "Data Stores"
        UsersDB[(PostgreSQL<br/>Users)]
        ProductsDB[(PostgreSQL<br/>Products)]
        OrdersDB[(PostgreSQL<br/>Orders)]
        Redis[(Redis<br/>Cache)]
    end

    subgraph "External"
        Stripe{{Stripe API}}
        SendGrid{{SendGrid}}
    end

    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Users
    Gateway --> Products
    Gateway --> Orders
    Users --> UsersDB
    Products --> ProductsDB
    Products --> Redis
    Orders --> OrdersDB
    Orders --> Kafka
    Kafka --> Payments
    Kafka --> Notifications
    Payments --> Stripe
    Notifications --> SendGrid
```

### .NET Solution Structure

```mermaid
graph TD
    subgraph "Solution: MyApp"
        subgraph "src"
            WebApi[MyApp.WebApi<br/>ASP.NET Core]
            Worker[MyApp.Worker<br/>.NET Worker]
            Domain[MyApp.Domain<br/>Class Library]
            Infrastructure[MyApp.Infrastructure<br/>Class Library]
            Shared[MyApp.Shared<br/>Class Library]
        end

        subgraph "tests"
            UnitTests[MyApp.UnitTests<br/>xUnit]
            IntegrationTests[MyApp.IntegrationTests<br/>xUnit]
        end
    end

    WebApi --> Domain
    WebApi --> Infrastructure
    WebApi --> Shared
    Worker --> Domain
    Worker --> Infrastructure
    Worker --> Shared
    Infrastructure --> Domain
    Infrastructure --> Shared
    Domain --> Shared
    UnitTests -.-> WebApi
    UnitTests -.-> Domain
    IntegrationTests -.-> WebApi
```

### Data Pipeline

```mermaid
graph LR
    subgraph "Sources"
        S1[/API Logs/]
        S2[/Database CDC/]
        S3[/File Uploads/]
    end

    subgraph "Ingestion"
        Kafka[/Kafka/]
    end

    subgraph "Processing"
        Spark[Apache Spark]
    end

    subgraph "Storage"
        Lake[(Data Lake<br/>S3)]
        Warehouse[(Data Warehouse<br/>Snowflake)]
    end

    subgraph "Serving"
        API[Query API]
        BI[BI Dashboard]
    end

    S1 --> Kafka
    S2 --> Kafka
    S3 --> Kafka
    Kafka --> Spark
    Spark --> Lake
    Spark --> Warehouse
    Lake --> API
    Warehouse --> BI
```

---

## Diagram Generation Checklist

When creating diagrams:

1. **Identify all components** from discovery phase
2. **Choose appropriate layout**
   - TB (top-bottom) for hierarchical systems
   - LR (left-right) for flow-based systems
3. **Group related components** using subgraphs
4. **Use consistent shapes** per entity type
5. **Label connections** when relationship isn't obvious
6. **Highlight** warnings or problems
7. **Keep it readable** - split complex diagrams
8. **Validate syntax** before including in documentation
