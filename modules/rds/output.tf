

output "db_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = aws_db_instance.this.endpoint
}

output "db_id" {
  description = "The ID of the RDS instance"
  value       = aws_db_instance.this.id
}