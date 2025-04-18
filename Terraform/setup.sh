#!/bin/bash
set -e

# Install Docker
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user

# Install AWS CLI (just in case)
yum install -y aws-cli

# Log in to ECR
REGION="us-east-2"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
$(aws ecr get-login --no-include-email --region $REGION)

# Pull & Run Frontend and Backend Containers
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/docushare-frontend:latest
docker pull $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/docushare-backend:latest

docker run -d --name frontend -p 80:3000 $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/docushare-frontend:latest
docker run -d --name backend -p 3001:3001 $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/docushare-backend:latest

# Install CloudWatch Agent
yum install -y amazon-cloudwatch-agent

# Copy CloudWatch config
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/bin/cloudwatch-config.json
$(cat /home/ec2-user/cloudwatch-config.json)
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/cloudwatch-config.json \
  -s
