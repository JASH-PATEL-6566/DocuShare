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