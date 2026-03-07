# AWS region
region = "us-east-1"

# Networking
vpc_cidr = "10.0.0.0/16"
availability_zones = [
  "us-east-1a",
  "us-east-1b"
]

# EC2 configuration
ec2_ami       = "ami-0b6c6ebed2801a5cb"
key_name      = "my-ssh-key"

# Database (RDS)
db_username = "admin"
db_password = "SuperSecret123"

# Tags (optional but common)
environment  = "dev"

db_engine_version    = "8.0"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

bucket_name   = "my-terraform-demo-bucket-202741"
bucket_region = "us-east-1"

dynamodb_table_name  = "terraform-demo-table"
dynamodb_hash_key   = "id"
dynamodb_billing_mode = "PAY_PER_REQUEST"

cluster_name = "production-eks"

node_groups = {

  general = {
    instance_types = ["t3.large"]
    capacity_type  = "ON_DEMAND"
    desired_size   = 3
    min_size       = 2
    max_size       = 6
  }

  spot = {
    instance_types = ["t3.large"]
    capacity_type  = "SPOT"
    desired_size   = 2
    min_size       = 1
    max_size       = 10
  }

}




