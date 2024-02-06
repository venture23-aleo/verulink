FROM ubuntu 
RUN apt update && apt upgrade -y &&\
    apt install git -y

FROM golang:1.21.6-bookworm as attestor
WORKDIR /attestor/chainService
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o chainService .

FROM ubuntu
WORKDIR /
COPY --from=attestor /attestor/chainService/chainService .
COPY --from=attestor /attestor/chainService/config.yaml .
ENV DB_PATH=/db
ENV LOG_PATH=/log/attestor.log
ENV LOG_ENC=json
ENTRYPOINT [ "./chainService",\
                            "--config config.yaml", \
                            "--db ${DB_PATH}",\
                            "--log_path ${LOG_PATH}",\
                            "--log_enc ${LOG_ENC}", \
                            "--mode ${MODE}"]