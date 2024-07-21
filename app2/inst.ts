import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { AWSXRayPropagator } from "@opentelemetry/propagator-aws-xray";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { 
  SEMRESATTRS_SERVICE_NAME, 
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT ,
  SEMRESATTRS_AWS_LOG_GROUP_NAMES
} from '@opentelemetry/semantic-conventions';

const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'my-nextjs-app-1.0.2',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: 'production',
    [SEMRESATTRS_AWS_LOG_GROUP_NAMES ]: ['my-nextjs-app-logs']
});

// トレース用の設定
const traceExporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  });

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: 'http://localhost:4318/v1/metrics', // ADOT Collectorのエンドポイント
  }),
  exportIntervalMillis: 1000,
});


async function nodeSDKBuilder() {
    const sdk = new NodeSDK({
        resource: resource,
        traceExporter,
        metricReader,
        instrumentations: [
          new HttpInstrumentation({
            ignoreIncomingPaths: ['/healthcheck'],
          }),
          new AwsInstrumentation({
            suppressInternalInstrumentation: true
          })
        ],
        idGenerator: new AWSXRayIdGenerator(),
        textMapPropagator: new AWSXRayPropagator(),
    });
  
    // this enables the API to record telemetry
    await sdk.start();
  
    // gracefully shut down the SDK on process exit
    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(() => console.log('Metrics terminated'))
        .catch((error) => console.log('Error terminating metrics', error))
        .finally(() => process.exit(0));
    });
  }
  
nodeSDKBuilder().catch((error) => console.error('Error initializing OpenTelemetry SDK', error));