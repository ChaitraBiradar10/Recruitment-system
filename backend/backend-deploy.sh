#!/bin/bash

echo "Setting up Backend..."

cd "/d/full-recruitment-system (3)/full-recruitment-system/full-recruitment-system/backend"

echo "Building Spring Boot project..."
mvn clean install -DskipTests

echo "Running Spring Boot app..."
mvn spring-boot:run