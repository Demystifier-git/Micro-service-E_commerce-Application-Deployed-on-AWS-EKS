output "cluster_name" {
  value = aws_eks_cluster.cluster.name
}

output "cluster_endpoint" {
  value = aws_eks_cluster.cluster.endpoint
}

output "cluster_oidc_issuer" {
  value = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}

output "cluster_certificate_authority" {
  value = aws_eks_cluster.cluster.certificate_authority[0].data
}

