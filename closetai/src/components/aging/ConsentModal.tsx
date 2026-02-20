/**
 * Consent Modal - User consent dialog for face analysis
 */

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ open, onAccept, onDecline }: ConsentModalProps) {
  const [accepted, setAccepted] = React.useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={open ? undefined : onDecline}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Skin Analysis Consent</DialogTitle>
          <DialogDescription>
            Please review and accept our consent information before proceeding
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">What We Analyze</h4>
            <p className="text-muted-foreground">
              We analyze facial features to provide educational insights about skin aging indicators 
              including wrinkle patterns, pigmentation, hydration levels, and elasticity.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Data Handling</h4>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Images are processed securely and stored temporarily</li>
              <li>Data is retained for 30 days by default</li>
              <li>You can request deletion at any time</li>
              <li>Data is never shared with third parties for marketing</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Important Disclaimer</h4>
            <p className="text-muted-foreground">
              This analysis is for educational purposes only. It is NOT a medical diagnosis. 
              Results should not be used for self-treatment of any skin condition. 
              For medical concerns, please consult a licensed dermatologist.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="consent" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label 
              htmlFor="consent" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand and consent to the analysis of my facial image
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Cancel
          </Button>
          <Button onClick={handleAccept} disabled={!accepted}>
            I Consent & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
