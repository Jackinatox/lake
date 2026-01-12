# Network Management | NETVPX Pterodactyl API Documentation

Manage server network settings including IP allocations, ports, and network configuration.

## List Server Allocations[​](#list-server-allocations 'Direct link to List Server Allocations')

Retrieve all network allocations assigned to a server.

**`GET /api/client/servers/{server}/network/allocations`**

### URL Parameters[​](#url-parameters 'Direct link to URL Parameters')

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| server    | string | Server identifier (UUID or short ID) |

### Example Request[​](#example-request 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

GET /api/client/servers/{server}/network/allocations

```
curl "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json"

```

### Example Response[​](#example-response 'Direct link to Example Response')

```
{
  "object": "list",
  "data": [
    {
      "object": "allocation",
      "attributes": {
        "id": 15,
        "ip": "45.86.168.218",
        "ip_alias": "game.example.com",
        "port": 25565,
        "notes": "Main Minecraft server port",
        "is_default": true
      }
    },
    {
      "object": "allocation",
      "attributes": {
        "id": 16,
        "ip": "45.86.168.218",
        "ip_alias": "game.example.com",
        "port": 25566,
        "notes": "Secondary port for plugins",
        "is_default": false
      }
    },
    {
      "object": "allocation",
      "attributes": {
        "id": 17,
        "ip": "45.86.168.218",
        "ip_alias": null,
        "port": 25567,
        "notes": null,
        "is_default": false
      }
    }
  ]
}

```

### Allocation Object Attributes[​](#allocation-object-attributes 'Direct link to Allocation Object Attributes')

| Field      | Description                            |
| ---------- | -------------------------------------- |
| id         | Unique allocation identifier           |
| ip         | IP address of the allocation           |
| ip_alias   | Friendly name/hostname for the IP      |
| port       | Port number                            |
| notes      | User-defined notes for the allocation  |
| is_default | Whether this is the primary allocation |

---

## Assign New Allocation[​](#assign-new-allocation 'Direct link to Assign New Allocation')

Request assignment of an available allocation to the server.

**`POST /api/client/servers/{server}/network/allocations`**

### Request Body[​](#request-body 'Direct link to Request Body')

| Field | Type    | Required | Description                   |
| ----- | ------- | -------- | ----------------------------- |
| ip    | string  | No       | Specific IP address to assign |
| port  | integer | No       | Specific port to assign       |

Note

If no IP or port is specified, the system will automatically assign the next available allocation from the node's pool.

### Example Request[​](#example-request-1 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 25568
  }'

```

### Success Response[​](#success-response 'Direct link to Success Response')

```
{
  "object": "allocation",
  "attributes": {
    "id": 18,
    "ip": "45.86.168.218",
    "ip_alias": "game.example.com",
    "port": 25568,
    "notes": null,
    "is_default": false
  }
}

```

### Error Responses[​](#error-responses 'Direct link to Error Responses')

**Allocation Limit Reached (400)**

```
{
  "errors": [
    {
      "code": "TooManyAllocationsException",
      "status": "400",
      "detail": "This server has reached its allocation limit."
    }
  ]
}

```

**Allocation Not Available (409)**

```
{
  "errors": [
    {
      "code": "AllocationNotAvailableException",
      "status": "409",
      "detail": "The requested allocation is not available or already in use."
    }
  ]
}

```

**No Available Allocations (503)**

```
{
  "errors": [
    {
      "code": "NoAvailableAllocationsException",
      "status": "503",
      "detail": "No available allocations found on this node."
    }
  ]
}

```

---

## Set Primary Allocation[​](#set-primary-allocation 'Direct link to Set Primary Allocation')

Change which allocation is the primary (default) allocation for the server.

**`POST /api/client/servers/{server}/network/allocations/{allocation}/primary`**

### URL Parameters[​](#url-parameters-1 'Direct link to URL Parameters')

| Parameter  | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| server     | string  | Server identifier (UUID or short ID) |
| allocation | integer | Allocation ID to set as primary      |

### Example Request[​](#example-request-2 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations/16/primary" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json"

```

### Success Response[​](#success-response-1 'Direct link to Success Response')

```
{
  "object": "allocation",
  "attributes": {
    "id": 16,
    "ip": "45.86.168.218",
    "ip_alias": "game.example.com",
    "port": 25566,
    "notes": "Secondary port for plugins",
    "is_default": true
  }
}

```

Primary Allocation

The primary allocation is the main IP:Port combination used for server connections. Only one allocation can be primary at a time.

### Error Responses[​](#error-responses-1 'Direct link to Error Responses')

**Server Must Be Stopped (400)**

```
{
  "errors": [
    {
      "code": "ConflictingServerStateException",
      "status": "400",
      "detail": "Server must be stopped to change the primary allocation."
    }
  ]
}

```

---

## Update Allocation Notes[​](#update-allocation-notes 'Direct link to Update Allocation Notes')

Add or modify notes for a specific allocation.

**`POST /api/client/servers/{server}/network/allocations/{allocation}`**

### URL Parameters[​](#url-parameters-2 'Direct link to URL Parameters')

| Parameter  | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| server     | string  | Server identifier (UUID or short ID) |
| allocation | integer | Allocation ID                        |

### Request Body[​](#request-body-1 'Direct link to Request Body')

| Field | Type   | Required | Description                                   |
| ----- | ------ | -------- | --------------------------------------------- |
| notes | string | No       | Notes for the allocation (max 255 characters) |

### Example Request[​](#example-request-3 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations/17" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Reserved for future web interface"
  }'

```

### Success Response[​](#success-response-2 'Direct link to Success Response')

```
{
  "object": "allocation",
  "attributes": {
    "id": 17,
    "ip": "45.86.168.218",
    "ip_alias": "game.example.com",
    "port": 25567,
    "notes": "Reserved for future web interface",
    "is_default": false
  }
}

```

---

## Remove Allocation[​](#remove-allocation 'Direct link to Remove Allocation')

Unassign an allocation from the server, making it available for other servers.

**`DELETE /api/client/servers/{server}/network/allocations/{allocation}`**

### URL Parameters[​](#url-parameters-3 'Direct link to URL Parameters')

| Parameter  | Type    | Description                          |
| ---------- | ------- | ------------------------------------ |
| server     | string  | Server identifier (UUID or short ID) |
| allocation | integer | Allocation ID to remove              |

### Example Request[​](#example-request-4 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
curl -X DELETE "https://your-panel.com/api/client/servers/d3aac109/network/allocations/18" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json"

```

### Success Response (204)

[​](#success-response-204 'Direct link to Success Response (204)')

Returns empty response body with status code 204.

### Error Responses[​](#error-responses-2 'Direct link to Error Responses')

**Cannot Remove Primary Allocation (400)**

```
{
  "errors": [
    {
      "code": "CannotDeletePrimaryAllocationException",
      "status": "400",
      "detail": "Cannot remove the primary allocation. Set another allocation as primary first."
    }
  ]
}

```

**Server Must Be Stopped (400)**

```
{
  "errors": [
    {
      "code": "ConflictingServerStateException",
      "status": "400",
      "detail": "Server must be stopped to remove allocations."
    }
  ]
}

```

---

## Network Configuration Examples[​](#network-configuration-examples 'Direct link to Network Configuration Examples')

### Game Server Setup[​](#game-server-setup 'Direct link to Game Server Setup')

Here's how to configure network allocations for different types of game servers:

**Minecraft Server**

```
# Add primary allocation for Minecraft
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 25565
  }'

```

**FiveM Server**

```
# Add primary allocation for FiveM (30120)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 30120
  }'

```

**CS:GO Server**

```
# Add primary allocation for CS:GO (27015)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 27015
  }'

```

### Multiple Services[​](#multiple-services 'Direct link to Multiple Services')

Configure multiple allocations for servers running multiple services:

```
# Add web panel allocation (8080)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 8080
  }'

# Add RCON allocation (25575)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 25575
  }'

```

### Set Primary Allocation[​](#set-primary-allocation-1 'Direct link to Set Primary Allocation')

```
# Set allocation as primary (main server port)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations/1/primary" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json"

```

### Multiple Services[​](#multiple-services-1 'Direct link to Multiple Services')

Configure multiple allocations for servers running multiple services:

```
# Add web panel allocation (8080)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 8080
  }'

# Add RCON allocation (25575)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "45.86.168.218",
    "port": 25575
  }'

```

### Set Primary Allocation[​](#set-primary-allocation-2 'Direct link to Set Primary Allocation')

```
# Set allocation as primary (main server port)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/network/allocations/1/primary" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json"

```

### Port Testing[​](#port-testing 'Direct link to Port Testing')

Test allocation connectivity:

```
# Test port connectivity
telnet 45.86.168.218 25565

# Verify port listening
netstat -tuln | grep 25565

# Test from specific location
curl -I http://45.86.168.218:8080

```

### Network Monitoring[​](#network-monitoring 'Direct link to Network Monitoring')

- **Port scanning**: Regular port availability checks
- **Latency monitoring**: Track connection latency
- **Bandwidth usage**: Monitor data transfer
- **Uptime tracking**: Ensure allocation availability

---

## Common Error Codes[​](#common-error-codes 'Direct link to Common Error Codes')

| Status | Code                                   | Description                      |
| ------ | -------------------------------------- | -------------------------------- |
| 400    | TooManyAllocationsException            | Allocation limit reached         |
| 400    | CannotDeletePrimaryAllocationException | Cannot remove primary allocation |
| 400    | ConflictingServerStateException        | Server state prevents operation  |
| 401    | InvalidCredentialsException            | Invalid API key                  |
| 403    | InsufficientPermissionsException       | Missing required permissions     |
| 404    | NotFoundHttpException                  | Allocation not found             |
| 422    | ValidationException                    | Invalid request data             |

## Required Permissions[​](#required-permissions 'Direct link to Required Permissions')

Network allocation operations require specific permissions:

| Permission        | Description                |
| ----------------- | -------------------------- |
| allocation.read   | View server allocations    |
| allocation.create | Add new allocations        |
| allocation.update | Modify allocation settings |
| allocation.delete | Remove allocations         |

## Next Steps[​](#next-steps 'Direct link to Next Steps')

- Explore [Server Management](https://pterodactyl-api-docs.netvpx.com/docs/api/client/servers) for server control and monitoring
- Check [User Management](https://pterodactyl-api-docs.netvpx.com/docs/api/client/users) for allocation access control
- Review [Scheduled Tasks](https://pterodactyl-api-docs.netvpx.com/docs/api/client/schedules) for automated network checks

## Source References[​](#source-references 'Direct link to Source References')

**Controller**: [`NetworkAllocationController`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Http/Controllers/Api/Client/Servers/NetworkAllocationController.php)  
**Routes**: [`api-client.php`](https://github.com/pterodactyl/panel/blob/1.0-develop/routes/api-client.php) - Network allocation endpoints  
**Allocation Model**: [`Allocation.php`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Models/Allocation.php)  
**Allocation Service**: [`AllocationSelectionService`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Services/Allocations/AllocationSelectionService.php)
