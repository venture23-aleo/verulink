FROM golang:1.21.6-bookworm as chainservice
WORKDIR /chainservice
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o chainservice .

FROM alpine:3.19.1
WORKDIR /
COPY --from=chainservice /chainservice/chainservice .
ENV DB_PATH=/db
ENV LOG_PATH=/log/chainservice.log
ENV LOG_ENC=json
# Entrypoint expects config.yaml to be present in /configs directory. User should bind mount their
# config file into container's /configs/config.yaml
ENTRYPOINT [ "./chainservice",\
                            "--config /configs/config.yaml",\
                            "--db ${DB_PATH}",\
                            "--log_path ${LOG_PATH}",\
                            "--log_enc ${LOG_ENC}", \
                            "--mode ${MODE}"]
