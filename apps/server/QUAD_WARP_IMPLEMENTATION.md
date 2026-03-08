# Robust Quad Warp Implementation

## Overview
Implemented robust quadrilateral warping with consistent point ordering for perspective transforms in the AloeVeraMate harvest assessment backend.

## Implementation Details

### 1. Point Ordering Algorithm (`order_points`)
**Location**: `apps/server/app/api/harvest.py` (lines 683-703)

**Algorithm**: Sum/Difference Method
- Uses `x + y` sums to identify top-left (minimum) and bottom-right (maximum)
- Uses `y - x` differences to identify top-right (minimum) and bottom-left (maximum)
- Returns points in consistent order: `[TL, TR, BR, BL]`

**Advantages**:
- Simple and fast (O(n) complexity)
- Works for rotated, skewed, and irregular quadrilaterals
- No floating-point trigonometry required
- Robust across all orientations

### 2. Quad Warp Function (`apply_quad_warp`)
**Location**: `apps/server/app/api/harvest.py` (lines 706-758)

**Process**:
1. Orders input points using `order_points()`
2. Calculates output dimensions from edge lengths
   - Width: maximum of top and bottom edge lengths
   - Height: maximum of left and right edge lengths
3. Creates destination rectangle coordinates
4. Applies `cv2.getPerspectiveTransform()` and `cv2.warpPerspective()`

**Parameters**:
- `img`: Input image (OpenCV BGR format, np.ndarray)
- `quad_points`: 4 corner points as np.ndarray (any order)

**Returns**:
- Warped rectangular image (np.ndarray)

### 3. Integration

#### Updated Endpoints:
1. **POST `/harvest/detect_card`** (line 452)
   - Uses `apply_quad_warp()` for perspective correction before card detection
   - Reduced from 25 lines to 3 lines (88% code reduction)

2. **POST `/harvest/measure_length`** (lines 559-578)
   - Added perspective correction when `crop_quad` parameter provided
   - Applies quad warp before leaf measurements

## Test Coverage

### Test Suite: `tests/test_quad_warp.py`
**Total**: 16 tests, all passing ✅

#### TestOrderPoints (6 tests):
- `test_order_points_standard_rectangle`: Basic upright rectangle
- `test_order_points_already_ordered`: Identity operation
- `test_order_points_rotated_rectangle`: 45° rotated rectangle
- `test_order_points_trapezoid`: Non-rectangular quadrilateral
- `test_order_points_invalid_count`: Error handling
- `test_order_points_all_permutations`: All 24 permutations produce same result

#### TestApplyQuadWarp (8 tests):
- `test_warp_identity_rectangle`: Axis-aligned rectangle with colored quadrants
- `test_warp_rotated_rectangle`: 30° rotated rectangle
- `test_warp_perspective_distortion`: Trapezoid to rectangle correction
- `test_warp_shuffled_points`: Point order independence verification
- `test_warp_small_quad`: 20×20 pixel region
- `test_warp_large_quad`: 1800×1800 pixel region
- `test_warp_preserves_aspect_ratio`: 3:1 aspect ratio preservation
- `test_warp_invalid_points`: Error handling for wrong point count

#### TestQuadWarpIntegration (2 tests):
- `test_credit_card_simulation`: Simulates credit card with perspective transform
- `test_leaf_measurement_simulation`: Real-world leaf measurement scenario

### Test Results:
```bash
cd apps/server
python -m pytest tests/test_quad_warp.py -v
# 16 passed, 10 warnings in 0.91s
```

## Benefits

### Code Quality:
- **88% reduction** in perspective transform code (25 lines → 3 lines)
- Single source of truth for quad warping
- Consistent behavior across endpoints
- Easier maintenance and testing

### Robustness:
- Handles any quadrilateral orientation
- Works with rotated, skewed, and irregular shapes
- Point order independent (all 24 permutations verified)
- Proper error handling for invalid inputs

### Testing:
- Comprehensive unit tests for point ordering
- Transform correctness verification
- Edge case coverage (small/large quads, extreme rotations)
- Integration tests with real-world scenarios

## Usage Example

```python
import cv2
import numpy as np
from app.api.harvest import apply_quad_warp

# Load image
img = cv2.imread("image.jpg")

# Define 4 corner points (any order)
quad_points = np.array([
    [100, 200],  # Point 1
    [500, 150],  # Point 2
    [550, 450],  # Point 3
    [80, 480]    # Point 4
], dtype=np.float32)

# Apply perspective transform
warped = apply_quad_warp(img, quad_points)

# warped is now a rectangular image with corrected perspective
cv2.imwrite("output.jpg", warped)
```

## Technical Specifications

### Dependencies:
- OpenCV (cv2) 4.9.0.80
- NumPy 1.26.3
- Python 3.13.7

### Performance:
- O(n) time complexity for point ordering (n=4)
- Efficient perspective transforms using OpenCV
- Minimal memory overhead

### Error Handling:
- ValueError for wrong point count
- Graceful degradation for invalid inputs
- Detailed error messages

## Future Enhancements

### Potential Improvements:
1. Add logging for transform operations
2. Support for polygon warping (>4 points)
3. Automatic quad detection from user clicks
4. Performance benchmarking with large images
5. Support for batch processing

### Documentation:
- Add API documentation with examples
- Create visual guides for mobile developers
- Document coordinate system conventions

## References

### Point Ordering Algorithm:
- Based on sum/difference method for 2D points
- Inspired by OpenCV documentation and computer vision best practices

### ISO/IEC 7810 ID-1 Credit Card Standard:
- Width: 85.60 mm
- Height: 53.98 mm
- Aspect Ratio: ~1.585

## Changelog

### 2025-01-XX - Initial Implementation
- Implemented `order_points()` with sum/difference algorithm
- Created `apply_quad_warp()` utility function
- Updated `/harvest/detect_card` endpoint
- Updated `/harvest/measure_length` endpoint
- Added comprehensive test suite (16 tests)
- All tests passing ✅
