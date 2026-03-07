include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/security-group-VPC"
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  vpc_id  = dependency.vpc.outputs.vpc_id
  sg_name = "dev-vpc-internal-sg"
}
