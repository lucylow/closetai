variable "linode_token" {
  description = "Linode API token from Cloud Manager"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Linode region - use GPU-supported: us-sea, us-ord, de-fra-2, fr-par, jp-osa, sg-sin-2"
  type        = string
  default     = "us-sea"
}

variable "object_storage_cluster" {
  description = "Object Storage cluster (us-east-1, eu-central-1, ap-south-1)"
  type        = string
  default     = "us-east-1"
}
