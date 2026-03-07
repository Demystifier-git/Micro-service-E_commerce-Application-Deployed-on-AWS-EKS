include {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/dynamodb"
}

inputs = {
  table_name   = "terraform-demo-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
}
