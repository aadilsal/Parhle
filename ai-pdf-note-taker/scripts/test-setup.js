// Simple test to verify Google Generative AI is installed and working
const testSetup = async () => {
  console.log("🔍 Checking setup...\n");

  // Check if @google/generative-ai is installed
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    console.log("✅ @google/generative-ai installed");
    
    // Check if API key is set
    if (process.env.GOOGLE_API_KEY) {
      console.log("✅ GOOGLE_API_KEY is set");
      
      // Try to initialize (doesn't make a request)
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        console.log("✅ Google Generative AI SDK initialized");
      } catch (e) {
        console.log("⚠️  SDK initialization issue:", e.message);
      }
    } else {
      console.log("⚠️  GOOGLE_API_KEY not found in environment");
      console.log("   Add it to .env.local: GOOGLE_API_KEY=your_key_here");
    }
  } catch (e) {
    console.log("❌ @google/generative-ai not installed");
    console.log("   Run: npm install @google/generative-ai");
    return;
  }

  // Check LangChain
  try {
    await import("@langchain/textsplitters");
    console.log("✅ @langchain/textsplitters installed");
  } catch (e) {
    console.log("❌ @langchain/textsplitters not installed");
    console.log("   Run: npm install @langchain/textsplitters");
  }

  // Check pdfjs
  try {
    await import("pdfjs-dist/legacy/build/pdf.mjs");
    console.log("✅ pdfjs-dist installed");
  } catch (e) {
    console.log("❌ pdfjs-dist not installed");
    console.log("   Run: npm install pdfjs-dist");
  }

  console.log("\n🎯 Next steps:");
  console.log("1. Ensure .env.local has GOOGLE_API_KEY");
  console.log("2. Run: npx convex dev");
  console.log("3. In another terminal: npm run dev");
};

testSetup().catch(console.error);
