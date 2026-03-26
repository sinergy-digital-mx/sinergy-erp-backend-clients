export interface TestResult {
  status: 'success' | 'failure';
  errorMessage?: string;
  errorCode?: string;
  timestamp: Date;
}
