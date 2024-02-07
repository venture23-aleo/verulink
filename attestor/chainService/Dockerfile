FROM golang:1.21.6-bookworm as chainservice
WORKDIR /chainservice
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o chainservice .

FROM alpine:3.19.1
WORKDIR /
COPY --from=chainservice /chainservice/chainservice .
COPY ./config.yaml .
ENV DB_PATH=/db
ENV LOG_PATH=/log/chainservice.log
ENV LOG_ENC=json
ENTRYPOINT [ "./chainservice",\
                            "--config config.yaml", \
                            "--db ${DB_PATH}",\
                            "--log_path ${LOG_PATH}",\
                            "--log_enc ${LOG_ENC}", \
                            "--mode ${MODE}"]
