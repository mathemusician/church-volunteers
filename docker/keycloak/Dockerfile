# Stage 1: Build the optimized Keycloak image with the Postgres driver
FROM quay.io/keycloak/keycloak:latest as builder

# This build argument tells Keycloak to bake in the Postgres driver
ARG KC_DB=postgres
WORKDIR /opt/keycloak

# Build the server with the specified database driver
RUN /opt/keycloak/bin/kc.sh build

# Stage 2: Create the final, lean image
FROM quay.io/keycloak/keycloak:latest

# Copy the optimized server from the builder stage
COPY --from=builder /opt/keycloak/ /opt/keycloak/

# The entrypoint simply starts the pre-built server
# All configuration will be passed via secrets at runtime
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start"]
