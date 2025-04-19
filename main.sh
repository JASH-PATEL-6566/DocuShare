#!/bin/bash
# ==========================
# Run Terraform apply
# ==========================

cd ./Terraform

terraform init
terraform apply -auto-approve

# Exit if apply fails
if [ $? -ne 0 ]; then
  echo "Terraform apply failed. Exiting..."
  exit 1
fi

cd ..

read -p "Terraform apply completed. Confirm to proceed with Docker build and push (y/n): " confirm
if [[ "$confirm" != "y" ]]; then
  echo "Operation cancelled by user."
  exit 0
fi

# ==========================
# PUSH IMAGE TO ECR
# ==========================
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 715841365404.dkr.ecr.us-east-2.amazonaws.com

# BACKEND
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t 715841365404.dkr.ecr.us-east-2.amazonaws.com/docushare-backend:latest \
  --build-arg API_URL=http://3.142.40.182/api \
  --build-arg FRONTEND_URL=http://3.142.40.182 \
  --push \
  ./backend

# FRONTEND
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t 715841365404.dkr.ecr.us-east-2.amazonaws.com/docushare-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://3.142.40.182/api \
  --push \
  ./frontend