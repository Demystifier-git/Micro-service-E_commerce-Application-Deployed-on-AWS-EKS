############################################
# Launch Template for EKS Nodes
############################################
resource "aws_launch_template" "eks_nodes_lt" {
  name_prefix = "eks-nodes-"

  # Use your custom security group
  vpc_security_group_ids = [aws_security_group.eks_nodes.id]

  # User data must be base64 encoded and plain bash script
  user_data = base64encode(<<-EOT
    #!/bin/bash
    /etc/eks/bootstrap.sh ${aws_eks_cluster.cluster.name}
  EOT
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "eks-node"
    }
  }
}

############################################
# EKS Node Group
############################################
resource "aws_eks_node_group" "nodes" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.cluster.name
  node_group_name = each.key

  node_role_arn = aws_iam_role.eks_node_role.arn

  subnet_ids = var.private_subnets

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type

  scaling_config {
    desired_size = each.value.desired_size
    min_size     = each.value.min_size
    max_size     = each.value.max_size
  }

  launch_template {
    id      = aws_launch_template.eks_nodes_lt.id
    version = "$Latest"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ecr_readonly_policy,
    aws_iam_role_policy_attachment.node_app_attach
  ]
}
