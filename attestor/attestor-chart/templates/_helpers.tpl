{{/* vim: set filetype=gotpl: */}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "verulink-attestor.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{/*
Common labels
*/}}
{{- define "verulink-attestor.labels" -}}
helm.sh/chart: {{ include "verulink-attestor.chart" . }}
{{ include "verulink-attestor.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "verulink-attestor.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Runtime validation for required values.
This will fail the install/upgrade if values are empty,
but will not print anything into the rendered YAML output.
*/}}
{{- define "verulink-attestor.validateValues" -}}
{{- $ := required "A non-empty .Values.aleo_wallet_address is required for installation" .Values.aleo_wallet_address -}}
{{- $ := required "A non-empty .Values.bsc_wallet_address is required for installation" .Values.bsc_wallet_address -}}
{{- end -}}
