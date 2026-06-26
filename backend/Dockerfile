# ---- Build stage ----
# Uses a Maven + JDK 21 image so no local Maven wrapper is required.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first (only re-downloads when pom.xml changes).
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Build the application jar (tests skipped to keep deploys fast).
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Runtime stage ----
# Slim JRE-only image for a smaller, faster-starting container.
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the repackaged Spring Boot jar from the build stage.
COPY --from=build /app/target/*.jar app.jar

# Render injects the PORT env var; Spring Boot reads it via server.port.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
