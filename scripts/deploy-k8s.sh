#!/bin/bash
set -e

CLUSTER_NAME="github-actions-prometheus-k8s-cronjobs"
REGISTRY="registry.digitalocean.com"
REGISTRY_NAME="github-actions-prometheus-k8s-cronjobs"

echo "⚙️  Configurando kubectl..."
doctl kubernetes cluster kubeconfig save ${CLUSTER_NAME}

echo "📝 Atualizando manifests do Kubernetes..."
# Atualizar backend deployment
sed -i.bak "s|image:.*backend:.*|image: ${REGISTRY}/${REGISTRY_NAME}/backend:latest|g" k8s/backend-deployment.yaml

# Atualizar prometheus deployment
sed -i.bak "s|image:.*prometheus:.*|image: ${REGISTRY}/${REGISTRY_NAME}/prometheus:latest|g" k8s/prometheus-deployment.yaml

echo "🚀 Aplicando manifests..."
kubectl apply -f k8s/

echo "⏳ Aguardando deployments..."
kubectl rollout status deployment/backend --timeout=5m
kubectl rollout status deployment/prometheus --timeout=5m

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "=== Status dos Deployments ==="
kubectl get deployments
echo ""
echo "=== Status dos Pods ==="
kubectl get pods
echo ""
echo "=== Services ==="
kubectl get services

# Limpar arquivos backup
rm -f k8s/*.bak
