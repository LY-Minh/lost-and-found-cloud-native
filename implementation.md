# Architecture Overhaul Implementation Plan

This is a significant architectural pivot! Your approach to grouping the services by EC2 instances and using MongoDB Atlas is exactly how it's done in the industry. Moving away from service-to-service internal communication (and connecting directly to databases instead) will also greatly simplify the project.

## Architecture
- ec1: Nginx reverse proxy and loadbalancer (also acts as a gate way), auth service
- ec2: claim service, and Catalog service (instace 1)
- ec3: report service and Catalog service (instance 2)
- ec4: profile service and feedback service 

## Changes Implemented
### 1. Reorganize for EC2 Deployment
#### `ec2-1/`, `ec2-2/`, `ec2-3/`, `ec2-4/`
Four deployment folders corresponding to your EC2 instances. Each contains:
- `docker-compose.yml`: Pulls your images from `jinn2/lostfound-*` and exposes the necessary ports. No MongoDB containers are included.
- `env-template`: Template for `.env` containing `JWT_SECRET` and the MongoDB Atlas URIs. Copy to `.env` and fill in credentials.
- `deploy.sh`: A bash script to pull the latest images from DockerHub and restart the containers.

Source code remains at the repository root. The `ec2-*` folders contain only deployment files.
#### `build-and-push.sh`
A root-level script to build all services (`docker build -t jinn2/lostfound-<service> .`) and push them to DockerHub. Includes a pre-flight check that warns if placeholder IPs are still in `nginx.conf`.
### 2. Replace Activity Log with Profile Service
#### `activity-log-service/` — DELETED
Entirely removed.

#### `profile-service/` — NEW
A new Node.js/Express service with:
- `GET /student/me`: Retrieves the student's profile from the Users database.
- `PUT /student/update`: Updates the student's profile (name only).
- Connects to the Users DB on MongoDB Atlas (shared with auth-service).

### 3. API Gateway Updates
#### `api-gateway/nginx.conf` — MODIFIED
- Removed the `activitylog_backend` upstream.
- Added `profile_backend` upstream pointing to the new Profile Service.
- Added `EC2 IP QUICK-REFERENCE` comment block for easy IP management.
- Added `/student/me` and `/student/update` routes → `profile_backend`.
- The gateway is the only service that publishes port `80` in `ec2-1`.

### 4. Docker Networking
- `report-service` (EC2-3) reaches the co-located `catalog-service` via Docker's internal DNS (`http://catalog-service:3002`), no env var needed.
- `report-service` reaches `claims-service` (EC2-2) via `CLAIMS_SERVICE_URL` env var.

## Deployment Workflow
1. Create 4 EC2 instances and note their IPs.
2. Replace placeholder IPs in `api-gateway/nginx.conf` (see the QUICK-REFERENCE comment).
3. Run `./build-and-push.sh` locally to build and push all images to DockerHub.
4. Copy each `ec2-*` folder to its corresponding EC2 instance.
5. On each EC2: `cp env-template .env`, fill in Atlas credentials, then `./deploy.sh`.

## Verification Plan
### Automated Tests
- Run the `build-and-push.sh` script to verify all Docker images build successfully.
### Manual Verification
- Start `ec2-4/docker-compose.yml` locally, pass in a MongoDB Atlas test URI, and verify the new `/student/me` endpoint returns data.
