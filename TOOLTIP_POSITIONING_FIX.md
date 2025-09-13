# Tooltip Positioning Fix

## 🔧 **Issue Fixed**: Tooltip Visibility

### **Problem:**

The generation breakdown tooltip was positioned above the Collection Stats, but since the header is at the top of the page, the tooltip was going off-screen and not visible.

### **Solution:**

Changed the tooltip positioning from `bottom-full` (above) to `top-full` (below) the Collection Stats.

### **Changes Made:**

#### **Positioning:**

- **Before**: `bottom-full` + `mb-2` (margin bottom) - tooltip above stats
- **After**: `top-full` + `mt-2` (margin top) - tooltip below stats

#### **Arrow Direction:**

- **Before**: Arrow pointing down (`border-t-4 border-t-gray-900`)
- **After**: Arrow pointing up (`border-b-4 border-b-gray-900`)

### **Result:**

✅ Tooltip now appears below the Collection Stats and is fully visible
✅ Arrow correctly points up to indicate the tooltip source
✅ No more off-screen visibility issues

### **Code Changes:**

```vue
<!-- OLD (off-screen) -->
<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2">
  <!-- Arrow pointing down -->
  <div class="border-t-4 border-t-gray-900"></div>
</div>

<!-- NEW (visible) -->
<div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
  <!-- Arrow pointing up -->
  <div class="border-b-4 border-b-gray-900"></div>
</div>
```

The tooltip now displays perfectly below the Collection Stats where it's fully visible to users!
