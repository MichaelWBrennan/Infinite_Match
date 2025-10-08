#!/usr/bin/env python3
"""
Security Test Suite for Evergreen Match-3 Unity Game
Tests the implemented security and anti-cheat systems
"""

import requests
import json
import time
import random
import hashlib
import hmac
from datetime import datetime, timedelta
import sys
import os

class SecurityTester:
    def __init__(self, base_url="http://localhost:3030"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.player_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", details=None):
        """Log test result"""
        result = {
            "test_name": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        if details:
            for key, value in details.items():
                print(f"    {key}: {value}")
    
    def test_server_health(self):
        """Test server health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Server Health Check", True, "Server is healthy", {
                    "status": data.get("status"),
                    "uptime": data.get("uptime")
                })
                return True
            else:
                self.log_test("Server Health Check", False, f"Server returned status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Server Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_authentication(self):
        """Test authentication system"""
        try:
            # Test login
            player_id = f"test_player_{random.randint(1000, 9999)}"
            login_data = {
                "playerId": player_id,
                "deviceInfo": {
                    "deviceModel": "Test Device",
                    "platform": "Test Platform"
                }
            }
            
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.auth_token = data.get("token")
                    self.player_id = player_id
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    
                    self.log_test("Authentication", True, "Login successful", {
                        "player_id": player_id,
                        "has_token": bool(self.auth_token)
                    })
                    return True
                else:
                    self.log_test("Authentication", False, f"Login failed: {data.get('error')}")
                    return False
            else:
                self.log_test("Authentication", False, f"Login request failed with status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Authentication test failed: {str(e)}")
            return False
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        if not self.auth_token:
            self.log_test("Rate Limiting", False, "No auth token available")
            return False
        
        try:
            # Send multiple requests quickly to trigger rate limiting
            rate_limit_triggered = False
            for i in range(150):  # Exceed the 100 request limit
                response = self.session.get(f"{self.base_url}/health")
                if response.status_code == 429:
                    rate_limit_triggered = True
                    break
                time.sleep(0.01)  # Small delay between requests
            
            if rate_limit_triggered:
                self.log_test("Rate Limiting", True, "Rate limiting triggered correctly")
                return True
            else:
                self.log_test("Rate Limiting", False, "Rate limiting not triggered")
                return False
                
        except Exception as e:
            self.log_test("Rate Limiting", False, f"Rate limiting test failed: {str(e)}")
            return False
    
    def test_input_validation(self):
        """Test input validation and sanitization"""
        if not self.auth_token:
            self.log_test("Input Validation", False, "No auth token available")
            return False
        
        try:
            # Test with malicious input
            malicious_data = {
                "gameData": {
                    "actionType": "score_update",
                    "score": "<script>alert('xss')</script>",
                    "coins": "'; DROP TABLE players; --",
                    "timestamp": time.time()
                }
            }
            
            response = self.session.post(f"{self.base_url}/game/submit_data", json=malicious_data)
            
            # Should either reject the request or sanitize the input
            if response.status_code in [200, 400]:
                data = response.json()
                if response.status_code == 400:
                    self.log_test("Input Validation", True, "Malicious input rejected", {
                        "status_code": response.status_code,
                        "error": data.get("error")
                    })
                else:
                    # Check if input was sanitized
                    if "<script>" not in str(data):
                        self.log_test("Input Validation", True, "Malicious input sanitized")
                    else:
                        self.log_test("Input Validation", False, "Malicious input not sanitized")
                return True
            else:
                self.log_test("Input Validation", False, f"Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Input Validation", False, f"Input validation test failed: {str(e)}")
            return False
    
    def test_anti_cheat_validation(self):
        """Test anti-cheat validation system"""
        if not self.auth_token:
            self.log_test("Anti-Cheat Validation", False, "No auth token available")
            return False
        
        try:
            # Test with impossible values
            impossible_data = {
                "gameData": {
                    "actionType": "score_update",
                    "score": 999999999,  # Impossible score
                    "coins": -1000,      # Negative coins
                    "gems": 999999,      # Impossible gems
                    "timestamp": time.time()
                }
            }
            
            response = self.session.post(f"{self.base_url}/game/submit_data", json=impossible_data)
            
            if response.status_code == 400:
                data = response.json()
                if "Invalid game data" in data.get("error", ""):
                    self.log_test("Anti-Cheat Validation", True, "Impossible values detected", {
                        "status_code": response.status_code,
                        "error": data.get("error")
                    })
                    return True
                else:
                    self.log_test("Anti-Cheat Validation", False, "Impossible values not detected")
                    return False
            else:
                self.log_test("Anti-Cheat Validation", False, f"Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Anti-Cheat Validation", False, f"Anti-cheat test failed: {str(e)}")
            return False
    
    def test_speed_hack_detection(self):
        """Test speed hack detection"""
        if not self.auth_token:
            self.log_test("Speed Hack Detection", False, "No auth token available")
            return False
        
        try:
            # Simulate speed hack by sending actions too quickly
            base_time = time.time()
            for i in range(10):
                speed_hack_data = {
                    "gameData": {
                        "actionType": "game_action",
                        "action": "move",
                        "timestamp": base_time + (i * 0.01),  # 10ms between actions (too fast)
                        "responseTime": 0.001  # 1ms response time (impossible)
                    }
                }
                
                response = self.session.post(f"{self.base_url}/game/submit_data", json=speed_hack_data)
                
                if response.status_code == 400:
                    data = response.json()
                    if "suspicious" in data.get("error", "").lower() or "speed" in data.get("error", "").lower():
                        self.log_test("Speed Hack Detection", True, "Speed hack detected", {
                            "status_code": response.status_code,
                            "error": data.get("error")
                        })
                        return True
                
                time.sleep(0.01)  # Small delay between requests
            
            self.log_test("Speed Hack Detection", False, "Speed hack not detected")
            return False
                
        except Exception as e:
            self.log_test("Speed Hack Detection", False, f"Speed hack test failed: {str(e)}")
            return False
    
    def test_security_headers(self):
        """Test security headers"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            headers = response.headers
            
            security_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
            
            missing_headers = []
            for header, expected_value in security_headers.items():
                if header not in headers:
                    missing_headers.append(header)
                elif expected_value not in headers[header]:
                    missing_headers.append(f"{header} (wrong value)")
            
            if not missing_headers:
                self.log_test("Security Headers", True, "All security headers present")
                return True
            else:
                self.log_test("Security Headers", False, f"Missing headers: {missing_headers}")
                return False
                
        except Exception as e:
            self.log_test("Security Headers", False, f"Security headers test failed: {str(e)}")
            return False
    
    def test_session_management(self):
        """Test session management"""
        if not self.auth_token:
            self.log_test("Session Management", False, "No auth token available")
            return False
        
        try:
            # Test protected endpoint
            response = self.session.get(f"{self.base_url}/player/security_profile")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Session Management", True, "Session validation working", {
                        "has_profile": "profile" in data
                    })
                    return True
                else:
                    self.log_test("Session Management", False, f"Session validation failed: {data.get('error')}")
                    return False
            else:
                self.log_test("Session Management", False, f"Session request failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Session Management", False, f"Session management test failed: {str(e)}")
            return False
    
    def test_logout(self):
        """Test logout functionality"""
        if not self.auth_token:
            self.log_test("Logout", False, "No auth token available")
            return False
        
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Logout", True, "Logout successful")
                    self.auth_token = None
                    self.player_id = None
                    return True
                else:
                    self.log_test("Logout", False, f"Logout failed: {data.get('error')}")
                    return False
            else:
                self.log_test("Logout", False, f"Logout request failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Logout", False, f"Logout test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🔒 Starting Security Test Suite")
        print("=" * 50)
        
        tests = [
            self.test_server_health,
            self.test_authentication,
            self.test_rate_limiting,
            self.test_input_validation,
            self.test_anti_cheat_validation,
            self.test_speed_hack_detection,
            self.test_security_headers,
            self.test_session_management,
            self.test_logout
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ ERROR in {test.__name__}: {str(e)}")
            print()
        
        print("=" * 50)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All security tests passed!")
        else:
            print("⚠️  Some security tests failed. Review the results above.")
        
        return passed == total
    
    def generate_report(self, filename="security_test_report.json"):
        """Generate detailed test report"""
        report = {
            "test_suite": "Security Test Suite",
            "timestamp": datetime.now().isoformat(),
            "base_url": self.base_url,
            "total_tests": len(self.test_results),
            "passed_tests": sum(1 for result in self.test_results if result["success"]),
            "failed_tests": sum(1 for result in self.test_results if not result["success"]),
            "test_results": self.test_results
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Detailed report saved to {filename}")

def main():
    """Main function"""
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3030"
    
    print(f"🚀 Starting security tests against {base_url}")
    print()
    
    tester = SecurityTester(base_url)
    success = tester.run_all_tests()
    tester.generate_report()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()