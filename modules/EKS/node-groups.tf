resource "aws_iam_role" "node_role" {

  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })

}

resource "aws_eks_node_group" "nodes" {

  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.cluster.name
  node_group_name = each.key

  node_role_arn = aws_iam_role.node_role.arn

  subnet_ids = var.private_subnets

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type

  scaling_config {
    desired_size = each.value.desired_size
    min_size     = each.value.min_size
    max_size     = each.value.max_size
  }

}