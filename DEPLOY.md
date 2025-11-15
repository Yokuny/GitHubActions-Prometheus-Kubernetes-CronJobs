# Deploy para DigitalOcean Kubernetes (DOKS)

## Pré-requisitos

1. Conta na DigitalOcean
2. Token de API da DigitalOcean (já configurado como `DOCR_TOKEN`)
3. `doctl` instalado localmente

## Instalação do doctl

```bash
brew install doctl
```

## Passo 1: Autenticar com DigitalOcean

```bash
doctl auth init
# Cole seu token quando solicitado (mesmo token do DOCR_TOKEN)
```

## Passo 2: Criar Container Registry

```bash
doctl registry create github-actions-prometheus-k8s-cronjobs
```

**Nome do Registry:** `github-actions-prometheus-k8s-cronjobs`

## Passo 3: Criar Cluster Kubernetes

```bash
doctl kubernetes cluster create github-actions-prometheus-k8s-cronjobs \
  --region nyc3 \
  --version latest \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=2;auto-scale=true;min-nodes=1;max-nodes=3"
```

**Nome do Cluster:** `github-actions-prometheus-k8s-cronjobs`

Isso levará alguns minutos. Aguarde a conclusão.

## Passo 4: Build e Push das Imagens

```bash
chmod +x scripts/initial-deploy.sh
./scripts/initial-deploy.sh
```

## Passo 5: Deploy no Kubernetes

```bash
chmod +x scripts/deploy-k8s.sh
./scripts/deploy-k8s.sh
```

## Passo 6: Configurar GitHub Secrets

Adicione os seguintes secrets no GitHub (Settings → Secrets and variables → Actions):

1. **DOCR_TOKEN**: Seu token da DigitalOcean (já configurado)
2. **DO_REGISTRY_NAME**: `github-actions-prometheus-k8s-cronjobs`
3. **DO_CLUSTER_NAME**: `github-actions-prometheus-k8s-cronjobs`

## Verificar Deploy

```bash
# Ver pods
kubectl get pods

# Ver services
kubectl get services

# Ver logs do backend
kubectl logs -l app=backend --tail=50

# Ver logs do prometheus
kubectl logs -l app=prometheus --tail=50
```

## Acessar Aplicações

```bash
# Obter IP externo do backend
kubectl get service backend

# Obter IP externo do prometheus
kubectl get service prometheus
```

Acesse:
- Backend: `http://<BACKEND_IP>:8000`
- Prometheus: `http://<PROMETHEUS_IP>:9090`

## Comandos Úteis

```bash
# Deletar cluster (cuidado!)
doctl kubernetes cluster delete github-actions-prometheus-k8s-cronjobs

# Deletar registry (cuidado!)
doctl registry delete github-actions-prometheus-k8s-cronjobs

# Ver custos
doctl kubernetes cluster list
doctl registry repository list-v2
```

## Custos Estimados (DigitalOcean)

- Cluster DOKS (2 nodes s-2vcpu-4gb): ~$48/mês
- Container Registry: $5/mês (até 500MB)
- Load Balancers (se usar): $12/mês cada

**Total estimado:** ~$53-77/mês
