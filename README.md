# Prometheus Kubernetes Monitoring POC

A proof-of-concept application demonstrating Node.js/Express monitoring with Prometheus, orchestrated on Kubernetes, and deployed via GitHub Actions to DigitalOcean.

## Overview

This project implements a complete monitoring system featuring:

- **Backend Application**: Express server with variable latency routes (`/fast`, `/slow`)
- **Integrated Metrics**: Prometheus metrics via `prom-client` and `response-time` middleware
- **Internal Cron Jobs**: Automated traffic generation for continuous monitoring
- **Prometheus Server**: Metrics collection and visualization
- **Kubernetes Orchestration**: Deployments, services, and persistent storage
- **CI/CD Pipeline**: Automated build and deployment via GitHub Actions

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                       │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Backend Pods    │         │  Prometheus Pod  │          │
│  │  (2 replicas)    │◄────────│  (1 replica)     │          │
│  │                  │ scrape  │                  │          │
│  │  - /fast route   │ metrics │  - Metrics DB    │          │
│  │  - /slow route   │         │  - Query Engine  │          │
│  │  - /metrics      │         │                  │          │
│  │  - Cron Jobs     │         │                  │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                    │
│           │                            │                    │
│  ┌────────▼────────┐         ┌─────────▼────────┐           │
│  │ Backend Service │         │Prometheus Service│           │
│  │  (ClusterIP)    │         │  (LoadBalancer)  │           │
│  └─────────────────┘         └──────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** (LTS version recommended)
- **PNPM** (Package manager)
- **Docker** (For containerization)
- **kubectl** (Kubernetes CLI)
- **doctl** (DigitalOcean CLI)
- **Git** (Version control)

### Installing Prerequisites

#### Node.js and PNPM

```bash
# Install Node.js 20 (using nvm)
nvm install 20
nvm use 20

# Install PNPM globally
npm install -g pnpm
```

#### Docker

- **macOS**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow [Docker Engine installation](https://docs.docker.com/engine/install/)
- **Windows**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

Enable Kubernetes in Docker Desktop for local development:
1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"

#### kubectl

```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Windows (using Chocolatey)
choco install kubernetes-cli
```

#### doctl (DigitalOcean CLI)

```bash
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf ~/doctl-1.104.0-linux-amd64.tar.gz
sudo mv ~/doctl /usr/local/bin

# Windows (using Chocolatey)
choco install doctl
```

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd prometheus-k8s-monitoring-poc
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### 4. Run Locally (Development Mode)

```bash
# Start the development server with hot reload
pnpm dev

# Or build and run production mode
pnpm build
pnpm start
```

The application will be available at:
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics

### 5. Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Backend: http://localhost:3000
- Prometheus: http://localhost:9090

### 6. Code Quality

```bash
# Run linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check
```

## DigitalOcean Setup

### 1. Install and Configure doctl

#### Authenticate with DigitalOcean

```bash
# Initialize doctl with your API token
doctl auth init

# You'll be prompted to enter your DigitalOcean API token
# Get your token from: https://cloud.digitalocean.com/account/api/tokens
```

Verify authentication:

```bash
doctl account get
```

### 2. Create DigitalOcean Container Registry (DOCR)

```bash
# Create a new container registry
doctl registry create <registry-name>

# Example:
doctl registry create my-monitoring-poc

# Get registry information
doctl registry get
```

#### Authenticate Docker with DOCR

```bash
# Login to DigitalOcean Container Registry
doctl registry login

# This configures Docker to authenticate with your DOCR
```

### 3. Create DigitalOcean Kubernetes Cluster (DOKS)

```bash
# List available regions
doctl kubernetes options regions

# List available node sizes
doctl kubernetes options sizes

# Create a Kubernetes cluster
doctl kubernetes cluster create <cluster-name> \
  --region nyc1 \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=3" \
  --auto-upgrade=true \
  --maintenance-window "saturday=02:00"

# Example:
doctl kubernetes cluster create monitoring-poc-cluster \
  --region nyc1 \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=3"
```

This will take several minutes to provision.

#### Configure kubectl to Access DOKS Cluster

```bash
# Save cluster kubeconfig to your local kubectl config
doctl kubernetes cluster kubeconfig save <cluster-name>

# Example:
doctl kubernetes cluster kubeconfig save monitoring-poc-cluster

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 4. Set Up Local Environment Variables

Create a `.env` file matching GitHub Actions configuration:

```bash
# .env
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
DOCR_TOKEN=your-digitalocean-api-token
DO_REGISTRY_NAME=your-registry-name
DO_CLUSTER_NAME=your-cluster-name
```

**Important**: Never commit `.env` to version control. It's already in `.gitignore`.

## GitHub Actions Configuration

### Configure GitHub Secrets

Navigate to your GitHub repository settings and add the following secrets:

**Settings → Secrets and variables → Actions → New repository secret**

Required secrets:

1. **DOCR_TOKEN**
   - Your DigitalOcean API token
   - Get from: https://cloud.digitalocean.com/account/api/tokens
   - Needs read/write access to Container Registry and Kubernetes

2. **DO_REGISTRY_NAME**
   - Your DOCR registry name
   - Example: `my-monitoring-poc`
   - Get from: `doctl registry get`

3. **DO_CLUSTER_NAME**
   - Your DOKS cluster name
   - Example: `monitoring-poc-cluster`
   - Get from: `doctl kubernetes cluster list`

### Workflow Trigger

The GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers on:
- Push to `main` branch
- Manual workflow dispatch

The pipeline will:
1. Build and lint the application
2. Build Docker images for backend and Prometheus
3. Push images to DOCR
4. Deploy to DOKS cluster
5. Verify deployment rollout

## Deployment

### Deploy to Local Kubernetes

#### 1. Build Docker Images

```bash
# Build backend image
docker build -t backend:local .

# Build Prometheus image
docker build -t prometheus:local -f Dockerfile.prometheus .
```

#### 2. Update Kubernetes Manifests

Edit `k8s/*.yaml` files to use local image tags:

```yaml
# In k8s/backend-deployment.yaml and k8s/prometheus-deployment.yaml
image: backend:local  # or prometheus:local
imagePullPolicy: Never  # Use local images
```

#### 3. Deploy to Local Cluster

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Verify deployments
kubectl get deployments
kubectl get pods
kubectl get services
```

#### 4. Access Services Locally

```bash
# Port forward backend service
kubectl port-forward svc/backend-service 3000:3000

# Port forward Prometheus service (in another terminal)
kubectl port-forward svc/prometheus-service 9090:9090
```

Access:
- Backend: http://localhost:3000
- Prometheus: http://localhost:9090

### Deploy to DigitalOcean Kubernetes (DOKS)

#### 1. Build and Push Images to DOCR

```bash
# Set your registry name
export REGISTRY_NAME=your-registry-name

# Build and tag backend image
docker build -t registry.digitalocean.com/$REGISTRY_NAME/backend:latest .
docker push registry.digitalocean.com/$REGISTRY_NAME/backend:latest

# Build and tag Prometheus image
docker build -t registry.digitalocean.com/$REGISTRY_NAME/prometheus:latest -f Dockerfile.prometheus .
docker push registry.digitalocean.com/$REGISTRY_NAME/prometheus:latest
```

#### 2. Update Kubernetes Manifests

Update image references in `k8s/backend-deployment.yaml` and `k8s/prometheus-deployment.yaml`:

```yaml
image: registry.digitalocean.com/your-registry-name/backend:latest
```

#### 3. Deploy to DOKS

```bash
# Ensure kubectl is configured for DOKS
doctl kubernetes cluster kubeconfig save <cluster-name>

# Apply all manifests
kubectl apply -f k8s/

# Watch deployment progress
kubectl rollout status deployment/backend
kubectl rollout status deployment/prometheus

# Get all resources
kubectl get all
```

#### 4. Access Services

```bash
# Get LoadBalancer external IP for Prometheus
kubectl get svc prometheus-service

# Wait for EXTERNAL-IP to be assigned (may take a few minutes)
# Access Prometheus at: http://<EXTERNAL-IP>:9090
```

For backend service (ClusterIP), use port forwarding or create an Ingress:

```bash
kubectl port-forward svc/backend-service 3000:3000
```

### Automated Deployment via GitHub Actions

Simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

Monitor the deployment in GitHub Actions tab.

## API Documentation

### Endpoints

#### GET /fast

Simulates a fast response with random latency between 0-500ms.

**Response:**
```json
{
  "message": "Fast response",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "latency": 234
}
```

**Status Codes:**
- `200 OK`: Successful response

#### GET /slow

Simulates a slow response with random latency between 500-1000ms.

**Response:**
```json
{
  "message": "Slow response",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "latency": 756
}
```

**Status Codes:**
- `200 OK`: Successful response

#### GET /metrics

Exposes Prometheus metrics in text format.

**Response:**
```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.005",method="GET",route="/fast",status_code="200"} 0
http_request_duration_seconds_bucket{le="0.05",method="GET",route="/fast",status_code="200"} 5
...

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/fast",status_code="200"} 42
...

# HELP nodejs_heap_size_total_bytes Total heap size
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes 25165824
...
```

**Status Codes:**
- `200 OK`: Metrics successfully exposed

**Content-Type:** `text/plain; version=0.0.4`

#### GET /health

Health check endpoint for Kubernetes probes.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "uptime": 3600
}
```

**Status Codes:**
- `200 OK`: Service is healthy

## Prometheus Monitoring

### Accessing Prometheus UI

- **Local**: http://localhost:9090
- **DOKS**: http://\<EXTERNAL-IP\>:9090

### Example Queries

#### Request Rate

Total requests per second across all routes:

```promql
rate(http_requests_total[5m])
```

Requests per second by route:

```promql
sum(rate(http_requests_total[5m])) by (route)
```

#### Error Rate

5xx errors per second:

```promql
rate(http_requests_total{status_code=~"5.."}[5m])
```

Error percentage:

```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
/ 
sum(rate(http_requests_total[5m])) * 100
```

#### Latency Metrics

P50 (median) latency:

```promql
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
```

P95 latency:

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

P99 latency:

```promql
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

Average latency by route:

```promql
rate(http_request_duration_seconds_sum[5m]) 
/ 
rate(http_request_duration_seconds_count[5m])
```

#### Node.js Metrics

Event loop lag:

```promql
nodejs_eventloop_lag_seconds
```

Heap memory usage:

```promql
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100
```

Garbage collection duration:

```promql
rate(nodejs_gc_duration_seconds_sum[5m])
```

#### Kubernetes Metrics

Pod restarts:

```promql
kube_pod_container_status_restarts_total{pod=~"backend.*"}
```

### Creating Dashboards

1. Open Prometheus UI
2. Go to Graph tab
3. Enter a query from above
4. Click "Execute"
5. Switch to "Graph" view for visualization

For advanced dashboards, consider integrating Grafana.

## Troubleshooting

### Local Development Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### PNPM Installation Fails

```bash
# Clear PNPM cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t backend:local .
```

### Kubernetes Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl get pods

# Describe pod for events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check previous logs if pod restarted
kubectl logs <pod-name> --previous
```

#### ImagePullBackOff Error

This usually means Kubernetes can't pull the image from DOCR.

```bash
# Verify image exists in registry
doctl registry repository list-tags <repository-name>

# Create image pull secret
kubectl create secret docker-registry docr-secret \
  --docker-server=registry.digitalocean.com \
  --docker-username=<your-email> \
  --docker-password=<your-docr-token>

# Add to deployment
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "docr-secret"}]}'
```

#### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints

# Check if pods are ready
kubectl get pods

# Verify service selector matches pod labels
kubectl describe service <service-name>
```

#### Persistent Volume Issues

```bash
# Check PVC status
kubectl get pvc

# Describe PVC for events
kubectl describe pvc prometheus-pvc

# Check if storage class exists
kubectl get storageclass
```

### DigitalOcean Issues

#### doctl Authentication Fails

```bash
# Re-authenticate
doctl auth init

# List auth contexts
doctl auth list

# Switch context
doctl auth switch --context <context-name>
```

#### Cannot Access DOKS Cluster

```bash
# Refresh kubeconfig
doctl kubernetes cluster kubeconfig save <cluster-name>

# Verify cluster is running
doctl kubernetes cluster list

# Check cluster health
kubectl get nodes
kubectl get componentstatuses
```

#### DOCR Push Fails

```bash
# Re-login to registry
doctl registry login

# Verify registry exists
doctl registry get

# Check registry quota
doctl registry get
```

### GitHub Actions Issues

#### Workflow Fails on Build

- Check Node.js version matches (20+)
- Verify all dependencies are in `package.json`
- Check BiomeJS configuration is valid

#### Workflow Fails on Docker Push

- Verify `DOCR_TOKEN` secret is set correctly
- Ensure token has write access to registry
- Check registry name matches `DO_REGISTRY_NAME`

#### Workflow Fails on Deploy

- Verify `DO_CLUSTER_NAME` secret is correct
- Ensure cluster is running: `doctl kubernetes cluster list`
- Check kubectl can access cluster
- Verify image tags in manifests match pushed images

### Metrics Issues

#### /metrics Endpoint Returns Empty

```bash
# Check if prom-client is initialized
# Verify middleware is registered before routes
# Check logs for errors
kubectl logs <backend-pod-name>
```

#### Prometheus Not Scraping Metrics

```bash
# Check Prometheus targets
# Open Prometheus UI → Status → Targets
# Verify backend-service is reachable from Prometheus pod

# Test connectivity
kubectl exec -it <prometheus-pod> -- wget -O- http://backend-service:3000/metrics
```

#### Cron Jobs Not Running

```bash
# Check application logs
kubectl logs <backend-pod-name>

# Verify cron schedule is correct
# Check if HTTP client can reach localhost:3000
```

### Performance Issues

#### High Memory Usage

```bash
# Check resource usage
kubectl top pods

# Increase memory limits in deployment
# Check for memory leaks in application logs
```

#### High CPU Usage

```bash
# Check CPU usage
kubectl top pods

# Scale deployment
kubectl scale deployment/backend --replicas=3

# Investigate slow queries or inefficient code
```

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline
├── k8s/
│   ├── backend-deployment.yaml # Backend Kubernetes deployment
│   ├── backend-service.yaml    # Backend service
│   ├── prometheus-configmap.yaml # Prometheus configuration
│   ├── prometheus-deployment.yaml # Prometheus deployment
│   ├── prometheus-pvc.yaml     # Persistent volume claim
│   └── prometheus-service.yaml # Prometheus service
├── src/
│   ├── config/
│   │   └── prometheus.ts       # Prometheus client configuration
│   ├── cron/
│   │   └── jobs.ts             # Cron job definitions
│   ├── middleware/
│   │   └── metrics.middleware.ts # Metrics collection middleware
│   ├── routes/
│   │   ├── fast.route.ts       # /fast endpoint
│   │   ├── slow.route.ts       # /slow endpoint
│   │   ├── metrics.route.ts    # /metrics endpoint
│   │   └── health.route.ts     # /health endpoint
│   ├── index.ts                # Express app setup
│   └── server.ts               # Server initialization
├── Dockerfile                  # Backend container image
├── Dockerfile.prometheus       # Prometheus container image
├── docker-compose.yml          # Local development orchestration
├── prometheus.yml              # Prometheus configuration
├── package.json                # Node.js dependencies
├── pnpm-lock.yaml              # PNPM lock file
├── tsconfig.json               # TypeScript configuration
├── biome.json                  # BiomeJS linting config
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [DigitalOcean Kubernetes](https://docs.digitalocean.com/products/kubernetes/)
- [Express.js Documentation](https://expressjs.com/)
- [prom-client Documentation](https://github.com/siimon/prom-client)
- [doctl Documentation](https://docs.digitalocean.com/reference/doctl/)