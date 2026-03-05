output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = data.aws_eks_cluster.cluster.endpoint
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = aws_eks_cluster.cluster.name
}

output "cluster_certificate_authority_data" {
  description = "Kubernetes Cluster Certificate Authority Data"
  value       = data.aws_eks_cluster.cluster.certificate_authority[0].data
}

output "configure_kubectl" {
  description = "Configure kubectl command"
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${aws_eks_cluster.cluster.name}"
}
