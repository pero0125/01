# Use the base image for ADOT Collector
FROM public.ecr.aws/aws-observability/aws-otel-collector:latest

# Copy the custom metrics configuration file into the container
COPY custom-metrics.yaml /otel-config.yaml

# Set the command to run the ADOT Collector with the custom configuration
CMD ["--config", "/otel-config.yaml"]
