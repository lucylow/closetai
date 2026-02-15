{{/*
Expand the name of the chart.
*/}}
{{- define "closetai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "closetai.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart name and version.
*/}}
{{- define "closetai.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version -}}
{{- end -}}

{{/*
Default labels applied to all resources.
*/}}
{{- define "closetai.labels" -}}
app.kubernetes.io/name: {{ include "closetai.name" . }}
helm.sh/chart: {{ include "closetai.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels for matching resources.
*/}}
{{- define "closetai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "closetai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
