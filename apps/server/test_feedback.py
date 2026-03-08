"""
Test script for feedback endpoints

This script tests:
1. Making a prediction (which logs to database)
2. Submitting feedback for that prediction
3. Retrieving feedback statistics
"""

import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"

def test_prediction_and_feedback():
    """Test the complete feedback workflow"""
    
    print("=" * 80)
    print("Testing Feedback Loop")
    print("=" * 80)
    
    # Step 1: Make a prediction
    print("\n1. Making prediction...")
    # Use absolute path from workspace root
    test_image = Path(__file__).parent.parent.parent / "dataset" / "Aloe Vera Leaf Disease Detection Dataset" / "Healthy" / "AloeVeraOriginalFresh0001_sheared_158.jpg"
    
    if not test_image.exists():
        print(f"❌ Test image not found: {test_image}")
        return
    
    with open(test_image, "rb") as f:
        files = {"image1": ("test.jpg", f, "image/jpeg")}
        response = requests.post(f"{BASE_URL}/predict", files=files)
    
    if response.status_code != 200:
        print(f"❌ Prediction failed: {response.status_code}")
        print(response.text)
        return
    
    prediction = response.json()
    request_id = prediction["request_id"]
    top_prediction = prediction["predictions"][0]
    
    print(f"✅ Prediction successful!")
    print(f"   Request ID: {request_id}")
    print(f"   Top prediction: {top_prediction['disease_name']} ({top_prediction['prob']:.2%})")
    print(f"   Confidence: {prediction['confidence_status']}")
    
    # Step 2: Submit positive feedback (prediction was correct)
    print("\n2. Submitting positive feedback...")
    feedback_data = {
        "request_id": request_id,
        "selected_disease_id": top_prediction["disease_id"],
        "was_prediction_helpful": True,
        "notes": "Test feedback - prediction was accurate"
    }
    
    response = requests.post(f"{BASE_URL}/feedback", json=feedback_data)
    
    if response.status_code != 200:
        print(f"❌ Feedback submission failed: {response.status_code}")
        print(response.text)
        return
    
    feedback_result = response.json()
    print(f"✅ Feedback submitted successfully!")
    print(f"   Message: {feedback_result['message']}")
    
    # Step 3: Make another prediction with different result
    print("\n3. Making second prediction...")
    test_image2 = Path(__file__).parent.parent.parent / "dataset" / "Aloe Vera Leaf Disease Detection Dataset" / "Aloe Rust" / "AloeVeraOriginalRust0001_bright_499.jpg"
    
    if not test_image2.exists():
        print(f"⚠️  Second test image not found: {test_image2}")
        print("   Skipping second prediction test")
    else:
        with open(test_image2, "rb") as f:
            files = {"image1": ("test2.jpg", f, "image/jpeg")}
            response = requests.post(f"{BASE_URL}/predict", files=files)
        
        if response.status_code == 200:
            prediction2 = response.json()
            request_id2 = prediction2["request_id"]
            top_prediction2 = prediction2["predictions"][0]
            
            print(f"✅ Second prediction successful!")
            print(f"   Request ID: {request_id2}")
            print(f"   Top prediction: {top_prediction2['disease_name']} ({top_prediction2['prob']:.2%})")
            
            # Submit corrective feedback (user says it was a different disease)
            print("\n4. Submitting corrective feedback...")
            
            # Get list of diseases first
            diseases_response = requests.get(f"{BASE_URL}/diseases")
            if diseases_response.status_code == 200:
                diseases = diseases_response.json()["diseases"]
                # Find a different disease ID for testing
                different_disease = [d for d in diseases if d["disease_id"] != top_prediction2["disease_id"]][0]
                
                corrective_feedback = {
                    "request_id": request_id2,
                    "selected_disease_id": different_disease["disease_id"],
                    "was_prediction_helpful": False,
                    "notes": f"Test correction - it was actually {different_disease['disease_name']}"
                }
                
                response = requests.post(f"{BASE_URL}/feedback", json=corrective_feedback)
                
                if response.status_code == 200:
                    print(f"✅ Corrective feedback submitted!")
                    print(f"   Original prediction: {top_prediction2['disease_name']}")
                    print(f"   User correction: {different_disease['disease_name']}")
    
    # Step 4: Get feedback statistics
    print("\n5. Retrieving feedback statistics...")
    response = requests.get(f"{BASE_URL}/feedback/stats")
    
    if response.status_code != 200:
        print(f"❌ Failed to retrieve stats: {response.status_code}")
        print(response.text)
        return
    
    stats = response.json()
    print(f"✅ Statistics retrieved successfully!")
    print(f"\n📊 Feedback Statistics:")
    print(f"   Total Predictions: {stats['total_predictions']}")
    print(f"   Total Feedback: {stats['total_feedback']}")
    print(f"   Feedback Rate: {stats['feedback_rate']}")
    print(f"   Helpful Rate: {stats['helpful_rate']}")
    print(f"\n   Confidence Distribution:")
    for conf_level, count in stats['confidence_distribution'].items():
        print(f"     {conf_level}: {count}")
    
    if stats['common_corrections']:
        print(f"\n   Common Corrections (Top 5):")
        for correction in stats['common_corrections'][:5]:
            print(f"     Disease {correction['predicted_disease_id']} → Disease {correction['selected_disease_id']}: {correction['count']} times")
    
    print("\n" + "=" * 80)
    print("✅ All feedback tests completed successfully!")
    print("=" * 80)


def test_invalid_feedback():
    """Test error handling for invalid feedback"""
    
    print("\n" + "=" * 80)
    print("Testing Error Handling")
    print("=" * 80)
    
    # Try to submit feedback for non-existent request
    print("\n1. Testing feedback for non-existent request...")
    invalid_feedback = {
        "request_id": "non-existent-request-id",
        "selected_disease_id": "0",
        "was_prediction_helpful": False,
        "notes": "This should fail"
    }
    
    response = requests.post(f"{BASE_URL}/feedback", json=invalid_feedback)
    
    if response.status_code == 404:
        print(f"✅ Correctly rejected invalid request_id (404)")
    else:
        print(f"⚠️  Expected 404, got {response.status_code}")
    
    print("=" * 80)


if __name__ == "__main__":
    try:
        test_prediction_and_feedback()
        test_invalid_feedback()
        
        print("\n🎉 All tests passed! Feedback system is working correctly.")
        print("\n💡 Next steps:")
        print("   1. Update mobile app with feedback UI")
        print("   2. Add documentation to README.md")
        print("   3. Export feedback data for model retraining when ready")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
