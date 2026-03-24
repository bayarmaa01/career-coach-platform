variable "prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "careercoach"
}

variable "location" {
  description = "Azure region for deployment"
  type        = string
  default     = "East US"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "career-coach-prod"
}

variable "kubernetes_version" {
  description = "Kubernetes version for AKS"
  type        = string
  default     = "1.28.0"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "career-coach.example.com"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "career-coach"
    ManagedBy   = "terraform"
  }
}

variable "node_pool_vm_size" {
  description = "VM size for AKS node pools"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "ai_node_pool_vm_size" {
  description = "VM size for AI workloads node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "app_gateway_sku" {
  description = "SKU for Application Gateway"
  type        = string
  default     = "WAF_v2"
}

variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "storage_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
}

variable "log_analytics_sku" {
  description = "Log Analytics workspace SKU"
  type        = string
  default     = "PerGB2018"
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}

variable "container_registry_sku" {
  description = "Container Registry SKU"
  type        = string
  default     = "Premium"
}

variable "enable_monitoring" {
  description = "Enable Azure Monitor for AKS"
  type        = bool
  default     = true
}

variable "enable_application_gateway_ingress" {
  description = "Enable Application Gateway ingress"
  type        = bool
  default     = true
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for node pools"
  type        = bool
  default     = true
}

variable "min_node_count" {
  description = "Minimum number of nodes in auto-scaling pools"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum number of nodes in auto-scaling pools"
  type        = number
  default     = 3
}

variable "file_share_quota" {
  description = "Quota for Azure File Share in GB"
  type        = number
  default     = 100
}
