{{- define "attestor.name" -}}
verulink-attestor
{{- end }}

{{- define "attestor.fullname" -}}
{{- if .Release.Name -}}
{{- printf "%s-%s" .Release.Name (include "attestor.name" .) | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "attestor.name" . -}}
{{- end -}}
{{- end }}

{{- define "attestor.serviceAccountName" -}}
{{- if and (.Values.serviceAccount) (.Values.serviceAccount.name) -}}
{{- .Values.serviceAccount.name -}}
{{- else -}}
{{- include "attestor.fullname" . -}}
{{- end -}}
{{- end }}

{{- define "attestor.labels" -}}
app.kubernetes.io/name: {{ include "attestor.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
