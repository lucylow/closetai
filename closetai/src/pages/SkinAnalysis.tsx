import { useState } from 'react';
import SkinAnalysisUpload from '@/components/skin-analysis/SkinAnalysisUpload';
import SkinAnalysisResultView from '@/components/skin-analysis/SkinAnalysisResultView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SkinAnalysis() {
  const [latestResult, setLatestResult] = useState<any>(null);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent-color bg-clip-text text-transparent">
          AI Color Analysis
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover your perfect palette with professional-grade skin analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Selfie Analysis</CardTitle>
            <CardDescription>
              Upload a clear photo in natural light for the most accurate results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkinAnalysisUpload onResult={setLatestResult} />
            <p className="mt-4 text-xs text-muted-foreground italic text-center">
              Powered by Perfect Corp AI Beauty Technology
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Your Color Profile</CardTitle>
            <CardDescription>
              Analysis of your skin tone, undertone, and seasonal palette.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!latestResult ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-2xl border-2 border-dashed">
                <div className="text-6xl mb-4 opacity-20">🎨</div>
                <p className="text-muted-foreground">
                  Your personalized analysis will appear here once you upload your selfie.
                </p>
              </div>
            ) : (
              <SkinAnalysisResultView result={latestResult} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
