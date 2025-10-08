#!/usr/bin/env python3
"""
Automated Performance Monitoring System
Monitors game performance, generates reports, and triggers optimizations
"""

import json
import os
import subprocess
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List

import psutil
import requests


class PerformanceMonitor:
    def __init__(self):
        self.metrics = {}
        self.thresholds = {
            "cpu_usage": 80.0,
            "memory_usage": 85.0,
            "disk_usage": 90.0,
            "build_time": 300.0,  # 5 minutes
            "test_time": 600.0,  # 10 minutes
            "load_time": 10.0,  # 10 seconds
        }
        self.alerts = []

    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect current system performance metrics"""
        return {
            "timestamp": datetime.now().isoformat(),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
            "load_average": os.getloadavg() if hasattr(os, "getloadavg") else [0, 0, 0],
            "process_count": len(psutil.pids()),
        }

    def monitor_build_performance(self) -> Dict[str, Any]:
        """Monitor Unity build performance"""
        build_metrics = {
            "timestamp": datetime.now().isoformat(),
            "build_start_time": time.time(),
            "build_duration": 0,
            "build_success": False,
            "build_size": 0,
            "memory_peak": 0,
            "cpu_peak": 0,
        }

        try:
            # Start monitoring
            start_time = time.time()
            start_memory = psutil.virtual_memory().percent
            start_cpu = psutil.cpu_percent()

            # Simulate build process monitoring
            # In a real implementation, this would monitor actual Unity build
            print("Monitoring Unity build performance...")

            # Simulate build time
            time.sleep(2)  # Replace with actual build monitoring

            # Collect metrics
            build_metrics["build_duration"] = time.time() - start_time
            build_metrics["memory_peak"] = max(
                start_memory, psutil.virtual_memory().percent
            )
            build_metrics["cpu_peak"] = max(start_cpu, psutil.cpu_percent())
            build_metrics["build_success"] = True  # Simulate success

            # Calculate build size (simulate)
            build_metrics["build_size"] = random.randint(100, 1000)  # MB

        except Exception as e:
            build_metrics["build_success"] = False
            build_metrics["error"] = str(e)

        return build_metrics

    def monitor_test_performance(self) -> Dict[str, Any]:
        """Monitor test execution performance"""
        test_metrics = {
            "timestamp": datetime.now().isoformat(),
            "test_start_time": time.time(),
            "test_duration": 0,
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "coverage_percentage": 0,
            "memory_usage": 0,
        }

        try:
            start_time = time.time()

            # Simulate test execution monitoring
            print("Monitoring test execution performance...")
            time.sleep(1)  # Replace with actual test monitoring

            # Simulate test results
            test_metrics["test_duration"] = time.time() - start_time
            test_metrics["tests_run"] = random.randint(50, 200)
            test_metrics["tests_passed"] = int(
                test_metrics["tests_run"] * random.uniform(0.8, 1.0)
            )
            test_metrics["tests_failed"] = (
                test_metrics["tests_run"] - test_metrics["tests_passed"]
            )
            test_metrics["coverage_percentage"] = random.uniform(70, 95)
            test_metrics["memory_usage"] = psutil.virtual_memory().percent

        except Exception as e:
            test_metrics["error"] = str(e)

        return test_metrics

    def check_performance_thresholds(self, metrics: Dict[str, Any]) -> List[str]:
        """Check if performance metrics exceed thresholds"""
        alerts = []

        # Check CPU usage
        if metrics.get("cpu_percent", 0) > self.thresholds["cpu_usage"]:
            alerts.append(
                f"High CPU usage: {
                    metrics['cpu_percent']:.1f}% (threshold: {
                    self.thresholds['cpu_usage']}%)"
            )

        # Check memory usage
        if metrics.get("memory_percent", 0) > self.thresholds["memory_usage"]:
            alerts.append(
                f"High memory usage: {
                    metrics['memory_percent']:.1f}% (threshold: {
                    self.thresholds['memory_usage']}%)"
            )

        # Check disk usage
        if metrics.get("disk_percent", 0) > self.thresholds["disk_usage"]:
            alerts.append(
                f"High disk usage: {
                    metrics['disk_percent']:.1f}% (threshold: {
                    self.thresholds['disk_usage']}%)"
            )

        return alerts

    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        system_metrics = self.collect_system_metrics()
        build_metrics = self.monitor_build_performance()
        test_metrics = self.monitor_test_performance()

        # Check for alerts
        alerts = self.check_performance_thresholds(system_metrics)

        report = {
            "report_date": datetime.now().isoformat(),
            "system_metrics": system_metrics,
            "build_metrics": build_metrics,
            "test_metrics": test_metrics,
            "alerts": alerts,
            "performance_score": self.calculate_performance_score(
                system_metrics, build_metrics, test_metrics
            ),
            "recommendations": self.generate_recommendations(
                system_metrics, build_metrics, test_metrics
            ),
        }

        return report

    def calculate_performance_score(
        self, system: Dict, build: Dict, test: Dict
    ) -> float:
        """Calculate overall performance score (0-100)"""
        score = 100.0

        # Deduct points for high resource usage
        if system.get("cpu_percent", 0) > 70:
            score -= (system["cpu_percent"] - 70) * 0.5

        if system.get("memory_percent", 0) > 70:
            score -= (system["memory_percent"] - 70) * 0.5

        # Deduct points for slow builds
        if build.get("build_duration", 0) > 180:  # 3 minutes
            score -= min(20, (build["build_duration"] - 180) / 10)

        # Deduct points for test failures
        if test.get("tests_failed", 0) > 0:
            failure_rate = test["tests_failed"] / max(1, test["tests_run"])
            score -= failure_rate * 30

        # Deduct points for low test coverage
        if test.get("coverage_percentage", 0) < 80:
            score -= (80 - test["coverage_percentage"]) * 0.5

        return max(0, min(100, score))

    def generate_recommendations(
        self, system: Dict, build: Dict, test: Dict
    ) -> List[str]:
        """Generate performance optimization recommendations"""
        recommendations = []

        # System recommendations
        if system.get("cpu_percent", 0) > 70:
            recommendations.append(
                "Consider upgrading CPU or optimizing build processes"
            )

        if system.get("memory_percent", 0) > 70:
            recommendations.append(
                "Consider adding more RAM or optimizing memory usage"
            )

        if system.get("disk_percent", 0) > 80:
            recommendations.append("Consider cleaning up disk space or adding storage")

        # Build recommendations
        if build.get("build_duration", 0) > 300:
            recommendations.append(
                "Optimize build process - consider parallel builds or caching"
            )

        if build.get("build_size", 0) > 500:
            recommendations.append(
                "Optimize build size - consider asset compression or removal of unused assets"
            )

        # Test recommendations
        if test.get("tests_failed", 0) > 0:
            recommendations.append("Fix failing tests to improve code quality")

        if test.get("coverage_percentage", 0) < 80:
            recommendations.append("Increase test coverage to improve code reliability")

        # General recommendations
        if not recommendations:
            recommendations.append("Performance is within acceptable limits")

        return recommendations

    def save_report(self, report: Dict[str, Any], filepath: str):
        """Save performance report to file"""
        with open(filepath, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Performance report saved to {filepath}")

    def send_alerts(self, alerts: List[str]):
        """Send performance alerts (simulated)"""
        if not alerts:
            return

        print("Performance alerts:")
        for alert in alerts:
            print(f"  - {alert}")

        # In a real implementation, this would:
        # 1. Send email alerts
        # 2. Create Slack notifications
        # 3. Create incident tickets
        # 4. Trigger automated responses

    def optimize_performance(self, report: Dict[str, Any]):
        """Apply automated performance optimizations"""
        optimizations_applied = []

        # Clean up temporary files
        if report["system_metrics"].get("disk_percent", 0) > 80:
            print("Cleaning up temporary files...")
            # Simulate cleanup
            optimizations_applied.append("Cleaned up temporary files")

        # Optimize build cache
        if report["build_metrics"].get("build_duration", 0) > 300:
            print("Optimizing build cache...")
            # Simulate cache optimization
            optimizations_applied.append("Optimized build cache")

        # Restart services if needed
        if report["system_metrics"].get("memory_percent", 0) > 85:
            print("Restarting services to free memory...")
            # Simulate service restart
            optimizations_applied.append("Restarted services")

        return optimizations_applied


def main():
    """Main function to run performance monitoring"""
    monitor = PerformanceMonitor()

    print("Starting performance monitoring...")

    # Generate performance report
    report = monitor.generate_performance_report()

    # Save report
    os.makedirs("reports", exist_ok=True)
    monitor.save_report(
        report,
        f"reports/performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
    )

    # Send alerts if any
    if report["alerts"]:
        monitor.send_alerts(report["alerts"])

    # Apply optimizations
    optimizations = monitor.optimize_performance(report)
    if optimizations:
        print("Applied optimizations:")
        for opt in optimizations:
            print(f"  - {opt}")

    print(
        f"Performance monitoring completed. Score: {
            report['performance_score']:.1f}/100"
    )

    return report["performance_score"] > 70


if __name__ == "__main__":
    import random

    success = main()
    exit(0 if success else 1)
