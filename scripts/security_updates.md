Here's the updated version with the suggested changes incorporated:

---

# Verulink Update Version 1.0.2

This document outlines the key highlights of the version 1.0.2 upgrade and provides step-by-step instructions on how to apply the changes. This release introduces improved credential management and better integration with AWS Secrets Manager.

### Summary

Starting version 1.0.2, there will be a Docker image published on Docker Hub. You can reference it in your `compose.yaml` file to run the attestor.

### Docker Image Update

Update your `compose.yaml` file to reference the following Docker image for `chainservice`:

```yaml
services:
  chainservice:
    build: ./chainService
    image: verulink/chainservice:8a428f7
    pull_policy: build  # 'build' for local changes, 'always' to pull the latest image
```

### Credentials Separation

We are now separating the credentials to connect to the signing service from the `config.yaml` of `chainService` into a new `auth_secrets.yaml` file. This file will contain the authentication details required to connect to the signing service.

Ensure you create and store `auth_secrets.yaml` securely, as it contains sensitive authentication details.

The `auth_secrets.yaml` file should look like this:

```yaml
cred:
  username: <username_same_as_signingService>
  password: <password_same_as_signingService>
```

### AWS Secrets Manager Configuration

If you prefer to use AWS Secrets Manager for managing credentials, you can enable it by setting the `AWS_SECRETS_MANAGER` environment variable to `true` in the `signingService` section of the `compose.yaml` file.

There are two ways to configure AWS secrets: the recommended **EC2 Role Provider** method, or using AWS credentials and mounting them in Docker (described below).

#### EC2 Role Provider

For EC2 role-based authentication, follow these steps:

1. In the `attestor/signingService/secrets.yaml` file, **remove** the current chain-related private key and wallet addresses, which look like this:

   ```yaml
   chain:
     ethereum:
       private_key: <ETH_PRIVATE_KEY>
       wallet_address: <ETH_WALLET_ADDRESS>
     aleo:
       private_key: <ALEO_PRIVATE_KEY>
       wallet_address: <ALEO_WALLET_ADDRESS>
   ```

2. **Add** the following AWS region and secret IDs in the same file:

   ```yaml
   region: "<your_aws_region>"
   secret_id: "<secret_id_to_access_aws_secret_manager>"
   ```

3. Specify the signing service credentials in the same `secrets.yaml` file:

   ```yaml
   cred:
     username: "<username>"
     password: "<password>"
   ```

#### Using AWS Credentials

If you're using AWS credentials directly (via the `.aws` folder), you will need to mount this folder into your Docker container.

1. In the `attestor/signingService/secrets.yaml` file, **remove** the current chain-related private key and wallet addresses, which look like this:

   ```yaml
   chain:
     ethereum:
       private_key: <ETH_PRIVATE_KEY>
       wallet_address: <ETH_WALLET_ADDRESS>
     aleo:
       private_key: <ALEO_PRIVATE_KEY>
       wallet_address: <ALEO_WALLET_ADDRESS>
   ```

2. In the `attestor/compose.yaml` file, under `signingservice`, add the following `volumes` to mount your `.aws` folder:

   ```yaml
   volumes:
     - ./signingService/config.yaml:/configs/config.yaml
     - ./signingService/secrets.yaml:/configs/keys.yaml  # for local key pair setup
     - ~/.aws:/root/.aws:ro
   ```

3. Specify the signing service credentials in the same `secrets.yaml` file:

   ```yaml
   cred:
     username: "<username>"
     password: "<password>"
   ```
 

This will allow Docker to access your AWS credentials for Secrets Manager authentication.



**Note**: For best security practices, avoid storing credentials directly in the `.aws` folder or config files. Instead, prefer EC2 Role Provider or AWS Secrets Manager.

### Conclusion

The upcoming upgrade will enhance the management of credentials by separating them into distinct files and allowing for AWS Secrets Manager integration. This will improve security and ease credential management. Follow the steps outlined above to update your `compose.yaml` and credential files accordingly.

For any additional support, feel free to reach out.
