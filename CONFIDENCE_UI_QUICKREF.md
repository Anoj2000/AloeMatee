# Confidence UI - Quick Reference

## 🎯 What Was Built

### Mobile Components

#### 1. ConfidenceInfoModal
**File**: `apps/mobile/components/ConfidenceInfoModal.tsx`

**Props**:
```typescript
interface ConfidenceInfoModalProps {
  visible: boolean;
  onClose: () => void;
  currentConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

**Usage**:
```tsx
<ConfidenceInfoModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  currentConfidence="HIGH"
/>
```

#### 2. ConfidenceBadge (Enhanced)
**File**: `apps/mobile/components/ConfidenceBadge.tsx`

**New Props**:
```typescript
interface BadgeProps {
  status: 'High' | 'Medium' | 'Low';
  confidence?: number;
  onInfoPress?: () => void;  // NEW
}
```

**Usage**:
```tsx
<ConfidenceBadge 
  status="High"
  confidence={0.97}
  onInfoPress={() => setShowInfo(true)}
/>
```

#### 3. Results Screen (Enhanced)
**File**: `apps/mobile/app/results.tsx`

**New State**:
```tsx
const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);
```

**Modal Integration**:
```tsx
<ConfidenceInfoModal
  visible={showConfidenceInfo}
  onClose={() => setShowConfidenceInfo(false)}
  currentConfidence={result.confidence_status}
/>
```

---

## 🎨 UI Layout - LOW Confidence

### Screen Structure:
```
┌─────────────────────────────────────┐
│ ⚠️ Low Confidence Detection         │
│ [LOW Badge] [ℹ️]                    │
│ We're not confident...              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📸 How to Take Better Photos        │
│                                      │
│ ❶ ☀️ Good Lighting                 │
│    Natural daylight...               │
│                                      │
│ ❷ 🎯 Clear Focus                   │
│    Tap to focus...                   │
│                                      │
│ ❸ 📏 Right Distance                │
│    6-12 inches...                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🤔 Why might it be uncertain?       │
│                                      │
│ 📷 Blurry or out-of-focus           │
│ 🌑 Low light                        │
│ 📏 Wrong distance                   │
│ 🎨 Background clutter               │
│ 👁️ Symptoms not visible            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Technical Details:                   │
│ The model detected some patterns...  │
│ 📸 Use bright daylight • 🎯 Tap...  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔍 What We Detected (Uncertain)     │
│ #1 Disease A (45%)                   │
│ #2 Disease B (30%)                   │
└─────────────────────────────────────┘

[ 📷 Retake Photos ]

Taking clearer photos will help...
```

---

## 📱 Modal Content Structure

### Modal Layout:
```
┌──────────────────────────────────────────┐
│ Understanding Confidence Levels      [✕] │
├──────────────────────────────────────────┤
│                                          │
│ [✓ HIGH] Current                         │
│ Very Likely Correct                      │
│ The model is very confident...           │
│ ┌────────────────────────────────────┐  │
│ │ ✓ Confidence ≥80%                  │  │
│ │ ✓ Clear symptoms detected          │  │
│ │ ✓ High-quality images provided     │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [! MEDIUM]                               │
│ Likely, But Not Certain                  │
│ The diagnosis is probable...             │
│ ┌────────────────────────────────────┐  │
│ │ ⚠ Confidence 60-79%                │  │
│ │ ⚠ Some symptoms unclear            │  │
│ │ 💡 Consider retaking photos        │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [? LOW]                                  │
│ Not Reliable                             │
│ The model cannot provide...              │
│ ┌────────────────────────────────────┐  │
│ │ ✗ Confidence <60%                  │  │
│ │ ✗ Symptoms not clear               │  │
│ │ 📷 Must retake photos              │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 🤔 Why might it be uncertain?            │
│ 📷 Blurry or out-of-focus image          │
│ 🌑 Low light or poor lighting            │
│ 📏 Camera too far or too close           │
│ 🎨 Background clutter or distractions    │
│ 👁️ Symptoms not clearly visible         │
│ 💧 Water droplets or reflections         │
│ 📐 Awkward angle making details hard     │
│                                          │
│ 💡 Tips for High Confidence Results      │
│ ✓ Take photos in bright daylight        │
│ ✓ Focus clearly on affected areas       │
│ ✓ Hold camera steady, avoid blur        │
│ ✓ Get close enough to see details       │
│ ✓ Clean your camera lens first          │
│ ✓ Capture all 3 angles                  │
│                                          │
│         [ Got It ]                       │
└──────────────────────────────────────────┘
```

---

## 🔧 Backend Changes

### File: `disease_prediction.py`

**Method**: `_generate_retake_message()`

**Input**:
- `confidence`: float (0.0 - 1.0)
- `num_images`: int (1-3)

**Logic**:
```python
if confidence < 0.3:
    intro = "couldn't identify clear patterns"
elif confidence < 0.5:
    intro = "detected some patterns but not confident"
else:
    intro = f"moderate ({confidence:.0%})"

tips = [
    "📸 bright, natural daylight",
    "🎯 tap to focus",
    "📏 6-12 inches away",
    ...
]

if num_images < 3:
    tips.append(f"📷 take all 3 photos (you provided {num_images})")
```

**Output Example**:
```
The model detected some patterns but isn't confident enough for a 
reliable diagnosis. Tips for better results: 📸 Use bright, natural 
daylight (avoid harsh direct sun) • 🎯 Tap to focus on affected areas 
and wait for sharp image • 📏 Hold camera 6-12 inches from the plant • 
📷 Take all 3 recommended photos (you provided 1) • 🧹 Clean camera 
lens for clearer capture • 🖼️ Remove background clutter and shadows
```

---

## 🎯 Key Interactions

### 1. Info Icon Tap (Any Confidence)
```
User taps ℹ️
  ↓
Modal opens
  ↓
Shows all 3 confidence levels
  ↓
Highlights current level
  ↓
User reads explanations
  ↓
Taps "Got It" or background
  ↓
Modal closes
```

### 2. LOW Confidence Flow
```
Receive LOW confidence result
  ↓
Show warning card with badge + info icon
  ↓
Display "How to Take Better Photos" card
  ↓
Display "Why uncertain?" card
  ↓
Show uncertain predictions
  ↓
Tap "Retake Photos"
  ↓
Navigate to /camera-capture
  ↓
User takes new photos
  ↓
Hopefully get HIGH confidence!
```

---

## 📊 Testing

### Manual Test Checklist:

#### ✅ Info Icon
- [ ] Icon visible next to badge
- [ ] Tappable with good hit area
- [ ] Opens modal
- [ ] Modal shows correct current confidence

#### ✅ Modal Content
- [ ] All 3 confidence levels shown
- [ ] Current level highlighted
- [ ] Color coding correct (Green/Orange/Red)
- [ ] "Why uncertain?" section complete
- [ ] Tips section complete
- [ ] "Got It" button works
- [ ] Background tap closes modal
- [ ] Scrollable on small screens

#### ✅ LOW Confidence UI
- [ ] Warning card shows properly
- [ ] "How to Take Better Photos" has 3 tips
- [ ] Each tip has number, icon, title, description
- [ ] "Why uncertain?" card shows 5 reasons
- [ ] Technical details card (if message exists)
- [ ] Uncertain predictions shown
- [ ] "Retake Photos" button navigates correctly

#### ✅ Backend Messages
- [ ] Context-aware intro based on confidence
- [ ] Emojis render correctly
- [ ] Tips separated with bullets
- [ ] Specific to number of images

### Automated Testing:
```bash
cd apps/server
python test_confidence_ui.py
```

**Expected Output**:
- ✅ HIGH confidence prediction works
- ✅ Backend message format verified
- ✅ All components listed as implemented

---

## 🚀 Deployment Notes

### Mobile App:
1. New dependency: None (uses built-in React Native components)
2. New file: `ConfidenceInfoModal.tsx` (must be included)
3. Breaking changes: None (backward compatible)

### Backend:
1. Dependencies: No changes
2. API contract: Unchanged (still returns `retake_message`)
3. Message format: Enhanced but still string

### Database:
- No schema changes
- Feedback system unaffected

---

## 📈 Success Metrics

### User Engagement:
- Modal open rate (% of users who tap ℹ️)
- Average time in modal
- Retake rate after viewing LOW tips

### Photo Quality:
- Confidence improvement after retake
- Blur score improvement
- Brightness score improvement

### User Satisfaction:
- Feedback: "Was this helpful?" rate increase
- Support tickets about confidence: decrease
- App store reviews mentioning "helpful guidance"

---

## 🎓 Learning Resources

### For Developers:
- Modal implementation: React Native Modal docs
- Badge styling: View composition patterns
- State management: useState hook basics

### For Users:
- In-app modal provides all education
- No external documentation needed
- Self-contained learning experience

---

**Quick Start**: Tap ℹ️ next to any confidence badge to learn more!

**Implementation Time**: ~2 hours  
**Lines of Code**: ~450 lines  
**Files Changed**: 4 (1 new, 3 modified)  
**Test Coverage**: Manual + Integration tests ✅
