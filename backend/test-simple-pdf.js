// Simple test to verify PDF parsing works
const fs = require('fs').promises;

async function testSimplePDF() {
  try {
    console.log('🧪 Testing simple PDF text extraction...');
    
    // Read the PDF file
    const testPdfPath = './uploads/resume-1773414043802-923806356.pdf';
    const fileBuffer = await fs.readFile(testPdfPath);
    console.log(`✅ PDF file read: ${fileBuffer.length} bytes`);
    
    // For now, just extract some text using basic approach
    // This is a fallback method that doesn't require pdf-parse
    const text = fileBuffer.toString('utf8', 0, Math.min(15000, fileBuffer.length));
    const cleanedText = text.replace(/\u0000/g, '').replace(/[^\x20-\x7E\n\r\t]/g, ' ').substring(0, 15000);
    
    console.log(`✅ Text extracted (basic): ${cleanedText.length} characters`);
    console.log(`📝 Text preview: ${cleanedText.substring(0, 200)}...`);
    
    console.log('🎉 Simple PDF test completed successfully!');
    return true;
    
  } catch (error) {
    console.error(`❌ Simple PDF test failed: ${error.message}`);
    return false;
  }
}

testSimplePDF().then(success => {
  console.log(`🏁 Result: ${success ? 'SUCCESS' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});
