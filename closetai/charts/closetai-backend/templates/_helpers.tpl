{{- define "closetai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "closetai.fullname" -}}
{{- define "closetai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "closetai.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" (include "closetai.name" .) .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "closetai.labels" -}}
app.kubernetes.io/name: {{ include "closetai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: "{{ .Chart.AppVersion }}"
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "closetai.selectorLabels" -}}
app: {{ include "closetai.fullname" . }}
{{- end -}}

{{- define "closetai.serviceAccountName" -}}
{{- default (printf "%s-sa" (include "closetai.fullname" .)) .Values.serviceAccount.name -}}
{{- end -}}

{{- define "closetai.metricsAnnotations" -}}
{{- $path := .Values.prometheus.serviceMonitor.path | default "/metrics" -}}
{{- $port := .Values.prometheus.serviceMonitor.port | default "metrics" -}}
prometheus.io/scrape: "true"
prometheus.io/port: "{{ $port }}"
prometheus.io/path: "{{ $path }}"
{{- end -}}
