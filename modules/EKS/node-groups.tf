############################################
# Launch Template for EKS Nodes
############################################
resource "aws_launch_template" "eks_nodes_lt" {
  name_prefix = "eks-nodes-"

  # Use your custom security group
  vpc_security_group_ids = [aws_security_group.eks_nodes.id]

  # User data in MIME multipart format (required by EKS)
  user_data = base64encode(<<-EOT
    Content-Type: multipart/mixed; boundary="==BOUNDARY=="

    --==BOUNDARY==
    Content-Type: text/x-shellscript; charset="us-ascii"

    #!/bin/bash
    /etc/eks/bootstrap.sh ${aws_eks_cluster.cluster.name}

    --==BOUNDARY==--
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

  # Nodes will launch in these subnets
  subnet_ids = var.private_subnets

  # Instance type & capacity
  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type

  # Auto-scaling configuration
  scaling_config {
    desired_size = each.value.desired_size
    min_size     = each.value.min_size
    max_size     = each.value.max_size
  }

  # Attach the launch template
  launch_template {
    id      = aws_launch_template.eks_nodes_lt.id
    version = "$Latest"  # Always use the latest version of the LT
  }

  # Ensure IAM policies are attached before provisioning nodes
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.ecr_readonly_policy,
    aws_iam_role_policy_attachment.node_app_attach
  ]
}
