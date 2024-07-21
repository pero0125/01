// customMetrics.ts
import { metrics, Meter, ObservableResult } from '@opentelemetry/api';

export class CustomMetrics {
  private meter: Meter;
  private counterExample: any;
  private observableUpdownCounterExample: any;
  private observableGaugeExample: any;
  private histogramExample: any;
  private counterVar: number = 0;
  private gaugeVar: number = 0;
  
  private common_attributes = { signal: 'metric', language: 'typescript' };

  constructor() {
    this.meter = metrics.getMeter('ts-sample-app-meter');
    this.initializeMetrics();
  }

  private initializeMetrics() {
    this.counterExample = this.meter.createCounter('counter', {
      description: 'Creates a counter metric',
      unit: '1',
    });

    this.observableUpdownCounterExample = this.meter.createObservableUpDownCounter('updownCounter', {
      description: 'Creates an asynchronous updown counter metric',
      unit: '1',
    });
    this.observableUpdownCounterExample.addCallback((measurement: any) => {
      console.log(`UpDownCounter callback called. Current value: ${this.counterVar}`);
      measurement.observe(this.counterVar, this.common_attributes);
    });

    this.observableGaugeExample = this.meter.createObservableGauge('observableGauge', {
      description: 'Creates an observable gauge metric',
      unit: '1',
    });
    this.observableGaugeExample.addCallback((measurement: any) => {
      measurement.observe(this.gaugeVar, this.common_attributes);
    });

    this.histogramExample = this.meter.createHistogram('histogram', {
      description: 'Creates a histogram metric.',
      unit: 'ms',
    });
  }

  updateMetrics(value: number) {
    this.counterExample.add(value, this.common_attributes);
    this.counterVar += value;
    this.gaugeVar = value;
    this.histogramExample.record(value, this.common_attributes);
    console.log(`Update custom metrics: value=${value} AccumulatedCounter=${this.counterVar}, gauge=${this.gaugeVar}, histogram=${value}`);
  }
}