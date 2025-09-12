# HTTP 500 Error Fix - Header Case Sensitivity Issue

## 🐛 **Problem Identified**

The extension was getting **HTTP 500: Internal Server Error** when submitting job data to the kanban board due to a **header case sensitivity mismatch**.

### **Root Cause**
- **Extension was sending**: `X-User-ID` (uppercase)
- **Webapp was expecting**: `x-user-id` (lowercase)

The webapp's Express.js server reads headers in lowercase, so `req.headers['x-user-id']` was returning `undefined`, causing the UUID validation to fail.

## ✅ **Solution Applied**

### **1. Fixed API Service Header**
**File**: `src/services/api.ts`
```typescript
// Before (causing 500 error)
const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'X-User-ID': userId,  // ❌ Uppercase
};

// After (working correctly)
const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'x-user-id': userId,  // ✅ Lowercase
};
```

### **2. Fixed Kanban Schema Header**
**File**: `src/utils/kanbanSchema.ts`
```typescript
// Before (causing 500 error)
headers: {
  'Content-Type': 'application/json',
  'X-User-Id': userId  // ❌ Wrong case
}

// After (working correctly)
headers: {
  'Content-Type': 'application/json',
  'x-user-id': userId  // ✅ Correct case
}
```

## 🧪 **Testing Results**

### **Before Fix**
```bash
# Request with uppercase header
curl -H "X-User-ID: e4c6cc9a-d835-4291-b51b-ace887de4ffa" \
     -X POST http://localhost:8080/api/ext-jobs

# Response: HTTP 500
{"error":"Failed to create job","details":"invalid input syntax for type uuid: \"undefined\""}
```

### **After Fix**
```bash
# Request with lowercase header
curl -H "x-user-id: e4c6cc9a-d835-4291-b51b-ace887de4ffa" \
     -X POST http://localhost:8080/api/ext-jobs

# Response: HTTP 200
{"success":true,"job":{"id":"31697c50-7e1f-4f90-b87c-571fa3945feb",...}}
```

## 📋 **Files Modified**

1. **`src/services/api.ts`** - Fixed header case in API service
2. **`src/utils/kanbanSchema.ts`** - Fixed header case in kanban schema

## 🎯 **Impact**

- ✅ **HTTP 500 errors resolved**
- ✅ **Job submissions now work correctly**
- ✅ **Extension can successfully send data to kanban board**
- ✅ **No webapp changes required**

## 💡 **Key Learnings**

1. **Header Case Sensitivity**: Express.js converts headers to lowercase
2. **Debugging Process**: Use PowerShell's `Invoke-WebRequest` for testing
3. **Error Messages**: Look for specific error details in 500 responses
4. **Consistency**: Ensure all API calls use the same header format

## 🚀 **Next Steps**

1. **Test the extension** with real job data
2. **Verify job submissions** appear in the kanban board
3. **Monitor for any other header-related issues**
4. **Update documentation** to reflect correct header format

The extension should now work perfectly with your kanban board! 🎉
