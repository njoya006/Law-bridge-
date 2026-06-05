# 🚀 AWS DEPLOYMENT QUICK START (First-Time Guide)

> **For developers deploying LawBridge to AWS for the first time**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

Before starting, verify you have:

- [ ] **AWS Account** with billing enabled
- [ ] **AWS CLI** installed (`aws --version`)
- [ ] **kubectl** installed (`kubectl version`)
- [ ] **eksctl** installed (`eksctl version`)
- [ ] **Docker** installed (`docker --version`)
- [ ] **AWS Credentials** configured (`aws configure`)
- [ ] **IAM Permissions** for EKS, RDS, ECR, ALB, VPC

### AWS Account Preparation
```bash
# Login to AWS
aws configure

# Verify credentials work
aws sts get-caller-identity
```

---

## 📊 WHAT YOU'RE DEPLOYING

```
LawBridge = 11 Django Microservices + Database + Frontend
├── 11 Services (Auth, Client, Lawyer, Case, Document, etc.)
├── 1 PostgreSQL Database (RDS) with 11 logical databases
├── 1 Redis Cache (ElastiCache)
├── 1 Load Balancer (ALB)
├── 1 Kubernetes Cluster (EKS)
└── 1 Frontend (already on Vercel)
```

**Cost**: ~$1,100/month  
**Setup Time**: ~90 minutes

---

## 🎯 3-PHASE DEPLOYMENT OVERVIEW

### PHASE 1: Build & Push Docker Images (15 min)
```
Local Docker Images → AWS ECR (Container Registry)
```

### PHASE 2: Create Infrastructure (40 min)
```
AWS Account → VPC → RDS + Redis → EKS Cluster
```

### PHASE 3: Deploy Services (20 min)
```
EKS Cluster + Kubernetes Manifests → Running Services
```

### PHASE 4: Verification & Integration (15 min)
```
Test Services → Update Frontend URLs → Done!
```

---

## 🔧 PHASE 1: BUILD & PUSH DOCKER IMAGES (15 minutes)

### Step 1.1: Create ECR Repositories
```bash
# Create repository for each service
aws ecr create-repository --repository-name lawbridge/auth-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/client-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/lawyer-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/case-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/document-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/notification-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/payment-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/calendar-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/monitoring-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/search-service --region us-east-1
aws ecr create-repository --repository-name lawbridge/ai-assistant-service --region us-east-1

# Get your AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo $ACCOUNT_ID
```

### Step 1.2: Login to ECR
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Step 1.3: Build & Push Images
```bash
# Navigate to project root
cd /path/to/lawbridge

# Build and push each service
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Auth Service
docker build -t $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/auth-service:latest ./services/auth/
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/auth-service:latest

# Client Service
docker build -t $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/client-service:latest ./services/client/
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/client-service:latest

# Lawyer Service
docker build -t $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/lawyer-service:latest ./services/lawyer/
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/lawyer-service:latest

# ... (repeat for all 11 services)
```

### ✅ Step 1 Complete
Verify images are in ECR:
```bash
aws ecr describe-repositories --region us-east-1
```

---

## 🏗️ PHASE 2: CREATE INFRASTRUCTURE (40 minutes)

### Step 2.1: Create VPC & Networking (10 min)
```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region us-east-1 \
  --query 'Vpc.VpcId' --output text)
echo "VPC ID: $VPC_ID"

# Enable DNS
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --region us-east-1 \
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Create Public Subnets
PUB_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a --region us-east-1 --query 'Subnet.SubnetId' --output text)
PUB_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b --region us-east-1 --query 'Subnet.SubnetId' --output text)

# Create Private Subnets
PRIV_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a --region us-east-1 --query 'Subnet.SubnetId' --output text)
PRIV_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b --region us-east-1 --query 'Subnet.SubnetId' --output text)

# Create route table for public subnets
ROUTE_TABLE_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --region us-east-1 \
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $ROUTE_TABLE_ID --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID --region us-east-1

# Associate with public subnets
aws ec2 associate-route-table --subnet-id $PUB_SUBNET_1 --route-table-id $ROUTE_TABLE_ID
aws ec2 associate-route-table --subnet-id $PUB_SUBNET_2 --route-table-id $ROUTE_TABLE_ID

echo "VPC Setup Complete!"
echo "VPC: $VPC_ID"
echo "Public Subnets: $PUB_SUBNET_1, $PUB_SUBNET_2"
echo "Private Subnets: $PRIV_SUBNET_1, $PRIV_SUBNET_2"
```

### Step 2.2: Create Security Groups (5 min)
```bash
# ALB Security Group
ALB_SG=$(aws ec2 create-security-group --group-name lawbridge-alb-sg \
  --description "ALB security group" --vpc-id $VPC_ID --region us-east-1 \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ALB_SG \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 --region us-east-1

# Services Security Group
SERVICES_SG=$(aws ec2 create-security-group --group-name lawbridge-services-sg \
  --description "Services security group" --vpc-id $VPC_ID --region us-east-1 \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $SERVICES_SG \
  --protocol tcp --port 8001-8011 --source-group $ALB_SG --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $SERVICES_SG \
  --group-id $SERVICES_SG --protocol tcp --port 0-65535 --region us-east-1

# RDS Security Group
RDS_SG=$(aws ec2 create-security-group --group-name lawbridge-rds-sg \
  --description "RDS security group" --vpc-id $VPC_ID --region us-east-1 \
  --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id $RDS_SG \
  --protocol tcp --port 5432 --source-group $SERVICES_SG --region us-east-1

echo "Security Groups Created!"
echo "ALB SG: $ALB_SG"
echo "Services SG: $SERVICES_SG"
echo "RDS SG: $RDS_SG"
```

### Step 2.3: Create RDS PostgreSQL Database (15 min)
```bash
# Create DB Subnet Group
aws rds create-db-subnet-group --db-subnet-group-name lawbridge-subnet-group \
  --db-subnet-group-description "LawBridge RDS subnet group" \
  --subnet-ids $PRIV_SUBNET_1 $PRIV_SUBNET_2 --region us-east-1

# Create RDS Instance (takes ~10-15 minutes)
aws rds create-db-instance \
  --db-instance-identifier lawbridge-postgres \
  --db-instance-class db.r6i.xlarge \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 200 \
  --storage-type gp3 \
  --multi-az \
  --db-subnet-group-name lawbridge-subnet-group \
  --vpc-security-group-ids $RDS_SG \
  --backup-retention-period 30 \
  --region us-east-1

# Wait for RDS to be ready (check status)
aws rds describe-db-instances --db-instance-identifier lawbridge-postgres \
  --region us-east-1 --query 'DBInstances[0].DBInstanceStatus'

# Get RDS Endpoint (after it's ready)
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier lawbridge-postgres \
  --region us-east-1 --query 'DBInstances[0].Endpoint.Address' --output text)
echo "RDS Endpoint: $RDS_ENDPOINT"
```

### Step 2.4: Create ElastiCache Redis (5 min)
```bash
# Create ElastiCache Subnet Group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name lawbridge-redis-subnet \
  --cache-subnet-group-description "LawBridge Redis subnet group" \
  --subnet-ids $PRIV_SUBNET_1 $PRIV_SUBNET_2 --region us-east-1

# Create Redis Cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id lawbridge-redis \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name lawbridge-redis-subnet \
  --security-group-ids $SERVICES_SG \
  --auto-failover-enabled \
  --region us-east-1

# Get Redis Endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id lawbridge-redis --region us-east-1 \
  --query 'CacheClusters[0].CacheNodes[0].Address' --output text)
echo "Redis Endpoint: $REDIS_ENDPOINT"
```

### ✅ Step 2 Complete
Save these values for later:
```bash
# Create a file to store for later use
cat > deployment-config.sh << EOF
export VPC_ID=$VPC_ID
export PRIV_SUBNET_1=$PRIV_SUBNET_1
export PRIV_SUBNET_2=$PRIV_SUBNET_2
export SERVICES_SG=$SERVICES_SG
export RDS_ENDPOINT=$RDS_ENDPOINT
export REDIS_ENDPOINT=$REDIS_ENDPOINT
export ACCOUNT_ID=$ACCOUNT_ID
EOF

# Save to file
chmod +x deployment-config.sh
```

---

## ⚙️ PHASE 3: CREATE EKS CLUSTER (20 minutes)

### Step 3.1: Create EKS Cluster
```bash
# Create cluster using eksctl (simplest way)
eksctl create cluster \
  --name lawbridge \
  --region us-east-1 \
  --nodegroup-name lawbridge-nodes \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 6 \
  --with-oidc \
  --enable-ssm

# Wait for cluster to be ready (takes ~15-20 minutes)
# You can check status:
eksctl get cluster --region us-east-1
```

### Step 3.2: Install ALB Ingress Controller
```bash
# Add AWS Load Balancer Controller Helm chart
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install ALB controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=lawbridge \
  --set serviceAccount.create=true \
  --set region=us-east-1

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 3.3: Create Namespace & Secrets
```bash
# Create namespace
kubectl create namespace lawbridge

# Create Docker registry secret for ECR
kubectl create secret docker-registry regcred \
  --docker-server=$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  -n lawbridge

# Create ConfigMap for database/Redis config
kubectl create configmap database-config \
  --from-literal=POSTGRES_HOST=$RDS_ENDPOINT \
  --from-literal=POSTGRES_PORT=5432 \
  --from-literal=REDIS_HOST=$REDIS_ENDPOINT \
  --from-literal=REDIS_PORT=6379 \
  --from-literal=AWS_REGION=us-east-1 \
  -n lawbridge

# Create Secret for database credentials
kubectl create secret generic postgres-credentials \
  --from-literal=username=postgres \
  --from-literal=password="YourSecurePassword123!" \
  -n lawbridge

echo "Kubernetes configuration complete!"
```

### ✅ Step 3 Complete
Verify cluster is ready:
```bash
kubectl get nodes
kubectl get ns
```

---

## 🚀 PHASE 4: DEPLOY SERVICES (20 minutes)

### Step 4.1: Deploy Kubernetes Manifests
```bash
# Apply all manifests (follow STEP_BY_STEP_DEPLOYMENT.md for full manifest generation)
# For now, here's a simplified example:

# 1. Create service deployments (you'll need to create YAML files)
kubectl apply -f k8s/namespace/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/hpa/

# Check deployment status
kubectl get deployments -n lawbridge
kubectl get pods -n lawbridge
kubectl get svc -n lawbridge
```

### Step 4.2: Run Database Migrations
```bash
# Create a migration job for each service
# Example for auth service:
kubectl run auth-migration \
  --image=$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/auth-service:latest \
  --overrides='{"spec":{"containers":[{"name":"auth-migration","command":["python","manage.py","migrate"],"env":[{"name":"DB_NAME","value":"auth_db"},{"name":"DB_HOST","value":"'$RDS_ENDPOINT'"},{"name":"DB_USER","value":"postgres"},{"name":"DB_PASSWORD","value":"YourSecurePassword123!"}]}]}}' \
  -n lawbridge \
  --restart=Never

# Wait for migration to complete
kubectl logs auth-migration -n lawbridge
```

### Step 4.3: Verify Services
```bash
# Get ALB DNS name
ALB_DNS=$(kubectl get ingress -n lawbridge lawbridge-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"

# Test API endpoints
curl http://$ALB_DNS/api/v1/health/
curl http://$ALB_DNS/api/v1/auth/health/
curl http://$ALB_DNS/api/v1/cases/health/

# Check pod status
kubectl get pods -n lawbridge
kubectl logs -f deployment/auth-service -n lawbridge
```

### ✅ Step 4 Complete
All services should be running and responding.

---

## ✅ PHASE 5: VERIFICATION & INTEGRATION (15 minutes)

### Step 5.1: Health Checks
```bash
# Test each service endpoint
echo "Testing Auth Service..."
curl http://$ALB_DNS/api/v1/auth/health/

echo "Testing Client Service..."
curl http://$ALB_DNS/api/v1/clients/health/

echo "Testing Case Service..."
curl http://$ALB_DNS/api/v1/cases/health/

# ... (test all services)
```

### Step 5.2: Database Verification
```bash
# Connect to RDS and verify databases exist
psql -h $RDS_ENDPOINT -U postgres -c "\l"

# Expected output should show:
# auth_db, client_db, lawyer_db, case_db, doc_db, 
# notification_db, payment_db, calendar_db, monitoring_db, search_db, ai_db
```

### Step 5.3: Update Vercel Frontend
```bash
# Get the ALB DNS name
ALB_DNS=$(kubectl get ingress -n lawbridge lawbridge-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Update Vercel environment variables:
# API_GATEWAY_URL=http://$ALB_DNS
# API_AUTH_SERVICE_URL=http://$ALB_DNS/api/v1/auth/
# API_CASE_SERVICE_URL=http://$ALB_DNS/api/v1/cases/
# ... (update all service URLs)

# Then redeploy frontend on Vercel
```

---

## 🎉 DEPLOYMENT COMPLETE!

Your LawBridge system is now running on AWS EKS!

### What You've Set Up:
- ✅ AWS VPC with public/private subnets
- ✅ RDS PostgreSQL with 11 databases
- ✅ ElastiCache Redis cluster
- ✅ EKS Kubernetes cluster (3 nodes)
- ✅ 11 microservices running
- ✅ ALB load balancer routing traffic
- ✅ Auto-scaling configured

### Next Steps:
1. Monitor services using CloudWatch
2. Set up automated backups
3. Configure CI/CD pipeline (Jenkins/GitHub Actions)
4. Set up monitoring (Prometheus/Grafana)
5. Plan for disaster recovery

---

## 📞 TROUBLESHOOTING

### Services not starting?
```bash
kubectl describe pod <pod-name> -n lawbridge
kubectl logs <pod-name> -n lawbridge
```

### Database connection issues?
```bash
# Test RDS connectivity from pod
kubectl exec -it <pod-name> -n lawbridge -- psql -h $RDS_ENDPOINT -U postgres -d auth_db -c "SELECT 1;"
```

### ALB not routing traffic?
```bash
kubectl describe ingress lawbridge-ingress -n lawbridge
kubectl get targetgroups
```

### Out of memory/CPU?
```bash
# Scale nodes
eksctl scale nodegroup --cluster lawbridge --name lawbridge-nodes --nodes 5
```

---

## 📊 MONITORING YOUR DEPLOYMENT

### CloudWatch Logs
```bash
# View logs from all services
aws logs describe-log-groups --query 'logGroups[].logGroupName'

# View specific service logs
aws logs tail /aws/eks/lawbridge/auth-service --follow
```

### Kubernetes Dashboard
```bash
# Get dashboard access token
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep eks-admin | awk '{print $1}')

# Open dashboard
kubectl proxy
# Visit: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

---

## 📞 SUPPORT & DOCUMENTATION

- [STEP_BY_STEP_DEPLOYMENT.md](./STEP_BY_STEP_DEPLOYMENT.md) - Complete detailed guide
- [K8S_MANIFESTS_GUIDE.md](./K8S_MANIFESTS_GUIDE.md) - Kubernetes manifest templates
- [SERVICES_INVENTORY.md](./SERVICES_INVENTORY.md) - Service architecture details
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)

