provider "aws" {
  region = "us-east-2"
}

# IAM Role & Policies
resource "aws_iam_role" "ec2_role" {
  name = "docushare-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "docushare-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# VPC + Subnet + IGW + Routing
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "docushare-vpc"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-2a"
  map_public_ip_on_launch = true

  tags = {
    Name = "docushare-public-subnet"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "docushare-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "docushare-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "docushare-sg"
  description = "Allow HTTP, HTTPS, and SSH"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "docushare-ec2-sg"
  }
}

# EC2 Instance
resource "aws_instance" "docushare_instance" {
  ami                         = "ami-0100e595e1cc1ff7f" # Amazon Linux 2
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.public.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]
  key_name                    = "DocuShare"
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  user_data                   = file("setup.sh")
  user_data_replace_on_change = true

  depends_on = [
    aws_iam_role_policy_attachment.ecr_access,
    aws_iam_role_policy_attachment.cloudwatch_access
  ]

  tags = {
    Name = "docushare-ec2"
  }
}

# ECR
resource "aws_ecr_repository" "frontend" {
  name = "docushare-frontend"
  force_delete = true

  tags = {
    Name = "frontend"
  }
}

resource "aws_ecr_repository" "backend" {
  name = "docushare-backend"
  force_delete = true
  tags = {
    Name = "backend"
  }
}

# DynamoDB Tables
resource "aws_dynamodb_table" "access_grants" {
  name         = "AccessGrants"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "grantId"
  attribute {
    name = "grantId"
    type = "S"
  }
  tags = {
    Name = "AccessGrants"
  }
}

resource "aws_dynamodb_table" "access_logs" {
  name         = "AccessLogs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "logId"
  attribute {
    name = "logId"
    type = "S"
  }
  tags = {
    Name = "AccessLogs"
  }
}

resource "aws_dynamodb_table" "files" {
  name         = "Files"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "fileId"
  attribute {
    name = "fileId"
    type = "S"
  }
  tags = {
    Name = "Files"
  }
}

resource "aws_dynamodb_table" "links" {
  name         = "Links"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "linkId"
  attribute {
    name = "linkId"
    type = "S"
  }
  tags = {
    Name = "Links"
  }
}

resource "aws_dynamodb_table" "subscription_plans" {
  name         = "SubscriptionPlans"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "planId"
  range_key    = "name"
  attribute {
    name = "planId"
    type = "S"
  }
  attribute {
    name = "name"
    type = "S"
  }
  tags = {
    Name = "SubscriptionPlans"
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "email"
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "email"
    type = "S"
  }
  tags = {
    Name = "Users"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "docushare" {
  bucket        = "docushare-storage"
  force_destroy = true
  tags = {
    Name = "docushare-storage"
  }
}