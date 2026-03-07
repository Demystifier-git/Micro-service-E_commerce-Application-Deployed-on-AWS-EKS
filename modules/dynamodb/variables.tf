variable "table_name" {
  type = string
}

variable "hash_key" {
  type = string
}

variable "billing_mode" {
  type = string
}

variable "environment" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
