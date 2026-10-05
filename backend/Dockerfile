FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Dependencies are resolved in their own layer, so they are only downloaded again when pom.xml changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Tests need Docker (Testcontainers) and cannot run inside an image build; run them with ./mvnw verify.
COPY src ./src
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home app
COPY --from=build /app/target/*.jar app.jar
USER app
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
