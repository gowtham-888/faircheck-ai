import requests
import sys
import io
import csv
from datetime import datetime

class FairCheckAPITester:
    def __init__(self, base_url="https://detect-bias.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_sample_dataset_endpoint(self):
        """Test sample dataset endpoint"""
        success, response = self.run_test(
            "Sample Dataset Endpoint",
            "GET",
            "sample-dataset",
            200
        )
        if success:
            # Validate response structure
            if 'data' in response and 'columns' in response:
                print(f"   ✅ Sample dataset has {len(response['data'])} records")
                print(f"   ✅ Columns: {response['columns']}")
                return True
            else:
                print(f"   ❌ Invalid response structure")
                return False
        return False

    def test_analyze_sample_endpoint(self):
        """Test analyze sample dataset endpoint"""
        success, response = self.run_test(
            "Analyze Sample Dataset",
            "POST",
            "analyze-sample",
            200
        )
        if success:
            # Validate analysis result structure
            required_fields = ['fairness_score', 'gender_stats', 'income_stats', 'bias_alerts', 'insights']
            missing_fields = [field for field in required_fields if field not in response]
            if not missing_fields:
                print(f"   ✅ Fairness Score: {response['fairness_score']}")
                print(f"   ✅ Bias Alerts: {len(response['bias_alerts'])} alerts")
                print(f"   ✅ Insights: {len(response['insights'])} insights")
                return True
            else:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
        return False

    def create_test_csv(self):
        """Create a test CSV file for upload testing"""
        test_data = [
            ["Name", "Gender", "Age", "Income", "Experience", "Education", "Hired"],
            ["John Doe", "Male", "30", "75000", "5", "Bachelor", "1"],
            ["Jane Smith", "Female", "28", "65000", "3", "Bachelor", "0"],
            ["Bob Johnson", "Male", "35", "85000", "7", "Master", "1"],
            ["Alice Brown", "Female", "32", "70000", "4", "Bachelor", "0"],
            ["Charlie Wilson", "Male", "29", "72000", "4", "Bachelor", "1"],
            ["Diana Davis", "Female", "31", "68000", "5", "Master", "1"]
        ]
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(test_data)
        csv_content = output.getvalue()
        output.close()
        
        return csv_content

    def test_csv_upload_endpoint(self):
        """Test CSV file upload and analysis"""
        csv_content = self.create_test_csv()
        csv_file = io.BytesIO(csv_content.encode('utf-8'))
        
        files = {'file': ('test_data.csv', csv_file, 'text/csv')}
        
        success, response = self.run_test(
            "CSV Upload and Analysis",
            "POST",
            "analyze-csv",
            200,
            files=files
        )
        
        if success:
            # Validate analysis result structure
            required_fields = ['fairness_score', 'gender_stats', 'income_stats', 'bias_alerts', 'insights']
            missing_fields = [field for field in required_fields if field not in response]
            if not missing_fields:
                print(f"   ✅ Fairness Score: {response['fairness_score']}")
                print(f"   ✅ Gender Stats: {len(response['gender_stats']['chart_data'])} data points")
                print(f"   ✅ Income Stats: {len(response['income_stats']['chart_data'])} data points")
                return True
            else:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
        return False

    def test_invalid_csv_upload(self):
        """Test invalid CSV upload handling"""
        # Test with invalid CSV (missing required columns)
        invalid_csv = "Name,Age\nJohn,30\nJane,25"
        csv_file = io.BytesIO(invalid_csv.encode('utf-8'))
        
        files = {'file': ('invalid.csv', csv_file, 'text/csv')}
        
        success, response = self.run_test(
            "Invalid CSV Upload (Missing Required Columns)",
            "POST",
            "analyze-csv",
            400,
            files=files
        )
        return success

    def test_export_pdf_endpoint(self):
        """Test PDF export functionality"""
        # First get sample analysis data
        success, analysis_data = self.run_test(
            "Get Sample Analysis for PDF Export",
            "POST",
            "analyze-sample",
            200
        )
        
        if not success:
            print("   ❌ Failed to get analysis data for PDF export")
            return False
        
        # Prepare export data
        export_data = {
            "fairness_score": analysis_data["fairness_score"],
            "gender_stats": analysis_data["gender_stats"],
            "income_stats": analysis_data["income_stats"],
            "bias_alerts": analysis_data["bias_alerts"],
            "insights": analysis_data["insights"]
        }
        
        # Test PDF export
        url = f"{self.api_url}/export-pdf"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing PDF Export...")
        
        try:
            response = requests.post(url, json=export_data, headers=headers)
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'Unknown')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                
                # Check if it's actually a PDF
                if response.content.startswith(b'%PDF'):
                    print("   ✅ Valid PDF file generated")
                    return True
                else:
                    print("   ❌ Response is not a valid PDF")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_export_csv_endpoint(self):
        """Test CSV export functionality"""
        # First get sample analysis data
        success, analysis_data = self.run_test(
            "Get Sample Analysis for CSV Export",
            "POST",
            "analyze-sample",
            200
        )
        
        if not success:
            print("   ❌ Failed to get analysis data for CSV export")
            return False
        
        # Prepare export data
        export_data = {
            "fairness_score": analysis_data["fairness_score"],
            "gender_stats": analysis_data["gender_stats"],
            "income_stats": analysis_data["income_stats"],
            "bias_alerts": analysis_data["bias_alerts"],
            "insights": analysis_data["insights"]
        }
        
        # Test CSV export
        url = f"{self.api_url}/export-csv"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing CSV Export...")
        
        try:
            response = requests.post(url, json=export_data, headers=headers)
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'Unknown')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                
                # Check if it's valid CSV content
                csv_content = response.text
                if 'FAIRCHECK AI - BIAS ANALYSIS REPORT' in csv_content:
                    print("   ✅ Valid CSV export generated")
                    return True
                else:
                    print("   ❌ Response is not a valid CSV export")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

def main():
    print("🚀 Starting FairCheck AI Backend API Tests")
    print("=" * 50)
    
    # Setup
    tester = FairCheckAPITester()
    
    # Run tests in order
    tests = [
        tester.test_root_endpoint,
        tester.test_sample_dataset_endpoint,
        tester.test_analyze_sample_endpoint,
        tester.test_csv_upload_endpoint,
        tester.test_invalid_csv_upload,
        tester.test_export_pdf_endpoint,
        tester.test_export_csv_endpoint
    ]
    
    for test in tests:
        test()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())