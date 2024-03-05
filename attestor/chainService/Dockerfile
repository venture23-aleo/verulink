FROM golang:1.21.6 as chainservice
WORKDIR /chainservice
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o chainservice .

FROM alpine:3.19.1
WORKDIR /app
COPY --from=chainservice /chainservice/chainservice .
ENV DB_DIR=/db
ENV LOG_DIR=/log
ENV LOG_ENC=json
ENV CLEAN_START=false
# Entrypoint expects config.yaml to be present in /configs directory. User should bind mount their
# config file into container's /configs/config.yaml
ENTRYPOINT ./chainservice --config=/configs/config.yaml \
                            --db-dir=$DB_DIR \
                            --log-dir=$LOG_DIR \
                            --log-enc=$LOG_ENC \
                            --mode=$MODE \
                            --clean=$CLEAN_START
