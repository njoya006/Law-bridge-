# LAWBRIDGE — AGENT PROMPT: PRAISE
## File 01: DevOps Setup — Docker, Kubernetes (Kind), Jenkins CI/CD
### Week 1, Days 1-2 | Use Claude Opus 4.5 for this entire file

---

## DOCKER COMPOSE — FULL LOCAL STACK

Write this at the project root as docker-compose.yml.
This runs the entire system locally without Kubernetes.
Use this for rapid development and debugging.

```yaml
version: '3.9'

services:

  # ─── API GATEWAY ───────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: lawbridge-gateway
    ports:
      - "80:80"
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - client-service
      - lawyer-service
      - case-service
      - document-service
      - notification-service
      - payment-service
      - calendar-service
      - monitoring-service
      - search-service
      - ai-assistant-service
    networks:
      - lawbridge-network

  # ─── AUTH SERVICE ──────────────────────────────────────
  auth-service:
    build: ./services/auth-service
    container_name: lawbridge-auth
    env_file: .env
    environment:
      DB_HOST: auth-db
      DB_NAME: auth_db
    depends_on:
      auth-db:
        condition: service_healthy
    networks:
      - lawbridge-network
    volumes:
      - ./services/auth-service:/app

  auth-db:
    image: postgres:16-alpine
    container_name: lawbridge-auth-db
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - auth_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── CLIENT SERVICE ────────────────────────────────────
  client-service:
    build: ./services/client-service
    container_name: lawbridge-client
    env_file: .env
    environment:
      DB_HOST: client-db
      DB_NAME: client_db
    depends_on:
      client-db:
        condition: service_healthy
    networks:
      - lawbridge-network

  client-db:
    image: postgres:16-alpine
    container_name: lawbridge-client-db
    environment:
      POSTGRES_DB: client_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - client_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── LAWYER SERVICE ────────────────────────────────────
  lawyer-service:
    build: ./services/lawyer-service
    container_name: lawbridge-lawyer
    env_file: .env
    environment:
      DB_HOST: lawyer-db
      DB_NAME: lawyer_db
    depends_on:
      lawyer-db:
        condition: service_healthy
    networks:
      - lawbridge-network

  lawyer-db:
    image: postgres:16-alpine
    container_name: lawbridge-lawyer-db
    environment:
      POSTGRES_DB: lawyer_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - lawyer_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── CASE SERVICE ──────────────────────────────────────
  case-service:
    build: ./services/case-service
    container_name: lawbridge-case
    env_file: .env
    environment:
      DB_HOST: case-db
      DB_NAME: case_db
    depends_on:
      case-db:
        condition: service_healthy
      redis:
        condition: service_started
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network

  case-db:
    image: postgres:16-alpine
    container_name: lawbridge-case-db
    environment:
      POSTGRES_DB: case_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - case_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── DOCUMENT SERVICE ──────────────────────────────────
  document-service:
    build: ./services/document-service
    container_name: lawbridge-document
    env_file: .env
    environment:
      DB_HOST: document-db
      DB_NAME: doc_db
    depends_on:
      document-db:
        condition: service_healthy
      minio:
        condition: service_started
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network
    volumes:
      - doc_media:/app/media

  document-db:
    image: postgres:16-alpine
    container_name: lawbridge-document-db
    environment:
      POSTGRES_DB: doc_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - document_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── NOTIFICATION SERVICE ──────────────────────────────
  notification-service:
    build: ./services/notification-service
    container_name: lawbridge-notification
    env_file: .env
    environment:
      DB_HOST: notification-db
      DB_NAME: notification_db
      RUN_MAIN: "true"
    depends_on:
      notification-db:
        condition: service_healthy
      redis:
        condition: service_started
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network

  notification-db:
    image: postgres:16-alpine
    container_name: lawbridge-notification-db
    environment:
      POSTGRES_DB: notification_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - notification_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── PAYMENT SERVICE ───────────────────────────────────
  payment-service:
    build: ./services/payment-service
    container_name: lawbridge-payment
    env_file: .env
    environment:
      DB_HOST: payment-db
      DB_NAME: payment_db
    depends_on:
      payment-db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network

  payment-db:
    image: postgres:16-alpine
    container_name: lawbridge-payment-db
    environment:
      POSTGRES_DB: payment_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - payment_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── CALENDAR SERVICE ──────────────────────────────────
  calendar-service:
    build: ./services/calendar-service
    container_name: lawbridge-calendar
    env_file: .env
    environment:
      DB_HOST: calendar-db
      DB_NAME: calendar_db
    depends_on:
      calendar-db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network

  calendar-db:
    image: postgres:16-alpine
    container_name: lawbridge-calendar-db
    environment:
      POSTGRES_DB: calendar_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - calendar_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── MONITORING SERVICE ────────────────────────────────
  monitoring-service:
    build: ./services/monitoring-service
    container_name: lawbridge-monitoring
    env_file: .env
    environment:
      DB_HOST: monitoring-db
      DB_NAME: monitoring_db
    depends_on:
      monitoring-db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - lawbridge-network

  monitoring-db:
    image: postgres:16-alpine
    container_name: lawbridge-monitoring-db
    environment:
      POSTGRES_DB: monitoring_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - monitoring_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── SEARCH SERVICE ────────────────────────────────────
  search-service:
    build: ./services/search-service
    container_name: lawbridge-search
    env_file: .env
    environment:
      DB_HOST: search-db
      DB_NAME: search_db
    depends_on:
      search-db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - lawbridge-network

  search-db:
    image: postgres:16-alpine
    container_name: lawbridge-search-db
    environment:
      POSTGRES_DB: search_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - search_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── AI ASSISTANT SERVICE ──────────────────────────────
  ai-assistant-service:
    build: ./services/ai-assistant-service
    container_name: lawbridge-ai
    env_file: .env
    environment:
      DB_HOST: ai-db
      DB_NAME: ai_db
      OLLAMA_URL: http://ollama:11434
    depends_on:
      ai-db:
        condition: service_healthy
      ollama:
        condition: service_started
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network

  ai-db:
    image: postgres:16-alpine
    container_name: lawbridge-ai-db
    environment:
      POSTGRES_DB: ai_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ai_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network

  # ─── FRONTEND ──────────────────────────────────────────
  frontend:
    build: ./frontend
    container_name: lawbridge-frontend
    env_file: .env
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:80
    networks:
      - lawbridge-network

  # ─── INFRASTRUCTURE ────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: lawbridge-redis
    networks:
      - lawbridge-network
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management
    container_name: lawbridge-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: lawbridge
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "15672:15672"   # Management UI (dev only)
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lawbridge-network
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  minio:
    image: minio/minio:latest
    container_name: lawbridge-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    ports:
      - "9001:9001"     # Console UI (dev only)
    networks:
      - lawbridge-network
    volumes:
      - minio_data:/data

  ollama:
    image: ollama/ollama:latest
    container_name: lawbridge-ollama
    networks:
      - lawbridge-network
    volumes:
      - ollama_data:/root/.ollama
    # Pull Mistral on startup (first run takes ~5 minutes)
    entrypoint: >
      sh -c "ollama serve &
             sleep 5 &&
             ollama pull mistral &&
             ollama pull llama3 &&
             wait"

  celery-worker:
    build: ./services/case-service
    container_name: lawbridge-celery
    command: celery -A core worker -l info
    env_file: .env
    depends_on:
      rabbitmq:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - lawbridge-network

  celery-beat:
    build: ./services/case-service
    container_name: lawbridge-celery-beat
    command: celery -A core beat -l info
    env_file: .env
    depends_on:
      rabbitmq:
        condition: service_healthy
    networks:
      - lawbridge-network

volumes:
  auth_data:
  client_data:
  lawyer_data:
  case_data:
  document_data:
  notification_data:
  payment_data:
  calendar_data:
  monitoring_data:
  search_data:
  ai_data:
  doc_media:
  redis_data:
  rabbitmq_data:
  minio_data:
  ollama_data:

networks:
  lawbridge-network:
    driver: bridge
```

---

## NGINX GATEWAY CONFIG

Write this at gateway/nginx.conf:

```nginx
events { worker_connections 1024; }

http {
    client_max_body_size 50M;

    upstream auth_svc       { server auth-service:8001; }
    upstream client_svc     { server client-service:8002; }
    upstream lawyer_svc     { server lawyer-service:8003; }
    upstream case_svc       { server case-service:8004; }
    upstream document_svc   { server document-service:8005; }
    upstream notification_svc { server notification-service:8006; }
    upstream payment_svc    { server payment-service:8007; }
    upstream calendar_svc   { server calendar-service:8008; }
    upstream monitoring_svc { server monitoring-service:8009; }
    upstream search_svc     { server search-service:8010; }
    upstream ai_svc         { server ai-assistant-service:8011; }
    upstream frontend_svc   { server frontend:3000; }

    server {
        listen 80;

        location /api/v1/auth/       { proxy_pass http://auth_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/clients/    { proxy_pass http://client_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/lawyers/    { proxy_pass http://lawyer_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/cases/      { proxy_pass http://case_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/documents/  { proxy_pass http://document_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/notifications/ { proxy_pass http://notification_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/payments/   { proxy_pass http://payment_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/calendar/   { proxy_pass http://calendar_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/monitoring/ { proxy_pass http://monitoring_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/search/     { proxy_pass http://search_svc; proxy_set_header Authorization $http_authorization; }
        location /api/v1/ai/         { proxy_pass http://ai_svc; proxy_set_header Authorization $http_authorization; }

        # WebSocket for monitoring service
        location /ws/ {
            proxy_pass http://monitoring_svc;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Swagger docs
        location /docs/auth/         { proxy_pass http://auth_svc/api/schema/swagger-ui/; }
        location /docs/cases/        { proxy_pass http://case_svc/api/schema/swagger-ui/; }
        location /docs/lawyers/      { proxy_pass http://lawyer_svc/api/schema/swagger-ui/; }
        location /docs/ai/           { proxy_pass http://ai_svc/api/schema/swagger-ui/; }

        # Frontend (catch-all)
        location / { proxy_pass http://frontend_svc; }
    }
}
```

---

## BASE DOCKERFILE TEMPLATE

All 11 services use this same pattern.
Replace PORT with the actual service port (8001-8011).

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE PORT

CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:PORT"]
```

For monitoring-service (uses ASGI/Daphne for WebSockets):
```dockerfile
CMD ["sh", "-c", "python manage.py migrate && daphne -b 0.0.0.0 -p 8009 core.asgi:application"]
```

---

## KIND KUBERNETES CONFIG

Write this at k8s/kind-config.yaml:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: lawbridge
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 8080
        protocol: TCP
      - containerPort: 443
        hostPort: 8443
        protocol: TCP
  - role: worker
    extraMounts:
      - hostPath: /tmp/lawbridge-data
        containerPath: /data
  - role: worker
    extraMounts:
      - hostPath: /tmp/lawbridge-data
        containerPath: /data
```

Create the cluster:
kind create cluster --config k8s/kind-config.yaml --name lawbridge

Install Nginx Ingress Controller for Kind:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

Wait for ingress to be ready:
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

---

## KUBERNETES BASE MANIFESTS

### k8s/base/namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: lawbridge
  labels:
    app: lawbridge
```

### k8s/base/infrastructure/redis-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: lawbridge
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: lawbridge
spec:
  selector:
    app: redis
  ports:
    - port: 6379
      targetPort: 6379
```

### k8s/base/infrastructure/rabbitmq-statefulset.yaml
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rabbitmq
  namespace: lawbridge
spec:
  serviceName: rabbitmq
  replicas: 1
  selector:
    matchLabels:
      app: rabbitmq
  template:
    metadata:
      labels:
        app: rabbitmq
    spec:
      containers:
        - name: rabbitmq
          image: rabbitmq:3-management
          ports:
            - containerPort: 5672
            - containerPort: 15672
          env:
            - name: RABBITMQ_DEFAULT_USER
              valueFrom:
                secretKeyRef:
                  name: lawbridge-secrets
                  key: RABBITMQ_USER
            - name: RABBITMQ_DEFAULT_PASS
              valueFrom:
                secretKeyRef:
                  name: lawbridge-secrets
                  key: RABBITMQ_PASSWORD
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          volumeMounts:
            - name: rabbitmq-data
              mountPath: /var/lib/rabbitmq
  volumeClaimTemplates:
    - metadata:
        name: rabbitmq-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 2Gi
---
apiVersion: v1
kind: Service
metadata:
  name: rabbitmq
  namespace: lawbridge
spec:
  selector:
    app: rabbitmq
  ports:
    - name: amqp
      port: 5672
      targetPort: 5672
    - name: management
      port: 15672
      targetPort: 15672
```

### k8s/base/infrastructure/ollama-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
  namespace: lawbridge
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      initContainers:
        # Pull models on first deploy
        - name: pull-models
          image: ollama/ollama:latest
          command:
            - sh
            - -c
            - |
              ollama serve &
              sleep 5
              ollama pull mistral
              ollama pull llama3
              ollama pull phi3
          volumeMounts:
            - name: ollama-data
              mountPath: /root/.ollama
      containers:
        - name: ollama
          image: ollama/ollama:latest
          ports:
            - containerPort: 11434
          resources:
            requests:
              memory: "4Gi"
              cpu: "2000m"
            limits:
              memory: "8Gi"
              cpu: "4000m"
          volumeMounts:
            - name: ollama-data
              mountPath: /root/.ollama
      volumes:
        - name: ollama-data
          persistentVolumeClaim:
            claimName: ollama-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ollama-pvc
  namespace: lawbridge
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi    # Mistral (4GB) + LLaMA3 (5GB) + Phi3 (2GB) + buffer
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
  namespace: lawbridge
spec:
  selector:
    app: ollama
  ports:
    - port: 11434
      targetPort: 11434
```

### k8s/base/services/auth-deployment.yaml (template for all services)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: lawbridge
  labels:
    app: auth-service
    version: "1.0"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: lawbridge/auth-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8001
          envFrom:
            - secretRef:
                name: lawbridge-secrets
            - configMapRef:
                name: lawbridge-config
          env:
            - name: DB_HOST
              value: auth-postgres
            - name: DB_NAME
              value: auth_db
          readinessProbe:
            httpGet:
              path: /api/v1/auth/health/
              port: 8001
            initialDelaySeconds: 15
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/v1/auth/health/
              port: 8001
            initialDelaySeconds: 30
            periodSeconds: 20
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: lawbridge
spec:
  selector:
    app: auth-service
  ports:
    - port: 8001
      targetPort: 8001
```

Copy this pattern for all 11 services.
Change name, image, port, DB_HOST, DB_NAME for each.

### k8s/base/ingress/ingress.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lawbridge-ingress
  namespace: lawbridge
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  rules:
    - host: lawbridge.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-gateway
                port:
                  number: 80
```

---

## JENKINS PIPELINE

Write this at jenkins/Jenkinsfile:

```groovy
pipeline {
    agent any

    environment {
        REGISTRY = 'ghcr.io/yourusername'
        KUBECONFIG = credentials('kubeconfig-staging')
        SONAR_TOKEN = credentials('sonarqube-token')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Detect Changed Services') {
            steps {
                script {
                    def changedFiles = sh(
                        script: 'git diff --name-only HEAD~1 HEAD',
                        returnStdout: true
                    ).trim().split('\n')

                    env.CHANGED_SERVICES = changedFiles
                        .findAll { it.startsWith('services/') }
                        .collect { it.split('/')[1] }
                        .unique()
                        .join(',')

                    echo "Changed services: ${env.CHANGED_SERVICES}"
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    def services = env.CHANGED_SERVICES.split(',')
                    services.each { service ->
                        echo "Testing ${service}"
                        sh """
                            cd services/${service}
                            pip install -r requirements.txt
                            pytest --cov=. --cov-report=xml \
                                   --cov-fail-under=80 \
                                   -v
                        """
                    }
                }
            }
            post {
                always {
                    junit '**/test-results/*.xml'
                    cobertura coberturaReportFile: '**/coverage.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                        sonar-scanner \
                          -Dsonar.projectKey=lawbridge \
                          -Dsonar.sources=services/ \
                          -Dsonar.python.coverage.reportPaths=**/coverage.xml
                    """
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    def services = env.CHANGED_SERVICES.split(',')
                    services.each { service ->
                        def imageName = "${REGISTRY}/lawbridge-${service}:${env.GIT_COMMIT_SHORT}"
                        sh """
                            docker build -t ${imageName} services/${service}/
                            docker push ${imageName}
                            docker tag ${imageName} ${REGISTRY}/lawbridge-${service}:latest
                            docker push ${REGISTRY}/lawbridge-${service}:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    kubectl apply -k k8s/overlays/staging/ \
                        --kubeconfig=${KUBECONFIG}
                    kubectl rollout status deployment \
                        -n lawbridge \
                        --timeout=5m \
                        --kubeconfig=${KUBECONFIG}
                '''
            }
        }

        stage('Integration Tests') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    newman run docs/postman/LawBridge_Tests.json \
                        --environment docs/postman/staging-env.json \
                        --reporters cli,junit \
                        --reporter-junit-export results/integration-tests.xml
                '''
            }
            post {
                always {
                    junit 'results/integration-tests.xml'
                }
            }
        }

        stage('Manual Approval — Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?',
                      ok: 'Deploy',
                      submitter: 'praise'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            environment {
                KUBECONFIG = credentials('kubeconfig-production')
            }
            steps {
                sh '''
                    kubectl apply -k k8s/overlays/production/ \
                        --kubeconfig=${KUBECONFIG}
                    kubectl rollout status deployment \
                        -n lawbridge \
                        --timeout=10m \
                        --kubeconfig=${KUBECONFIG}
                '''
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded for commit ${env.GIT_COMMIT_SHORT}"
        }
        failure {
            echo "Pipeline failed — check logs above"
        }
    }
}
```

---

## BASE requirements.txt (all services)

```txt
Django==5.0.6
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
psycopg2-binary==2.9.9
python-decouple==3.8
drf-spectacular==0.27.2
django-cors-headers==4.3.1
redis==5.0.4
pika==1.3.2
requests==2.31.0
celery==5.3.6
django-redis==5.4.0
pytest==8.2.0
pytest-django==4.8.0
pytest-cov==5.0.0
```

Additional for document-service:
```txt
minio==7.2.7
cryptography==42.0.5
pdfplumber==0.11.0
```

Additional for ai-assistant-service:
```txt
langchain==0.2.0
langchain-community==0.2.0
pdfplumber==0.11.0
langdetect==1.0.9
httpx==0.27.0
```

Additional for monitoring-service:
```txt
channels==4.1.0
channels-redis==4.2.0
daphne==4.1.0
```

Additional for search-service:
```txt
langdetect==1.0.9
```
