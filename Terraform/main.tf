provider "aws" {
  region = "us-east-2"
}

# IAM Role for EC2 to access ECR and describe EC2 instances
resource "aws_iam_role" "ec2_ecr_role" {
  name = "ec2-ecr-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach ECR and EC2 describe policies to the role
resource "aws_iam_role_policy_attachment" "ecr_policy_attachment" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess"
}


resource "aws_iam_policy" "ec2_describe_policy" {
  name = "EC2DescribePolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ec2:DescribeInstances"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_describe_attachment" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = aws_iam_policy.ec2_describe_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-ecr-profile"
  role = aws_iam_role.ec2_ecr_role.name
}

# Networking
resource "aws_vpc" "docushare_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "docushare-vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.docushare_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-2a"
  tags = {
    Name = "docushare-public"
  }
}

resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.docushare_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-2a"
  tags = {
    Name = "docushare-private"
  }
}

resource "aws_internet_gateway" "docushare_igw" {
  vpc_id = aws_vpc.docushare_vpc.id
  tags = {
    Name = "docushare-igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.docushare_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.docushare_igw.id
  }
  tags = {
    Name = "docushare-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "frontend_sg" {
  name        = "docushare-frontend-sg"
  description = "Allow HTTP/SSH"
  vpc_id      = aws_vpc.docushare_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
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
    Name = "docushare-frontend-sg"
  }
}

resource "aws_security_group" "backend_sg" {
  name        = "docushare-backend-sg"
  description = "Allow traffic from frontend EC2 only"
  vpc_id      = aws_vpc.docushare_vpc.id

  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
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
    Name = "docushare-backend-sg"
  }
}

# EC2 Instances
resource "aws_instance" "frontend_ec2" {
  ami                         = "ami-0100e595e1cc1ff7f"
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.public_subnet.id
  vpc_security_group_ids      = [aws_security_group.frontend_sg.id]
  associate_public_ip_address = true
  key_name                    = "DocuShare"
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  user_data                   = file("frontend.sh")
  user_data_replace_on_change = true
  tags = {
    Name = "docushare-frontend"
  }
}

resource "aws_instance" "backend_ec2" {
  ami                         = "ami-0100e595e1cc1ff7f"
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.private_subnet.id
  vpc_security_group_ids      = [aws_security_group.backend_sg.id]
  associate_public_ip_address = false
  key_name                    = "DocuShare"
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name
  user_data                   = file("backend.sh")
  user_data_replace_on_change = true
  tags = {
    Name = "docushare-backend"
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
