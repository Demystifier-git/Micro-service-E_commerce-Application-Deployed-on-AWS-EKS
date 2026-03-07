provider "aws" {
  region = var.region
}

# VPC
module "vpc" {
  source     = "./modules/vpc"
  cidr_block = var.vpc_cidr
}

# Subnets
module "subnets" {
  source = "./modules/subnets"
  vpc_id = module.vpc.vpc_id
  availability_zones = var.availability_zones
}


# Internet Gateway
module "igw" {
  source = "./modules/internet-gateway"
  vpc_id = module.vpc.vpc_id
}

# NAT Gateway
module "nat" {
  source            = "./modules/nat-gateway"
  public_subnet_id  = module.subnets.public_subnet_ids[0]   # ✅ changed
  depends_on        = [module.igw]
}

# Route Tables
module "routes" {
  source             = "./modules/route-tables"
  vpc_id             = module.vpc.vpc_id
  igw_id             = module.igw.igw_id
  nat_id             = module.nat.nat_id
  public_subnet_id   = module.subnets.public_subnet_ids[0]   # ✅ send one subnet
  private_subnet_id  = module.subnets.private_subnet_ids[0]  # ✅ send one subnet
}

# Security Groups
module "web_sg" {
  source  = "./modules/security-group-web"
  vpc_id  = module.vpc.vpc_id
  sg_name = "web-sg"
}

module "db_sg" {
  source  = "./modules/security-group-db"
  vpc_id  = module.vpc.vpc_id
  sg_name = "db-new"
  allowed_sg_ids = [module.web_sg.sg_id]
}

module "vpc_sg" {
  source  = "./modules/security-group-VPC"
  vpc_id  = module.vpc.vpc_id
  sg_name = "vpc-sg"
}

# EC2
module "ec2" {
  source             = "./modules/ec2"
  name               = "web-server"
  instance_type      = "t3.micro"
  subnet_id          = module.subnets.public_subnet_ids[0]
  security_group_ids = [module.web_sg.sg_id]
  key_name           = var.key_name
  ami                = var.ec2_ami
}

# RDS
module "rds" {
  source = "./modules/rds"

  name               = "mysql-db"
  db_name            = "app_db"
  username           = var.db_username
  password           = var.db_password
  subnet_ids         = module.subnets.private_subnet_ids
  security_group_ids = [module.db_sg.sg_id]

  engine_version     = var.db_engine_version
  instance_class     = var.db_instance_class
  allocated_storage  = var.db_allocated_storage
}

module "s3" {
  source      = "./modules/S3"
  bucket_name = var.bucket_name
  environment = var.environment

  tags = {
    Project = "terraform-learning"
    Env     = var.environment
  }
}

module "dynamodb" {
  source = "./modules/dynamodb"

  table_name   = var.dynamodb_table_name
  hash_key     = var.dynamodb_hash_key
  billing_mode = var.dynamodb_billing_mode
  environment  = var.environment

  tags = {
    Project = "terraform-learning"
    Env     = var.environment
  }
}

module "eks" {

  source = "./modules/EKS"

  cluster_name    = var.cluster_name
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.subnets.private_subnet_ids
  node_groups     = var.node_groups

}
