FROM golang:1.21.6-bookworm as signingservice
WORKDIR /signingservice
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o signingservice .

FROM rust:1.75.0-buster as aleo
WORKDIR /app
COPY ./rust .
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
ENTRYPOINT [ "./signingservice", "--config config.yaml"]
