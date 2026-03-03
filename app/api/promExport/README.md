# Lake Prometheus Metrics

Endpoint: `GET /api/promExport`  
Protected by the reverse proxy — only accessible locally.

Add to `prometheus.yml`:

```yaml
scrape_configs:
    - job_name: lake
      static_configs:
          - targets: ['localhost:3000']
      metrics_path: /api/promExport
      scrape_interval: 30s
```

---

## Metrics Reference

### Metadata

| Metric                    | Labels | Description                                       |
| ------------------------- | ------ | ------------------------------------------------- |
| `scrape_duration_seconds` | —      | How long the sscrape took(should be around 200ms) |

### Users

| Metric                                | Labels                    | Description                            |
| ------------------------------------- | ------------------------- | -------------------------------------- |
| `lake_users_total`                    | —                         | Total registered users                 |
| `lake_users_banned_total`             | —                         | Currently banned users                 |
| `lake_users_new_total`                | `window` (24h / 7d / 30d) | New signups per rolling window         |
| `lake_users_twofactor_enabled_total`  | —                         | Users with 2FA enabled                 |
| `lake_users_email_verified_total`     | —                         | Users with verified email              |
| `lake_users_with_active_server_total` | —                         | Distinct users owning an active server |
| `lake_active_sessions_total`          | —                         | Non-expired sessions                   |

### Game Servers

| Metric                                  | Labels             | Description                                  |
| --------------------------------------- | ------------------ | -------------------------------------------- |
| `lake_game_servers_total`               | `status`           | Server count by status (ACTIVE, EXPIRED, …)  |
| `lake_game_servers_by_type_total`       | `type`             | Server count by type (CUSTOM, PACKAGE, FREE) |
| `lake_game_servers_by_game_total`       | `game_id`          | Active servers per game                      |
| `lake_game_servers_by_location_total`   | `location_id`      | Active servers per location                  |
| `lake_game_servers_expiring_soon_total` | `window` (1d / 7d) | Servers expiring within window               |

### Resource Allocation

| Metric                                   | Labels        | Description                                 |
| ---------------------------------------- | ------------- | ------------------------------------------- |
| `lake_total_given_cpu_percent`           | —             | Total CPU % allocated (active servers)      |
| `lake_total_given_memory_mb`             | —             | Total RAM allocated in MB (active servers)  |
| `lake_total_given_disk_mb`               | —             | Total disk allocated in MB (active servers) |
| `lake_resources_by_location_cpu_percent` | `location_id` | CPU % per location                          |
| `lake_resources_by_location_ram_mb`      | `location_id` | RAM per location                            |
| `lake_resources_by_location_disk_mb`     | `location_id` | Disk per location                           |

### Orders & Revenue

| Metric                            | Labels                    | Description                                  |
| --------------------------------- | ------------------------- | -------------------------------------------- |
| `lake_orders_total`               | `status`                  | Orders by status                             |
| `lake_orders_by_type_total`       | `type`                    | Orders by type (NEW, RENEW, UPGRADE, …)      |
| `lake_orders_revenue_cents_total` | —                         | All-time revenue from PAID orders (cents)    |
| `lake_orders_revenue_cents`       | `window` (24h / 7d / 30d) | Revenue per rolling window (cents)           |
| `lake_net_revenue_cents_total`    | —                         | Paid revenue minus succeeded refunds (cents) |
| `lake_orders_avg_value_cents`     | —                         | Average PAID order value (cents)             |
| `lake_orders_pending_total`       | —                         | Checkouts started but not yet paid           |
| `lake_orders_created_24h_total`   | —                         | Orders created in last 24 h                  |

### Refunds

| Metric                            | Labels   | Description                   |
| --------------------------------- | -------- | ----------------------------- |
| `lake_refunds_total`              | `status` | Refunds by Stripe status      |
| `lake_refunds_amount_cents_total` | —        | Total refunded amount (cents) |

### Support Tickets

| Metric                                   | Labels     | Description                         |
| ---------------------------------------- | ---------- | ----------------------------------- |
| `lake_support_tickets_total`             | `status`   | Tickets by status (OPEN, CLOSED, …) |
| `lake_support_tickets_by_category_total` | `category` | Tickets by category                 |

### Emails

| Metric                         | Labels   | Description                              |
| ------------------------------ | -------- | ---------------------------------------- |
| `lake_emails_total`            | `status` | Emails by status (PENDING, SENT, FAILED) |
| `lake_emails_by_type_total`    | `type`   | Emails by type                           |
| `lake_emails_failed_24h_total` | —        | Failed emails in last 24 h               |

### Background Jobs

| Metric                               | Labels                | Description                                   |
| ------------------------------------ | --------------------- | --------------------------------------------- |
| `lake_job_runs_total`                | `workerJob`, `status` | Job run count by type and status              |
| `lake_job_last_run_duration_seconds` | `job_type`            | Duration of most recent completed run per job |
| `lake_job_last_items_processed`      | `job_type`            | Items processed in most recent run per job    |

### Application Logs

| Metric                            | Labels     | Description                                           |
| --------------------------------- | ---------- | ----------------------------------------------------- |
| `lake_app_logs_24h_total`         | `level`    | Log entries last 24 h by level (INFO, WARN, ERROR, …) |
| `lake_app_logs_24h_by_type_total` | `log_type` | Log entries last 24 h by domain (PAYMENT, AUTH, …)    |

---

## Suggested Grafana Dashboard Panels

### Overview row

- **Stat** — `lake_users_total` / `lake_users_new_total{window="7d"}` / `lake_active_sessions_total`
- **Stat** — `lake_game_servers_total{status="ACTIVE"}` / `lake_game_servers_expiring_soon_total{window="1d"}`
- **Stat** — `lake_net_revenue_cents_total / 100` (display as €)

### Revenue row

- **Time series** — `lake_orders_revenue_cents` with all three windows overlaid
- **Stat** — `lake_orders_avg_value_cents / 100`
- **Stat** — `lake_orders_pending_total` (high value = checkout drop-off)

### Servers row

- **Bar chart** — `lake_game_servers_total` grouped by `status`
- **Pie chart** — `lake_game_servers_by_game_total` grouped by `game_id`
- **Bar chart** — `lake_resources_by_location_cpu_percent` / `_ram_mb` grouped by `location_id`

### Health row

- **Stat (alert threshold)** — `lake_app_logs_24h_total{level="ERROR"}`
- **Stat (alert threshold)** — `lake_emails_failed_24h_total`
- **Table** — `lake_job_last_run_duration_seconds` across all job types
- **Bar chart** — `lake_support_tickets_total` grouped by `status`

### Tip: convert cents to euros in Grafana

Use a field override → **Unit** → `Currency / Euro (€)` and set **Scale** to `0.01`, or apply the transformation `lake_net_revenue_cents_total / 100` directly in the PromQL query.
