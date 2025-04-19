# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Effect = "Allow",
      }
    ]
  })
}

# IAM Policy Attachment for Lambda Permissions
resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Optional: Attach permissions for DynamoDB and S3
# resource "aws_iam_policy" "lambda_custom_policy" {
#   name = "${local.name_prefix}-lambda-policy"

#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect = "Allow",
#         Action = [
#           "dynamodb:Scan",
#           "dynamodb:DeleteItem"
#         ],
#         Resource = "*"
#       },
#       {
#         Effect = "Allow",
#         Action = [
#           "s3:DeleteObject"
#         ],
#         Resource = "arn:aws:s3:::docushare-storage/*"
#       }
#     ]
#   })
# }
resource "aws_iam_policy" "lambda_custom_policy" {
  name = "${local.name_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Scan",
          "dynamodb:DeleteItem"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:DeleteObject"
        ],
        Resource = "arn:aws:s3:::docushare-storage/*"
      },
      {
        Effect = "Allow",
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ],
        Resource = aws_sqs_queue.message_queue.arn
      }
    ]
  })
}


resource "aws_iam_policy_attachment" "lambda_custom_attach" {
  name       = "${local.name_prefix}-lambda-attach"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = aws_iam_policy.lambda_custom_policy.arn
}

# Lambda Function for Cleanup
resource "aws_lambda_function" "cleanup_lambda" {
  function_name = "${local.name_prefix}-cleanup"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30
  memory_size   = 256
  filename      = "${path.module}/cleanup.zip"  # Ensure this zip exists
  source_code_hash = filebase64sha256("${path.module}/cleanup.zip")

  environment {
    variables = {
      S3_BUCKET_NAME       = "docushare-storage"
      FILES_TABLE          = "Files"
      LINKS_TABLE          = "Links"
      ACCESS_LOGS_TABLE    = "AccessLogs"
      ACCESS_GRANTS_TABLE  = "AccessGrants"
    }
  }

  tags = local.common_tags
}

# Lambda Trigger from SQS
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.message_queue.arn
  function_name     = aws_lambda_function.cleanup_lambda.arn
  batch_size        = 10
  enabled           = true
}
