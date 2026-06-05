# 📊 LawBridge Services Inventory & Deployment Architecture

## 11 SERVICES OVERVIEW

| # | Service | Port | Database | Purpose | Replicas | CPU | Memory |
|---|---------|------|----------|---------|----------|-----|--------|
| 1 | Auth Service | 8001 | auth_db | JWT token management & authentication | 3 | 500m | 512Mi |
| 2 | Client Service | 8002 | client_db | Client profiles & information | 2 | 400m | 512Mi |
| 3 | Lawyer Service | 8003 | lawyer_db | Lawyer profiles & expertise matching | 2 | 400m | 512Mi |
| 4 | Case Service | 8004 | case_db | Case management & lifecycle | 3 | 600m | 1Gi |
| 5 | Document Service | 8005 | doc_db | Document storage & audit trail | 2 | 500m | 1Gi |
| 6 | Notification Service | 8006 | notification_db | Email/SMS notifications | 2 | 300m | 512Mi |
| 7 | Payment Service | 8007 | payment_db | Payment processing & invoicing | 2 | 500m | 1Gi |
| 8 | Calendar Service | 8008 | calendar_db | Hearing scheduling & reminders | 2 | 300m | 512Mi |
| 9 | Monitoring Service | 8009 | monitoring_db | Real-time case monitoring (WebSockets) | 2 | 400m | 512Mi |
| 10 | Search Service | 8010 | search_db | Federated search across services | 1 | 400m | 512Mi |
| 11 | AI Assistant Service | 8011 | ai_db | Ollama-powered legal Q&A (EN/FR) | 1 | 1000m | 2Gi |

## DATABASE ARCHITECTURE

### Strategy: Single RDS Instance with 11 Logical Databases

**Why this approach?**
- ✅ Cost-effective (~$450/month vs $3000+/month for separate instances)
- ✅ Simplified backup & disaster recovery
- ✅ Easier maintenance & upgrades
- ✅ Service isolation at logical level
- ✅ Microservices best practice

### Database Names
```
auth_db
client_db
lawyer_db
case_db
doc_db
notification_db
payment_db
calendar_db
monitoring_db
search_db
ai_db
```

### RDS Instance Specifications
- **Instance Class**: db.r6i.xlarge (2 vCPU, 8GB RAM)
- **Storage**: 200GB gp3
- **Backup Retention**: 30 days
- **Multi-AZ**: Yes (for high availability)
- **Encryption**: At-rest + in-transit
- **Version**: PostgreSQL 16.1

---

## DEPLOYMENT ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET (80, 443)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼─────┐
                    │    ALB    │ (AWS Application Load Balancer)
                    │  Ingress  │ (Kubernetes ALB Controller)
                    └────┬─────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐     ┌────▼─────┐    ┌────▼─────┐
   │EKS Node 1 │     │EKS Node 2 │    │EKS Node 3 │
   │(t3.xlarge)│     │(t3.xlarge)│    │(t3.xlarge)│
   └────┬─────┘     └────┬─────┘    └────┬─────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────────┐  ┌────▼────────┐  ┌───▼────────┐
    │  Services  │  │   Services  │  │  Services  │
    │   Pods     │  │    Pods     │  │   Pods     │
    │ (8001-8011)│  │ (8001-8011) │  │ (8001-8011)│
    └───┬────────┘  └────┬────────┘  └───┬────────┘
        │                │                │
        │      ┌─────────┼─────────┐     │
        │      │         │         │     │
        │   ┌──▼──┐  ┌───▼───┐ ┌──▼──┐  │
        └──►│RDS  │  │Redis  │ │S3   │◄─┘
           │  DB  │  │Cache  │ │Obj  │
           │ (11  │  │Cluster│ │Store│
           │ DBs) │  │       │ │     │
           └──────┘  └───────┘ └─────┘
```

---

## SERVICE-TO-SERVICE COMMUNICATION PATTERN

### Kubernetes Internal DNS
Services communicate using Kubernetes DNS:
```
http://auth-service:8001
http://client-service:8002
http://lawyer-service:8003
... etc
```

### Service Discovery
- **Type**: ClusterIP (internal only)
- **DNS Format**: `{service-name}.{namespace}.svc.cluster.local`
- **Example**: `auth-service.lawbridge.svc.cluster.local:8001`

### Environment Variables (Set in All Pods)
```bash
# PostgreSQL
DB_HOST=lawbridge-postgres.xxxxx.rds.amazonaws.com
DB_PORT=5432
DB_NAME={service}_db
DB_USER=postgres
DB_PASSWORD=<from-secrets>

# Redis
REDIS_HOST=lawbridge-redis.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_DB=0

# Inter-service URLs
AUTH_SERVICE_URL=http://auth-service:8001
CLIENT_SERVICE_URL=http://client-service:8002
LAWYER_SERVICE_URL=http://lawyer-service:8003
CASE_SERVICE_URL=http://case-service:8004
DOCUMENT_SERVICE_URL=http://document-service:8005
NOTIFICATION_SERVICE_URL=http://notification-service:8006
PAYMENT_SERVICE_URL=http://payment-service:8007
CALENDAR_SERVICE_URL=http://calendar-service:8008
MONITORING_SERVICE_URL=http://monitoring-service:8009
SEARCH_SERVICE_URL=http://search-service:8010
AI_ASSISTANT_SERVICE_URL=http://ai-assistant-service:8011

# AWS S3 (ReplaceMinIO)
AWS_ACCESS_KEY_ID=<from-secrets>
AWS_SECRET_ACCESS_KEY=<from-secrets>
AWS_STORAGE_BUCKET_NAME=lawbridge-documents
AWS_REGION=us-east-1

# AWS SQS (Replace RabbitMQ)
AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxx/lawbridge-tasks
AWS_SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxx:lawbridge-notifications
```

---

## INFRASTRUCTURE COMPONENTS REPLACEMENT

### Local Development → AWS Production

| Local Component | Purpose | AWS Replacement | Cost/Month |
|---|---|---|---|
| Docker Compose PostgreSQL | Database | RDS PostgreSQL (managed) | $450 |
| Docker Redis | Cache + Pub/Sub | ElastiCache Redis | $120 |
| Docker RabbitMQ | Task queue | SQS + SNS (managed) | $10-50 |
| Docker MinIO | Object storage | S3 (pay per use) | $20-100 |
| Nginx | API Gateway | AWS ALB (managed) | $50 |
| 11 Docker services | Microservices | EKS Pods (managed) | $300 |
| Ollama | AI Model Server | EC2 t3.xlarge | $100 |
| **TOTAL** | | | **~$1,050** |

---

## DEPLOYMENT ORDER (CRITICAL)

### Phase 0: Prerequisites
1. ✅ AWS Account with billing enabled
2. ✅ AWS CLI configured with credentials
3. ✅ Local tools installed (kubectl, eksctl, Docker)

### Phase 1: Infrastructure (30 minutes)
1. Create VPC with public/private subnets (2 AZ)
2. Create security groups (ALB, Services, RDS)
3. Create RDS PostgreSQL instance with 11 databases
4. Create ElastiCache Redis cluster
5. Create S3 bucket for file storage

### Phase 2: Container Registry (10 minutes)
1. Create 11 ECR repositories
2. Build and push all 11 Docker images
3. Verify images in ECR

### Phase 3: Kubernetes Cluster (20 minutes)
1. Create EKS cluster (3 nodes, t3.xlarge)
2. Install ALB ingress controller
3. Verify cluster status

### Phase 4: Configuration & Secrets (5 minutes)
1. Create Kubernetes namespace
2. Create secrets (DB credentials, API keys)
3. Create ConfigMaps (service URLs, endpoints)

### Phase 5: Deploy Services (10 minutes)
1. Create service deployments (all 11)
2. Create service endpoints
3. Create ingress for ALB routing

### Phase 6: Database Migrations (5 minutes)
1. Run `python manage.py migrate` for each service
2. Verify migrations completed successfully

### Phase 7: Verification (5 minutes)
1. Check pod status
2. Test service health endpoints
3. Verify database connectivity
4. Test ALB routing

### Phase 8: Frontend Integration (5 minutes)
1. Update Vercel environment variables
2. Redeploy frontend
3. End-to-end testing

**Total Time: ~90 minutes (first deployment)**

---

## RESOURCE REQUIREMENTS

### Compute Resources
```
Auth Service:
  Replicas: 3
  CPU: 500m * 3 = 1500m
  Memory: 512Mi * 3 = 1.5Gi

Case Service (heaviest):
  Replicas: 3
  CPU: 600m * 3 = 1800m
  Memory: 1Gi * 3 = 3Gi

AI Assistant Service:
  Replicas: 1
  CPU: 1000m
  Memory: 2Gi

Other services (8):
  Avg: 400m CPU, 512Mi Memory each
  Total: 3200m, 4Gi

TOTAL CLUSTER NEED:
CPU: ~10 cores (3 nodes × t3.xlarge = 12 cores) ✅
Memory: ~15Gi (3 nodes × 30Gi = 90Gi available) ✅
```

### Storage Requirements
- **RDS PostgreSQL**: 200GB initial (auto-scaling)
- **ElastiCache**: 10GB (configurable)
- **S3**: Variable (pay per use, ~1GB/month initially)
- **EBS Volumes**: 20GB per node (60GB total)

---

## NETWORK ARCHITECTURE

### VPC Layout
```
10.0.0.0/16 (Main VPC)
├── 10.0.1.0/24   (Public Subnet 1 - us-east-1a)
│   └── ALB Endpoints
├── 10.0.2.0/24   (Public Subnet 2 - us-east-1b)
│   └── ALB Endpoints
├── 10.0.10.0/24  (Private Subnet 1 - us-east-1a)
│   └── EKS Nodes + Services
├── 10.0.11.0/24  (Private Subnet 2 - us-east-1b)
│   └── EKS Nodes + Services
├── RDS Private Endpoint
└── ElastiCache Private Endpoint
```

### Security Groups
- **ALB SG**: Ingress 80, 443 from 0.0.0.0/0
- **Services SG**: Ingress ports 8001-8011 from ALB SG, inter-service communication
- **RDS SG**: Ingress port 5432 from Services SG only

---

## SCALING STRATEGY

### Horizontal Pod Autoscaling (HPA)
```yaml
# Auth Service (high-traffic)
minReplicas: 3
maxReplicas: 10
targetCPUUtilizationPercentage: 70%
targetMemoryUtilizationPercentage: 80%

# Case Service (complex operations)
minReplicas: 2
maxReplicas: 8
targetCPUUtilizationPercentage: 60%

# Low-traffic services (Search, Calendar)
minReplicas: 1
maxReplicas: 3
targetCPUUtilizationPercentage: 80%
```

### RDS Scaling
- **Auto-scaling Storage**: Enabled (200GB → max 1TB)
- **Read Replicas**: Add as needed
- **Manual Scaling**: Upgrade instance class if needed

---

## MONITORING & LOGGING

### CloudWatch Integration
- All logs automatically sent to CloudWatch
- Log groups: `/aws/eks/lawbridge/{service-name}`
- Retention: 30 days

### Prometheus & Grafana (Optional)
```bash
# Install monitoring stack
helm install prometheus prometheus-community/kube-prometheus-stack
```

### Health Checks
- **Kubernetes Liveness Probe**: Every 10 seconds
- **Readiness Probe**: Every 5 seconds
- **Service Health Endpoint**: `GET /health/`

---

## BACKUP & DISASTER RECOVERY

### RDS Backups
- **Automatic Backups**: Daily (30-day retention)
- **Multi-AZ Replica**: Automatic failover
- **Manual Snapshots**: Create before major changes

### EKS Cluster Backup
- **Persistent Volumes**: EBS-backed
- **EBS Snapshots**: Automated daily

### Recovery Time Objectives (RTO)
- Pod failure: < 30 seconds (auto-restart)
- Node failure: < 2 minutes (new pod on another node)
- AZ failure: < 5 minutes (switch to backup AZ)
- Full cluster failure: < 30 minutes (rebuild from snapshots)

---

## ESTIMATED COSTS (Monthly)

### Base Infrastructure
- RDS PostgreSQL (db.r6i.xlarge): $450
- ElastiCache Redis (cache.r6g.large): $120
- EKS Control Plane: $73
- EKS Nodes (3 × t3.xlarge): $300
- ALB: $50
- NAT Gateway: $30
- Data Transfer: $50
- S3 Storage & Transfer: $20

### Optional Services
- EC2 for Ollama (t3.large): $100
- CloudWatch Logs: $10-30
- Monitoring (Prometheus/Grafana): $50-100

**TOTAL: ~$1,100/month (base) + optional services**

---

## QUICK DECISION MATRIX

| Decision | Recommended | Reason |
|----------|---|---|
| ECS vs EKS | EKS | Better for production, multi-region ready |
| Database | Single RDS + 11 DBs | Cost-effective, operational simplicity |
| Load Balancer | ALB | Layer 7 routing for port-based services |
| Container Runtime | Docker | Industry standard, good Kubernetes integration |
| Monitoring | CloudWatch + optional Prometheus | CloudWatch built-in, Prometheus for advanced metrics |
| CI/CD | Jenkins on EC2 | Flexible, good Kubernetes integration |
| Secrets Management | AWS Secrets Manager | Native AWS integration, automatic rotation |
| Ingress Controller | AWS ALB Controller | Native AWS support, no additional cost |

---

## NEXT STEPS

1. ✅ Review this architecture
2. ✅ Confirm AWS region (us-east-1)
3. ✅ Prepare AWS credentials
4. ✅ Review cost estimation
5. ⏭️ Execute STEP_BY_STEP_DEPLOYMENT.md
6. ⏭️ Monitor deployment progress
7. ⏭️ Run verification commands
8. ⏭️ Update Vercel frontend
9. ⏭️ Set up CI/CD pipeline
10. ⏭️ Configure monitoring

