##############################
# AWS Provider
##############################
variable "region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

##############################
# VPC & Networking
##############################
variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to create subnets in"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

##############################
# EC2
##############################
variable "key_name" {
  description = "The name of the SSH key pair for EC2 instances"
  type        = string
}

variable "ec2_ami" {
  description = "The AMI ID to use for EC2 instances"
  type        = string
}

##############################
# RDS
##############################
variable "db_username" {
  description = "Username for RDS database"
  type        = string
}

variable "db_password" {
  description = "Password for RDS database"
  type        = string
  sensitive   = true
}

variable "db_engine_version" {
  description = "The database engine version for RDS"
  type        = string
}

variable "db_instance_class" {
  description = "The instance class/type for RDS"
  type        = string
}

variable "db_allocated_storage" {
  description = "Allocated storage (in GB) for RDS"
  type        = number
}

##############################
# S3
##############################
variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "bucket_region" {
  description = "Region where the S3 bucket will be created"
  type        = string
}

##############################
# Environment
##############################
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

##############################
# DynamoDB
##############################
variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "dynamodb_billing_mode" {
  description = "Billing mode for DynamoDB (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_hash_key" {
  description = "Partition key for the DynamoDB table"
  type        = string
}






variable "cluster_name" {
  description = "Name of the eks cluster table"
  type        = string
}


variable "node_groups" {
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    desired_size   = number
    min_size       = number
    max_size       = number
  }))
}








