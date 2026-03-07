include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/security-group-db"
}

dependency "vpc" {
  config_path = "../vpc"
}

dependency "ec2_sg" {
  config_path = "../security-group-ec2"
}

inputs = {
  vpc_id            = dependency.vpc.outputs.vpc_id
  sg_name           = "dev-rds-sg"
  allowed_sg_ids    = [dependency.ec2_sg.outputs.sg_id]
}
