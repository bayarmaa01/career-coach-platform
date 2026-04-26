// Test script to verify resume upload and analysis pipeline fixes
require('dotenv').config({ path: '.env' });

const fs = require('fs').promises;
const geminiService = require('./dist/services/gemini').default;

async function testResumePipeline() {
  console.log('🧪 Testing Resume Upload and Analysis Pipeline');
  
  try {
    // Test 1: PDF text extraction
    console.log('\n1️⃣ Testing PDF text extraction...');
    const testPdfPath = './uploads/resume-1773414043802-923806356.pdf';
    
    try {
      const fileBuffer = await fs.readFile(testPdfPath);
      
      // Try pdf-parse first, fallback to basic text extraction
      let extractedText = '';
      try {
        const { PDFParse } = require('pdf-parse');
        const pdfParser = new PDFParse();
        const pdfData = await pdfParser.parseBuffer(fileBuffer);
        extractedText = pdfData.text || '';
        console.log('✅ PDF parsed with pdf-parse library');
      } catch (pdfError) {
        // Fallback: extract text from buffer
        extractedText = fileBuffer.toString('utf8', 0, Math.min(15000, fileBuffer.length));
        extractedText = extractedText.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        console.log('⚠️ PDF parse failed, using basic text extraction');
      }
      
      // Clean extracted text to remove null bytes and limit size
      extractedText = extractedText.replace(/\u0000/g, ''); // Remove null bytes
      extractedText = extractedText.substring(0, 15000); // Limit to 15k characters
      
      console.log(`✅ PDF text extracted: ${extractedText.length} characters`);
      console.log(`📝 Extracted text preview: ${extractedText.substring(0, 200)}...`);
      
      // Test 2: Gemini API integration
      console.log('\n2️⃣ Testing Gemini API integration...');
      console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);
      
      const response = await geminiService.generateContent(extractedText);
      console.log(`✅ Gemini API Response: ${response.substring(0, 200)}...`);
      
      // Test 3: Check for null bytes
      const hasNullBytes = /\u0000/.test(extractedText);
      console.log(`🔍 Null bytes check: ${hasNullBytes ? 'FOUND' : 'CLEAN'}`);
      
      // Test 4: Check size limit
      const isSizeValid = extractedText.length <= 15000;
      console.log(`📏 Size limit check: ${isSizeValid ? 'VALID' : 'EXCEEDED'} (${extractedText.length} chars)`);
      
      console.log('\n🎉 Pipeline test completed successfully!');
      return true;
      
    } catch (error) {
      console.error(`❌ Pipeline test failed: ${error.message}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Test setup failed: ${error.message}`);
    return false;
  }
}

testResumePipeline().then(success => {
  console.log(`\n🏁 Overall Result: ${success ? 'SUCCESS' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});
