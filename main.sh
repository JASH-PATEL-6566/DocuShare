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

# Capture outputs
PRIVATE_ID=$(terraform output -raw private_ec2_instance_id)
PRIVATE_IP=$(terraform output -raw private_ec2_private_ip)
PUBLIC_IP=$(terraform output -raw public_ec2_public_ip)


cd ..

# ==========================
# Export to GitHub Actions environment
# ==========================
echo "PRIVATE_ID=$PRIVATE_ID" >> $GITHUB_ENV
echo "PRIVATE_IP=$PRIVATE_IP" >> $GITHUB_ENV
echo "PUBLIC_IP=$PUBLIC_IP" >> $GITHUB_ENV

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

# ==========================
# GITHUB
# ==========================

git add .
git commit -m "run from bash"
git push