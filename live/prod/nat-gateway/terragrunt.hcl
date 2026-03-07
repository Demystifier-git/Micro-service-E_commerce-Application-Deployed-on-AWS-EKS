include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/nat-gateway"
}

dependency "subnets" {
  config_path = "../subnets"
}

dependency "igw" {
  config_path = "../internet-gateway"
}

inputs = {
  public_subnet_id = dependency.subnets.outputs.public_subnet_ids[0]
}
