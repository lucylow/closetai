// src/components/TryOnModal.tsx
import React, { useEffect, useState } from 'react';
import { Recommendation, TryOnTask } from '../types';

interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  recommendation: Recommendation;
}

export default function TryOnModal({ open, onClose, taskId, recommendation }: TryOnModalProps) {
  const [status, setStatus] = useState<string>('pending');
  const [result, setResult] = useState<TryOnTask['result'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !taskId) return;

    let cancelled = false;
    let backoff = 800;

    async function poll() {
      if (cancelled) return;
      
      try {
        // Poll demo endpoint for status
        const res = await fetch(`/api/demo/tryon/${taskId}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        
        const json = await res.json();
        
        if (!cancelled) {
          setStatus(json.status || 'pending');
          
          if (json{
            result) {
              setResult(json.result);
            }
            
            setLoading(false);
            
            // Continue polling if not done
            if (json.status !== 'done' && json
