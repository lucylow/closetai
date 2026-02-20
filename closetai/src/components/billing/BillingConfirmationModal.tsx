/**
 * Billing Confirmation Modal - Shows cost estimate before generation
 * 
 * Per playbook section 12:
 * - Show estimated cost (credit estimate or USD) before running generation
 * - For PAYG or overage scenarios
 * - Allows user to confirm or cancel
 */

import React, { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, Check, X, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PricingConfig {
  creditsPerImage: number;
  pricePerCredit: number;
  currency: string;
  overagePricePerCredit: number;
}

interface BillingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  
  // Cost estimation
  estimatedCredits: number;
  isOverage?: boolean;
  userCreditsRemaining?: number;
  userPlanLimit?: number;
  
  // Pricing configuration
  pricingConfig?: PricingConfig;
  
  // Feature details
  featureType?: 'tryon' | 'text2img' | 'image-edit' | 'batch';
  estimatedTime?: string;
}

const DEFAULT_PRICING: PricingConfig = {
  creditsPerImage: 1,
  pricePerCredit: 0.10,
  currency: 'USD',
  overagePricePerCredit: 0.25,
};

export function BillingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  estimatedCredits,
  isOverage = false,
  userCreditsRemaining,
  userPlanLimit,
  pricingConfig = DEFAULT_PRICING,
  featureType = 'text2img',
  estimatedTime = '30-60 seconds',
}: BillingConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate costs
  const costInfo = useMemo(() => {
    const effectivePrice = isOverage 
      ? pricingConfig.overagePricePerCredit 
      : pricingConfig.pricePerCredit;
    
    const totalCost = estimatedCredits * effectivePrice;
    const costInCredits = estimatedCredits;
    
    // Credit utilization
    let creditsPercentUsed = 0;
    let creditsAfter = userCreditsRemaining;
    
    if (userCreditsRemaining !== undefined) {
      creditsAfter = userCreditsRemaining - estimatedCredits;
      if (userPlanLimit && userPlanLimit > 0) {
        creditsPercentUsed = ((userPlanLimit - userCreditsRemaining) / userPlanLimit) * 100;
      }
    }
    
    return {
      totalCost,
      costInCredits,
      effectivePrice,
      creditsPercentUsed,
      creditsAfter,
      isLowBalance: userCreditsRemaining !== undefined && userCreditsRemaining < estimatedCredits,
    };
  }, [estimatedCredits, isOverage, pricingConfig, userCreditsRemaining, userPlanLimit]);

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
    onClose();
  }, [onCancel, onClose]);

  if (!isOpen) return null;

  const getFeatureLabel = () => {
    switch (featureType) {
      case 'tryon':
        return 'Virtual Try-On';
      case 'text2img':
        return 'AI Image Generation';
      case 'image-edit':
        return 'Image Editing';
      case 'batch':
        return 'Batch Generation';
      default:
        return 'Image Generation';
    }
  };

  const getFeatureIcon = () => {
    switch (featureType) {
      case 'tryon':
        return '👗';
      case 'text2img':
        return '🎨';
      case 'image-edit':
        return '✨';
      case 'batch':
        return '📦';
      default:
        return '🖼️';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="shadow-2xl border-slate-100">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
                {getFeatureIcon()}
              </div>
              <div>
                <CardTitle className="text-lg">Confirm {getFeatureLabel()}</CardTitle>
                <p className="text-sm text-muted-foreground">Review cost before proceeding</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Credit Summary */}
            {userCreditsRemaining !== undefined && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Credits</span>
                  <span className="font-medium">{userCreditsRemaining} credits</span>
                </div>
                
                {userPlanLimit && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Plan Limit</span>
                      <span>{userPlanLimit} credits/month</span>
                    </div>
                    <Progress value={Math.min(costInfo.creditsPercentUsed, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(costInfo.creditsPercentUsed)}% of monthly limit used
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Feature</span>
                <span className="font-medium">{getFeatureLabel()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Credits Required</span>
                <span className="font-semibold text-purple-600">
                  {costInfo.costInCredits} credits
                </span>
              </div>

              {isOverage && (
                <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Overage rate applied</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-medium">Estimated Cost</span>
                <span className="text-xl font-bold text-purple-700">
                  ${costInfo.totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Credits After */}
            {costInfo.creditsAfter !== undefined && (
              <div className={`p-3 rounded-lg flex items-center justify-between ${
                costInfo.isLowBalance 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'
              }`}>
                <span className="text-sm">Credits after this generation:</span>
                <span className="font-semibold">
                  {Math.max(0, costInfo.creditsAfter)} credits
                </span>
              </div>
            )}

            {/* Processing Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {estimatedTime}</span>
            </div>

            {/* Low Balance Warning */}
            {costInfo.isLowBalance && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Insufficient credits</p>
                  <p className="text-amber-700">
                    You'll need to purchase more credits or upgrade your plan.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || costInfo.isLowBalance}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 animate-pulse" />
                  Processing...
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm ({costInfo.costInCredits} credits)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

/**
 * Hook for managing billing confirmation flow
 */
export function useBillingConfirmation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [billingInfo, setBillingInfo] = useState<{
    estimatedCredits: number;
    isOverage?: boolean;
    userCreditsRemaining?: number;
    userPlanLimit?: number;
    featureType?: 'tryon' | 'text2img' | 'image-edit' | 'batch';
  } | null>(null);

  const requestConfirmation = useCallback((
    action: () => void,
    info: {
      estimatedCredits: number;
      isOverage?: boolean;
      userCreditsRemaining?: number;
      userPlanLimit?: number;
      featureType?: 'tryon' | 'text2img' | 'image-edit' | 'batch';
    }
  ) => {
    setPendingAction(() => action);
    setBillingInfo(info);
    setIsModalOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    setIsModalOpen(false);
    setPendingAction(null);
    setBillingInfo(null);
  }, [pendingAction]);

  const handleCancel = useCallback(() => {
    setIsModalOpen(false);
    setPendingAction(null);
    setBillingInfo(null);
  }, []);

  return {
    isModalOpen,
    billingInfo,
    requestConfirmation,
    handleConfirm,
    handleCancel,
  };
}

export default BillingConfirmationModal;
