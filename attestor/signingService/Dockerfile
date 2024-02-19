FROM golang:1.21.6 as signingservice
WORKDIR /chainService
COPY ./chainService .
WORKDIR /signingservice
COPY ./signingService/go.mod ./signingService/go.sum ./
RUN go mod download
COPY ./signingService .

ENV GOPRIVATE=github.com/venture23-aleo/aleo-bridge
RUN go build -o signingservice .

FROM rust:1.75.0-buster as aleo
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
# port in which signing service listens from and serves to the incoming requests
EXPOSE 6579
# signingservice expects user to provide input in its run time while
# asking for decrypt key. It is recommended that attestor encrypt their
# wallet credentials and provide decrypt key at runtime
# ENTRYPOINT ["/bin/sh","-c", "./signingservice", "--config=/configs/config.yaml", "--kp=/configs/keys.yaml"]
CMD ["./signingservice --config=/configs/config.yaml --kp=/configs/keys.yaml"]
ENTRYPOINT ["/bin/sh", "-c"]
# ENTRYPOINT [ "/bin/sh", "-c", "sleep 1800"]