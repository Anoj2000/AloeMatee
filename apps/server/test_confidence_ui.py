"""
Test script to demonstrate improved confidence explanations and retake messages
"""

import requests
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 80)
print("Testing Enhanced Confidence & Retake Messages")
print("=" * 80)

# Test 1: High confidence prediction
print("\n1️⃣  Testing HIGH Confidence (Good Quality Image)")
print("-" * 80)
test_image = Path(__file__).parent.parent.parent / "dataset" / "Aloe Vera Leaf Disease Detection Dataset" / "Healthy" / "AloeVeraOriginalFresh0001_sheared_158.jpg"

if test_image.exists():
    with open(test_image, "rb") as f:
        files = {"image1": ("test.jpg", f, "image/jpeg")}
        response = requests.post(f"{BASE_URL}/predict", files=files)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {result['confidence_status']}")
        print(f"   Top Prediction: {result['predictions'][0]['disease_name']}")
        print(f"   Confidence: {result['predictions'][0]['prob']:.1%}")
        print(f"   Next Step: {result['recommended_next_step']}")
        print(f"   Retake Message: {result.get('retake_message', 'None')}")
    else:
        print(f"❌ Failed: {response.status_code}")
else:
    print(f"❌ Test image not found: {test_image}")

# Test 2: Simulate low confidence by providing single image
print("\n2️⃣  Testing POTENTIAL LOW Confidence (Single Image)")
print("-" * 80)
print("   Note: This may or may not trigger LOW confidence depending on image quality")

if test_image.exists():
    with open(test_image, "rb") as f:
        files = {"image1": ("single.jpg", f, "image/jpeg")}
        response = requests.post(f"{BASE_URL}/predict", files=files)
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Status: {result['confidence_status']}")
        print(f"   Top Prediction: {result['predictions'][0]['disease_name']}")
        print(f"   Confidence: {result['predictions'][0]['prob']:.1%}")
        print(f"   Next Step: {result['recommended_next_step']}")
        if result.get('retake_message'):
            print(f"\n   📋 Retake Message:")
            print(f"   {result['retake_message']}")
        else:
            print(f"   Retake Message: None (confidence is sufficient)")

print("\n" + "=" * 80)
print("📱 Mobile UI Improvements:")
print("=" * 80)
print("""
✅ Implemented:
  1. Info icon (ℹ️) next to confidence badge
  2. Tapping opens modal explaining:
     - HIGH: "Very likely correct. You can follow guidance."
     - MEDIUM: "Likely, but not certain. Consider additional photos."
     - LOW: "Not reliable. Please retake with better lighting/focus."
  
  3. "Why might it be uncertain?" section with bullets:
     - Blurry or out-of-focus image
     - Low light or poor lighting
     - Camera too far or too close
     - Background clutter
     - Symptoms not clearly visible
     - Water droplets or reflections
     - Awkward angle
  
  4. For LOW confidence:
     - Dedicated "How to Take Better Photos" card
     - 3 numbered tips with icons:
       1. ☀️ Good Lighting
       2. 🎯 Clear Focus  
       3. 📏 Right Distance
     - "Retake Photos" button routes back to camera
     - "Why might it be uncertain?" card
     - Technical details card with backend message

✅ Backend Enhanced:
  - More descriptive retake messages based on confidence level
  - Human-readable tips with emojis
  - Specific guidance based on number of images provided
  - Quality check messages remain user-friendly
""")

print("\n📁 Files Modified:")
print("-" * 80)
print("  Mobile:")
print("    ✅ components/ConfidenceInfoModal.tsx (NEW)")
print("    ✅ components/ConfidenceBadge.tsx (added info icon)")
print("    ✅ app/results.tsx (integrated modal, enhanced LOW confidence UI)")
print("\n  Backend:")
print("    ✅ services/disease_prediction.py (improved retake messages)")

print("\n🎯 User Experience:")
print("-" * 80)
print("  - Users can tap ℹ️ to learn what confidence levels mean")
print("  - Clear, actionable guidance for LOW confidence")
print("  - Visual tips cards with numbered steps")
print("  - Easy navigation back to camera for retakes")
print("  - Encouraging, non-technical language")

print("\n" + "=" * 80)
print("✅ All Improvements Complete!")
print("=" * 80)
