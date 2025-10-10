# Stage 1: Build the optimized Keycloak image with the Postgres driver
FROM quay.io/keycloak/keycloak:latest as builder

ENV KC_DB=postgres
WORKDIR /opt/keycloak

# This command bakes the Postgres driver into the image
RUN /opt/keycloak/bin/kc.sh build

# Stage 2: Create the final, lean image
FROM quay.io/keycloak/keycloak:latest

# Copy the optimized server from the builder stage
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# The entrypoint simply starts the pre-built server
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start"]
