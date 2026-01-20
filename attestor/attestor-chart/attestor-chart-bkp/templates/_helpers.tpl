{{- define "attestor.name" -}}
verulink-attestor
{{- end }}

{{- define "attestor.labels" -}}
app.kubernetes.io/name: {{ include "attestor.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
