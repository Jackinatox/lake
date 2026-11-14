# Server ports (allocations)

A resource tier's `ports` is the number of ports a customer buys, and it becomes the server's
**Pterodactyl allocation limit** (`feature_limits.allocations`, which counts the primary port).
Players add ports themselves in the Network tab up to that limit. Lake stores the purchased
number in `GameServer.allocations`; the panel limit may be higher, never lower than the ports
in use.

## Data flow

- **Order:** `checkout.ts` copies `ResourceTier.ports` into `GameServerOrder.allocations`
  (free servers use the `free_tier_allocations` KeyValue).
- **Creation (worker):** `GameServer.allocations = order.allocations`. The panel limit is
  `max(order.allocations, ports the game needs)` (`allocationLimitFor` in the worker's
  `src/modules/pterodactyl/Ports/game-ports.ts`, which also holds the per-game port table).
- **Port setup (worker, `PterodactylPortService.configureServerPorts`):** runs on provisioning,
  game change and the user's "fix ports" button. It raises a limit that is too low for the
  game (`ensureAllocationLimit`) and never lowers one.
- **Upgrade (`lib/Pterodactyl/upgradeServer/upgradeServer.ts`) and refund revert
  (`lib/refund/undoRefundedOrder.ts`):** the DB gets the order's `allocations`, the panel gets
  `allocationLimitToKeep(order.allocations, assigned ports)` from
  `lib/Pterodactyl/allocationLimit.ts`. A lower limit would not remove ports, only block fixes.
- **Admin edit dialog (`updateGameServer`):** sets the DB value and the panel limit to exactly
  what the admin enters.

## Rules

- `null` limit in Pterodactyl = unlimited; nothing touches it.
- `PATCH /api/application/servers/{id}/build` replaces the whole build: always send the current
  memory/swap/disk/io/cpu/threads/oom and the other feature limits back unchanged.
- Lake does not know a game's required ports; only the worker does. Lake's floor is the number of
  ports already assigned.

## History

Before worker 1.10.1 every server was created with a panel limit of 2. Before worker 1.9.14
`GameServer.backupCount` was written as 0 (the panel limit was correct). The one-off scripts
`scripts/backfillAllocations.ts` and `scripts/backfillBackupCount.ts` repair existing rows; both
dry-run by default and need `--apply`.
