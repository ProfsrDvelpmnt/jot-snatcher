# How to Get Your Supabase API Key

## 🔑 **Step-by-Step Guide to Get the Correct API Key**

### **1. Go to Your Supabase Project Dashboard**
Visit: https://supabase.com/dashboard/project/aeoyohqyhawxulisdvqj

### **2. Navigate to API Settings**
1. In your project dashboard, look for **"Settings"** in the left sidebar
2. Click on **"API"** under the Settings section
3. Or go directly to: https://supabase.com/dashboard/project/aeoyohqyhawxulisdvqj/settings/api

### **3. Copy the Correct Key**
You need the **"anon" public key** (not the service role key):

- **Project URL**: `https://aeoyohqyhawxulisdvqj.supabase.co`
- **anon public key**: This is the long JWT token that starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **4. What the Key Should Look Like**
A valid Supabase anon key should:
- Start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Be very long (usually 200+ characters)
- Have 3 parts separated by dots (JWT format)
- End with a signature part

### **5. Common Issues**
- **Incomplete key**: Make sure you copied the entire key
- **Wrong key type**: Use the "anon" key, not "service_role"
- **Extra spaces**: Remove any leading/trailing whitespace
- **Line breaks**: Ensure it's all on one line

## 🔧 **Update Your Extension**

Once you have the correct key, update it in these files:

1. **`src/services/directSupabaseAuth.ts`** (line 8)
2. **`src/services/api.ts`** (line 426)

Replace the current key with your new one.

## 🧪 **Test the Key**

After updating, rebuild and test:

```bash
npm run build
```

Then check the browser console for:
- ✅ "Connection test successful"
- ❌ "Invalid API key" (if still wrong)

## 💡 **Alternative: Environment Variables**

For better security, you could also use environment variables instead of hardcoding the key.

Would you like me to help you set that up instead?
