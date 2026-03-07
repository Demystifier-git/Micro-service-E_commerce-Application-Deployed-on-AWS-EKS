include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/route-tables"
}

dependency "vpc" {
  config_path = "../vpc"
}

dependency "igw" {
  config_path = "../internet-gateway"
}

dependency "nat" {
  config_path = "../nat-gateway"
}

dependency "subnets" {
  config_path = "../subnets"
}

inputs = {
  vpc_id              = dependency.vpc.outputs.vpc_id
  igw_id              = dependency.igw.outputs.igw_id
  nat_gateway_id      = dependency.nat.outputs.nat_id
  public_subnet_ids   = dependency.subnets.outputs.public_subnet_ids
  private_subnet_ids  = dependency.subnets.outputs.private_subnet_ids
}
