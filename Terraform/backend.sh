#!/bin/bash

# Update system and install Docker
sudo dnf update -y
sudo dnf install -y docker

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Install AWS CLI if not already installed
sudo dnf install -y awscli

# Set environment variables
AWS_REGION="us-east-2"
ECR_REPO="docushare-backend"
ACCOUNT_ID="715841365404"

# Wait for Docker service to be fully running
sleep 10

# Login to Amazon ECR
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com