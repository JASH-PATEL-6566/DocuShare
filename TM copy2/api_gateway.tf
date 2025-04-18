# ----------------------------------
# Security Group for API Gateway Access
# ----------------------------------
resource "aws_security_group" "api_gateway_access" {
  name        = "api-gateway-access-sg"
  description = "Allow API Gateway access to VPC"
  vpc_id      = aws_vpc.main.id

  # Allow inbound HTTP/HTTPS traffic from API Gateway
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

  # Outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "api-gateway-access-sg"
    }
  )
}

# ----------------------------------
# VPC Link for API Gateway
# ----------------------------------
resource "aws_apigatewayv2_vpc_link" "docushare_vpc_link" {
  name               = "docushare-vpc-link"
  subnet_ids         = [
    aws_subnet.private[0].id,
    aws_subnet.private[1].id
  ]
  security_group_ids = [aws_security_group.api_gateway_access.id]
}

# =========================
# Application Load Balancer
# =========================
resource "aws_lb" "backend_alb" {
  name               = "docushare-backend-alb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.api_gateway_access.id]
  subnets            = aws_subnet.private[*].id
  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "docushare-backend-alb"
  })
}

# =========================
# Target Group for ALB
# =========================
resource "aws_lb_target_group" "backend_target_group" {
  name     = "docushare-backend-tg"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    protocol = "HTTP"
    port     = "traffic-port"
    path     = "/health"
  }

  tags = merge(local.common_tags, {
    Name = "docushare-backend-tg"
  })
}

# =========================
# Listener for ALB
# =========================
resource "aws_lb_listener" "backend_listener" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_target_group.arn
  }
}

# =========================
# BACKEND API GATEWAY
# =========================
resource "aws_apigatewayv2_api" "backend_api" {
  name          = "docushare-backend-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "backend_integration" {
  api_id             = aws_apigatewayv2_api.backend_api.id
  integration_type   = "HTTP_PROXY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.docushare_vpc_link.id
  integration_method = "ANY"

  # 🔥 Use actual ALB listener ARN
  integration_uri = aws_lb_listener.backend_listener.arn
}


resource "aws_apigatewayv2_route" "backend_route" {
  api_id    = aws_apigatewayv2_api.backend_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend_integration.id}"
}

resource "aws_apigatewayv2_stage" "backend_stage" {
  api_id      = aws_apigatewayv2_api.backend_api.id
  name        = "$default"
  auto_deploy = true
}
