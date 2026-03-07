resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  vpc_id = var.vpc_id
  cidr_block = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = var.availability_zones[count.index]
  tags = { Name = "public-${count.index}" }
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  vpc_id = var.vpc_id
  cidr_block = cidrsubnet("10.0.0.0/16", 8, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]
  tags = { Name = "private-${count.index}" }
}
