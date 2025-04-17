# provider "aws" {
#   region = "us-east-2"
# }

# resource "random_id" "suffix" {
#   byte_length = 4
# }

# resource "aws_vpc" "docushare_vpc" {
#   cidr_block           = "10.0.0.0/16"
#   enable_dns_support   = true
#   enable_dns_hostnames = true
#   tags = {
#     Name = "docushare-vpc"
#   }
# }

# resource "aws_subnet" "public_subnet" {
#   vpc_id                  = aws_vpc.docushare_vpc.id
#   cidr_block              = "10.0.1.0/24"
#   map_public_ip_on_launch = true
#   availability_zone       = "us-east-2a"
#   tags = {
#     Name = "docushare-public"
#   }
# }

# resource "aws_subnet" "private_subnet" {
#   vpc_id            = aws_vpc.docushare_vpc.id
#   cidr_block        = "10.0.2.0/24"
#   availability_zone = "us-east-2a"
#   tags = {
#     Name = "docushare-private"
#   }
# }

# resource "aws_internet_gateway" "docushare_igw" {
#   vpc_id = aws_vpc.docushare_vpc.id
#   tags = {
#     Name = "docushare-igw"
#   }
# }

# resource "aws_route_table" "public_rt" {
#   vpc_id = aws_vpc.docushare_vpc.id
#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.docushare_igw.id
#   }
#   tags = {
#     Name = "docushare-public-rt"
#   }
# }

# resource "aws_route_table_association" "public_assoc" {
#   subnet_id      = aws_subnet.public_subnet.id
#   route_table_id = aws_route_table.public_rt.id
# }

# resource "aws_security_group" "frontend_sg" {
#   name        = "docushare-frontend-sg"
#   description = "Allow HTTP/SSH"
#   vpc_id      = aws_vpc.docushare_vpc.id

#   ingress {
#     from_port   = 80
#     to_port     = 80
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#     description = "Allow HTTP"
#   }

#   ingress {
#     from_port   = 22
#     to_port     = 22
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#     description = "Allow SSH"
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name = "docushare-frontend-sg"
#   }
# }

# resource "aws_security_group" "backend_sg" {
#   name        = "docushare-backend-sg"
#   description = "Allow traffic from frontend EC2 only"
#   vpc_id      = aws_vpc.docushare_vpc.id

#   ingress {
#     from_port       = 3000
#     to_port         = 3000
#     protocol        = "tcp"
#     security_groups = [aws_security_group.frontend_sg.id]
#     description     = "Allow frontend EC2 only"
#   }

#   ingress {
#     from_port   = 22
#     to_port     = 22
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#     description = "Allow SSH"
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name = "docushare-backend-sg"
#   }
# }

# resource "aws_instance" "frontend_ec2" {
#   ami                         = "ami-0c55b159cbfafe1f0"
#   instance_type               = "t2.micro"
#   subnet_id                   = aws_subnet.public_subnet.id
#   vpc_security_group_ids      = [aws_security_group.frontend_sg.id]
#   associate_public_ip_address = true

#   tags = {
#     Name = "docushare-frontend"
#   }
# }

# resource "aws_instance" "backend_ec2" {
#   ami                         = "ami-0c55b159cbfafe1f0"
#   instance_type               = "t2.micro"
#   subnet_id                   = aws_subnet.private_subnet.id
#   vpc_security_group_ids      = [aws_security_group.backend_sg.id]
#   associate_public_ip_address = false

#   tags = {
#     Name = "docushare-backend"
#   }
# }

# resource "aws_s3_bucket" "docushare" {
#   bucket        = "docushare-s3-${random_id.suffix.hex}"
#   force_destroy = true

#   tags = {
#     Name = "docushare-s3"
#   }
# }

# resource "aws_dynamodb_table" "access_grants" {
#   name         = "AccessGrants"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "grantId"
#   attribute {
#     name = "grantId"
#     type = "S"
#   }
#   tags = {
#     Name = "AccessGrants"
#   }
# }

# resource "aws_dynamodb_table" "access_logs" {
#   name         = "AccessLogs"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "logId"
#   attribute {
#     name = "logId"
#     type = "S"
#   }
#   tags = {
#     Name = "AccessLogs"
#   }
# }

# resource "aws_dynamodb_table" "files" {
#   name         = "Files"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "fileId"
#   attribute {
#     name = "fileId"
#     type = "S"
#   }
#   tags = {
#     Name = "Files"
#   }
# }

# resource "aws_dynamodb_table" "links" {
#   name         = "Links"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "linkId"
#   attribute {
#     name = "linkId"
#     type = "S"
#   }
#   tags = {
#     Name = "Links"
#   }
# }

# resource "aws_dynamodb_table" "subscription_plans" {
#   name         = "SubscriptionPlans"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "planId"
#   range_key    = "name"
#   attribute {
#     name = "planId"
#     type = "S"
#   }
#   attribute {
#     name = "name"
#     type = "S"
#   }
#   tags = {
#     Name = "SubscriptionPlans"
#   }
# }

# resource "aws_dynamodb_table" "users" {
#   name         = "Users"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "userId"
#   range_key    = "email"
#   attribute {
#     name = "userId"
#     type = "S"
#   }
#   attribute {
#     name = "email"
#     type = "S"
#   }
#   tags = {
#     Name = "Users"
#   }
# }

# resource "aws_iam_policy" "backend_access_policy" {
#   name = "BackendAccessPolicy"
#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect = "Allow",
#         Action = [
#           "dynamodb:*",
#           "s3:*"
#         ],
#         Resource = [
#           aws_s3_bucket.docushare.arn,
#           "${aws_s3_bucket.docushare.arn}/*",
#           "arn:aws:dynamodb:*:*:table/*"
#         ]
#       }
#     ]
#   })
# }

# # ECR for Backend
# resource "aws_ecr_repository" "docushare_backend" {
#   name                 = "docushare-backend"
#   image_tag_mutability = "MUTABLE"
#   force_delete         = true

#   image_scanning_configuration {
#     scan_on_push = true
#   }

#   tags = {
#     Name = "docushare-backend-ecr"
#   }
# }

# # ECR for Frontend
# resource "aws_ecr_repository" "docushare_frontend" {
#   name                 = "docushare-frontend"
#   image_tag_mutability = "MUTABLE"
#   force_delete         = true

#   image_scanning_configuration {
#     scan_on_push = true
#   }

#   tags = {
#     Name = "docushare-frontend-ecr"
#   }
# }
provider "aws" {
  region = "us-east-2"
}

resource "random_id" "suffix" {
  byte_length = 4
}

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

resource "aws_security_group" "frontend_sg" {
  name        = "docushare-frontend-sg"
  description = "Allow HTTP/SSH"
  vpc_id      = aws_vpc.docushare_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH"
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
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.frontend_sg.id]
    description     = "Allow frontend EC2 only"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow SSH"
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

resource "aws_instance" "frontend_ec2" {
  ami                         = "ami-0e83be366243f524a" # Amazon Linux 2023 AMI (us-east-2)
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.public_subnet.id
  vpc_security_group_ids      = [aws_security_group.frontend_sg.id]
  associate_public_ip_address = true
  key_name                    = "DocuShare"

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install docker -y
              service docker start
              usermod -a -G docker ec2-user
              systemctl enable docker
              EOF

  tags = {
    Name = "docushare-frontend"
  }
}

resource "aws_instance" "backend_ec2" {
  ami                         = "ami-0e83be366243f524a" # Amazon Linux 2023 AMI (us-east-2)
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.private_subnet.id
  vpc_security_group_ids      = [aws_security_group.backend_sg.id]
  associate_public_ip_address = false
  key_name                    = "DocuShare"

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              amazon-linux-extras install docker -y
              service docker start
              usermod -a -G docker ec2-user
              systemctl enable docker
              EOF

  tags = {
    Name = "docushare-backend"
  }
}


resource "aws_s3_bucket" "docushare" {
  bucket        = "docushare-s3-${random_id.suffix.hex}"
  force_destroy = true

  tags = {
    Name = "docushare-s3"
  }
}

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

resource "aws_iam_policy" "backend_access_policy" {
  name = "BackendAccessPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:*",
          "s3:*"
        ],
        Resource = [
          aws_s3_bucket.docushare.arn,
          "${aws_s3_bucket.docushare.arn}/*",
          "arn:aws:dynamodb:*:*:table/*"
        ]
      }
    ]
  })
}

# ECR for Backend
resource "aws_ecr_repository" "docushare_backend" {
  name                 = "docushare-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "docushare-backend-ecr"
  }
}

# ECR for Frontend
resource "aws_ecr_repository" "docushare_frontend" {
  name                 = "docushare-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "docushare-frontend-ecr"
  }
}
