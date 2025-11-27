# 1단계: Gradle로 빌드해서 jar 만들기
FROM gradle:8.7-jdk17 AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

# 2단계: 가벼운 JRE 이미지로 실행
FROM eclipse-temurin:17-jre
WORKDIR /app

# 위 단계에서 만든 jar 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 기본 포트 (실제 포트는 PORT env로 정해짐)
EXPOSE 8080

# prod 프로필 사용
ENV SPRING_PROFILES_ACTIVE=prod

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app.jar"]
