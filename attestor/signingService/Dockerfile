FROM golang:1.21.6 as signingservice
WORKDIR /chainService
COPY ./chainService .
WORKDIR /signingservice
COPY ./signingService ./
RUN go mod download
RUN go mod tidy

RUN go build -o signingservice .

FROM rust:1.88.0 as aleo
WORKDIR /app
COPY ./signingService/rust .
RUN cargo install --path .
RUN cargo build

FROM ubuntu
RUN apt update && apt -y upgrade && apt install -y curl 
WORKDIR /app
COPY --from=aleo /app/target/debug/ahs .
COPY --from=signingservice /signingservice/signingservice .
#signing service looks up if `ahs` command is available
ENV PATH="$PATH:/app"
RUN export PATH
EXPOSE 8080
# signingservice expects user to provide input in its run time while
# asking for decrypt key. It is recommended that attestor encrypt their
# wallet credentials and provide decrypt key at runtime
CMD ["./signingservice --config=/configs/config.yaml --kp=/configs/keys.yaml --port 8080"]
ENTRYPOINT ["/bin/sh", "-c"]