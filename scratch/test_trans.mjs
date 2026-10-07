import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// Let's test what transformations exist and how to combine Host, User, PC
// In Grafana, if we have Target A (USER) and Target B (PC):
// If Target A has Item "User locked Name" and Target B has Item "User Locked PC":
// If we use transformation: "groupBy"
// Group by: Host
// Or "groupingToMatrix"
// Let's inspect available transformations or test in a scratch panel
console.log("Ready to test transformations");
