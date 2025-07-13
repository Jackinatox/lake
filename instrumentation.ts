import { OTLPHttpJsonTraceExporter, registerOTel } from '@vercel/otel'

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.NONE);


export function register() {
  diag.debug('registerd otel');

  registerOTel({
    serviceName: 'project-lake',
    traceExporter: new OTLPHttpJsonTraceExporter({
      url: 'https://ingest.us.signoz.cloud/v1/traces',
      headers: {
        // 'signoz-access-token': process.env.SIGNOZ_INGESTION_KEY || ''
        'signoz-access-token': 'beaca9ff-5766-419f-b1a0-587b9d69d5cf'
      }
    })
  });
}