

# Public route table
resource "aws_route_table" "public" {
  vpc_id = var.vpc_id
  tags = { Name = "public-rt" }
}

resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = var.igw_id
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = var.public_subnet_id
  route_table_id = aws_route_table.public.id
}

# Private route table
resource "aws_route_table" "private" {
  vpc_id = var.vpc_id
  tags = { Name = "private-rt" }
}

resource "aws_route" "private_route" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.nat_id
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = var.private_subnet_id
  route_table_id = aws_route_table.private.id
}