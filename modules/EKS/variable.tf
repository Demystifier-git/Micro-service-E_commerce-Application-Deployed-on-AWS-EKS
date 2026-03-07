variable "cluster_name" {}
variable "vpc_id" {}
variable "private_subnets" {
  type = list(string)
  description = "List of private subnet IDs for EKS"
}

variable "node_groups" {
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    desired_size   = number
    min_size       = number
    max_size       = number
  }))
}