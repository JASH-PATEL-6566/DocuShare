#!/bin/bash

# Update system and install Docker
sudo dnf update -y
sudo dnf install -y docker awscli

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Set environment variables
AWS_REGION="us-east-2"
ECR_REPO="docushare-frontend"
ACCOUNT_ID="715841365404"

# Wait for Docker service to be fully running
sleep 10

# Get the backend private IP address
# This requires the EC2 instance to have permission to describe instances
# BACKEND_IP=$(aws ec2 describe-instances --region $AWS_REGION --filters "Name=tag:Name,Values=docushare-backend" --query "Reservations[0].Instances[0].PrivateIpAddress" --output text)

# Login to Amazon ECR
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

