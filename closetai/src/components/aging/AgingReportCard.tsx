/**
 * Aging Report Card - Displays aging analysis results
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  recommendations?: Array<{
    category: string;
    product_name: string;
    recommendation_reason: string;
    confidence_score: number;
    is_medical: boolean;
  }>;
}

interface AgingReportCardProps {
  report: AgingReport;
}

function MetricBar({ label, value, color = "bg-primary" }: { label: string; value: number; color?: string }) {
  const percentage = Math.round(value * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className={`h-2 ${color}`} />
    </div>
  );
}

export default function AgingReportCard({ report }: AgingReportCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Results Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your Skin Analysis</CardTitle>
              <CardDescription>Analysis completed {formatDate(report.created_at)}</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Educational
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estimated Age */}
          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent-color/10 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Estimated Appearance Indicator</p>
            <p className="text-5xl font-bold text-primary">
              {report.estimated_appearance_age}
            </p>
            <p className="text-sm text-muted-foreground">
              Confidence range: {report.confidence_lower} - {report.confidence_upper}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This is an illustrative estimate, not a medical diagnosis
            </p>
          </div>

          {/* Metrics */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Skin Indicators</h3>
              <MetricBar label="Wrinkle Index" value={report.wrinkle_index} color="bg-blue-500" />
              <MetricBar label="Pigmentation" value={report.pigment_index} color="bg-amber-500" />
              <MetricBar label="Hydration" value={report.hydration_index} color="bg-cyan-500" />
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Additional Metrics</h3>
              <MetricBar label="Elasticity" value={report.elasticity_proxy} color="bg-green-500" />
              <MetricBar label="UV Damage" value={report.uv_damage_score} color="bg-red-500" />
              <MetricBar label="Pore Visibility" value={report.pore_index} color="bg-purple-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> This analysis provides educational insights only. 
            It is not a medical diagnosis or treatment recommendation. 
            For any skin concerns, please consult a licensed dermatologist.
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personalized Suggestions</CardTitle>
            <CardDescription>
              Non-medical recommendations based on your analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${rec.is_medical ? 'bg-red-50 border border-red-200' : 'bg-muted'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{rec.product_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{rec.recommendation_reason}</p>
                  </div>
                  {rec.is_medical && (
                    <Badge variant="destructive">Consult Professional</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
