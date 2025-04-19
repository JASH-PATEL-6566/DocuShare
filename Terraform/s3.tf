
resource "aws_s3_bucket" "docushare" {
  bucket        = "docushare-storage"
  force_destroy = true
  tags = {
    Name = "docushare-storage"
  }
}