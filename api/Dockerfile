FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn package -DskipTests

FROM eclipse-temurin:17.0.9_9-jre

WORKDIR /app

COPY --from=build /app/target/api-0.0.1-SNAPSHOT.jar .

EXPOSE 8080

CMD ["java", "-jar", "/app/api-0.0.1-SNAPSHOT.jar"]