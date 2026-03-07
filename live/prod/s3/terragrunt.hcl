include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/s3"
}

inputs = {
 bucket_name= "my-terraform-demo-bucket-202741"
 bucket_region = "us-east-1"
}