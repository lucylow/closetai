#!/bin/bash
# cost-tracker.sh - Monitor Linode resource usage to stay within $1,000 credit
# Run daily via cron: 0 9 * * * /path/to/cost-tracker.sh

echo "=== Akamai Cloud Cost Tracker ==="
echo "Date: $(date)"
echo

# Get current balance (requires Linode CLI)
if command -v linode-cli &>/dev/null; then
    BALANCE=$(linode-cli account view --format balance --text 2>/dev/null | tail -1 || echo "0")
    echo "Current balance: \$${BALANCE:-0.00}"
    echo "Remaining credit: \$((1000 - ${BALANCE:-0}))"
else
    echo "Linode CLI not installed - run: pip install linode-cli"
fi
echo

# Get running instances
echo "Running GPU instances:"
if command -v linode-cli &>/dev/null; then
    linode-cli linodes list \
        --format label,region,status,ipv4 \
        --text \
        --no-headers 2>/dev/null || echo "   (none or CLI not configured)"
else
    echo "   Linode CLI not installed"
fi
echo

# GPU cost estimate
GPU_COUNT=$(kubectl get nodes -l node.kubernetes.io/instance-type=g2-gpu-rtx4000a1-m --no-headers 2>/dev/null | wc -l || echo "0")
echo "GPU instances in cluster: $GPU_COUNT"
echo "Estimated hourly cost: ~\$0.52/hour per GPU node"
echo "Total hourly estimate: \$$(echo "$GPU_COUNT * 0.52" | bc 2>/dev/null || echo "0")"
echo

echo "Run this script daily to track costs within your \$1,000 promotional credit."
