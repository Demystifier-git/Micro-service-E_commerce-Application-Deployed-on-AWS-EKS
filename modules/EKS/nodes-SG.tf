resource "aws_security_group" "eks_nodes" {
  name        = "${var.cluster_name}-nodes"
  description = "EKS worker nodes SG"
  vpc_id      = var.vpc_id

  # Allow nodes to reach cluster API
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # or just the cluster SG for stricter security
  }

  # Allow all traffic inside SG (node-to-node communication)
  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    self            = true
  }
}