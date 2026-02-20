terraform {
  required_providers {
    linode = {
      source  = "linode/linode"
      version = "2.32.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "linode" {
  token = var.linode_token
}

variable "linode_token" {
  description = "Linode API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Linode region (use us-sea, us-ord, de-fra-2, fr-par, jp-osa, or sg-sin-2 for GPU)"
  type        = string
  default     = "us-sea"
}

# Object Storage cluster - may differ from compute region
# Check: https://www.linode.com/docs/products/storage/object-storage/ (us-east-1, eu-central-1, ap-south-1)
variable "object_storage_cluster" {
  description = "Object Storage cluster (e.g. us-east-1, eu-central-1)"
  type        = string
  default     = "us-east-1"
}

variable "cluster_label" {
  description = "LKE cluster label"
  type        = string
  default     = "closetai-lke"
}

variable "gpu_node_count" {
  description = "Number of GPU nodes in the pool"
  type        = number
  default     = 2
}

variable "cpu_node_count" {
  description = "Number of CPU nodes in the pool"
  type        = number
  default     = 3
}

variable "object_storage_expiration_days" {
  description = "Days before objects in bucket expire (0 = disabled)"
  type        = number
  default     = 30
}

# Create LKE cluster
resource "linode_lke_cluster" "wardrobe_stylist" {
  label       = var.cluster_label
  region      = var.region
  k8s_version = "1.31"
  tags        = ["hackathon", "ai-wardrobe", "gpu", "closetai"]

  # GPU node pool for AI workloads (label nodepool=gpu via post-apply script)
  pool {
    type  = "g2-gpu-rtx4000a1-m" # RTX 4000 Ada Medium
    count = var.gpu_node_count
    tags  = ["gpu", "inference", "nodepool-gpu"]
  }

  # CPU node pool for supporting services
  pool {
    type  = "g6-dedicated-8" # Dedicated 8GB
    count = var.cpu_node_count
    tags  = ["api", "frontend", "support"]
  }
}

# Object Storage bucket (Linode Object Storage cluster)
resource "linode_object_storage_bucket" "media" {
  cluster     = var.object_storage_cluster
  label       = "closetai-media-${random_string.suffix.result}"
  description = "Media bucket for ClosetAI"

  dynamic "lifecycle_rule" {
    for_each = var.object_storage_expiration_days > 0 ? [1] : []
    content {
      enabled = true
      expiration {
        days = var.object_storage_expiration_days
      }
    }
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Object Storage access key
resource "linode_object_storage_key" "media" {
  label = "wardrobe-stylist-key"
  bucket_access {
    bucket_name = linode_object_storage_bucket.media.label
    cluster     = linode_object_storage_bucket.media.cluster
    permissions = "read_write"
  }
}

output "kubeconfig" {
  value     = linode_lke_cluster.wardrobe_stylist.kubeconfig
  sensitive = true
}

output "cluster_id" {
  value = linode_lke_cluster.wardrobe_stylist.id
}

output "object_storage_endpoint" {
  value = "${linode_object_storage_bucket.media.cluster}.linodeobjects.com"
}

output "object_storage_bucket" {
  value = linode_object_storage_bucket.media.label
}

output "object_storage_access_key" {
  value     = linode_object_storage_key.media.access_key
  sensitive = true
}

output "object_storage_secret_key" {
  value     = linode_object_storage_key.media.secret_key
  sensitive = true
}
