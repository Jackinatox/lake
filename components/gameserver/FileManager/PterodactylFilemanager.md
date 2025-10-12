# File Management | NETVPX Pterodactyl API Documentation
Manage server files and directories including listing, reading, uploading, downloading, and manipulating files.

List Directory Contents[​](#list-directory-contents "Direct link to List Directory Contents")
---------------------------------------------------------------------------------------------

Retrieve the contents of a server directory.

**`GET /api/client/servers/{server}/files/list`**

### Query Parameters[​](#query-parameters "Direct link to Query Parameters")


|Parameter|Type  |Description                        |
|---------|------|-----------------------------------|
|directory|string|Directory path to list (default: /)|


### Example Request[​](#example-request "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP

GET /api/client/servers/{server}/files/list

```
curl "https://your-panel.com/api/client/servers/d3aac109/files/list?directory=%2F" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json"

```


### Example Response[​](#example-response "Direct link to Example Response")

```
{
  "object": "list",
  "data": [
    {
      "object": "file_object",
      "attributes": {
        "name": "server.jar",
        "mode": "-rw-r--r--",
        "mode_bits": "644",
        "size": 47698923,
        "is_file": true,
        "is_symlink": false,
        "mimetype": "application/java-archive",
        "created_at": "2024-01-15T14:30:25+00:00",
        "modified_at": "2024-01-15T14:30:25+00:00"
      }
    },
    {
      "object": "file_object",
      "attributes": {
        "name": "logs",
        "mode": "drwxr-xr-x",
        "mode_bits": "755",
        "size": 4096,
        "is_file": false,
        "is_symlink": false,
        "mimetype": "inode/directory",
        "created_at": "2024-01-15T14:30:25+00:00",
        "modified_at": "2024-01-15T14:30:25+00:00"
      }
    },
    {
      "object": "file_object",
      "attributes": {
        "name": "world",
        "mode": "drwxr-xr-x",
        "mode_bits": "755",
        "size": 4096,
        "is_file": false,
        "is_symlink": false,
        "mimetype": "inode/directory",
        "created_at": "2024-01-15T14:30:25+00:00",
        "modified_at": "2024-01-15T14:30:25+00:00"
      }
    }
  ]
}

```


* * *

Read File Contents[​](#read-file-contents "Direct link to Read File Contents")
------------------------------------------------------------------------------

Read the contents of a specific file.

**`GET /api/client/servers/{server}/files/contents`**

### Query Parameters[​](#query-parameters-1 "Direct link to Query Parameters")


|Parameter|Type  |Description             |
|---------|------|------------------------|
|file     |string|Path to the file to read|


### Example Request[​](#example-request-1 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP

GET /api/client/servers/{server}/files/contents

```
curl "https://your-panel.com/api/client/servers/d3aac109/files/contents?file=%2Fserver.properties" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json"

```


### Example Response (Plain Text)
[​](#example-response-plain-text "Direct link to Example Response (Plain Text)")

```
# Minecraft server properties
server-port=25565
gamemode=survival
max-players=20
online-mode=true
difficulty=normal
spawn-protection=16
white-list=false
generate-structures=true
allow-flight=false

```


* * *

Write File Contents[​](#write-file-contents "Direct link to Write File Contents")
---------------------------------------------------------------------------------

Create or update a file with new content.

**`POST /api/client/servers/{server}/files/write`**

### Query Parameters[​](#query-parameters-2 "Direct link to Query Parameters")


|Parameter|Type  |Description              |
|---------|------|-------------------------|
|file     |string|Path to the file to write|


### Request Body[​](#request-body "Direct link to Request Body")

Send the file content as raw text in the request body.

### Example Request[​](#example-request-2 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP

POST /api/client/servers/{server}/files/write

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/write?file=%2Fserver.properties" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: text/plain" \
-d "# Minecraft server properties
server-port=25565
gamemode=survival
max-players=30
online-mode=true
difficulty=hard"

```


### Success Response (204)
[​](#success-response-204 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

* * *

Upload Files[​](#upload-files "Direct link to Upload Files")
------------------------------------------------------------

Upload files to the server using a two-step process: first get a signed upload URL, then upload the file.

### How File Upload Works[​](#how-file-upload-works "Direct link to How File Upload Works")

The Pterodactyl file upload system uses a secure two-step process:

1.  **Get Upload URL**: Request a signed upload URL from the API (`GET /api/client/servers/{server}/files/upload`)
2.  **Upload File**: Use the signed URL to upload your file(s) via multipart form data

This approach ensures secure file uploads without exposing server credentials and allows the panel to validate permissions before accepting files.

### Step 1: Get Upload URL[​](#step-1-get-upload-url "Direct link to Step 1: Get Upload URL")

**`GET /api/client/servers/{server}/files/upload`**

#### Query Parameters[​](#query-parameters-3 "Direct link to Query Parameters")


|Parameter|Type  |Required|Description                             |
|---------|------|--------|----------------------------------------|
|directory|string|No      |Target directory for upload (default: /)|


#### Example Response[​](#example-response-1 "Direct link to Example Response")

```
{
  "object": "signed_url",
  "attributes": {
    "url": "https://your-panel.com/upload/signed/abc123..."
  }
}

```


### Step 2: Upload File to Signed URL[​](#step-2-upload-file-to-signed-url "Direct link to Step 2: Upload File to Signed URL")

**`POST {signed_url}`**

Use the signed URL from Step 1 to upload your file(s).

#### Form Data Parameters[​](#form-data-parameters "Direct link to Form Data Parameters")


|Parameter|Type  |Required|Description                             |
|---------|------|--------|----------------------------------------|
|files    |file  |Yes     |File to upload (use files as field name)|
|directory|string|Yes     |Target directory (must match Step 1)    |


### Complete Example[​](#complete-example "Direct link to Complete Example")

*   cURL
*   JavaScript
*   Python
*   PHP
*   Go
*   Java
*   C#
*   Ruby

GET + POST /api/client/servers/{server}/files/upload

```
# Step 1: Get signed upload URL
signed_url=$(curl -s \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
"https://your-panel.com/api/client/servers/d3aac109/files/upload?directory=%2F" \
| jq -r '.attributes.url')

# Step 2: Upload file to signed URL
curl -X POST "$signed_url" \
-F "files=@/path/to/local/file.txt" \
-F "directory=/"

```


### Upload Limits[​](#upload-limits "Direct link to Upload Limits")


|Limit                    |Value                            |
|-------------------------|---------------------------------|
|Maximum file size        |100 MB per file                  |
|Maximum files per request|10 files                         |
|Allowed file types       |All types (configurable by admin)|


### Multiple File Upload Example[​](#multiple-file-upload-example "Direct link to Multiple File Upload Example")

*   cURL
*   JavaScript
*   Python
*   PHP

Multiple Files /api/client/servers/{server}/files/upload

```
# Step 1: Get signed upload URL (same as single file)
signed_url=$(curl -s \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
"https://your-panel.com/api/client/servers/d3aac109/files/upload?directory=%2F" \
| jq -r '.attributes.url')

# Step 2: Upload multiple files to signed URL
curl -X POST "$signed_url" \
-F "files=@/path/to/file1.txt" \
-F "files=@/path/to/file2.log" \
-F "files=@/path/to/config.yml" \
-F "directory=/"

```


### Important Notes[​](#important-notes "Direct link to Important Notes")

*   **Signed URL Validity**: The signed URL is valid for 15 minutes (verified from source code)
*   **Directory Parameter**: Must be URL-encoded when used in the query string
*   **Form Field Name**: Must use `files` as the field name for each file
*   **Multiple Files**: Supported by adding multiple `files` fields in the form data
*   **Folder Uploads**: **NOT SUPPORTED** - Pterodactyl does not support uploading entire folders. You must upload individual files
*   **File Permissions**: Uploaded files are created with 0644 permissions (read/write for owner, read-only for others)

* * *

Download File[​](#download-file "Direct link to Download File")
---------------------------------------------------------------

Download a file from the server.

**`GET /api/client/servers/{server}/files/download`**

### Query Parameters[​](#query-parameters-4 "Direct link to Query Parameters")


|Parameter|Type  |Description                 |
|---------|------|----------------------------|
|file     |string|Path to the file to download|


### Example Request[​](#example-request-3 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP

GET /api/client/servers/{server}/files/download

```
curl "https://your-panel.com/api/client/servers/d3aac109/files/download?file=%2Fbackups%2Fworld.zip" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-o "world.zip"

```


* * *

Create Directory[​](#create-directory "Direct link to Create Directory")
------------------------------------------------------------------------

Create a new directory on the server.

**`POST /api/client/servers/{server}/files/create-folder`**

### Request Body[​](#request-body-1 "Direct link to Request Body")


|Field|Type  |Required|Description             |
|-----|------|--------|------------------------|
|root |string|Yes     |Parent directory path   |
|name |string|Yes     |Directory name to create|


### Example Request[​](#example-request-4 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/create-folder" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "root": "/",
    "name": "plugins"
  }'

```


### Success Response (204)
[​](#success-response-204-1 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

* * *

Copy Files[​](#copy-files "Direct link to Copy Files")
------------------------------------------------------

Copy files or directories to a new location.

**`POST /api/client/servers/{server}/files/copy`**

### Request Body[​](#request-body-2 "Direct link to Request Body")


|Field   |Type  |Required|Description               |
|--------|------|--------|--------------------------|
|location|string|Yes     |Source file/directory path|


### Example Request[​](#example-request-5 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/copy" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "/world"
  }'

```


Creates a copy of the file/directory with "\_copy" appended to the name.

### Success Response (204)
[​](#success-response-204-2 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

* * *

Rename Files[​](#rename-files "Direct link to Rename Files")
------------------------------------------------------------

Rename or move files and directories.

**`PUT /api/client/servers/{server}/files/rename`**

### Request Body[​](#request-body-3 "Direct link to Request Body")


|Field|Type  |Required|Description               |
|-----|------|--------|--------------------------|
|root |string|Yes     |Parent directory          |
|files|array |Yes     |Array of rename operations|


### Files Array Structure[​](#files-array-structure "Direct link to Files Array Structure")


|Field|Type  |Required|Description     |
|-----|------|--------|----------------|
|from |string|Yes     |Current filename|
|to   |string|Yes     |New filename    |


### Example Request[​](#example-request-6 "Direct link to Example Request")

```
curl -X PUT "https://your-panel.com/api/client/servers/d3aac109/files/rename" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "root": "/",
    "files": [
      {
        "from": "old_name.txt",
        "to": "new_name.txt"
      }
    ]
  }'

```


### Success Response (204)
[​](#success-response-204-3 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

* * *

Delete Files[​](#delete-files "Direct link to Delete Files")
------------------------------------------------------------

Delete files or directories from the server.

**`POST /api/client/servers/{server}/files/delete`**

### Request Body[​](#request-body-4 "Direct link to Request Body")


|Field|Type  |Required|Description                 |
|-----|------|--------|----------------------------|
|root |string|Yes     |Parent directory            |
|files|array |Yes     |Array of filenames to delete|


### Example Request[​](#example-request-7 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/delete" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "root": "/",
    "files": [
      "unnecessary_file.txt",
      "old_backup.zip"
    ]
  }'

```


### Success Response (204)
[​](#success-response-204-4 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

Permanent Deletion

File deletion is permanent and cannot be undone. Always ensure you have backups before deleting important files.

* * *

Compress Files[​](#compress-files "Direct link to Compress Files")
------------------------------------------------------------------

Create an archive (ZIP/TAR) from files and directories.

**`POST /api/client/servers/{server}/files/compress`**

### Request Body[​](#request-body-5 "Direct link to Request Body")


|Field|Type  |Required|Description                  |
|-----|------|--------|-----------------------------|
|root |string|Yes     |Root directory               |
|files|array |Yes     |Files/directories to compress|


### Example Request[​](#example-request-8 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/compress" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "root": "/",
    "files": [
      "world",
      "plugins"
    ]
  }'

```


### Example Response[​](#example-response-2 "Direct link to Example Response")

```
{
  "object": "file_object",
  "attributes": {
    "name": "archive-2024-01-15-143025.tar.gz",
    "mode": "-rw-r--r--",
    "mode_bits": "0644",
    "size": 125829120,
    "is_file": true,
    "is_symlink": false,
    "mimetype": "application/gzip",
    "created_at": "2024-01-15T14:30:25+00:00",
    "modified_at": "2024-01-15T14:30:25+00:00"
  }
}

```


* * *

Decompress Files[​](#decompress-files "Direct link to Decompress Files")
------------------------------------------------------------------------

Extract files from an archive.

**`POST /api/client/servers/{server}/files/decompress`**

### Request Body[​](#request-body-6 "Direct link to Request Body")


|Field|Type  |Required|Description                     |
|-----|------|--------|--------------------------------|
|root |string|Yes     |Directory containing the archive|
|file |string|Yes     |Archive filename                |


### Example Request[​](#example-request-9 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/decompress" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "root": "/",
    "file": "backup.zip"
  }'

```


### Success Response (204)
[​](#success-response-204-5 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

### Supported Archive Types[​](#supported-archive-types "Direct link to Supported Archive Types")


|Extension|Format   |Description         |
|---------|---------|--------------------|
|.zip     |ZIP      |Most common format  |
|.tar     |TAR      |Uncompressed tarball|
|.tar.gz  |TAR+GZIP |Compressed tarball  |
|.tar.bz2 |TAR+BZIP2|Compressed tarball  |


* * *

Change File Permissions[​](#change-file-permissions "Direct link to Change File Permissions")
---------------------------------------------------------------------------------------------

Modify file or directory permissions (chmod).

**`POST /api/client/servers/{server}/files/chmod`**

### Request Body[​](#request-body-7 "Direct link to Request Body")


|Field|Type  |Required|Description                |
|-----|------|--------|---------------------------|
|root |string|Yes     |Parent directory           |
|files|array |Yes     |Array of permission changes|


### Files Array Structure[​](#files-array-structure-1 "Direct link to Files Array Structure")


|Field|Type  |Required|Description                               |
|-----|------|--------|------------------------------------------|
|file |string|Yes     |Filename                                  |
|mode |string|Yes     |Octal permission mode (e.g., "755", "644")|


### Example Request[​](#example-request-10 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/chmod" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "root": "/",
    "files": [
      {
        "file": "start.sh",
        "mode": "755"
      },
      {
        "file": "config.yml",
        "mode": "644"
      }
    ]
  }'

```


### Success Response (204)
[​](#success-response-204-6 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

### Common Permission Modes[​](#common-permission-modes "Direct link to Common Permission Modes")


|Mode|Description|Symbolic                                      |
|----|-----------|----------------------------------------------|
|755 |rwxr-xr-x  |Full access for owner, read+execute for others|
|644 |rw-r--r--  |Read+write for owner, read-only for others    |
|600 |rw-------  |Read+write for owner only                     |
|777 |rwxrwxrwx  |Full access for everyone (not recommended)    |


* * *

Pull Remote File[​](#pull-remote-file "Direct link to Pull Remote File")
------------------------------------------------------------------------

Download a file from a URL directly to the server.

**`POST /api/client/servers/{server}/files/pull`**

### Request Body[​](#request-body-8 "Direct link to Request Body")


|Field    |Type  |Required|Description                |
|---------|------|--------|---------------------------|
|url      |string|Yes     |URL of the file to download|
|directory|string|Yes     |Directory to save the file |
|filename |string|No      |Custom filename (optional) |


### Example Request[​](#example-request-11 "Direct link to Example Request")

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/pull" \
  -H "Authorization: Bearer ptlc_YOUR_API_KEY" \
  -H "Accept: Application/vnd.pterodactyl.v1+json" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://piston-data.mojang.com/v1/objects/8dd1a28015f51b1803213892b50b7b4fc76e594d/server.jar",
    "directory": "/",
    "filename": "server.jar"
  }'

```


### Success Response (204)
[​](#success-response-204-7 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

### Remote Pull Limitations[​](#remote-pull-limitations "Direct link to Remote Pull Limitations")

*   Maximum file size: 1 GB
*   Timeout: 5 minutes
*   Only HTTP/HTTPS URLs allowed
*   Some panel configurations may restrict certain domains

* * *

Rename File[​](#rename-file "Direct link to Rename File")
---------------------------------------------------------

Rename a file or directory on the server.

**`PUT /api/client/servers/{server}/files/rename`**

### Request Body[​](#request-body-9 "Direct link to Request Body")


|Field|Type  |Required|Description                       |
|-----|------|--------|----------------------------------|
|root |string|Yes     |Directory containing the file     |
|files|array |Yes     |Array containing old and new names|


### Example Request[​](#example-request-12 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP
*   Go
*   Java
*   C#
*   Ruby

PUT /api/client/servers/{server}/files/rename

```
curl -X PUT "https://your-panel.com/api/client/servers/d3aac109/files/rename" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json" \
-d '{
  "root": "/",
  "files": [
    {
      "from": "old-name.txt",
      "to": "new-name.txt"
    }
  ]
}'

```


### Success Response (204)
[​](#success-response-204-8 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

* * *

Copy File[​](#copy-file "Direct link to Copy File")
---------------------------------------------------

Copy files to another location on the server.

**`POST /api/client/servers/{server}/files/copy`**

### Request Body[​](#request-body-10 "Direct link to Request Body")


|Field   |Type  |Required|Description     |
|--------|------|--------|----------------|
|location|string|Yes     |Source file path|


### Example Request[​](#example-request-13 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP
*   Go
*   Java
*   C#
*   Ruby

POST /api/client/servers/{server}/files/copy

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/copy" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json" \
-d '{
  "location": "/config.yml"
}'

```


### Success Response (204)
[​](#success-response-204-9 "Direct link to Success Response (204)")

Returns empty response body with status code 204. The file will be copied with "\_copy" appended to the filename.

* * *

Delete Files[​](#delete-files-1 "Direct link to Delete Files")
--------------------------------------------------------------

Delete one or more files or directories.

**`POST /api/client/servers/{server}/files/delete`**

### Request Body[​](#request-body-11 "Direct link to Request Body")


|Field|Type  |Required|Description                         |
|-----|------|--------|------------------------------------|
|root |string|Yes     |Base directory path                 |
|files|array |Yes     |Array of files/directories to delete|


### Example Request[​](#example-request-14 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP
*   Go
*   Java
*   C#
*   Ruby

POST /api/client/servers/{server}/files/delete

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/delete" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json" \
-d '{
  "root": "/",
  "files": ["old-file.txt", "temp-folder"]
}'

```


### Success Response (204)
[​](#success-response-204-10 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

Important

Deleted files cannot be recovered. Always create backups before deleting important files.

* * *

Create Folder[​](#create-folder "Direct link to Create Folder")
---------------------------------------------------------------

Create a new directory on the server.

**`POST /api/client/servers/{server}/files/create-folder`**

### Request Body[​](#request-body-12 "Direct link to Request Body")


|Field|Type  |Required|Description           |
|-----|------|--------|----------------------|
|root |string|Yes     |Parent directory path |
|name |string|Yes     |Name of the new folder|


### Example Request[​](#example-request-15 "Direct link to Example Request")

*   cURL
*   JavaScript
*   Python
*   PHP
*   Go
*   Java
*   C#
*   Ruby

POST /api/client/servers/{server}/files/create-folder

```
curl -X POST "https://your-panel.com/api/client/servers/d3aac109/files/create-folder" \
-H "Authorization: Bearer ptlc_YOUR_API_KEY" \
-H "Accept: Application/vnd.pterodactyl.v1+json" \
-H "Content-Type: application/json" \
-d '{
  "root": "/",
  "name": "new-folder"
}'

```


### Success Response (204)
[​](#success-response-204-11 "Direct link to Success Response (204)")

Returns empty response body with status code 204.

* * *

Required Permissions[​](#required-permissions "Direct link to Required Permissions")
------------------------------------------------------------------------------------


|Permission       |Description                              |
|-----------------|-----------------------------------------|
|file.read        |View file contents and directory listings|
|file.read-content|Read individual file contents            |
|file.create      |Create new files and directories         |
|file.update      |Modify existing files                    |
|file.delete      |Delete files and directories             |
|file.archive     |Create and extract archives              |
|file.sftp        |Access files via SFTP                    |


Security Best Practices[​](#security-best-practices "Direct link to Security Best Practices")
---------------------------------------------------------------------------------------------

1.  **File Size Limits**: Be aware of upload and download limits
2.  **Path Traversal**: The API prevents access outside the server directory
3.  **File Types**: Some file extensions may be restricted by server configuration
4.  **Permissions**: Always use the minimum required file permissions
5.  **Backups**: Create backups before making bulk changes

Source References[​](#source-references "Direct link to Source References")
---------------------------------------------------------------------------

**Controller**: [`FileController`](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Http/Controllers/Api/Client/Servers/FileController.php)  
**Routes**: [`api-client.php`](https://github.com/pterodactyl/panel/blob/1.0-develop/routes/api-client.php) - File management endpoints  
**Wings Integration**: [Wings Server Code](https://github.com/pterodactyl/wings/tree/develop/server) - File operations

Next Steps[​](#next-steps "Direct link to Next Steps")
------------------------------------------------------

*   Learn about [Database Management](https://pterodactyl-api-docs.netvpx.com/docs/api/client/databases) for server databases
*   Explore [Backup Management](https://pterodactyl-api-docs.netvpx.com/docs/api/client/backups) for automated backups
*   Check [Scheduled Tasks](https://pterodactyl-api-docs.netvpx.com/docs/api/client/schedules) for automated file operations