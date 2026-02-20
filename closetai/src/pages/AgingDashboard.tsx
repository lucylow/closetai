/**
 * Aging Dashboard - AI Aging Features Main Page
 * Provides skin analysis, aging simulation, and diagnostic reports
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AgingUploadWidget from '@/components/aging/AgingUploadWidget';
import AgingReportCard from '@/components/aging/AgingReportCard';
import AgingSimulator from '@/components/aging/AgingSimulator';
import ConsentModal from '@/components/aging/ConsentModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgingReport {
  id: string;
  wrinkle_index: number;
  pore_index: number;
  pigment_index: number;
  hydration_index: number;
  elasticity_proxy: number;
  uv_damage_score: number;
  estimated_appearance_age: number;
  confidence_lower: number;
  confidence_upper: number;
  created_at: string;
}

interface JobStatus {
  id: string;
  status: string;
  progress: number;
  type: string;
}

export default function AgingDashboard() {
  const [latestReport, setLatestReport] = useState<AgingReport | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobStatus[]>([]);
  const [showConsent, setShowConsent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Check consent status on mount
  useEffect(() => {
    const checkConsent = async () => {
      try {
        // In real implementation, check with backend
        const storedConsent = localStorage.getItem('aging_consent');
        if (storedConsent) {
          setConsentGiven(true);
        }
      } catch (error) {
        console.error('Error checking consent:', error);
      }
    };
    checkConsent();
  }, []);

  const handleConsentGiven = () => {
    setConsentGiven(true);
    setShowConsent(false);
    localStorage.setItem('aging_consent', 'true');
  };

  const handleAnalysisComplete = (jobId: string) => {
    setCurrentJobId(jobId);
    setActiveTab('results');
    // Poll for results
    pollJobStatus(jobId);
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/aging/job/${jobId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        if (data.status === 'completed') {
          if (data.results?.report?.metrics) {
            setLatestReport({
              id: data.results.reportId,
              ...data.results.report.metrics,
              created_at: new Date().toISOString()
            });
          }
        } else if (data.status === 'failed') {
          console.error('Analysis failed:', data.error);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };
    
    // Poll every 2 seconds
    const interval = setInterval(poll, 2000);
    setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent-color bg-clip-text text-transparent">
          AI Aging Analysis
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover your skin's aging indicators with educational, non-medical insights
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Educational Use Only:</strong> This tool provides illustrative estimates and 
        non-medical recommendations. Results are not diagnostic. For any health concerns, 
        please consult a licensed dermatologist or healthcare professional.
      </div>

      {/* Consent Required */}
      {!consentGiven && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Consent Required</p>
              <p className="text-muted-foreground">
                To analyze your skin, we need your consent to process facial images.
                Your data will be handled securely and can be deleted at any time.
              </p>
              <Button onClick={() => setShowConsent(true)}>
                Review Consent Information
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {consentGiven && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="simulate">Simulate</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Photo</CardTitle>
                  <CardDescription>
                    For best results, use a clear, well-lit selfie with a neutral expression.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AgingUploadWidget 
                    onAnalysisStarted={handleAnalysisComplete}
                  />
                  <p className="mt-4 text-xs text-muted-foreground italic text-center">
                    Powered by Perfect Corp AI Technology
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What We Analyze</CardTitle>
                  <CardDescription>
                    Our AI examines multiple skin indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Wrinkle Index</span>
                    <span className="text-sm text-muted-foreground">Fine lines & depth</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Pigmentation</span>
                    <span className="text-sm text-muted-foreground">Spots & evenness</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Hydration</span>
                    <span className="text-sm text-muted-foreground">Moisture levels</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Elasticity</span>
                    <span className="text-sm text-muted-foreground">Skin firmness</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">UV Damage</span>
                    <span className="text-sm text-muted-foreground">Sun exposure indicators</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulate">
            <Card>
              <CardHeader>
                <CardTitle>Aging Simulator</CardTitle>
                <CardDescription>
                  See how your appearance might change over time. This is an illustrative simulation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgingSimulator onSimulationComplete={(jobId) => {
                  setCurrentJobId(jobId);
                  setActiveTab('results');
                }} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {latestReport ? (
              <AgingReportCard report={latestReport} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-2xl border-2 border-dashed">
                    <div className="text-6xl mb-4 opacity-20">📊</div>
                    <p className="text-muted-foreground">
                      Your analysis results will appear here once you complete an analysis.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('analyze')}
                    >
                      Start New Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Consent Modal */}
      {showConsent && (
        <ConsentModal 
          open={true}
          onAccept={handleConsentGiven}
          onDecline={() => setShowConsent(false)}
        />
      )}
    </div>
  );
}
