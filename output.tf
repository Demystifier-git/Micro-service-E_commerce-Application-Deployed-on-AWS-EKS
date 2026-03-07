output "vpc_id" { value = module.vpc.vpc_id }

output "public_subnet_ids" {
  description = "List of public subnet IDs from the subnet module"
  value       = module.subnets.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs from the subnet module"
  value       = module.subnets.private_subnet_ids
}

# S3 outputs
output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = module.s3.bucket_arn
}

# DynamoDB outputs
output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB table"
  value       = module.dynamodb.table_arn
}

# EC2 outputs
output "ec2_instance_id" {
  description = "The ID of the EC2 instance"
  value       = module.ec2.instance_id
}

output "ec2_public_ip" {
  description = "The public IP of the EC2 instance"
  value       = module.ec2.public_ip
}

output "rds_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.rds.db_endpoint
}

output "rds_instance_id" {
  description = "The ID of the RDS instance"
  value       = module.rds.db_id
}



