include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/rds"
}

# RDS depends on networking and security
dependency "subnets" {
  config_path = "../subnets"
}

dependency "db_sg" {
  config_path = "../security-group"
}

inputs = {
  name               = "mysql-db"
  engine             = "mysql"
  engine_version     = "8.0"
  instance_class     = "db.t3.micro"
  allocated_storage  = 20

  db_name            = "app_db"
  username           = "admin"
  password           = "SuperSecret123"

  subnet_ids         = dependency.subnets.outputs.private_subnet_ids
  security_group_ids = [dependency.db_sg.outputs.sg_id]

  publicly_accessible = false
}
