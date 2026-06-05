# 📦 Kubernetes Manifests Setup Guide

## Directory Structure to Create

```
k8s/
├── namespace/
│   └── lawbridge-namespace.yaml
├── configmaps/
│   ├── database-config.yaml
│   ├── redis-config.yaml
│   └── service-urls-config.yaml
├── secrets/
│   ├── postgres-credentials-secret.yaml
│   ├── docker-registry-secret.yaml
│   └── aws-credentials-secret.yaml
├── deployments/
│   ├── auth-service-deployment.yaml
│   ├── client-service-deployment.yaml
│   ├── lawyer-service-deployment.yaml
│   ├── case-service-deployment.yaml
│   ├── document-service-deployment.yaml
│   ├── notification-service-deployment.yaml
│   ├── payment-service-deployment.yaml
│   ├── calendar-service-deployment.yaml
│   ├── monitoring-service-deployment.yaml
│   ├── search-service-deployment.yaml
│   └── ai-assistant-service-deployment.yaml
├── services/
│   ├── auth-service-svc.yaml
│   ├── client-service-svc.yaml
│   ├── lawyer-service-svc.yaml
│   ├── case-service-svc.yaml
│   ├── document-service-svc.yaml
│   ├── notification-service-svc.yaml
│   ├── payment-service-svc.yaml
│   ├── calendar-service-svc.yaml
│   ├── monitoring-service-svc.yaml
│   ├── search-service-svc.yaml
│   └── ai-assistant-service-svc.yaml
├── ingress/
│   ├── ingress-alb.yaml
│   └── ingress-rules.yaml
├── hpa/
│   ├── auth-service-hpa.yaml
│   ├── case-service-hpa.yaml
│   ├── client-service-hpa.yaml
│   ├── lawyer-service-hpa.yaml
│   ├── document-service-hpa.yaml
│   ├── notification-service-hpa.yaml
│   ├── payment-service-hpa.yaml
│   ├── calendar-service-hpa.yaml
│   ├── monitoring-service-hpa.yaml
│   ├── search-service-hpa.yaml
│   └── ai-assistant-service-hpa.yaml
└── pvc/
    ├── document-storage-pvc.yaml
    └── ai-models-pvc.yaml
```

---

## MANIFEST FILES TEMPLATE EXAMPLES

### 1. Namespace (lawbridge-namespace.yaml)
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: lawbridge
  labels:
    name: lawbridge
    environment: production
```

### 2. ConfigMap - Database Config (database-config.yaml)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: database-config
  namespace: lawbridge
data:
  POSTGRES_HOST: "lawbridge-postgres.xxxxx.rds.amazonaws.com"
  POSTGRES_PORT: "5432"
  REDIS_HOST: "lawbridge-redis.xxxxx.cache.amazonaws.com"
  REDIS_PORT: "6379"
  AWS_REGION: "us-east-1"
  AWS_STORAGE_BUCKET_NAME: "lawbridge-documents"
```

### 3. Secret - Database Credentials (postgres-credentials-secret.yaml)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: lawbridge
type: Opaque
stringData:
  username: "postgres"
  password: "YOUR_SECURE_PASSWORD_HERE"
```

### 4. Docker Registry Secret (docker-registry-secret.yaml)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: docker-registry-secret
  namespace: lawbridge
type: kubernetes.io/dockercfg
data:
  .dockercfg: |
    {
      "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com": {
        "auth": "BASE64_ENCODED_AWS_ECR_AUTH"
      }
    }
```

### 5. Sample Deployment - Auth Service (auth-service-deployment.yaml)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: lawbridge
  labels:
    app: auth-service
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
    spec:
      containers:
      - name: auth-service
        image: "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lawbridge/auth-service:latest"
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8001
          name: http
          protocol: TCP
        
        env:
        - name: DB_NAME
          value: "auth_db"
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: POSTGRES_HOST
        - name: DB_PORT
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: POSTGRES_PORT
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: REDIS_HOST
        - name: REDIS_PORT
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: REDIS_PORT
        - name: AWS_REGION
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: AWS_REGION
        - name: ENVIRONMENT
          value: "production"
        - name: DEBUG
          value: "False"
        
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
        
        livenessProbe:
          httpGet:
            path: /api/v1/health/
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /api/v1/health/
            port: 8001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
      
      imagePullSecrets:
      - name: docker-registry-secret
      
      volumes:
      - name: config-volume
        configMap:
          name: database-config
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - auth-service
              topologyKey: kubernetes.io/hostname
```

### 6. Service - Auth Service (auth-service-svc.yaml)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: lawbridge
  labels:
    app: auth-service
spec:
  type: ClusterIP
  selector:
    app: auth-service
  ports:
  - name: http
    port: 8001
    targetPort: 8001
    protocol: TCP
  sessionAffinity: None
```

### 7. Ingress - ALB Configuration (ingress-alb.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lawbridge-ingress
  namespace: lawbridge
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/tags: Environment=production,Application=lawbridge
spec:
  rules:
  - http:
      paths:
      - path: /api/v1/auth/
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 8001
      - path: /api/v1/clients/
        pathType: Prefix
        backend:
          service:
            name: client-service
            port:
              number: 8002
      - path: /api/v1/lawyers/
        pathType: Prefix
        backend:
          service:
            name: lawyer-service
            port:
              number: 8003
      - path: /api/v1/cases/
        pathType: Prefix
        backend:
          service:
            name: case-service
            port:
              number: 8004
      - path: /api/v1/documents/
        pathType: Prefix
        backend:
          service:
            name: document-service
            port:
              number: 8005
      - path: /api/v1/notifications/
        pathType: Prefix
        backend:
          service:
            name: notification-service
            port:
              number: 8006
      - path: /api/v1/payments/
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 8007
      - path: /api/v1/calendar/
        pathType: Prefix
        backend:
          service:
            name: calendar-service
            port:
              number: 8008
      - path: /api/v1/monitoring/
        pathType: Prefix
        backend:
          service:
            name: monitoring-service
            port:
              number: 8009
      - path: /api/v1/search/
        pathType: Prefix
        backend:
          service:
            name: search-service
            port:
              number: 8010
      - path: /api/v1/ai/
        pathType: Prefix
        backend:
          service:
            name: ai-assistant-service
            port:
              number: 8011
```

### 8. HPA - Auth Service (auth-service-hpa.yaml)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: lawbridge
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

### 9. PersistentVolumeClaim - Document Storage (document-storage-pvc.yaml)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: document-storage
  namespace: lawbridge
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: ebs-sc
  resources:
    requests:
      storage: 100Gi
```

### 10. NetworkPolicy (network-policy.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: lawbridge-network-policy
  namespace: lawbridge
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: lawbridge
  - from:
    - namespaceSelector:
        matchLabels:
          name: kube-system
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: lawbridge
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
  - ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
    - protocol: TCP
      port: 443
```

---

## DEPLOYMENT COMMANDS

```bash
# Create namespace
kubectl apply -f k8s/namespace/

# Create ConfigMaps
kubectl apply -f k8s/configmaps/

# Create Secrets
kubectl apply -f k8s/secrets/

# Create Deployments (all 11 services)
kubectl apply -f k8s/deployments/

# Create Services
kubectl apply -f k8s/services/

# Create Ingress (ALB)
kubectl apply -f k8s/ingress/

# Create HPA (autoscaling)
kubectl apply -f k8s/hpa/

# Create PVCs
kubectl apply -f k8s/pvc/

# Verify all resources created
kubectl get all -n lawbridge
```

---

## IMPORTANT NOTES

1. **ECR Registry URL**: Replace `ACCOUNT_ID` with your actual AWS account ID
2. **Database Credentials**: Ensure credentials are secure (stored in Secrets Manager)
3. **Image Pull Secret**: Configure ECR authentication for private images
4. **Resource Limits**: Adjust CPU/Memory based on actual requirements
5. **Replica Counts**: Adjust based on traffic patterns
6. **Health Checks**: Update paths based on your actual API health endpoints

---

## TO GENERATE MANIFESTS AUTOMATICALLY

```bash
#!/bin/bash
# Script to generate all manifests from templates

mkdir -p k8s/{namespace,configmaps,secrets,deployments,services,ingress,hpa,pvc}

# Generate based on service inventory
# For each service:
# - Create deployment
# - Create service
# - Create HPA

# See MANIFEST_GENERATOR.sh for complete automation
```

