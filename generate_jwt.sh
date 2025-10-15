#!/usr/bin/env bash
set -o pipefail
client_id=$1
pem=$2
now=$(date +%s)
iat=$((${now} - 60))
exp=$((${now} + 600))
b64enc() { openssl base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n'; }
header_json='{"typ":"JWT","alg":"RS256"}'
header=$( echo -n "${header_json}" | b64enc )
payload_json="{\"iat\":${iat},\"exp\":${exp},\"iss\":\"${client_id}\"}"
payload=$( echo -n "${payload_json}" | b64enc )
header_payload="${header}.${payload}"
signature=$(openssl dgst -sha256 -sign <(echo "${pem}" | sed 's/\\n/\n/g') <(echo -n "${header_payload}") | b64enc)
JWT="${header_payload}.${signature}"
echo "JWT=${JWT}" >> $GITHUB_ENV
