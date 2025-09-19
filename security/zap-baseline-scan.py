#!/usr/bin/env python3
"""
OWASP ZAP Baseline Security Scan
Automated DAST scanning for the application
"""

import os
import sys
import time
import requests
import subprocess
import json
from typing import Dict, List, Optional

class ZapBaselineScan:
    def __init__(self, target_url: str, api_url: Optional[str] = None):
        self.target_url = target_url
        self.api_url = api_url or target_url.replace(':3000', ':8080')  # Default API port
        self.zap_port = 8080
        self.results_dir = 'security/results'
        os.makedirs(self.results_dir, exist_ok=True)

    def start_zap_daemon(self) -> bool:
        """Start ZAP in daemon mode"""
        try:
            cmd = [
                'zap.sh', '-daemon', '-port', str(self.zap_port),
                '-config', 'api.disablekey=true'
            ]
            self.zap_process = subprocess.Popen(
                cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )

            # Wait for ZAP to start
            max_attempts = 30
            for _ in range(max_attempts):
                try:
                    response = requests.get(f'http://localhost:{self.zap_port}/JSON/core/view/version/')
                    if response.status_code == 200:
                        return True
                except requests.ConnectionError:
                    time.sleep(2)

            return False
        except Exception as e:
            print(f"Failed to start ZAP: {e}")
            return False

    def configure_zap(self) -> None:
        """Configure ZAP for the scan"""
        base_url = f'http://localhost:{self.zap_port}'

        # Set target in scope
        requests.get(f'{base_url}/JSON/core/action/includeInContext/', params={
            'contextName': 'Default Context',
            'regex': f'{self.target_url}.*'
        })

        # Configure authentication if needed
        if self.has_auth():
            self.configure_authentication()

    def has_auth(self) -> bool:
        """Check if target requires authentication"""
        try:
            response = requests.get(f'{self.target_url}/api/health', timeout=5)
            return response.status_code == 401
        except:
            return False

    def configure_authentication(self) -> None:
        """Configure authentication for scanning"""
        # This would be configured based on the specific auth mechanism
        # For Auth0/JWT, we would set up form-based auth or script-based auth
        pass

    def run_spider_scan(self) -> str:
        """Run spider scan to discover URLs"""
        base_url = f'http://localhost:{self.zap_port}'

        # Start spider
        response = requests.get(f'{base_url}/JSON/spider/action/scan/', params={
            'url': self.target_url,
            'maxChildren': '100',
            'recurse': 'true'
        })

        scan_id = response.json()['scan']

        # Wait for spider to complete
        while True:
            status = requests.get(f'{base_url}/JSON/spider/view/status/', params={
                'scanId': scan_id
            }).json()['status']

            if status == '100':
                break
            time.sleep(2)

        return scan_id

    def run_active_scan(self) -> str:
        """Run active security scan"""
        base_url = f'http://localhost:{self.zap_port}'

        # Start active scan
        response = requests.get(f'{base_url}/JSON/ascan/action/scan/', params={
            'url': self.target_url,
            'recurse': 'true',
            'inScopeOnly': 'false'
        })

        scan_id = response.json()['scan']

        # Wait for scan to complete
        while True:
            status = requests.get(f'{base_url}/JSON/ascan/view/status/', params={
                'scanId': scan_id
            }).json()['status']

            if status == '100':
                break
            time.sleep(5)
            print(f"Active scan progress: {status}%")

        return scan_id

    def get_scan_results(self) -> Dict:
        """Get scan results"""
        base_url = f'http://localhost:{self.zap_port}'

        # Get alerts
        alerts_response = requests.get(f'{base_url}/JSON/core/view/alerts/', params={
            'baseurl': self.target_url
        })

        return alerts_response.json()

    def generate_report(self, results: Dict) -> None:
        """Generate security report"""
        alerts = results.get('alerts', [])

        # Categorize by risk level
        risk_counts = {'High': 0, 'Medium': 0, 'Low': 0, 'Informational': 0}
        detailed_findings = {'High': [], 'Medium': [], 'Low': [], 'Informational': []}

        for alert in alerts:
            risk = alert.get('risk', 'Informational')
            risk_counts[risk] += 1
            detailed_findings[risk].append({
                'name': alert.get('alert', 'Unknown'),
                'description': alert.get('desc', ''),
                'solution': alert.get('solution', ''),
                'url': alert.get('url', ''),
                'param': alert.get('param', ''),
                'evidence': alert.get('evidence', '')
            })

        # Generate JSON report
        report = {
            'scan_date': time.strftime('%Y-%m-%d %H:%M:%S'),
            'target_url': self.target_url,
            'summary': risk_counts,
            'findings': detailed_findings,
            'total_alerts': len(alerts)
        }

        with open(f'{self.results_dir}/zap-report.json', 'w') as f:
            json.dump(report, f, indent=2)

        # Generate HTML report
        requests.get(f'http://localhost:{self.zap_port}/OTHER/core/other/htmlreport/',
                    params={'baseurl': self.target_url},
                    stream=True)

        print(f"Security scan completed. Found {len(alerts)} total alerts:")
        for risk, count in risk_counts.items():
            if count > 0:
                print(f"  {risk}: {count}")

    def stop_zap(self) -> None:
        """Stop ZAP daemon"""
        if hasattr(self, 'zap_process'):
            self.zap_process.terminate()
            self.zap_process.wait()

    def run_full_scan(self) -> None:
        """Run complete security scan"""
        print(f"Starting security scan for {self.target_url}")

        if not self.start_zap_daemon():
            print("Failed to start ZAP daemon")
            sys.exit(1)

        try:
            print("Configuring ZAP...")
            self.configure_zap()

            print("Running spider scan...")
            self.run_spider_scan()

            print("Running active security scan...")
            self.run_active_scan()

            print("Generating report...")
            results = self.get_scan_results()
            self.generate_report(results)

        finally:
            print("Stopping ZAP...")
            self.stop_zap()

def main():
    if len(sys.argv) < 2:
        print("Usage: python zap-baseline-scan.py <target-url> [api-url]")
        sys.exit(1)

    target_url = sys.argv[1]
    api_url = sys.argv[2] if len(sys.argv) > 2 else None

    scanner = ZapBaselineScan(target_url, api_url)
    scanner.run_full_scan()

if __name__ == "__main__":
    main()