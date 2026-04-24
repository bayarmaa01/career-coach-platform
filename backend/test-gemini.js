// Direct test of Gemini service
const geminiService = require('./dist/services/gemini').default;

async function testGemini() {
  console.log('Testing Gemini service directly...');
  
  try {
    // Test basic content generation
    console.log('\n=== Testing Basic Content Generation ===');
    const response = await geminiService.generateContent("What skills do I need for a software engineering job?");
    console.log('Gemini Response:', response);
    
    // Test resume analysis
    console.log('\n=== Testing Resume Analysis ===');
    const resumeText = `
Name: John Doe
Skills: JavaScript, React, Node.js, HTML, CSS
Experience: 2 years as a junior developer
Education: Bachelor's in Computer Science
Target Role: Software Engineer
    `;
    
    const analysis = await geminiService.analyzeResume(resumeText);
    console.log('Resume Analysis:', JSON.stringify(analysis, null, 2));
    
    // Test career recommendations
    console.log('\n=== Testing Career Recommendations ===');
    const recommendations = await geminiService.generateCareerRecommendations(resumeText);
    console.log('Career Recommendations:', JSON.stringify(recommendations, null, 2));
    
  } catch (error) {
    console.error('Gemini Test Error:', error.message);
    console.error('Full error:', error);
  }
}

testGemini();
