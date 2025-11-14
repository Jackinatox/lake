# Backup Management | NETVPX Pterodactyl API Documentation

Manage server backups including creation, downloads, and backup operations.

## List Backups[​](#list-backups 'Direct link to List Backups')

Retrieve all backups for a server.

**`GET /api/client/servers/{server}/backups`**

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

GET /api/client/servers/{server}/backups

```
curl "https://your-panel.com/api/client/servers/d3aac109/backups" \
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
      "object": "backup",
      "attributes": {
        "uuid": "a4962fe6-90c8-4b89-ba62-a5d3b06426c0",
        "name": "Weekly Backup - 2023-10-20",
        "ignored_files": [
          "*.log",
          "cache/*",
          "temp/*"
        ],
        "sha256_hash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
        "bytes": 1073741824,
        "created_at": "2023-10-20T14:30:00+00:00",
        "completed_at": "2023-10-20T14:35:22+00:00",
        "is_successful": true,
        "is_locked": false
      }
    },
    {
      "object": "backup",
      "attributes": {
        "uuid": "b7823cd9-45e1-4c23-9a84-c8d5f06b93a1",
        "name": "Pre-Update Backup",
        "ignored_files": [],
        "sha256_hash": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4930291f82d1",
        "bytes": 524288000,
        "created_at": "2023-10-18T09:15:00+00:00",
        "completed_at": "2023-10-18T09:20:45+00:00",
        "is_successful": true,
        "is_locked": true
      }
    },
    {
      "object": "backup",
      "attributes": {
        "uuid": "c3948f1a-67b2-4d89-8c45-a1b2c3d4e5f6",
        "name": "Failed Backup Attempt",
        "ignored_files": [],
        "sha256_hash": null,
        "bytes": 0,
        "created_at": "2023-10-15T12:00:00+00:00",
        "completed_at": null,
        "is_successful": false,
        "is_locked": false
      }
    }
  ],
  "meta": {
    "pagination": {
      "total": 3,
      "count": 3,
      "per_page": 25,
      "current_page": 1,
      "total_pages": 1,
      "links": {}
    }
  }
}

```

### Backup Object Attributes[​](#backup-object-attributes 'Direct link to Backup Object Attributes')

| Field         | Description                                          |
| ------------- | ---------------------------------------------------- |
| uuid          | Unique backup identifier                             |
| name          | Backup name/description                              |
| ignored_files | Array of file patterns excluded from backup          |
| sha256_hash   | SHA256 hash of backup file (null for failed backups) |
| bytes         | Backup file size in bytes                            |
| created_at    | Backup creation start time                           |
| completed_at  | Backup completion time (null for failed/in-progress) |
| is_successful | Whether backup completed successfully                |
| is_locked     | Whether backup is locked from deletion               |

---

## Get Backup Details[​](#get-backup-details 'Direct link to Get Backup Details')

Retrieve detailed information about a specific backup.

**`GET /api/client/servers/{server}/backups/{backup}`**

### URL Parameters[​](#url-parameters-1 'Direct link to URL Parameters')

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| server    | string | Server identifier (UUID or short ID) |
| backup    | string | Backup UUID                          |

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
curl "https://your-panel.com/api/client/servers/d3aac109/backups/a4962fe6-90c8-4b89-ba62-a5d3b06426c0" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json"

```

### Example Response[​](#example-response-1 'Direct link to Example Response')

```
{
  "object": "backup",
  "attributes": {
    "uuid": "a4962fe6-90c8-4b89-ba62-a5d3b06426c0",
    "name": "Weekly Backup - 2023-10-20",
    "ignored_files": [
      "*.log",
      "cache/*",
      "temp/*"
    ],
    "sha256_hash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
    "bytes": 1073741824,
    "created_at": "2023-10-20T14:30:00+00:00",
    "completed_at": "2023-10-20T14:35:22+00:00",
    "is_successful": true,
    "is_locked": false
  }
}

```

---

## Create Backup[​](#create-backup 'Direct link to Create Backup')

Create a new backup of the server.

**`POST /api/client/servers/{server}/backups`**

### Request Body[​](#request-body 'Direct link to Request Body')

| Field     | Type    | Required | Description                                           |
| --------- | ------- | -------- | ----------------------------------------------------- |
| name      | string  | No       | Backup name (auto-generated if not provided)          |
| ignored   | string  | No       | File patterns to exclude (one per line)               |
| is_locked | boolean | No       | Whether to lock backup from deletion (default: false) |

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
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/backups" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pre-maintenance backup",
    "ignored": "*.log\ncache/*\ntemp/*\n*.tmp",
    "is_locked": true
  }'

```

### Success Response[​](#success-response 'Direct link to Success Response')

```
{
  "object": "backup",
  "attributes": {
    "uuid": "d5a847b2-89c3-4f12-a456-789abc0def12",
    "name": "Pre-maintenance backup",
    "ignored_files": [
      "*.log",
      "cache/*",
      "temp/*",
      "*.tmp"
    ],
    "sha256_hash": null,
    "bytes": 0,
    "created_at": "2023-10-21T10:30:00+00:00",
    "completed_at": null,
    "is_successful": null,
    "is_locked": true
  }
}

```

### Ignored Files Format[​](#ignored-files-format 'Direct link to Ignored Files Format')

Specify file patterns to exclude from the backup, one pattern per line:

```
*.log
*.tmp
cache/*
temp/*
node_modules/*
.git/*
logs/*.log
backups/*
*.cache

```

### Backup Process[​](#backup-process 'Direct link to Backup Process')

1.  **Initiation**: Backup request is queued
2.  **Processing**: Server files are compressed and archived
3.  **Completion**: Backup is stored and hash is calculated
4.  **Notification**: Backup status is updated

### Error Responses[​](#error-responses 'Direct link to Error Responses')

**Backup Limit Reached (400)**

```
{
  "errors": [
    {
      "code": "TooManyBackupsException",
      "status": "400",
      "detail": "This server has reached its backup limit."
    }
  ]
}

```

**Server Busy (409)**

```
{
  "errors": [
    {
      "code": "ConflictingServerStateException",
      "status": "409",
      "detail": "Cannot create backup while another backup is in progress."
    }
  ]
}

```

**Insufficient Storage (507)**

```
{
  "errors": [
    {
      "code": "InsufficientStorageException",
      "status": "507",
      "detail": "Not enough storage space available for backup."
    }
  ]
}

```

---

## Download Backup[​](#download-backup 'Direct link to Download Backup')

Get a download URL for a backup file.

**`GET /api/client/servers/{server}/backups/{backup}/download`**

### URL Parameters[​](#url-parameters-2 'Direct link to URL Parameters')

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| server    | string | Server identifier (UUID or short ID) |
| backup    | string | Backup UUID                          |

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
curl "https://your-panel.com/api/client/servers/d3aac109/backups/a4962fe6-90c8-4b89-ba62-a5d3b06426c0/download" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json"

```

### Example Response[​](#example-response-2 'Direct link to Example Response')

```
{
  "object": "signed_url",
  "attributes": {
    "url": "https://s3.amazonaws.com/backups/servers/d3aac109/backup_a4962fe6.tar.gz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20231020%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20231020T143000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=abcd1234..."
  }
}

```

### Download URL Properties[​](#download-url-properties 'Direct link to Download URL Properties')

- **Validity**: URLs expire after 1 hour
- **Single use**: Each request generates a new URL
- **Authentication**: URLs are pre-signed and don't require additional auth
- **File format**: Backups are provided as compressed tar.gz files

### Using the Download URL[​](#using-the-download-url 'Direct link to Using the Download URL')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
# Download using curl
curl -L "https://s3.amazonaws.com/backups/..." -o backup.tar.gz

# Download using wget
wget "https://s3.amazonaws.com/backups/..." -O backup.tar.gz

```

### Error Responses[​](#error-responses-1 'Direct link to Error Responses')

**Backup Not Ready (400)**

```
{
  "errors": [
    {
      "code": "BackupNotCompletedException",
      "status": "400",
      "detail": "This backup has not completed yet and cannot be downloaded."
    }
  ]
}

```

**Backup Failed (400)**

```
{
  "errors": [
    {
      "code": "BackupFailedException",
      "status": "400",
      "detail": "This backup failed and cannot be downloaded."
    }
  ]
}

```

---

## Delete Backup[​](#delete-backup 'Direct link to Delete Backup')

Permanently delete a backup file.

**`DELETE /api/client/servers/{server}/backups/{backup}`**

### URL Parameters[​](#url-parameters-3 'Direct link to URL Parameters')

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| server    | string | Server identifier (UUID or short ID) |
| backup    | string | Backup UUID                          |

### Example Request[​](#example-request-4 'Direct link to Example Request')

```
curl -X DELETE "https://your-panel.com/api/client/servers/d3aac109/backups/c3948f1a-67b2-4d89-8c45-a1b2c3d4e5f6" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json"

```

### Success Response (204)

[​](#success-response-204 'Direct link to Success Response (204)')

Returns empty response body with status code 204.

Warning

Backup deletion is **permanent and irreversible**. Deleted backups cannot be recovered.

### Error Responses[​](#error-responses-2 'Direct link to Error Responses')

**Backup Locked (400)**

```
{
  "errors": [
    {
      "code": "BackupIsLockedException",
      "status": "400",
      "detail": "This backup is locked and cannot be deleted."
    }
  ]
}

```

**Backup In Progress (409)**

```
{
  "errors": [
    {
      "code": "ConflictingServerStateException",
      "status": "409",
      "detail": "Cannot delete backup while it is being created."
    }
  ]
}

```

---

## Restore Backup[​](#restore-backup 'Direct link to Restore Backup')

Restore a server from a backup file. This operation will replace all current server files.

**`POST /api/client/servers/{server}/backups/{backup}/restore`**

### URL Parameters[​](#url-parameters-4 'Direct link to URL Parameters')

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| server    | string | Server identifier (UUID or short ID) |
| backup    | string | Backup UUID                          |

### Request Body[​](#request-body-1 'Direct link to Request Body')

| Field    | Type    | Required | Description                                                     |
| -------- | ------- | -------- | --------------------------------------------------------------- |
| truncate | boolean | No       | Whether to delete existing files before restore (default: true) |

### Example Request[​](#example-request-5 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/backups/a4962fe6-90c8-4b89-ba62-a5d3b06426c0/restore" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "truncate": true
  }'

```

### Success Response (202)

[​](#success-response-202 'Direct link to Success Response (202)')

Returns empty response body with status code 202 (Accepted).

Important

Backup restoration will **permanently replace all server files** with the backup contents. Make sure to create a backup of the current state if needed.

### Restore Process[​](#restore-process 'Direct link to Restore Process')

1.  **Server Stop**: Server is automatically stopped if running
2.  **File Cleanup**: Existing files are deleted (if truncate=true)
3.  **Extraction**: Backup files are extracted to server directory
4.  **Completion**: Server is ready to be started

### Error Responses[​](#error-responses-3 'Direct link to Error Responses')

**Backup Not Ready (400)**

```
{
  "errors": [
    {
      "code": "BackupNotCompletedException",
      "status": "400",
      "detail": "This backup has not completed yet and cannot be restored."
    }
  ]
}

```

**Server Installing (409)**

```
{
  "errors": [
    {
      "code": "ConflictingServerStateException",
      "status": "409",
      "detail": "Cannot restore backup while server is installing."
    }
  ]
}

```

---

## Toggle Backup Lock[​](#toggle-backup-lock 'Direct link to Toggle Backup Lock')

Toggle backup lock status to prevent accidental deletion. This endpoint toggles the current lock state.

**`POST /api/client/servers/{server}/backups/{backup}/lock`**

### URL Parameters[​](#url-parameters-5 'Direct link to URL Parameters')

| Parameter | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| server    | string | Server identifier (UUID or short ID) |
| backup    | string | Backup UUID                          |

### Example Request[​](#example-request-6 'Direct link to Example Request')

- cURL
- JavaScript
- Python
- PHP
- Go
- Java
- C#
- Ruby

```
# Toggle lock status (lock if unlocked, unlock if locked)
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/backups/a4962fe6-90c8-4b89-ba62-a5d3b06426c0/lock" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json"

```

### Success Response (204)

[​](#success-response-204-1 'Direct link to Success Response (204)')

Returns empty response body with status code 204.

---

## Backup Best Practices[​](#backup-best-practices 'Direct link to Backup Best Practices')

### Scheduling Backups[​](#scheduling-backups 'Direct link to Scheduling Backups')

- **Regular intervals**: Create backups on a consistent schedule
- **Before updates**: Always backup before major changes
- **Multiple retention**: Keep multiple backup generations
- **Verify integrity**: Periodically test backup restoration

### File Management[​](#file-management 'Direct link to File Management')

- **Exclude unnecessary files**: Use ignored patterns for logs, cache, temporary files
- **Optimize size**: Regularly clean up large unnecessary files
- **Monitor space**: Track backup storage usage and limits

### Security[​](#security 'Direct link to Security')

- **Lock important backups**: Prevent accidental deletion of critical backups
- **Access control**: Limit backup access to authorized users only
- **Encryption**: Ensure backups are encrypted during storage and transfer

### Performance[​](#performance 'Direct link to Performance')

- **Off-peak hours**: Schedule automated backups during low usage periods
- **Resource monitoring**: Monitor server performance during backup creation
- **Storage location**: Use appropriate storage backends for performance

---

## Backup Limits and Storage[​](#backup-limits-and-storage 'Direct link to Backup Limits and Storage')

### Default Limits[​](#default-limits 'Direct link to Default Limits')

| Resource            | Default Limit | Description            |
| ------------------- | ------------- | ---------------------- |
| Backups per server  | 5-20          | Varies by hosting plan |
| Maximum backup size | 10GB          | Per backup file        |
| Backup retention    | 30-90 days    | Automatic cleanup      |
| Concurrent backups  | 1             | Per server             |

### Storage Backends[​](#storage-backends 'Direct link to Storage Backends')

| Backend       | Features                         | Performance                         |
| ------------- | -------------------------------- | ----------------------------------- |
| Local Storage | Fast creation, limited space     | High speed, low retention           |
| S3 Compatible | Large capacity, longer retention | Moderate speed, high retention      |
| Google Cloud  | Enterprise features, encryption  | Moderate speed, enterprise features |

### Backup Lifecycle[​](#backup-lifecycle 'Direct link to Backup Lifecycle')

1.  **Creation**: Backup is queued and processed
2.  **Storage**: Backup is stored in configured backend
3.  **Retention**: Backup is kept according to retention policy
4.  **Cleanup**: Old backups are automatically deleted

---

## Common Error Codes[​](#common-error-codes 'Direct link to Common Error Codes')

| Status | Code                             | Description                     |
| ------ | -------------------------------- | ------------------------------- |
| 400    | TooManyBackupsException          | Backup limit reached            |
| 400    | BackupNotCompletedException      | Backup not ready for operation  |
| 400    | BackupFailedException            | Backup creation failed          |
| 400    | BackupIsLockedException          | Backup is locked from deletion  |
| 401    | InvalidCredentialsException      | Invalid API key                 |
| 403    | InsufficientPermissionsException | Missing required permissions    |
| 404    | NotFoundHttpException            | Backup not found                |
| 409    | ConflictingServerStateException  | Server state prevents operation |
| 507    | InsufficientStorageException     | Not enough storage space        |

## Required Permissions[​](#required-permissions 'Direct link to Required Permissions')

Backup operations require specific permissions:

| Permission      | Description                  |
| --------------- | ---------------------------- |
| backup.read     | View backup list and details |
| backup.create   | Create new backups           |
| backup.download | Download backup files        |
| backup.delete   | Delete backups               |
| backup.restore  | Restore from backups         |

## Monitoring Backup Status[​](#monitoring-backup-status 'Direct link to Monitoring Backup Status')

### Backup States[​](#backup-states 'Direct link to Backup States')

| State     | Description        | Actions Available                      |
| --------- | ------------------ | -------------------------------------- |
| creating  | Backup in progress | View details only                      |
| completed | Backup successful  | Download, delete, restore, lock/unlock |
| failed    | Backup failed      | View details, delete                   |

### Checking Progress[​](#checking-progress 'Direct link to Checking Progress')

Monitor backup creation progress by polling the backup details endpoint. The `completed_at` field will be null until the backup finishes.

## Source References[​](#source-references 'Direct link to Source References')

**Controller**: [`BackupController`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Http/Controllers/Api/Client/Servers/BackupController.php)  
**Routes**: [`api-client.php`](https://github.com/pterodactyl/panel/blob/1.0-develop/routes/api-client.php) - Backup endpoints  
**Backup Model**: [`Backup.php`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Models/Backup.php)  
**Backup Service**: [`BackupService`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Services/Backups/BackupService.php)  
**Wings Integration**: [Wings Server Code](https://github.com/pterodactyl/wings/tree/develop/server) - Backup creation

## Next Steps[​](#next-steps 'Direct link to Next Steps')

- Explore [Scheduled Tasks](https://pterodactyl-api-docs.netvpx.com/docs/api/client/schedules) for automated backup creation
- Check [File Management](https://pterodactyl-api-docs.netvpx.com/docs/api/client/files) for manual file operations
- Review [Server Management](https://pterodactyl-api-docs.netvpx.com/docs/api/client/servers) for server control during backups
