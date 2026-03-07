include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/security-group-web"
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  vpc_id  = dependency.vpc.outputs.vpc_id
  sg_name = "dev-ec2-sg"
}
