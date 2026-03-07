data "aws_iam_policy_document" "eks_app_policy" {

  statement {
    sid = "SecretsManagerAccess"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      "arn:aws:secretsmanager:*:*:secret:*"
    ]
  }

  statement {
    sid = "ECRPullAccess"

    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchCheckLayerAvailability"
    ]

    resources = ["*"]
  }

  statement {
    sid = "RDSConnect"

    actions = [
      "rds-db:connect"
    ]

    resources = [
      "arn:aws:rds-db:*:*:dbuser:*/*"
    ]
  }

  statement {
    sid = "ElasticacheRead"

    actions = [
      "elasticache:DescribeCacheClusters",
      "elasticache:ListTagsForResource"
    ]

    resources = ["*"]
  }

  statement {
    sid = "DocumentDBAccess"

    actions = [
      "docdb:DescribeDBClusters",
      "docdb:DescribeDBInstances"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role" "eks_app_role" {

  name = "eks-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = module.eks.cluster_oidc_issuer
        }

        Action = "sts:AssumeRoleWithWebIdentity"
      }
    ]
  })
}

resource "aws_iam_policy" "eks_app_policy" {

  name   = "eks-app-policy"
  policy = data.aws_iam_policy_document.eks_app_policy.json
}

resource "aws_iam_role_policy_attachment" "attach" {

  role       = aws_iam_role.eks_app_role.name
  policy_arn = aws_iam_policy.eks_app_policy.arn
}