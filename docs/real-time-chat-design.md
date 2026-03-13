# Technical Design Document: Real-Time Chat Feature

| Field         | Value                          |
|---------------|--------------------------------|
| **Author**    | Engineering Team               |
| **Status**    | Draft                          |
| **Created**   | 2026-03-13                     |
| **Version**   | 1.0                            |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [System Architecture](#3-system-architecture)
4. [WebSocket Communication](#4-websocket-communication)
5. [Message Persistence in PostgreSQL](#5-message-persistence-in-postgresql)
6. [End-to-End Encryption](#6-end-to-end-encryption)
7. [Scalability for 10,000 Concurrent Users](#7-scalability-for-10000-concurrent-users)
8. [API Specification](#8-api-specification)
9. [Security Considerations](#9-security-considerations)
10. [Monitoring and Observability](#10-monitoring-and-observability)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Risks and Mitigations](#12-risks-and-mitigations)
13. [Future Considerations](#13-future-considerations)

---

## 1. Overview

This document describes the technical design for a real-time chat feature that enables instant messaging between users. The system uses WebSocket connections for low-latency bidirectional communication, persists messages in PostgreSQL for durability, supports 10,000 concurrent users, and provides end-to-end encryption (E2EE) to ensure message privacy.

### 1.1 Problem Statement

Users need a reliable, secure, and performant real-time messaging system. Messages must be delivered instantly, stored persistently, remain private through encryption, and the system must handle significant concurrent load.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Deliver messages in real time with sub-200ms latency under normal conditions
- Persist all messages durably in PostgreSQL
- Support at least 10,000 concurrent WebSocket connections
- Encrypt message content end-to-end so that only sender and recipient can read it
- Support both one-to-one and group chat conversations
- Provide message delivery acknowledgments (sent, delivered, read)

### 2.2 Non-Goals

- Voice or video calling (out of scope for this iteration)
- File/media sharing beyond text messages
- Federation with external chat systems
- Offline-first mobile client design

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Clients   │◄─────►│  Load Balancer   │◄─────►│  Chat Servers   │
│  (Browser/  │  WSS  │  (nginx/HAProxy) │       │  (Node.js)      │
│   Mobile)   │       │                  │       │                 │
└─────────────┘       └──────────────────┘       └────────┬────────┘
                                                          │
                                           ┌──────────────┼──────────────┐
                                           │              │              │
                                    ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
                                    │   Redis     │ │ PostgreSQL│ │  Key      │
                                    │  (Pub/Sub   │ │ (Message  │ │  Server   │
                                    │   + Cache)  │ │  Storage) │ │  (E2EE)   │
                                    └─────────────┘ └───────────┘ └───────────┘
```

### 3.2 Component Overview

| Component        | Technology       | Purpose                                          |
|------------------|------------------|--------------------------------------------------|
| Chat Server      | Node.js + ws     | Handle WebSocket connections and message routing  |
| Load Balancer    | nginx / HAProxy  | Distribute connections with sticky sessions       |
| Message Broker   | Redis Pub/Sub    | Cross-server message fanout                       |
| Database         | PostgreSQL 16    | Durable message and conversation storage          |
| Cache            | Redis            | Session state, presence, and recent message cache |
| Key Server       | Custom service   | Public key distribution for E2EE                  |

### 3.3 Data Flow

1. Client establishes a WebSocket connection to a chat server via the load balancer.
2. Client authenticates using a JWT token over the WebSocket handshake.
3. When a user sends a message, the client encrypts it locally using the recipient's public key.
4. The encrypted message is sent over the WebSocket to the chat server.
5. The chat server persists the encrypted message to PostgreSQL.
6. The chat server publishes the message to Redis Pub/Sub for the recipient's channel.
7. The chat server instance holding the recipient's connection delivers the message.
8. The recipient's client decrypts the message using their private key.

---

## 4. WebSocket Communication

### 4.1 Connection Lifecycle

```
Client                          Server
  │                                │
  │──── HTTP Upgrade Request ─────►│  (includes JWT in header)
  │◄─── 101 Switching Protocols ──│  (connection established)
  │                                │
  │──── ping ─────────────────────►│  (every 30s heartbeat)
  │◄─── pong ─────────────────────│
  │                                │
  │──── message ──────────────────►│  (encrypted payload)
  │◄─── ack ──────────────────────│  (delivery confirmation)
  │                                │
  │◄─── message ──────────────────│  (incoming message)
  │──── ack ──────────────────────►│  (read receipt)
  │                                │
  │──── close ────────────────────►│  (graceful disconnect)
  │◄─── close ────────────────────│
  │                                │
```

### 4.2 Protocol Design

All WebSocket frames use JSON payloads. Each message includes a `type` field for routing.

#### Message Types

| Type              | Direction        | Description                          |
|-------------------|------------------|--------------------------------------|
| `auth`            | Client → Server  | Authenticate after connection        |
| `message.send`    | Client → Server  | Send an encrypted chat message       |
| `message.receive` | Server → Client  | Deliver an incoming message          |
| `message.ack`     | Bidirectional    | Acknowledge message delivery/read    |
| `typing.start`    | Client → Server  | User started typing                  |
| `typing.stop`     | Client → Server  | User stopped typing                  |
| `presence.update` | Server → Client  | User online/offline status change    |
| `error`           | Server → Client  | Error notification                   |
| `ping` / `pong`   | Bidirectional    | Heartbeat keepalive                  |

#### Example: Sending a Message

```json
{
  "type": "message.send",
  "id": "msg_a1b2c3d4",
  "conversationId": "conv_x7y8z9",
  "payload": {
    "ciphertext": "base64-encoded-encrypted-content",
    "nonce": "base64-encoded-nonce",
    "senderKeyId": "key_sender_01"
  },
  "timestamp": "2026-03-13T09:30:00.000Z"
}
```

#### Example: Receiving a Message

```json
{
  "type": "message.receive",
  "id": "msg_a1b2c3d4",
  "conversationId": "conv_x7y8z9",
  "senderId": "user_42",
  "payload": {
    "ciphertext": "base64-encoded-encrypted-content",
    "nonce": "base64-encoded-nonce",
    "senderKeyId": "key_sender_01"
  },
  "timestamp": "2026-03-13T09:30:00.000Z"
}
```

### 4.3 Connection Management

- **Heartbeat**: Clients send a `ping` frame every 30 seconds. The server responds with `pong`. Connections with no heartbeat for 90 seconds are terminated.
- **Reconnection**: Clients implement exponential backoff reconnection (1s, 2s, 4s, 8s, max 30s). On reconnect, clients send the timestamp of their last received message to fetch missed messages.
- **Sticky Sessions**: The load balancer uses IP-hash or cookie-based affinity to route reconnections to the same server when possible.

---

## 5. Message Persistence in PostgreSQL

### 5.1 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations (supports 1:1 and group)
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
    name            VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation membership
CREATE TABLE conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role            VARCHAR(10) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('admin', 'member')),
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages (stores encrypted content)
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciphertext      TEXT NOT NULL,
    nonce           VARCHAR(44) NOT NULL,
    sender_key_id   VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message delivery status
CREATE TABLE message_status (
    message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(10) NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent', 'delivered', 'read')),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- User public keys for E2EE
CREATE TABLE user_keys (
    id              VARCHAR(100) PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key      TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);
```

### 5.2 Indexes

```sql
-- Fast message lookup by conversation, ordered by time
CREATE INDEX idx_messages_conversation_created
    ON messages (conversation_id, created_at DESC);

-- Fast lookup of user's conversations
CREATE INDEX idx_conversation_members_user
    ON conversation_members (user_id);

-- Fast lookup of undelivered messages for a user
CREATE INDEX idx_message_status_user_pending
    ON message_status (user_id, status)
    WHERE status IN ('sent', 'delivered');

-- Active (non-revoked) keys per user
CREATE INDEX idx_user_keys_user_active
    ON user_keys (user_id)
    WHERE revoked_at IS NULL;
```

### 5.3 Partitioning Strategy

To handle growing message volume, the `messages` table is range-partitioned by `created_at` on a monthly basis:

```sql
CREATE TABLE messages (
    id              UUID NOT NULL DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id       UUID NOT NULL,
    ciphertext      TEXT NOT NULL,
    nonce           VARCHAR(44) NOT NULL,
    sender_key_id   VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Example partitions
CREATE TABLE messages_2026_03 PARTITION OF messages
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE messages_2026_04 PARTITION OF messages
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

Partition creation is automated via a scheduled job (e.g., `pg_partman` or a cron task) that creates partitions 3 months ahead and detaches partitions older than 12 months for archival.

### 5.4 Write Optimization

- **Batch Inserts**: Messages are buffered in-memory for up to 100ms or 50 messages (whichever comes first) and inserted in a single batch to reduce per-row overhead.
- **Connection Pooling**: Use PgBouncer in transaction mode with a pool of 50 connections shared across chat server instances.
- **Async Writes**: Message persistence is performed asynchronously after the message has been forwarded to Redis Pub/Sub, so delivery latency is not blocked by database writes. A write-ahead buffer in Redis ensures no message loss if the database write fails transiently.

---

## 6. End-to-End Encryption

### 6.1 Encryption Protocol Overview

The system uses a protocol inspired by the Signal Protocol for end-to-end encryption. The server never has access to plaintext message content.

```
┌──────────────┐                                    ┌──────────────┐
│   Sender     │                                    │  Recipient   │
│              │                                    │              │
│ 1. Generate  │                                    │              │
│    message   │                                    │              │
│ 2. Fetch     │──── Request recipient's ──────────►│              │
│    recipient │◄─── public key             ────────│              │
│    public key│                                    │              │
│ 3. Encrypt   │                                    │              │
│    with      │                                    │              │
│    recipient │                                    │              │
│    public key│                                    │              │
│ 4. Send      │──── Encrypted message ────────────►│ 5. Decrypt   │
│    encrypted │     (via server)                   │    with own  │
│    message   │                                    │    private   │
│              │                                    │    key       │
└──────────────┘                                    └──────────────┘
```

### 6.2 Key Management

| Aspect               | Design Decision                                                  |
|-----------------------|------------------------------------------------------------------|
| Key Algorithm         | X25519 for key exchange, XChaCha20-Poly1305 for symmetric encryption |
| Key Generation        | Client-side only; private keys never leave the device            |
| Key Storage (Client)  | Private keys stored in platform secure storage (Keychain/Keystore) |
| Key Storage (Server)  | Only public keys stored on the server in the `user_keys` table   |
| Key Rotation          | Users can rotate keys at any time; old keys retained for decrypting historical messages |
| Key Verification      | Users can compare key fingerprints (SHA-256 of public key) out-of-band |

### 6.3 Encryption Flow (Direct Messages)

1. **Key Exchange**: Sender retrieves the recipient's current public key from the key server.
2. **Shared Secret**: Sender performs X25519 Diffie-Hellman with their private key and the recipient's public key to derive a shared secret.
3. **Key Derivation**: HKDF-SHA256 derives a symmetric encryption key from the shared secret.
4. **Encryption**: Message plaintext is encrypted using XChaCha20-Poly1305 with a random 24-byte nonce.
5. **Transmission**: The ciphertext, nonce, and sender's key ID are sent via WebSocket.
6. **Decryption**: Recipient derives the same shared secret using their private key and the sender's public key, then decrypts the ciphertext.

### 6.4 Group Chat Encryption

For group chats, a **sender-key** scheme is used:

1. Each group member generates a symmetric sender key and distributes it to all other members, encrypted individually with each member's public key.
2. When sending a message to the group, the sender encrypts using their sender key (one encryption for all recipients).
3. When a member joins or leaves, all sender keys are rotated.

### 6.5 Limitations

- The server stores only ciphertext and cannot perform server-side search on message content.
- Message previews and push notification content are generated client-side.
- Key loss results in inability to decrypt historical messages; users are advised to back up keys.

---

## 7. Scalability for 10,000 Concurrent Users

### 7.1 Capacity Planning

| Resource           | Estimate per Connection | Total (10K users)    |
|--------------------|------------------------|----------------------|
| Memory (per conn)  | ~50 KB                 | ~500 MB              |
| File Descriptors   | 1 per connection       | 10,000               |
| Bandwidth (avg)    | ~1 KB/s per user       | ~10 MB/s             |
| Messages/sec (avg) | 0.1 msg/s per user     | ~1,000 msg/s         |

### 7.2 Horizontal Scaling Architecture

```
                    ┌──────────────────────┐
                    │    Load Balancer      │
                    │  (Sticky Sessions)    │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
       ┌──────▼──────┐ ┌──▼──────────┐ ┌───▼─────────┐
       │ Chat Server │ │ Chat Server │ │ Chat Server │
       │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
       │  (~3.3K     │ │  (~3.3K     │ │  (~3.3K     │
       │   conns)    │ │   conns)    │ │   conns)    │
       └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Redis Cluster   │
                    │   (Pub/Sub +      │
                    │    Session State) │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL      │
                    │   (Primary +      │
                    │    Read Replicas) │
                    └───────────────────┘
```

### 7.3 Server Configuration

Each Node.js chat server instance is configured for high connection counts:

```javascript
// OS-level tuning (sysctl)
// net.core.somaxconn = 65535
// fs.file-max = 100000
// net.ipv4.tcp_tw_reuse = 1

// Node.js configuration
const server = http.createServer();
server.maxConnections = 5000; // per instance

// WebSocket server options
const wss = new WebSocket.Server({
  server,
  maxPayload: 64 * 1024,        // 64 KB max message size
  perMessageDeflate: false,       // disable compression (CPU tradeoff)
  clientTracking: true
});
```

### 7.4 Redis Pub/Sub for Cross-Server Messaging

When a message is sent to a user connected to a different server instance, Redis Pub/Sub routes the message:

1. Each server subscribes to a Redis channel for each connected user (e.g., `user:{userId}:messages`).
2. When a message arrives for a user, the handling server publishes to that user's channel.
3. The server holding the user's WebSocket connection receives the published message and delivers it.

### 7.5 Connection State Management

- **Presence**: User online/offline status is tracked in Redis with TTL-based expiry (90s). Each heartbeat refreshes the TTL.
- **Session Recovery**: On reconnect, the server queries Redis for session state and PostgreSQL for missed messages since the client's last received timestamp.

### 7.6 Rate Limiting

| Limit                    | Value          | Action on Exceed       |
|--------------------------|----------------|------------------------|
| Messages per user/min    | 60             | Throttle + warn        |
| Connections per IP       | 10             | Reject new connections |
| Message payload size     | 64 KB          | Reject message         |
| Typing events per sec    | 2              | Drop excess events     |

---

## 8. API Specification

### 8.1 REST API Endpoints

These endpoints are used for operations that don't require real-time delivery.

#### Authentication

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/login`     | Authenticate and get JWT |
| POST   | `/api/auth/refresh`   | Refresh JWT token        |

#### Conversations

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| POST   | `/api/conversations`                  | Create a new conversation      |
| GET    | `/api/conversations`                  | List user's conversations      |
| GET    | `/api/conversations/:id`              | Get conversation details       |
| POST   | `/api/conversations/:id/members`      | Add member to group            |
| DELETE | `/api/conversations/:id/members/:uid` | Remove member from group       |

#### Messages (History)

| Method | Endpoint                               | Description                         |
|--------|----------------------------------------|-------------------------------------|
| GET    | `/api/conversations/:id/messages`      | Fetch message history (paginated)   |

Query parameters: `before` (cursor), `limit` (default 50, max 100)

#### Keys

| Method | Endpoint                  | Description                      |
|--------|---------------------------|----------------------------------|
| POST   | `/api/keys`               | Upload a new public key          |
| GET    | `/api/keys/:userId`       | Get a user's active public keys  |
| DELETE | `/api/keys/:keyId`        | Revoke a public key              |

### 8.2 WebSocket Endpoint

| Endpoint       | Description                                     |
|----------------|-------------------------------------------------|
| `wss://host/ws`| WebSocket connection (JWT in `Authorization` header or query param) |

---

## 9. Security Considerations

| Concern                     | Mitigation                                                        |
|-----------------------------|-------------------------------------------------------------------|
| Transport Security          | TLS 1.3 enforced for all WebSocket and HTTP connections           |
| Authentication              | JWT with short expiry (15 min) + refresh tokens                   |
| Authorization               | Server validates conversation membership before message delivery  |
| Message Privacy             | End-to-end encryption; server stores only ciphertext              |
| Injection Attacks           | Parameterized queries for all database operations                 |
| Rate Limiting               | Per-user and per-IP rate limits at both LB and application layers |
| Key Compromise              | Key rotation support; compromised keys can be revoked immediately |
| Replay Attacks              | Each message has a unique nonce; server rejects duplicate message IDs |
| Connection Hijacking        | JWT validated on initial handshake; periodic re-authentication    |

---

## 10. Monitoring and Observability

### 10.1 Key Metrics

| Metric                          | Alert Threshold        |
|---------------------------------|------------------------|
| Active WebSocket connections    | > 9,000 (90% capacity)|
| Message delivery latency (p99)  | > 500ms               |
| Database write latency (p99)    | > 200ms               |
| Redis Pub/Sub lag               | > 100ms               |
| Failed message deliveries/min   | > 10                   |
| WebSocket error rate            | > 1%                   |
| CPU utilization per server      | > 80%                  |
| Memory utilization per server   | > 85%                  |

### 10.2 Logging

- Structured JSON logs for all components
- Log levels: `error`, `warn`, `info`, `debug`
- Correlation IDs (`requestId`, `messageId`) propagated across components
- Sensitive data (message content) never logged; only metadata

### 10.3 Tooling

| Tool          | Purpose                           |
|---------------|-----------------------------------|
| Prometheus    | Metrics collection and alerting   |
| Grafana       | Dashboards and visualization      |
| ELK Stack     | Centralized log aggregation       |
| Jaeger        | Distributed tracing               |

---

## 11. Deployment Strategy

### 11.1 Infrastructure

| Component       | Deployment                     | Replicas |
|-----------------|--------------------------------|----------|
| Chat Servers    | Kubernetes pods (auto-scaled)  | 3–6      |
| Redis           | Redis Cluster (managed)        | 3 nodes  |
| PostgreSQL      | Managed service (e.g., RDS)    | 1 primary + 2 read replicas |
| Load Balancer   | Cloud LB with WebSocket support| 1        |

### 11.2 Deployment Process

1. **Rolling Deployment**: New chat server versions are deployed one instance at a time. The load balancer drains connections from the instance being updated.
2. **Connection Draining**: Before termination, the server sends a `close` frame to all connected clients with a reconnect hint. Clients reconnect to a healthy instance.
3. **Database Migrations**: Schema changes are applied using a migration tool (e.g., Flyway or node-pg-migrate) as a pre-deployment step. All migrations are backward-compatible.

### 11.3 Disaster Recovery

- **Database Backups**: Automated daily snapshots with point-in-time recovery (PITR) enabled.
- **Redis Persistence**: AOF persistence enabled with fsync every second.
- **Multi-AZ Deployment**: All components deployed across at least 2 availability zones.

---

## 12. Risks and Mitigations

| Risk                                           | Likelihood | Impact | Mitigation                                                |
|------------------------------------------------|------------|--------|-----------------------------------------------------------|
| Single Redis instance becomes bottleneck       | Medium     | High   | Use Redis Cluster with sharded Pub/Sub channels           |
| PostgreSQL write throughput exceeded            | Low        | High   | Batch writes, connection pooling, table partitioning      |
| WebSocket connection storms after outage        | Medium     | Medium | Exponential backoff on clients, connection rate limiting  |
| Key management complexity leads to bugs         | Medium     | High   | Use established cryptographic libraries (libsodium/NaCl)  |
| Message ordering issues across server instances | Low        | Medium | Timestamp-based ordering; vector clocks if needed         |

---

## 13. Future Considerations

- **Media Messages**: Extend the system to support encrypted file and image sharing via pre-signed URLs
- **Message Search**: Implement client-side search index for encrypted messages
- **Push Notifications**: Integrate with FCM/APNs for mobile push delivery of encrypted notification metadata
- **Read Receipts at Scale**: Optimize batch delivery status updates for large group chats
- **Message Reactions**: Add lightweight reaction support with real-time delivery
- **Compliance and Audit**: Design an optional server-side compliance mode for regulated environments
