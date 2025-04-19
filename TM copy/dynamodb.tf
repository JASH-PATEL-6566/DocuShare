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
  stream_view_type = "OLD_IMAGE"
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
