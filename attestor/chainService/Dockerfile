FROM ubuntu as snark
ARG RUST_VERSION=1.75.0
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs/ | sh -s -- --default-toolchain=${RUST_VERSION} -y
RUN apt update && apt upgrade -y &&\
    apt install git -y
ARG SNARKOS_VERSION=v2.2.7
RUN git clone --depth 1 --branch ${SNARKOS_VERSION} https://github.com/AleoHQ/snarkOS.git
WORKDIR /snarkOS
RUN ./build_ubuntu.sh

FROM golang:1.21.6-bookworm as attestor
WORKDIR /attestor
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o attestor .

FROM ubuntu
WORKDIR /root/snarkos
COPY --from=snark  /root/.cargo/bin/snarkos .bin/snarkos
WORKDIR /
COPY --from=attestor /attestor/attestor .
COPY ./config.yaml .
ENV DB_PATH=/db
ENV LOG_PATH=/log
ENV LOG_ENC=json
ENTRYPOINT [ "./attestor --config config.yaml --db ${DB_PATH} --log_path ${LOG_PATH}} --log_enc ${LOG_ENC}" ]