# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY . .

RUN mvn -B -DskipTests clean package

# Runtime stage
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/4justice-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "base64 -d /etc/secrets/aiven-truststore-new.jks.b64 > /tmp/aiven-truststore-new.jks && java -jar app.jar --server.port=${PORT:-8080}"]
