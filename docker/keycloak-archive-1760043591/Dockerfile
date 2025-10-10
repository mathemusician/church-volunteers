FROM quay.io/keycloak/keycloak:latest as builder

ENV KC_DB=postgres
WORKDIR /opt/keycloak
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:latest
COPY --from=builder /opt/keycloak/ /opt/keycloak/
WORKDIR /opt/keycloak

ENV KC_DB=postgres
ENV KC_HTTP_ENABLED=true
ENV KC_HOSTNAME_STRICT=false
ENV JAVA_OPTS_APPEND="-Djava.net.preferIPv4Stack=false"

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--proxy-headers", "xforwarded"]
