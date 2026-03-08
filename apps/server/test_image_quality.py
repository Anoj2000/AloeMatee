"""
Test image quality checks for debugging

This script helps you understand why some images pass quality checks while others fail.
Use this to test your real plant photos vs screen photos.
"""

import sys
from pathlib import Path
from PIL import Image

# Add server to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.image_quality import check_image_quality, BLUR_THRESHOLD, BRIGHTNESS_MIN, BRIGHTNESS_MAX


def test_image_quality(image_path: str):
    """Test a single image and show detailed results"""
    print(f"\n{'='*60}")
    print(f"Testing: {Path(image_path).name}")
    print(f"{'='*60}")
    
    try:
        image = Image.open(image_path)
        result = check_image_quality(image)
        
        print(f"\n📊 Quality Metrics:")
        print(f"   Resolution: {result.resolution[0]}x{result.resolution[1]} (minimum: 224x224)")
        print(f"   Blur Score: {result.blur_score:.2f} (threshold: {BLUR_THRESHOLD})")
        print(f"   Brightness: {result.brightness_score:.2f} (range: {BRIGHTNESS_MIN}-{BRIGHTNESS_MAX})")
        
        print(f"\n✅ Result: {result.issue.value.upper()}")
        
        if result.is_acceptable:
            print("   ✓ Image quality is ACCEPTABLE")
            print("   ✓ Will proceed to disease detection")
        else:
            print(f"   ✗ Image quality is REJECTED")
            print(f"   ✗ Reason: {result.get_user_message()}")
        
        # Show detailed analysis
        print(f"\n🔍 Detailed Analysis:")
        
        # Resolution check
        if result.resolution[0] >= 224 and result.resolution[1] >= 224:
            print(f"   ✓ Resolution: PASS")
        else:
            print(f"   ✗ Resolution: FAIL - Image too small")
        
        # Blur check
        if result.blur_score >= BLUR_THRESHOLD:
            print(f"   ✓ Blur: PASS - Image is sharp (score: {result.blur_score:.2f})")
        else:
            print(f"   ✗ Blur: FAIL - Image is blurry (score: {result.blur_score:.2f}, need: {BLUR_THRESHOLD})")
            print(f"      Tip: Hold camera steady, tap to focus, use better lighting")
        
        # Brightness check
        if BRIGHTNESS_MIN <= result.brightness_score <= BRIGHTNESS_MAX:
            print(f"   ✓ Brightness: PASS - Good exposure (score: {result.brightness_score:.2f})")
        elif result.brightness_score < BRIGHTNESS_MIN:
            print(f"   ✗ Brightness: FAIL - Too dark (score: {result.brightness_score:.2f}, need: >{BRIGHTNESS_MIN})")
            print(f"      Tip: Take photo in brighter location or increase phone brightness")
        else:
            print(f"   ✗ Brightness: FAIL - Too bright (score: {result.brightness_score:.2f}, need: <{BRIGHTNESS_MAX})")
            print(f"      Tip: Move away from direct light or reduce exposure")
        
    except Exception as e:
        print(f"❌ Error testing image: {e}")


if __name__ == "__main__":
    print("\n🔬 Image Quality Tester")
    print("=" * 60)
    print("This tool helps debug why some images work and others don't")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("\n📝 Usage:")
        print(f"   python {Path(__file__).name} <path_to_image>")
        print("\n💡 Example:")
        print(f"   python {Path(__file__).name} test_image.jpg")
        print("\n📸 Compare your photos:")
        print("   1. Test your real plant photo")
        print("   2. Test your screen photo of the same plant")
        print("   3. Compare the blur scores and brightness")
        sys.exit(1)
    
    # Test each provided image
    for image_path in sys.argv[1:]:
        test_image_quality(image_path)
    
    print("\n" + "="*60)
    print("💡 Tips for Better Photos:")
    print("="*60)
    print("1. 🌞 Use natural daylight (not direct harsh sun)")
    print("2. 📱 Clean your camera lens")
    print("3. 🎯 Tap to focus on the plant before capturing")
    print("4. 📏 Hold phone 6-12 inches from plant")
    print("5. 🖐️ Keep phone steady (use both hands)")
    print("6. 🧹 Remove cluttered background")
    print("7. 🔍 Make sure affected areas are clearly visible")
    print("="*60 + "\n")
