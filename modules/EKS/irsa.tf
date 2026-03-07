locals {
  oidc_sub = replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer,"https://","")
}

# ALB controller
resource "aws_iam_role" "alb_irsa" {
  name = "${var.cluster_name}-alb-irsa"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.oidc.arn }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "${local.oidc_sub}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller" }
      }
    }]
  })
}

# EBS CSI driver
resource "aws_iam_role" "ebs_csi_irsa" {
  name = "${var.cluster_name}-ebs-csi-irsa"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.oidc.arn }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "${local.oidc_sub}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa" }
      }
    }]
  })
}

# Karpenter
resource "aws_iam_role" "karpenter_irsa" {
  name = "${var.cluster_name}-karpenter-irsa"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.oidc.arn }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "${local.oidc_sub}:sub" = "system:serviceaccount:karpenter:karpenter" }
      }
    }]
  })
}