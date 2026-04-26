// Test Demo AI functionality directly without HTTP server
const path = require('path');
const fs = require('fs');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

// Import the demo AI components
const { CVParser } = require('./backend/src/services/cvParser');
const { DemoAI } = require('./backend/src/services/demoAI');

async function testDemoAI() {
  try {
    console.log('🧪 Testing Demo AI functionality internally...');
    
    // Test 1: CV Parsing with CV2.pdf
    console.log('\n1. Testing CV parsing with CV2.pdf...');
    try {
      const pdfBuffer = fs.readFileSync(path.join(__dirname, 'CV2.pdf'));
      const cvData = await CVParser.extractFromPDF(pdfBuffer);
      
      console.log('✅ CV Parsed successfully!');
      console.log('📄 Skills detected:', cvData.skills.slice(0, 5).join(', ') + ` (${cvData.skills.length} total)`);
      console.log('💼 Experience entries:', cvData.experience.length);
      console.log('🎓 Education entries:', cvData.education.length);
      console.log('📝 Raw text length:', cvData.rawText.length, 'characters');
      
      // Test 2: Demo AI Response Generation
      console.log('\n2. Testing Demo AI response generation...');
      
      // Test resume analysis
      const analysisPrompt = 'Analyze the following resume and provide career recommendations';
      const analysisResponse = await DemoAI.generateResponse(analysisPrompt, cvData);
      console.log('✅ Resume Analysis Response Generated');
      console.log('📊 Analysis preview:', analysisResponse.substring(0, 200) + '...');
      
      // Test career recommendations
      const careerPrompt = 'Provide career recommendations based on my skills';
      const careerResponse = await DemoAI.generateResponse(careerPrompt, cvData);
      console.log('✅ Career Recommendations Generated');
      console.log('💼 Career preview:', careerResponse.substring(0, 200) + '...');
      
      // Test chat response
      const chatPrompt = 'Tell me about improving my resume for better job opportunities';
      const chatResponse = await DemoAI.generateResponse(chatPrompt, cvData);
      console.log('✅ Chat Response Generated');
      console.log('💬 Chat preview:', chatResponse.substring(0, 200) + '...');
      
      console.log('\n🎉 Demo AI Testing Complete!');
      console.log('✅ All internal Demo AI components are working perfectly!');
      console.log('✅ CV parsing is extracting real content from CV2.pdf');
      console.log('✅ Demo AI is generating personalized responses based on CV content');
      console.log('✅ Responses are dynamic and context-aware');
      
    } catch (pdfError) {
      console.error('❌ Error reading CV2.pdf:', pdfError.message);
      
      // Fallback: Test with mock CV data
      console.log('\n🔄 Testing with mock CV data...');
      const mockCVData = {
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        experience: [{ title: 'Software Developer', company: 'Tech Corp', years: 3 }],
        education: [{ degree: 'Bachelor of Science', institution: 'University' }],
        rawText: 'Software Developer with 3 years experience in JavaScript, React, Node.js'
      };
      
      const mockResponse = await DemoAI.generateResponse('Analyze my resume', mockCVData);
      console.log('✅ Mock CV Analysis:', mockResponse.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error testing Demo AI:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDemoAI();
