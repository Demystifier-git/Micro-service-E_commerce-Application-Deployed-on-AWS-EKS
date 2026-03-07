include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/subnets"
}

dependency "vpc" {
  config_path = "../vpc"
}

inputs = {
  vpc_id             = dependency.vpc.outputs.vpc_id
  availability_zones = ["us-east-1a", "us-east-1b"]
}
