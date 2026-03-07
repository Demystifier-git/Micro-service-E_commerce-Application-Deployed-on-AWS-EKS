#
# Build
#
FROM maven:3.9.6-eclipse-temurin-8 AS build

WORKDIR /opt/shipping

# Copy only pom.xml first for better caching
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn -B package


#
# Run
#
FROM eclipse-temurin:8-jdk

WORKDIR /opt/shipping

ENV CART_ENDPOINT=cart:8080
ENV DB_HOST=mysql

COPY --from=build /opt/shipping/target/shipping-1.0.jar shipping.jar

EXPOSE 8080

CMD ["java", "-Xmn256m", "-Xmx768m", "-jar", "shipping.jar"]


