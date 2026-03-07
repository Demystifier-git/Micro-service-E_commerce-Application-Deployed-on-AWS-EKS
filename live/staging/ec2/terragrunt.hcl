include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/ec2"
}

dependency "subnets" {
  config_path = "../subnets"
}

dependency "sg" {
  config_path = "../security-group"
}

inputs = {
  subnet_id         = dependency.subnets.outputs.public_subnet_ids[0]
  security_group_ids = [dependency.sg.outputs.sg_id]
  instance_type     = "t3.micro"
  ami               = "ami-0abcdef123456"
  key_name          = "my-ssh-key"
}
