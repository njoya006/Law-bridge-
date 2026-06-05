# 🚀 LawBridge AWS EKS Deployment - Complete Step-by-Step Guide

## 📋 TABLE OF CONTENTS
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
3. [Phase 2: Container Registry (ECR)](#phase-2-ecr)
4. [Phase 3: Kubernetes Manifests](#phase-3-kubernetes)
5. [Phase 4: PostgreSQL Setup](#phase-4-postgresql)
6. [Phase 5: EKS Cluster Creation](#phase-5-eks)
7. [Phase 6: Jenkins CI/CD](#phase-6-jenkins)
8. [Phase 7: Verification & Deployment](#phase-7-verification)
9. [Post-Deployment](#post-deployment)

---

## PRE-DEPLOYMENT CHECKLIST

### AWS Account Setup
- [ ] AWS account created and verified
- [ ] Billing enabled
- [ ] AWS CLI v2 installed (`aws --version`)
- [ ] AWS credentials configured (`aws configure`)
- [ ] Check AWS account limits/quotas:
  ```bash
  aws service-quotas list-service-quotas --service-code ec2 --region us-east-1
  ```

### Local Tools Required
- [ ] Docker Desktop installed
- [ ] kubectl installed (`kubectl version`)
- [ ] eksctl installed (`eksctl version`)
- [ ] jq installed (`jq --version`)
- [ ] Git installed (`git --version`)

### Repository Ready
- [ ] Clone LawBridge repository
- [ ] All 11 services have Dockerfile (or will be created)
- [ ] .dockerignore files created for each service
- [ ] Environment variables documented

### AWS Service Quotas to Verify
```bash
# Check EC2 instances
aws service-quotas get-service-quota \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --region us-east-1

# Check Elastic IPs
aws service-quotas get-service-quota \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --region us-east-1
```

---

## PHASE 1: INFRASTRUCTURE SETUP

### Step 1.1: Create VPC and Subnets

```bash
# Set variables
export AWS_REGION="us-east-1"
export VPC_CIDR="10.0.0.0/16"
export PUBLIC_SUBNET_1_CIDR="10.0.1.0/24"
export PUBLIC_SUBNET_2_CIDR="10.0.2.0/24"
export PRIVATE_SUBNET_1_CIDR="10.0.10.0/24"
export PRIVATE_SUBNET_2_CIDR="10.0.11.0/24"

# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block $VPC_CIDR \
  --region $AWS_REGION \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC Created: $VPC_ID"

# Enable DNS support
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames \
  --region $AWS_REGION

# Get availability zones
AZ1=$(aws ec2 describe-availability-zones \
  --region $AWS_REGION \
  --query 'AvailabilityZones[0].ZoneName' \
  --output text)

AZ2=$(aws ec2 describe-availability-zones \
  --region $AWS_REGION \
  --query 'AvailabilityZones[1].ZoneName' \
  --output text)

echo "AZs: $AZ1, $AZ2"

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --region $AWS_REGION \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID \
  --region $AWS_REGION

# Create Public Subnets
PUBLIC_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PUBLIC_SUBNET_1_CIDR \
  --availability-zone $AZ1 \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

PUBLIC_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PUBLIC_SUBNET_2_CIDR \
  --availability-zone $AZ2 \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

# Create Private Subnets
PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_SUBNET_1_CIDR \
  --availability-zone $AZ1 \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block $PRIVATE_SUBNET_2_CIDR \
  --availability-zone $AZ2 \
  --region $AWS_REGION \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Public Subnet 1: $PUBLIC_SUBNET_1"
echo "Public Subnet 2: $PUBLIC_SUBNET_2"
echo "Private Subnet 1: $PRIVATE_SUBNET_1"
echo "Private Subnet 2: $PRIVATE_SUBNET_2"

# Save to file for later use
cat > /tmp/vpc-config.sh << EOF
export VPC_ID=$VPC_ID
export IGW_ID=$IGW_ID
export PUBLIC_SUBNET_1=$PUBLIC_SUBNET_1
export PUBLIC_SUBNET_2=$PUBLIC_SUBNET_2
export PRIVATE_SUBNET_1=$PRIVATE_SUBNET_1
export PRIVATE_SUBNET_2=$PRIVATE_SUBNET_2
export AZ1=$AZ1
export AZ2=$AZ2
export AWS_REGION=$AWS_REGION
EOF

source /tmp/vpc-config.sh
```

### Step 1.2: Create Security Groups

```bash
source /tmp/vpc-config.sh

# ALB Security Group
ALB_SG=$(aws ec2 create-security-group \
  --group-name lawbridge-alb-sg \
  --description "Security group for LawBridge ALB" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

# Allow HTTP/HTTPS to ALB
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION

# Services Security Group
SERVICES_SG=$(aws ec2 create-security-group \
  --group-name lawbridge-services-sg \
  --description "Security group for EKS services" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

# Allow traffic from ALB to services (ports 8001-8011)
for port in {8001..8011}; do
  aws ec2 authorize-security-group-ingress \
    --group-id $SERVICES_SG \
    --protocol tcp \
    --port $port \
    --source-security-group-id $ALB_SG \
    --region $AWS_REGION
done

# Allow inter-service communication
aws ec2 authorize-security-group-ingress \
  --group-id $SERVICES_SG \
  --protocol tcp \
  --port 0-65535 \
  --source-security-group-id $SERVICES_SG \
  --region $AWS_REGION

# RDS Security Group
RDS_SG=$(aws ec2 create-security-group \
  --group-name lawbridge-rds-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id $VPC_ID \
  --region $AWS_REGION \
  --query 'GroupId' \
  --output text)

# Allow PostgreSQL from services
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id $SERVICES_SG \
  --region $AWS_REGION

# Save SG IDs
cat >> /tmp/vpc-config.sh << EOF
export ALB_SG=$ALB_SG
export SERVICES_SG=$SERVICES_SG
export RDS_SG=$RDS_SG
EOF

source /tmp/vpc-config.sh
echo "Security Groups Created: ALB_SG=$ALB_SG, SERVICES_SG=$SERVICES_SG, RDS_SG=$RDS_SG"
```

---

## PHASE 2: ECR (ELASTIC CONTAINER REGISTRY)

### Step 2.1: Create ECR Repositories for All 11 Services

```bash
source /tmp/vpc-config.sh

# List of all 11 services
SERVICES=(
  "auth-service"
  "client-service"
  "lawyer-service"
  "case-service"
  "document-service"
  "notification-service"
  "payment-service"
  "calendar-service"
  "monitoring-service"
  "search-service"
  "ai-assistant-service"
)

# Create repositories
for service in "${SERVICES[@]}"; do
  echo "Creating ECR repository for $service..."
  
  aws ecr create-repository \
    --repository-name lawbridge/$service \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES \
    2>/dev/null || echo "Repository already exists: $service"
done

# Get ECR registry URL
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "ECR Registry: $ECR_REGISTRY"

# Save to config
cat >> /tmp/vpc-config.sh << EOF
export ACCOUNT_ID=$ACCOUNT_ID
export ECR_REGISTRY=$ECR_REGISTRY
EOF
```

### Step 2.2: Build and Push Docker Images

```bash
source /tmp/vpc-config.sh

cd /path/to/lawbridge-repo  # Change to your repo directory

# Login to ECR
aws ecr get-login-password \
  --region $AWS_REGION | docker login \
  --username AWS \
  --password-stdin $ECR_REGISTRY

# Build and push each service
for service in "${SERVICES[@]}"; do
  echo "Building and pushing $service..."
  
  SERVICE_PATH="./services/$service"
  
  docker build \
    -t $ECR_REGISTRY/lawbridge/$service:latest \
    -t $ECR_REGISTRY/lawbridge/$service:$(git rev-parse --short HEAD) \
    -f $SERVICE_PATH/Dockerfile \
    $SERVICE_PATH
  
  docker push $ECR_REGISTRY/lawbridge/$service:latest
  docker push $ECR_REGISTRY/lawbridge/$service:$(git rev-parse --short HEAD)
done

echo "All images pushed to ECR!"
```

---

## PHASE 3: RDS POSTGRESQL SETUP

### Step 3.1: Create RDS PostgreSQL Instance

```bash
source /tmp/vpc-config.sh

# RDS Configuration
export DB_IDENTIFIER="lawbridge-postgres"
export DB_CLASS="db.r6i.xlarge"  # Adjust based on your needs
export DB_ENGINE="postgres"
export DB_VERSION="16.1"
export MASTER_USERNAME="postgres"
export MASTER_PASSWORD="ChangeMe123456789!"  # Change this!
export ALLOCATED_STORAGE="200"
export BACKUP_RETENTION="30"

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier $DB_IDENTIFIER \
  --db-instance-class $DB_CLASS \
  --engine $DB_ENGINE \
  --engine-version $DB_VERSION \
  --master-username $MASTER_USERNAME \
  --master-user-password "$MASTER_PASSWORD" \
  --allocated-storage $ALLOCATED_STORAGE \
  --backup-retention-period $BACKUP_RETENTION \
  --multi-az \
  --publicly-accessible false \
  --storage-encrypted true \
  --storage-type gp3 \
  --iops 3000 \
  --db-subnet-group-name default \
  --vpc-security-group-ids $RDS_SG \
  --copy-tags-to-snapshot \
  --enable-cloudwatch-logs-exports postgresql \
  --region $AWS_REGION

# Wait for instance to be available (5-10 minutes)
echo "Waiting for RDS instance to be available..."
aws rds wait db-instance-available \
  --db-instance-identifier $DB_IDENTIFIER \
  --region $AWS_REGION

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_IDENTIFIER \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text \
  --region $AWS_REGION)

echo "RDS Endpoint: $RDS_ENDPOINT"

cat >> /tmp/vpc-config.sh << EOF
export DB_IDENTIFIER=$DB_IDENTIFIER
export DB_CLASS=$DB_CLASS
export MASTER_USERNAME=$MASTER_USERNAME
export MASTER_PASSWORD="$MASTER_PASSWORD"
export RDS_ENDPOINT=$RDS_ENDPOINT
EOF
```

### Step 3.2: Create 11 Databases on RDS

```bash
source /tmp/vpc-config.sh

# Install postgresql-client if not available
# brew install libpq (macOS)
# sudo apt-get install postgresql-client (Ubuntu)

# Create all 11 databases
DATABASES=(
  "auth_db"
  "client_db"
  "lawyer_db"
  "case_db"
  "doc_db"
  "notification_db"
  "payment_db"
  "calendar_db"
  "monitoring_db"
  "search_db"
  "ai_db"
)

for db in "${DATABASES[@]}"; do
  echo "Creating database: $db"
  
  PGPASSWORD=$MASTER_PASSWORD psql \
    -h $RDS_ENDPOINT \
    -U $MASTER_USERNAME \
    -d postgres \
    -c "CREATE DATABASE $db ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8';"
done

# Verify databases created
echo "Verifying databases..."
PGPASSWORD=$MASTER_PASSWORD psql \
  -h $RDS_ENDPOINT \
  -U $MASTER_USERNAME \
  -d postgres \
  -c "\l"

echo "All 11 databases created successfully!"
```

---

## PHASE 4: ELASTICACHE REDIS SETUP

```bash
source /tmp/vpc-config.sh

# Create ElastiCache subnet group
SUBNET_IDS="$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2"

aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name lawbridge-redis-subnet \
  --description "Subnet group for LawBridge Redis" \
  --subnet-ids $SUBNET_IDS \
  --region $AWS_REGION

# Create Redis cluster
REDIS_CLUSTER=$(aws elasticache create-cache-cluster \
  --cache-cluster-id lawbridge-redis \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --vpc-security-group-ids $SERVICES_SG \
  --cache-subnet-group-name lawbridge-redis-subnet \
  --auto-failover-enabled \
  --region $AWS_REGION \
  --query 'CacheCluster.CacheClusterId' \
  --output text)

# Wait for Redis to be available
echo "Waiting for Redis to be available..."
aws elasticache wait cache-cluster-available \
  --cache-cluster-id $REDIS_CLUSTER \
  --region $AWS_REGION

# Get Redis endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id $REDIS_CLUSTER \
  --show-cache-node-info \
  --region $AWS_REGION \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

echo "Redis Endpoint: $REDIS_ENDPOINT"

cat >> /tmp/vpc-config.sh << EOF
export REDIS_ENDPOINT=$REDIS_ENDPOINT
export REDIS_CLUSTER=$REDIS_CLUSTER
EOF
```

---

## PHASE 5: EKS CLUSTER CREATION

### Step 5.1: Create EKS Cluster with eksctl

```bash
source /tmp/vpc-config.sh

# Create cluster configuration file
cat > /tmp/eks-cluster.yaml << EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: lawbridge
  region: $AWS_REGION
  version: "1.28"

vpc:
  id: $VPC_ID
  subnets:
    public:
      AZ1:
        id: $PUBLIC_SUBNET_1
      AZ2:
        id: $PUBLIC_SUBNET_2
    private:
      AZ1:
        id: $PRIVATE_SUBNET_1
      AZ2:
        id: $PRIVATE_SUBNET_2

nodeGroups:
  - name: lawbridge-nodes
    instanceType: t3.xlarge
    desiredCapacity: 3
    minSize: 2
    maxSize: 6
    subnets:
      - $PRIVATE_SUBNET_1
      - $PRIVATE_SUBNET_2
    securityGroups:
      - $SERVICES_SG
    tags:
      Environment: production
      Application: lawbridge

iam:
  withOIDC: true
  serviceAccounts:
    - metadata:
        name: ebs-csi-controller-sa
        namespace: kube-system
      attachPolicies:
        - arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy
    - metadata:
        name: alb-ingress-controller
        namespace: kube-system
      attachPolicies:
        - arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess

addons:
  - name: vpc-cni
    version: latest
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest
  - name: ebs-csi-driver
    version: latest
EOF

# Create the cluster
echo "Creating EKS cluster... (this takes 15-20 minutes)"
eksctl create cluster -f /tmp/eks-cluster.yaml

# Update kubeconfig
aws eks update-kubeconfig \
  --region $AWS_REGION \
  --name lawbridge

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

### Step 5.2: Install ALB Ingress Controller

```bash
# Create service account
kubectl apply -k github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=v2.6.0

# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install ALB Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=lawbridge \
  --set serviceAccount.create=true \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::$ACCOUNT_ID:role/AmazonEKSLoadBalancerControllerRole"

# Verify ALB controller
kubectl get deployment -n kube-system aws-load-balancer-controller
```

---

## PHASE 6: KUBERNETES MANIFESTS DEPLOYMENT

### Step 6.1: Create Namespace

```bash
kubectl create namespace lawbridge
kubectl label namespace lawbridge name=lawbridge
```

### Step 6.2: Create Secrets

```bash
source /tmp/vpc-config.sh

# PostgreSQL credentials secret
kubectl create secret generic postgres-credentials \
  --from-literal=username=$MASTER_USERNAME \
  --from-literal=password="$MASTER_PASSWORD" \
  -n lawbridge

# Database endpoints ConfigMap
kubectl create configmap database-config \
  --from-literal=POSTGRES_HOST=$RDS_ENDPOINT \
  --from-literal=POSTGRES_PORT=5432 \
  --from-literal=REDIS_HOST=$REDIS_ENDPOINT \
  --from-literal=REDIS_PORT=6379 \
  -n lawbridge
```

### Step 6.3: Deploy Services

For each of the 11 services, apply deployment manifests:

```bash
# Apply all manifests
kubectl apply -f k8s/namespace/ -n lawbridge
kubectl apply -f k8s/configmaps/ -n lawbridge
kubectl apply -f k8s/secrets/ -n lawbridge
kubectl apply -f k8s/deployments/ -n lawbridge
kubectl apply -f k8s/services/ -n lawbridge
kubectl apply -f k8s/ingress/ -n lawbridge
kubectl apply -f k8s/hpa/ -n lawbridge

# Verify deployments
kubectl get deployments -n lawbridge
kubectl get pods -n lawbridge
```

---

## PHASE 7: DATABASE MIGRATIONS

### Step 7.1: Run Django Migrations

```bash
source /tmp/vpc-config.sh

# List of services to migrate (order matters!)
MIGRATION_SERVICES=(
  "auth-service"
  "client-service"
  "lawyer-service"
  "case-service"
  "document-service"
  "notification-service"
  "payment-service"
  "calendar-service"
  "monitoring-service"
  "search-service"
  "ai-assistant-service"
)

# Create migration pod for each service
for service in "${MIGRATION_SERVICES[@]}"; do
  echo "Running migrations for $service..."
  
  kubectl run migration-$service \
    --image=$ECR_REGISTRY/lawbridge/$service:latest \
    --restart=Never \
    --env="DB_HOST=$RDS_ENDPOINT" \
    --env="DB_PORT=5432" \
    -n lawbridge \
    -- python manage.py migrate
  
  # Wait for migration to complete
  kubectl wait --for=condition=Ready pod/migration-$service \
    -n lawbridge \
    --timeout=300s || true
  
  # Check migration logs
  kubectl logs migration-$service -n lawbridge
done

echo "All migrations completed!"
```

---

## PHASE 7: VERIFICATION & MONITORING

### Step 7.1: Verify Pods and Services

```bash
# Check pod status
kubectl get pods -n lawbridge -o wide

# Check service endpoints
kubectl get svc -n lawbridge

# Check ingress
kubectl get ingress -n lawbridge

# Get ALB DNS name
ALB_DNS=$(kubectl get ingress -n lawbridge \
  -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}')

echo "Application is available at: http://$ALB_DNS"
```

### Step 7.2: Monitor Logs

```bash
# View logs from specific service
kubectl logs -f deployment/auth-service -n lawbridge

# View logs from all pods
kubectl logs -f -l app=auth-service -n lawbridge

# View pod events
kubectl describe pod <pod-name> -n lawbridge
```

### Step 7.3: Health Checks

```bash
# Test API endpoints
curl -X GET http://$ALB_DNS/api/v1/health/

# Check service connectivity
kubectl exec -it <pod-name> -n lawbridge -- curl http://client-service:8002/health/

# Verify database connectivity
kubectl exec -it <pod-name> -n lawbridge -- psql -h $RDS_ENDPOINT -U postgres -c "\l"

# Test Redis connectivity
kubectl exec -it <pod-name> -n lawbridge -- redis-cli -h $REDIS_ENDPOINT ping
```

---

## POST-DEPLOYMENT

### Step 8.1: Update Frontend (Vercel)

```bash
# Get ALB DNS
ALB_DNS=$(kubectl get ingress -n lawbridge \
  -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}')

# Update Vercel environment variables
# Go to: https://vercel.com/dashboard/project/lawbridge-frontend/settings/environment-variables

# Add/Update:
# NEXT_PUBLIC_API_URL=http://$ALB_DNS
# API_GATEWAY_URL=http://$ALB_DNS

# Redeploy frontend
# git push to trigger redeploy on Vercel
```

### Step 8.2: Enable Auto-Scaling

```bash
# Create Horizontal Pod Autoscalers
kubectl autoscale deployment auth-service \
  --min=2 --max=5 \
  -n lawbridge

# Monitor HPA status
kubectl get hpa -n lawbridge -w
```

### Step 8.3: Set Up Monitoring (Optional)

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace

# Install Grafana for visualization (optional)
helm install grafana grafana/grafana \
  -n monitoring
```

### Step 8.4: Backup Strategy

```bash
# Enable automated backups for RDS (already enabled with backup-retention-period=30)

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier $DB_IDENTIFIER \
  --db-snapshot-identifier lawbridge-backup-$(date +%Y%m%d-%H%M%S) \
  --region $AWS_REGION

# Backup persistent volumes (EBS snapshots)
# Configure snapshots via AWS Console or CLI
```

---

## COMPLETE EXECUTION SUMMARY

### Services Deployed (11 Total)
1. ✅ Auth Service (Port 8001) → auth_db
2. ✅ Client Service (Port 8002) → client_db
3. ✅ Lawyer Service (Port 8003) → lawyer_db
4. ✅ Case Service (Port 8004) → case_db
5. ✅ Document Service (Port 8005) → doc_db
6. ✅ Notification Service (Port 8006) → notification_db
7. ✅ Payment Service (Port 8007) → payment_db
8. ✅ Calendar Service (Port 8008) → calendar_db
9. ✅ Monitoring Service (Port 8009) → monitoring_db
10. ✅ Search Service (Port 8010) → search_db
11. ✅ AI Assistant Service (Port 8011) → ai_db

### Infrastructure Components
- ✅ VPC with public/private subnets
- ✅ RDS PostgreSQL (db.r6i.xlarge) with 11 databases
- ✅ ElastiCache Redis (cache.r6g.large)
- ✅ EKS Cluster (3 nodes, t3.xlarge)
- ✅ ALB Ingress Controller
- ✅ Security Groups & Network Configuration

### Total Estimated Deployment Time
- Infrastructure: 30 minutes
- EKS Cluster: 15-20 minutes
- Container Builds & Pushes: 10-15 minutes
- Deployment & Verification: 10 minutes
- **TOTAL: 65-75 minutes**

### Total Estimated Monthly Cost
- RDS PostgreSQL: ~$450/month
- ElastiCache Redis: ~$120/month
- EKS Nodes (3x t3.xlarge): ~$300/month
- ALB: ~$50/month
- Data Transfer: ~$50/month
- **TOTAL: ~$970/month**

---

## TROUBLESHOOTING

### RDS Connection Issues
```bash
# Test connectivity from pod
kubectl exec -it <pod-name> -n lawbridge -- \
  nc -zv $RDS_ENDPOINT 5432

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $RDS_SG \
  --region $AWS_REGION
```

### Pod Not Starting
```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n lawbridge

# Check container logs
kubectl logs <pod-name> -n lawbridge --previous

# Check events
kubectl get events -n lawbridge
```

### ALB Not Routing Traffic
```bash
# Check ingress status
kubectl describe ingress -n lawbridge

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region $AWS_REGION
```

---

## QUICK REFERENCE COMMANDS

```bash
# Save config for future use
source /tmp/vpc-config.sh

# Get cluster info
kubectl cluster-info

# Get all resources
kubectl get all -n lawbridge

# Get service endpoints
kubectl get endpoints -n lawbridge

# Scale deployment
kubectl scale deployment auth-service --replicas=5 -n lawbridge

# Update image
kubectl set image deployment/auth-service \
  auth-service=$ECR_REGISTRY/lawbridge/auth-service:v2 \
  -n lawbridge

# Port forward to local machine
kubectl port-forward svc/auth-service 8001:8001 -n lawbridge

# Get logs from all pods
kubectl logs -f deployment/auth-service -n lawbridge

# Execute command in pod
kubectl exec -it <pod-name> -n lawbridge -- /bin/bash

# Delete deployment
kubectl delete deployment auth-service -n lawbridge

# Restart deployment
kubectl rollout restart deployment/auth-service -n lawbridge
```

---

**🎉 Deployment Complete! Your LawBridge application is now running on AWS EKS.**
