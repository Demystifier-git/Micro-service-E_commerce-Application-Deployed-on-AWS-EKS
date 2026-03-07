resource "aws_iam_policy" "node_app_access" {

  name = "${var.cluster_name}-node-access"

  policy = jsonencode({

    Version = "2012-10-17"

    Statement = [

      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = "*"
      },

      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      },

      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances"
        ]
        Resource = "*"
      },

      {
        Effect = "Allow"
        Action = [
          "docdb:DescribeDBClusters"
        ]
        Resource = "*"
      },

      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters"
        ]
        Resource = "*"
      }

    ]

  })

}

resource "aws_iam_role_policy_attachment" "node_attach" {

  role       = aws_iam_role.node_role.name
  policy_arn = aws_iam_policy.node_app_access.arn

}