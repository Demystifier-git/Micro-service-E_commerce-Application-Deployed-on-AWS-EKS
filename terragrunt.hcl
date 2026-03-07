# live/terragrunt.hcl

locals {
  env = basename(path_relative_to_include())  # dev, staging, prod
}

terraform {
  extra_arguments "aws_provider" {
    commands = ["init", "plan", "apply"]
    arguments = [
      "-backend-config=bucket=my-tf-state",
      "-backend-config=key=${local.env}/${path_relative_to_include()}/terraform.tfstate",
      "-backend-config=region=us-east-1",
      "-backend-config=dynamodb_table=tf-locks"
    ]
  }
}

inputs = {
  environment = local.env
}

remote_state {
  backend = "s3"
  config = {
    bucket         = "my-terraform-demo-bucket-202741"
    key            = "${local.env}/${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-demo-table"
    encrypt        = true
  }
}

