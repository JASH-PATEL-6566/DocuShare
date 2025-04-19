output "public_ec2_public_ip" {
  description = "Public IP of the public EC2 instance"
  value       = aws_instance.web_server.public_ip
}

output "private_ec2_instance_id" {
  description = "Instance ID of the private EC2 instance"
  value       = aws_instance.private_backend.id
}

output "private_ec2_private_ip" {
  description = "Private IP of the private EC2 instance"
  value       = aws_instance.private_backend.private_ip
}
