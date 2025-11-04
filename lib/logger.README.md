# Application Logger

A unified logging solution for the Lake project that writes to the `ApplicationLog` database table. This logger provides a consistent interface for logging across the entire application and can be easily swapped to different backends (file, cloud logging services, etc.) in the future.

## Features

- **Unified Interface**: Single import for all logging needs
- **Type-Safe**: Full TypeScript support with Prisma types
- **Contextual**: Automatically captures request context, user info, and game server associations
- **Categorized**: Logs are categorized by type (System, Auth, Payment, etc.) and level (Info, Warn, Error, Fatal)
- **Queryable**: Built-in methods to query and filter logs
- **Error Handling**: Graceful fallback to console if database logging fails
- **Extensible**: Easy to swap backend implementation without changing usage

## Installation

The logger is already available in your project. Simply import it:

```typescript
import { logger } from "@/lib/logger";
```

## Basic Usage

### Simple Logging

```typescript
// Info log
await logger.info("Server started successfully");

// Warning
await logger.warn("High memory usage detected");

// Error
await logger.error("Failed to connect to database");

// Fatal error
await logger.fatal("Critical system failure");
```

### Category-Specific Logging

```typescript
// System events
await logger.system("Application initialized");

// Authentication
await logger.auth("User logged in", "INFO", { userId: "user123" });

// Payment events
await logger.payment("Payment processed", "INFO", { 
  userId: "user123",
  details: { amount: 1000, currency: "USD" }
});

// Game server events
await logger.gameServer("Server created", "INFO", {
  gameServerId: "server456",
  userId: "user123"
});

// Email events
await logger.email("Welcome email sent", "INFO", { userId: "user123" });

// Support tickets
await logger.ticket("New ticket created", "INFO", { userId: "user123" });
```

## Advanced Usage

### With Request Context

In API routes or server actions:

```typescript
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const requestContext = logger.extractRequestContext(request);
  
  await logger.info("API endpoint called", "SYSTEM", {
    ...requestContext,
    details: { endpoint: "/api/servers" }
  });
}
```

With Next.js headers:

```typescript
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

export async function myServerAction() {
  const headersList = await headers();
  const requestContext = logger.extractHeadersContext(headersList);
  
  await logger.info("Server action executed", "SYSTEM", requestContext);
}
```

### Error Logging with Stack Traces

```typescript
try {
  // Your code
} catch (error) {
  await logger.logError(error, "GAME_SERVER", {
    gameServerId: "server123",
    userId: "user456",
    details: { operation: "createServer" }
  });
}
```

### Rich Context

```typescript
await logger.payment("Checkout completed", "INFO", {
  userId: session.user.id,
  method: "POST",
  path: "/api/checkout",
  details: {
    orderId: order.id,
    amount: order.price,
    gameType: order.gameData.name,
    timestamp: new Date().toISOString()
  }
});
```

## Querying Logs

### Get Recent Errors

```typescript
const recentErrors = await logger.getRecentErrors(50);
```

### Get User-Specific Logs

```typescript
const userLogs = await logger.getUserLogs("user123", 100);
```

### Get Game Server Logs

```typescript
const serverLogs = await logger.getGameServerLogs("server456", 100);
```

### Custom Queries

```typescript
const logs = await logger.query({
  level: "ERROR",
  type: "PAYMENT",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-12-31"),
  limit: 200
});
```

## Log Types

- `SYSTEM` - System events, startup, shutdown, configuration changes
- `AUTHENTICATION` - Login, logout, registration, password resets
- `PAYMENT` - Stripe events, checkouts, refunds
- `GAME_SERVER` - Server creation, updates, deletions
- `EMAIL` - Email sending, failures, retries
- `SUPPORT_TICKET` - Ticket creation, updates, responses

## Log Levels

- `INFO` - Informational messages, normal operations
- `WARN` - Warning messages, potential issues
- `ERROR` - Error messages, recoverable failures
- `FATAL` - Critical failures, system down

## Examples from the Codebase

### In Checkout Action

```typescript
// app/actions/checkout.ts
import { logger } from "@/lib/logger";

export async function checkoutAction(data: CheckoutFormData) {
  try {
    // ... checkout logic
    
    await logger.payment("Checkout session created", "INFO", {
      userId: session.user.id,
      details: {
        sessionId: stripeSession.id,
        amount: totalPrice,
        type: orderType
      }
    });
    
    return { clientSecret: stripeSession.client_secret };
  } catch (error) {
    await logger.logError(error, "PAYMENT", {
      userId: session.user.id,
      details: { formData: data }
    });
    throw error;
  }
}
```

### In Webhook Handler

```typescript
// app/webhook/route.ts
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const requestContext = logger.extractRequestContext(request);
  
  try {
    // ... webhook processing
    
    await logger.payment("Webhook processed successfully", "INFO", {
      ...requestContext,
      details: { 
        eventType: event.type,
        sessionId: session.id 
      }
    });
  } catch (error) {
    await logger.logError(error, "PAYMENT", requestContext);
    return new Response("Webhook error", { status: 400 });
  }
}
```

### In Server Provisioning

```typescript
// lib/Pterodactyl/createServers/provisionServer.ts
import { logger } from "@/lib/logger";

export async function provisionServer(order: GameServerOrder) {
  try {
    const server = await createPtServer(order);
    
    await logger.gameServer("Server provisioned", "INFO", {
      userId: order.userId,
      gameServerId: server.id,
      details: {
        ptServerId: server.ptServerId,
        gameType: order.creationGameData?.name
      }
    });
    
    return server;
  } catch (error) {
    await logger.logError(error, "GAME_SERVER", {
      userId: order.userId,
      details: { orderId: order.id }
    });
    throw error;
  }
}
```

## Changing the Backend

To swap the logging backend (e.g., to use a file system, cloud service, or different database), modify the `Logger` class in `/lib/logger.ts`:

1. Keep the same public API (methods like `info`, `error`, etc.)
2. Change the implementation of the private `log` method
3. Update the constructor to accept different configuration

Example switching to console + file:

```typescript
class Logger {
  private writeToFile(entry: LogEntry) {
    // File writing logic
  }

  private async log(entry: LogEntry): Promise<void> {
    console.log(entry);
    this.writeToFile(entry);
  }
  
  // Rest of the API stays the same
}
```

All existing code using the logger will continue to work unchanged.

## Best Practices

1. **Always await**: Logger methods are async, always await them
2. **Use appropriate types**: Choose the correct LogType for better filtering
3. **Include context**: Pass userId, gameServerId when available
4. **Use details for structured data**: Store complex objects in the details field
5. **Use logError for exceptions**: Automatically captures stack traces
6. **Don't log sensitive data**: Avoid logging passwords, API keys, tokens
7. **Be descriptive**: Write clear, actionable log messages

## Performance Considerations

- Logging is async and doesn't block the main execution
- Database writes are batched by Prisma
- Failed logs fall back to console and don't throw errors
- Consider adding a job queue for high-volume logging scenarios

## Monitoring

Use the built-in query methods to create monitoring dashboards:

```typescript
// Get error rate
const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
const errors = await logger.query({
  level: "ERROR",
  startDate: last24h
});

// Monitor specific user activity
const userActivity = await logger.getUserLogs(userId);

// Track server issues
const serverErrors = await logger.query({
  type: "GAME_SERVER",
  level: "ERROR",
  limit: 100
});
```
