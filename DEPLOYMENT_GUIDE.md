# Deployment & Demo Guide

## Prerequisites Checklist
- [ ] MongoDB Atlas account (free tier is fine) — create 4 databases: `auth-db`, `catalog-db`, `claims-db`, `feedback-db`
- [ ] DockerHub account (`jinn2`) — logged in locally via `docker login`
- [ ] AWS account — ability to launch 4 EC2 instances (t2.micro is fine)
- [ ] Docker installed locally
- [ ] Postman installed

---

## Phase 1: Prepare MongoDB Atlas (15 min)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster.
2. Under **Database Access**, create a user (e.g., `jinn2` / a secure password).
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) — or add your EC2 IPs later.
4. Click **Connect → Drivers** and copy the connection string. It looks like:
   ```
   mongodb+srv://jinn2:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. You only need ONE cluster. The database names (`auth-db`, `catalog-db`, etc.) in the URI will auto-create on first write.

---

## Phase 2: Create 4 EC2 Instances (15 min)

1. Launch 4 EC2 instances (Amazon Linux 2023 or Ubuntu 22.04, t2.micro).
2. For each instance, configure the **Security Group** to allow:
   - **Inbound**: SSH (port 22) from your IP, HTTP (port 80) from anywhere, and ports 3001–3006 from anywhere (or from each other's IPs).
   - **Outbound**: All traffic.
3. Note down the **public IPs** and **private IPs** of all 4 instances:

```
EC2-1 (Gateway + Auth):   Public IP: __________  Private IP: __________
EC2-2 (Claims + Catalog):  Public IP: __________  Private IP: __________
EC2-3 (Report + Catalog):  Public IP: __________  Private IP: __________
EC2-4 (Profile + Feedback):Public IP: __________  Private IP: __________
```

4. SSH into each instance and install Docker:
   ```bash
   # Amazon Linux 2023
   sudo dnf install -y docker
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   # Log out and log back in
   
   # Install Docker Compose plugin
   sudo dnf install -y docker-compose-plugin
   # Verify
   docker compose version
   ```

   ```bash
   # Ubuntu 22.04
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   sudo systemctl enable --now docker
   sudo usermod -aG docker ubuntu
   # Log out and log back in
   docker compose version
   ```

---

## Phase 3: Configure nginx.conf with Real IPs (5 min)

In `api-gateway/nginx.conf`, search-and-replace these 7 placeholders:

| Placeholder | Replace with |
|---|---|
| `AUTH_SERVICE_IP` | EC2-1 private IP |
| `CLAIMS_SERVICE_IP` | EC2-2 private IP |
| `CATALOG_INSTANCE_1_IP` | EC2-2 private IP |
| `CATALOG_INSTANCE_2_IP` | EC2-3 private IP |
| `REPORT_SERVICE_IP` | EC2-3 private IP |
| `PROFILE_SERVICE_IP` | EC2-4 private IP |
| `FEEDBACK_SERVICE_IP` | EC2-4 private IP |

> Use **private IPs** if all EC2s are in the same VPC (default). Use **public IPs** if they're in different VPCs.

---

## Phase 4: Build & Push Images (10 min)

From your local machine, in the project root:

```bash
chmod +x build-and-push.sh
./build-and-push.sh
```

This builds all 7 images and pushes them to DockerHub as `jinn2/lostfound-<service>:latest`.

**Verify on DockerHub**: Go to hub.docker.com/u/jinn2 and confirm you see 7 repositories.

---

## Phase 5: Deploy to EC2 Instances (15 min)

### 5a. Transfer files to each EC2

From your local machine:

```bash
# EC2-1
scp -i <key.pem> ec2-1/docker-compose.yml ec2-1/env-template ec2-1/deploy.sh ec2-user@<EC2-1-IP>:~/

# EC2-2
scp -i <key.pem> ec2-2/docker-compose.yml ec2-2/env-template ec2-2/deploy.sh ec2-user@<EC2-2-IP>:~/

# EC2-3
scp -i <key.pem> ec2-3/docker-compose.yml ec2-3/env-template ec2-3/deploy.sh ec2-user@<EC2-3-IP>:~/

# EC2-4
scp -i <key.pem> ec2-4/docker-compose.yml ec2-4/env-template ec2-4/deploy.sh ec2-user@<EC2-4-IP>:~/
```

### 5b. Configure .env on each EC2

SSH into each instance:

```bash
# On EC2-1
cp env-template .env
nano .env   # Fill in AUTH_DB_URI with your Atlas connection string
            # (database name: auth-db)

# On EC2-2
cp env-template .env
nano .env   # Fill in CLAIMS_DB_URI and CATALOG_DB_URI

# On EC2-3
cp env-template .env
nano .env   # Fill in CATALOG_DB_URI and CLAIMS_SERVICE_URL
            # CLAIMS_SERVICE_URL=http://<EC2-2-PRIVATE-IP>:3003

# On EC2-4
cp env-template .env
nano .env   # Fill in PROFILE_DB_URI (auth-db) and FEEDBACK_DB_URI
```

### 5c. Deploy on each EC2

On each instance:

```bash
chmod +x deploy.sh
./deploy.sh
```

Verify containers are running:
```bash
docker compose ps
docker compose logs --tail 20
```

---

## Phase 6: Postman API Testing (15 min)

1. Import `LostFound_Postman_Collection.json` into Postman.
2. Edit the collection variables:
   - `BASE_URL` → `http://<EC2-1-PUBLIC-IP>`
3. Run the requests **in order**:

| # | Request | Purpose | Screenshot? |
|---|---------|---------|:-----------:|
| 1 | Register Student | Create student account | ✅ |
| 2 | Register Admin | Create admin account | ✅ |
| 3 | Login Student | Get student JWT | ✅ |
| 4 | Login Admin | Get admin JWT | ✅ |
| 5 | Create Item (Admin) | Add a lost/found item | ✅ |
| 6 | Get All Items | List items (auth required) | ✅ |
| 7 | Get My Profile (Student) | Test profile-service | ✅ |
| 8 | Update My Profile (Student) | Test profile update | ✅ |
| 9 | Submit Claim (Student) | Create a claim | ✅ |
| 10 | Submit Feedback (Student) | Submit feedback | ✅ |
| 11 | Get All Claims (Admin) | Admin views claims | ✅ |
| 12 | Total Items Report (Admin) | Test report-service | ✅ |
| 13 | Total Claims Report (Admin) | Test report-service | ✅ |
| 14 | Claims by Status (Admin) | Test report-service | ✅ |
| 15 | Get All Feedback (Admin) | Admin views feedback | ✅ |

> Tokens auto-save to Postman variables via test scripts.

---

## Phase 7: Load Balancing Demo (10 min)

The `catalog-service` runs on **EC2-2** (instance 1) and **EC2-3** (instance 2). Nginx load-balances between them round-robin.

### Method 1: Direct health checks (easiest for screenshots)

```bash
# Hit catalog instance 1 directly
curl http://<EC2-2-PUBLIC-IP>:3002/health
# Response: {"status":"ok","service":"catalog-service","instance":"catalog-instance-1"}

# Hit catalog instance 2 directly
curl http://<EC2-3-PUBLIC-IP>:3002/health
# Response: {"status":"ok","service":"catalog-service","instance":"catalog-instance-2"}
```

### Method 2: Through the gateway (shows round-robin)

The `/items` endpoint goes through Nginx's `catalog_backend` upstream which load-balances. To see which instance served each request:

1. SSH into EC2-1 (where Nginx runs).
2. Start watching the access log:
   ```bash
   docker exec api-gateway tail -f /var/log/nginx/access.log
   ```
3. In Postman, hit `GET /items` multiple times rapidly.
4. You'll see Nginx alternating between `CATALOG_INSTANCE_1_IP` and `CATALOG_INSTANCE_2_IP`.

### Method 3: Add a custom header (best for Postman screenshots)

To make the load-balancing visible in the Postman response itself, you can temporarily add a header to catalog-service responses. But the health check method (Method 1) is the simplest for screenshots.

### What to screenshot for load balancing:
1. Two terminal windows side by side — one curling EC2-2:3002/health, one curling EC2-3:3002/health, showing different `instance` values.
2. Nginx access logs on EC2-1 showing alternating upstream IPs.

---

## Troubleshooting

### Nginx won't start
```bash
docker logs api-gateway
# Look for "nginx: [emerg]" errors — usually a config syntax issue
```

### Service can't connect to MongoDB
```bash
# Check if the Atlas URI is correct
docker logs <container-name>
# Look for "MongoDB connection error"
# Ensure Network Access in Atlas allows your EC2's IP (or 0.0.0.0/0)
```

### Report service can't reach claims service
```bash
# On EC2-3, check connectivity to EC2-2
curl http://<EC2-2-PRIVATE-IP>:3003/health
# If this fails, check Security Group rules on EC2-2 (port 3003 must be open)
```

### 401 Unauthorized from protected routes
```bash
# Ensure JWT_SECRET is the same in all .env files
# Check that the token is being sent as: Bearer <token>
```
