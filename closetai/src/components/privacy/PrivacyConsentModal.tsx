/**
 * Privacy Consent Modal - Required for virtual try-on feature
 * 
 * This component implements the privacy-first flow required by the playbook:
 * - Explicit consent for user photo processing
 * - Face blur option for privacy
 * - Short retention policy disclosure
 * 
 * Per playbook section 12 & 17:
 * - Consent modal describing that user photo will be sent to external provider
 * - Face blur toggle: default to blur faces unless explicit opt-in
 * - Explicit and recorded consent for user photo processing
 */

import React, { useState, useCallback } from 'react';
import { AlertTriangle, Shield, Eye, EyeOff, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PrivacyConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consent: {
    agreed: boolean;
    blurFace: boolean;
    allowRetention: boolean;
  }) => void;
  featureType?: 'tryon' | 'image-edit' | 'text2img';
  estimatedCredits?: number;
  customMessage?: string;
}

const RETENTION_DAYS = 30;

export function PrivacyConsentModal({
  isOpen,
  onClose,
  onConsent,
  featureType = 'tryon',
  estimatedCredits,
  customMessage,
}: PrivacyConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [blurFace, setBlurFace] = useState(true); // Default to blur (per playbook)
  const [allowRetention, setAllowRetention] = useState(false);

  const handleConsent = useCallback(() => {
    if (!agreed) return;
    
    onConsent({
      agreed: true,
      blurFace,
      allowRetention,
    });
    
    // Reset state on close
    setAgreed(false);
    setBlurFace(true);
    setAllowRetention(false);
  }, [agreed, blurFace, allowRetention, onConsent]);

  const handleDecline = useCallback(() => {
    onConsent({
      agreed: false,
      blurFace: true,
      allowRetention: false,
    });
    onClose();
  }, [onConsent, onClose]);

  if (!isOpen) return null;

  const getFeatureLabel = () => {
    switch (featureType) {
      case 'tryon':
        return 'Virtual Try-On';
      case 'image-edit':
        return 'Image Editing';
      case 'text2img':
        return 'AI Image Generation';
      default:
        return 'AI Feature';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDecline}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <Card className="shadow-2xl border-purple-100">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-700">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Privacy Consent Required</span>
              </div>
              <button
                onClick={handleDecline}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardTitle className="text-xl font-bold">
              {getFeatureLabel()}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Warning Alert */}
            <Alert variant="default" className="bg-purple-50 border-purple-200">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-800">Photo Processing Notice</AlertTitle>
              <AlertDescription className="text-purple-700 text-sm">
                Your photo will be sent to our AI provider (Perfect Corp) to generate 
                the {getFeatureLabel().toLowerCase()} result.
              </AlertDescription>
            </Alert>

            {/* Custom Message */}
            {customMessage && (
              <p className="text-sm text-muted-foreground">{customMessage}</p>
            )}

            {/* Credit Estimate */}
            {estimatedCredits !== undefined && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">This action will consume: </span>
                <span className="font-semibold">{estimatedCredits} credits</span>
              </div>
            )}

            {/* Face Blur Option - Per playbook: default to blur */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                {blurFace ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">Blur Face (Recommended)</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically blur your face in the result for privacy
                  </p>
                </div>
              </div>
              <Switch
                checked={blurFace}
                onCheckedChange={setBlurFace}
              />
            </div>

            {/* Retention Option */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Allow Photo Storage</p>
                <p className="text-xs text-muted-foreground">
                  Store your photo for {RETENTION_DAYS} days to improve future tries
                </p>
              </div>
              <Switch
                checked={allowRetention}
                onCheckedChange={setAllowRetention}
              />
            </div>

            {/* Consent Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-purple-500 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm">
                I understand that my photo will be processed by an external AI provider 
                and I consent to this processing. I can request deletion at any time.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConsent}
                disabled={!agreed}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept & Continue
              </Button>
            </div>

            {/* Privacy Policy Link */}
            <p className="text-xs text-center text-muted-foreground">
              By proceeding, you agree to our{' '}
              <a href="/privacy" className="underline hover:text-purple-600">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Hook to manage privacy consent state
 */
export function usePrivacyConsent(featureType: 'tryon' | 'image-edit' | 'text2img' = 'tryon') {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consent, setConsent] = useState<{
    agreed: boolean;
    blurFace: boolean;
    allowRetention: boolean;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestConsent = useCallback((action: () => void) => {
    setPendingAction(() => action);
    setConsent(null);
    setIsModalOpen(true);
  }, []);

  const handleConsentResult = useCallback((result: {
    agreed: boolean;
    blurFace: boolean;
    allowRetention: boolean;
  }) => {
    setConsent(result);
    setIsModalOpen(false);
    
    if (result.agreed && pendingAction) {
      pendingAction();
    }
    setPendingAction(null);
  }, [pendingAction]);

  const clearConsent = useCallback(() => {
    setConsent(null);
    setIsModalOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isModalOpen,
    consent,
    requestConsent,
    handleConsentResult: handleConsentResult,
    clearConsent,
    hasConsent: consent?.agreed ?? false,
    shouldBlurFace: consent?.blurFace ?? true,
    allowsRetention: consent?.allowRetention ?? false,
  };
}

export default PrivacyConsentModal;
