############################################
# EBS CSI Driver
############################################

resource "helm_release" "ebs_csi" {

  name       = "aws-ebs-csi-driver"
  repository = "https://kubernetes-sigs.github.io/aws-ebs-csi-driver"
  chart      = "aws-ebs-csi-driver"

  namespace = "kube-system"

  values = [
    yamlencode({
      controller = {
        serviceAccount = {
          create = false
          name   = "ebs-csi-controller-sa"
        }
      }
    })
  ]

  depends_on = [
    aws_eks_node_group.nodes
  ]
}

############################################
# Karpenter
############################################

resource "helm_release" "karpenter" {

  name       = "karpenter"
  repository = "https://charts.karpenter.sh"
  chart      = "karpenter"

  namespace = "karpenter"

  values = [
    yamlencode({
      serviceAccount = {
        create = false
        name   = "karpenter"
      }
    })
  ]

  depends_on = [
    aws_eks_node_group.nodes
  ]
}