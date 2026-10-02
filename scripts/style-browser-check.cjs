// Compatibility entry: consolidated current-UI regression, all AI requests mocked.
// Starts an isolated local server; no production writes or model charges.
import('./browser-regression.mjs').catch(error => {console.error(error);process.exitCode = 1;});
