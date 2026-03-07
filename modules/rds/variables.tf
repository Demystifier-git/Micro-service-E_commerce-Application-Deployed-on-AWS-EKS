variable "name" {}
variable "db_name" {}
variable "username" {}
variable "password" {}
variable "subnet_ids" { type = list(string) }
variable "security_group_ids" { type = list(string) }
variable "engine_version" {}
variable "instance_class" {}
variable "allocated_storage" {}