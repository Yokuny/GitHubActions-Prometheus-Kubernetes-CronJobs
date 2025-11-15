#!/bin/bash
set -e

# Configurações
REGISTRY="registry.digitalocean.com"
REGISTRY_NAME="github-actions-prometheus-k8s-cronjobs"
IMAGE_TAG="initial"

echo "🔐 Fazendo login no registry..."
doctl registry login

echo "🏗️  Building backend image..."
docker build -t ${REGISTRY}/${REGISTRY_NAME}/backend:${IMAGE_TAG} .
docker tag ${REGISTRY}/${REGISTRY_NAME}/backend:${IMAGE_TAG} ${REGISTRY}/${REGISTRY_NAME}/backend:latest

echo "🏗️  Building prometheus image..."
docker build -t ${REGISTRY}/${REGISTRY_NAME}/prometheus:${IMAGE_TAG} -f Dockerfile.prometheus .
docker tag ${REGISTRY}/${REGISTRY_NAME}/prometheus:${IMAGE_TAG} ${REGISTRY}/${REGISTRY_NAME}/prometheus:latest

echo "📤 Pushing backend image..."
docker push ${REGISTRY}/${REGISTRY_NAME}/backend:${IMAGE_TAG}
docker push ${REGISTRY}/${REGISTRY_NAME}/backend:latest

echo "📤 Pushing prometheus image..."
docker push ${REGISTRY}/${REGISTRY_NAME}/prometheus:${IMAGE_TAG}
docker push ${REGISTRY}/${REGISTRY_NAME}/prometheus:latest

echo "✅ Imagens enviadas com sucesso!"
echo ""
echo "Registry: ${REGISTRY}/${REGISTRY_NAME}"
echo "Backend image: ${REGISTRY}/${REGISTRY_NAME}/backend:latest"
echo "Prometheus image: ${REGISTRY}/${REGISTRY_NAME}/prometheus:latest"
