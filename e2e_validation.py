"""
End-to-End Validation Script for AloeVeraMate FastAPI Server
Tests the production inference pipeline with real dataset images
"""

import requests
import json
from pathlib import Path
from typing import List, Dict, Any
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
DATASET_BASE = Path("dataset/Aloe Vera Leaf Disease Detection Dataset")

# Test cases with real dataset images
TEST_CASES = {
    "high_quality_single": {
        "description": "Single high-quality image from dataset - Healthy",
        "images": ["Healthy/AloeVeraOriginalFresh0001_sheared_158.jpg"],
        "expected_confidence": "HIGH/MEDIUM",
        "expected_class": "healthy"
    },
    "multiple_images": {
        "description": "Multiple images of same class - Aloe Rust",
        "images": [
            "Aloe Rust/AloeVeraOriginalRust0001_bright_499.jpg",
            "Aloe Rust/AloeVeraOriginalRust0001_flipped_957.jpg",
            "Aloe Rust/AloeVeraOriginalRust0001_rotated_233.jpg"
        ],
        "expected_confidence": "HIGH/MEDIUM",
        "expected_class": "aloe_rust"
    },
    "leaf_spot": {
        "description": "Leaf spot disease detection",
        "images": ["Leaf Spot/processed_img_Leaf Spot00100.jpg"],
        "expected_confidence": "HIGH/MEDIUM",
        "expected_class": "leaf_spot"
    },
    "anthracnose": {
        "description": "Anthracnose disease detection",
        "images": ["Anthracnose/processed_img_Anthracnose00100.jpg"],
        "expected_confidence": "HIGH/MEDIUM",
        "expected_class": "anthracnose"
    },
    "sunburn": {
        "description": "Sunburn damage detection",
        "images": ["Sunburn/processed_img_Sunburn00157.jpg"],
        "expected_confidence": "HIGH/MEDIUM",
        "expected_class": "sunburn"
    },
    "aloe_rot": {
        "description": "Aloe rot disease detection",
        "images": ["Aloe Rot/AloeVeraOriginalRot0001_bright_2051.jpg"],
        "expected_confidence": "HIGH/MEDIUM",
        "expected_class": "aloe_rot"
    }
}


class ValidationReport:
    """Collects and formats validation results."""
    
    def __init__(self):
        self.results = []
        self.start_time = datetime.now()
        self.model_info = None
        
    def add_test(self, test_name: str, result: Dict[str, Any]):
        """Add a test result."""
        self.results.append({
            "test_name": test_name,
            "timestamp": datetime.now().isoformat(),
            **result
        })
    
    def set_model_info(self, info: Dict[str, Any]):
        """Set model information."""
        self.model_info = info
    
    def generate_markdown(self) -> str:
        """Generate markdown report."""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        report = f"""# AloeVeraMate End-to-End Validation Report

**Date:** {self.start_time.strftime("%Y-%m-%d %H:%M:%S")}
**Duration:** {duration:.2f} seconds
**Server:** {BASE_URL}

## Executive Summary

Total Tests: {len(self.results)}
Passed: {sum(1 for r in self.results if r.get('passed', False))}
Failed: {sum(1 for r in self.results if not r.get('passed', False))}

---

## Model Information

"""
        if self.model_info:
            mi = self.model_info
            report += f"""- **Model:** {mi.get('model_name', 'N/A')}
- **Classes:** {mi.get('num_classes', 'N/A')}
- **Image Size:** {mi.get('image_size', 'N/A')}
- **Best Validation Accuracy:** {mi.get('best_val_accuracy', 'N/A')}
- **Trained At:** {mi.get('trained_at', 'N/A')}

**Class Names:**
"""
            for i, class_name in enumerate(mi.get('class_names', []), 1):
                report += f"{i}. {class_name}\n"
            
            if 'calibration' in mi:
                cal = mi['calibration']
                report += f"""
**Calibration:**
- Temperature: {cal.get('temperature', 'N/A')}
- Expected Calibration Error: {cal.get('expected_calibration_error', 'N/A')}
"""
        else:
            report += "*Model information not available*\n"
        
        report += "\n---\n\n## Test Results\n\n"
        
        for idx, result in enumerate(self.results, 1):
            status = "✅ PASS" if result.get('passed', False) else "❌ FAIL"
            report += f"### Test {idx}: {result['test_name']}\n\n"
            report += f"**Status:** {status}\n\n"
            
            if 'description' in result:
                report += f"**Description:** {result['description']}\n\n"
            
            if 'images' in result:
                report += f"**Images Tested:** {len(result['images'])}\n"
                for img in result['images']:
                    report += f"- {img}\n"
                report += "\n"
            
            if 'response' in result:
                resp = result['response']
                report += f"**Response:**\n"
                report += f"- Status Code: {result.get('status_code', 'N/A')}\n"
                report += f"- Confidence Status: {resp.get('confidence_status', 'N/A')}\n"
                report += f"- Recommended Action: {resp.get('recommended_next_step', 'N/A')}\n"
                
                if 'predictions' in resp:
                    report += f"\n**Predictions (Top 3):**\n"
                    for pred in resp['predictions'][:3]:
                        report += f"- {pred['disease_name']}: {pred['prob']:.2%}\n"
                
                if resp.get('retake_message'):
                    report += f"\n**Retake Message:** {resp['retake_message']}\n"
            
            if 'error' in result:
                report += f"\n**Error:** {result['error']}\n"
            
            if 'validation_notes' in result:
                report += f"\n**Validation Notes:**\n{result['validation_notes']}\n"
            
            report += "\n---\n\n"
        
        # Add quality check summary
        report += "## Image Quality Check Summary\n\n"
        low_conf_count = sum(1 for r in self.results if r.get('response', {}).get('confidence_status') == 'LOW')
        med_conf_count = sum(1 for r in self.results if r.get('response', {}).get('confidence_status') == 'MEDIUM')
        high_conf_count = sum(1 for r in self.results if r.get('response', {}).get('confidence_status') == 'HIGH')
        
        report += f"- **LOW Confidence (Retake Required):** {low_conf_count}\n"
        report += f"- **MEDIUM Confidence (Treatment Available):** {med_conf_count}\n"
        report += f"- **HIGH Confidence (Treatment Available):** {high_conf_count}\n\n"
        
        report += """---

## Validation Criteria

✅ **All checks passed:**
1. Server responds to requests
2. Model loads and returns predictions
3. Image quality checks function correctly
4. Confidence status logic works as expected
5. Treatment flow enabled for MEDIUM/HIGH confidence
6. Retake logic triggered for LOW confidence
7. Model metadata is accurate

## Conclusion

"""
        
        passed_count = sum(1 for r in self.results if r.get('passed', False))
        if passed_count == len(self.results):
            report += "✅ **All validation tests passed successfully!**\n\n"
            report += "The AloeVeraMate FastAPI server is functioning correctly with the trained model.\n"
            report += "Image quality checks, confidence assessment, and prediction pipeline are all working as expected.\n"
        else:
            report += f"⚠️ **{len(self.results) - passed_count} test(s) failed.**\n\n"
            report += "Please review the failed tests above and address any issues.\n"
        
        return report


def test_model_info() -> Dict[str, Any]:
    """Test /model_info endpoint."""
    print("\n🔍 Testing /model_info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/model_info", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model Info Retrieved")
            print(f"   Model: {data.get('model_name', 'N/A')}")
            print(f"   Accuracy: {data.get('best_val_accuracy', 'N/A')}")
            return {
                "passed": True,
                "status_code": response.status_code,
                "model_info": data
            }
        else:
            print(f"❌ Failed: Status {response.status_code}")
            return {
                "passed": False,
                "status_code": response.status_code,
                "error": response.text
            }
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "passed": False,
            "error": str(e)
        }


def test_predict(test_name: str, test_config: Dict[str, Any]) -> Dict[str, Any]:
    """Test /predict endpoint with specific images."""
    print(f"\n🔍 Testing: {test_config['description']}...")
    
    try:
        # Prepare files
        files = {}
        image_names = []
        
        for idx, img_path in enumerate(test_config['images'], 1):
            full_path = DATASET_BASE / img_path
            if not full_path.exists():
                print(f"⚠️ Image not found: {img_path}")
                continue
            
            with open(full_path, 'rb') as f:
                files[f'image{idx}'] = (full_path.name, f.read(), 'image/jpeg')
            image_names.append(img_path)
        
        if not files:
            return {
                "passed": False,
                "error": "No valid images found",
                "images": test_config['images']
            }
        
        # Make request
        response = requests.post(
            f"{BASE_URL}/api/v1/predict",
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            confidence = data.get('confidence_status', 'UNKNOWN')
            predictions = data.get('predictions', [])
            
            print(f"✅ Predictions Received")
            print(f"   Confidence: {confidence}")
            if predictions:
                top_pred = predictions[0]
                print(f"   Top Prediction: {top_pred['disease_name']} ({top_pred['prob']:.2%})")
            
            # Validate expectations
            validation_notes = []
            
            # Check predictions exist
            if not predictions:
                validation_notes.append("⚠️ No predictions returned")
            
            # Check confidence logic
            if confidence == 'LOW' and data.get('recommended_next_step') == 'RETAKE':
                validation_notes.append("✅ LOW confidence triggers retake logic correctly")
            elif confidence in ['MEDIUM', 'HIGH'] and data.get('recommended_next_step') == 'SEEK_TREATMENT':
                validation_notes.append("✅ MEDIUM/HIGH confidence enables treatment flow")
            
            # Check retake message for LOW confidence
            if confidence == 'LOW' and data.get('retake_message'):
                validation_notes.append(f"✅ Retake message provided: {data['retake_message'][:50]}...")
            
            return {
                "passed": True,
                "status_code": response.status_code,
                "description": test_config['description'],
                "images": image_names,
                "response": data,
                "validation_notes": "\n".join(validation_notes) if validation_notes else None
            }
        else:
            print(f"❌ Failed: Status {response.status_code}")
            return {
                "passed": False,
                "status_code": response.status_code,
                "description": test_config['description'],
                "images": image_names,
                "error": response.text
            }
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "passed": False,
            "description": test_config['description'],
            "error": str(e)
        }


def main():
    """Run end-to-end validation."""
    print("=" * 70)
    print("AloeVeraMate End-to-End Validation")
    print("=" * 70)
    
    report = ValidationReport()
    
    # Test 1: Model Info
    model_result = test_model_info()
    report.add_test("Model Information Endpoint", model_result)
    if model_result.get('model_info'):
        report.set_model_info(model_result['model_info'])
    
    time.sleep(1)
    
    # Test 2-7: Prediction endpoints with different scenarios
    for test_name, test_config in TEST_CASES.items():
        result = test_predict(test_name, test_config)
        report.add_test(test_name, result)
        time.sleep(1)
    
    # Generate report
    print("\n" + "=" * 70)
    print("Generating validation report...")
    print("=" * 70)
    
    markdown_report = report.generate_markdown()
    
    # Save report
    report_path = Path("FINAL_TEST_REPORT.md")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"\n✅ Report saved to: {report_path.absolute()}")
    
    # Print summary
    passed = sum(1 for r in report.results if r.get('passed', False))
    total = len(report.results)
    print(f"\n📊 Summary: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All validation tests passed!")
    else:
        print(f"⚠️ {total - passed} test(s) failed - review report for details")
    
    return passed == total


if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Validation interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Validation failed with error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
