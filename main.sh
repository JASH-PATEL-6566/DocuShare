#!/bin/bash
# ==========================
# Run Terraform apply
# ==========================

# cd ./Terraform

# terraform init
# terraform apply -auto-approve

# # Exit if apply fails
# if [ $? -ne 0 ]; then
#   echo "Terraform apply failed. Exiting..."
#   exit 1
# fi

# cd ..

# read -p "Terraform apply completed. Confirm to proceed with Docker build and push (y/n): " confirm
# if [[ "$confirm" != "y" ]]; then
#   echo "Operation cancelled by user."
#   exit 0
# fi

# # ==========================
# # PUSH IMAGE TO ECR
# # ==========================
# aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 715841365404.dkr.ecr.us-east-2.amazonaws.com

# # BACKEND
# docker buildx build \
#   --platform linux/amd64,linux/arm64 \
#   -t 715841365404.dkr.ecr.us-east-2.amazonaws.com/docushare-backend:latest \
#   --push \
#   ./backend

# # FRONTEND
# docker buildx build \
#   --platform linux/amd64,linux/arm64 \
#   -t 715841365404.dkr.ecr.us-east-2.amazonaws.com/docushare-frontend:latest \
#   --push \
#   ./frontend

# ======================
# GITHUB PUSH
# ======================

git add .
git commit -m "push by bash"
git push

echo "✅ Implemented successfully".