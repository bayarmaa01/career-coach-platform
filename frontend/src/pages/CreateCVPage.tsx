/**
 * Create CV Page - AI-powered CV builder
 * Step-by-step wizard for generating professional CVs
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepTitle,
  StepDescription,
  StepSeparator,
  StepIcon,
  useSteps,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Card,
  CardBody,
  Stack,
  Divider,
  useToast,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface CVData {
  name: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description: string;
    start_date: string;
    end_date: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    start_date: string;
    end_date: string;
  }>;
  interests: string[];
  target_role: string;
}

const CreateCVPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<any>(null);
  
  const [cvData, setCVData] = useState<CVData>({
    name: '',
    skills: [],
    experience: [],
    education: [],
    interests: [],
    target_role: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const steps = [
    { title: 'Personal Info', description: 'Basic information' },
    { title: 'Skills', description: 'Your technical and soft skills' },
    { title: 'Experience', description: 'Work experience' },
    { title: 'Education', description: 'Educational background' },
    { title: 'Interests', description: 'Professional interests' },
    { title: 'Generate', description: 'Create your CV' },
  ];

  const { activeStep, setActiveStep } = useSteps({
    index: currentStep,
    count: steps.length,
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setActiveStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActiveStep(currentStep - 1);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !cvData.skills.includes(skillInput.trim())) {
      setCVData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setCVData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && !cvData.interests.includes(interestInput.trim())) {
      setCVData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setCVData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const addExperience = () => {
    setCVData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        description: '',
        start_date: '',
        end_date: '',
      }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setCVData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        institution: '',
        start_date: '',
        end_date: '',
      }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const generateCV = async () => {
    setIsGenerating(true);
    
    try {
      const response = await api.post('/api/ai/generate-cv', cvData);
      
      if (response.data.success) {
        setGeneratedCV(response.data);
        toast({
          title: 'CV Generated Successfully!',
          description: 'Your professional CV has been created.',
          status: 'success',
          duration: 3000,
        });
        handleNext();
      } else {
        throw new Error(response.data.error || 'Failed to generate CV');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate CV. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCV = (format: 'markdown' | 'text') => {
    if (!generatedCV) return;
    
    const content = format === 'markdown' ? generatedCV.markdown_cv : generatedCV.formatted_cv;
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvData.name.replace(/\s+/g, '_')}_CV.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input
                value={cvData.name}
                onChange={(e) => setCVData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Target Role</FormLabel>
              <Input
                value={cvData.target_role}
                onChange={(e) => setCVData(prev => ({ ...prev, target_role: e.target.value }))}
                placeholder="e.g., Software Engineer, Data Analyst"
              />
            </FormControl>
          </VStack>
        );

      case 1: // Skills
        return (
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Add Skills</FormLabel>
              <Stack direction="row" spacing={2}>
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Enter a skill"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} colorScheme="blue">
                  Add
                </Button>
              </Stack>
            </FormControl>
            
            <Wrap spacing={2}>
              {cvData.skills.map((skill, index) => (
                <WrapItem key={index}>
                  <Tag size="md" variant="solid" colorScheme="blue">
                    <TagLabel>{skill}</TagLabel>
                    <TagCloseButton onClick={() => removeSkill(skill)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
            
            {cvData.skills.length === 0 && (
              <Text color="gray.500" fontStyle="italic">
                Add your technical and soft skills (e.g., JavaScript, Python, Communication)
              </Text>
            )}
          </VStack>
        );

      case 2: // Experience
        return (
          <VStack spacing={4} align="stretch">
            <Button onClick={addExperience} colorScheme="green" alignSelf="flex-start">
              Add Experience
            </Button>
            
            {cvData.experience.map((exp, index) => (
              <Card key={index}>
                <CardBody>
                  <VStack spacing={3}>
                    <Stack direction="row" spacing={2}>
                      <FormControl>
                        <FormLabel>Job Title</FormLabel>
                        <Input
                          value={exp.title}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          placeholder="e.g., Software Developer"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Company</FormLabel>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          placeholder="e.g., Tech Corp"
                        />
                      </FormControl>
                    </Stack>
                    
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Describe your responsibilities and achievements"
                        rows={3}
                      />
                    </FormControl>
                    
                    <Stack direction="row" spacing={2}>
                      <FormControl>
                        <FormLabel>Start Date</FormLabel>
                        <Input
                          type="month"
                          value={exp.start_date}
                          onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>End Date</FormLabel>
                        <Input
                          type="month"
                          value={exp.end_date}
                          onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                        />
                      </FormControl>
                    </Stack>
                    
                    <Button
                      onClick={() => removeExperience(index)}
                      colorScheme="red"
                      size="sm"
                      alignSelf="flex-start"
                    >
                      Remove
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
            
            {cvData.experience.length === 0 && (
              <Text color="gray.500" fontStyle="italic">
                Add your work experience, including internships and volunteer work
              </Text>
            )}
          </VStack>
        );

      case 3: // Education
        return (
          <VStack spacing={4} align="stretch">
            <Button onClick={addEducation} colorScheme="green" alignSelf="flex-start">
              Add Education
            </Button>
            
            {cvData.education.map((edu, index) => (
              <Card key={index}>
                <CardBody>
                  <VStack spacing={3}>
                    <Stack direction="row" spacing={2}>
                      <FormControl>
                        <FormLabel>Degree</FormLabel>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          placeholder="e.g., Bachelor of Science in Computer Science"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Institution</FormLabel>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          placeholder="e.g., University Name"
                        />
                      </FormControl>
                    </Stack>
                    
                    <Stack direction="row" spacing={2}>
                      <FormControl>
                        <FormLabel>Start Date</FormLabel>
                        <Input
                          type="month"
                          value={edu.start_date}
                          onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>End Date</FormLabel>
                        <Input
                          type="month"
                          value={edu.end_date}
                          onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                        />
                      </FormControl>
                    </Stack>
                    
                    <Button
                      onClick={() => removeEducation(index)}
                      colorScheme="red"
                      size="sm"
                      alignSelf="flex-start"
                    >
                      Remove
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
            
            {cvData.education.length === 0 && (
              <Text color="gray.500" fontStyle="italic">
                Add your educational background, including degrees and certifications
              </Text>
            )}
          </VStack>
        );

      case 4: // Interests
        return (
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Add Professional Interests</FormLabel>
              <Stack direction="row" spacing={2}>
                <Input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  placeholder="Enter an interest"
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <Button onClick={addInterest} colorScheme="blue">
                  Add
                </Button>
              </Stack>
            </FormControl>
            
            <Wrap spacing={2}>
              {cvData.interests.map((interest, index) => (
                <WrapItem key={index}>
                  <Tag size="md" variant="solid" colorScheme="purple">
                    <TagLabel>{interest}</TagLabel>
                    <TagCloseButton onClick={() => removeInterest(interest)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
            
            <Text color="gray.500" fontStyle="italic">
              Add your professional interests (e.g., Machine Learning, Web Development, Data Science)
            </Text>
          </VStack>
        );

      case 5: // Generate
        return (
          <VStack spacing={6} align="stretch">
            {isGenerating ? (
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>Generating your professional CV...</Text>
                <Text fontSize="sm" color="gray.500">
                  This may take a few moments as our AI creates a tailored CV for you
                </Text>
              </VStack>
            ) : generatedCV ? (
              <VStack spacing={4}>
                <Alert status="success">
                  <AlertIcon />
                  Your CV has been generated successfully!
                </Alert>
                
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Download Options</Heading>
                      <Stack direction="row" spacing={4}>
                        <Button
                          onClick={() => downloadCV('markdown')}
                          colorScheme="blue"
                        >
                          Download Markdown
                        </Button>
                        <Button
                          onClick={() => downloadCV('text')}
                          colorScheme="green"
                        >
                          Download Text
                        </Button>
                      </Stack>
                      
                      <Divider />
                      
                      <Heading size="md">Preview</Heading>
                      <Box
                        bg="gray.50"
                        p={4}
                        borderRadius="md"
                        maxH="400px"
                        overflowY="auto"
                      >
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                          {generatedCV.formatted_cv?.substring(0, 1000)}
                          {generatedCV.formatted_cv?.length > 1000 && '...'}
                        </pre>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            ) : (
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  Ready to generate your CV! Click the button below to create your professional CV.
                </Alert>
                
                <Button
                  onClick={generateCV}
                  colorScheme="blue"
                  size="lg"
                  isDisabled={!cvData.name || cvData.skills.length === 0}
                >
                  Generate CV
                </Button>
                
                {(!cvData.name || cvData.skills.length === 0) && (
                  <Text color="red.500" fontSize="sm">
                    Please fill in your name and add at least one skill before generating
                  </Text>
                )}
              </VStack>
            )}
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="2xl" textAlign="center">
          Create Your Professional CV with AI
        </Heading>
        
        <Stepper index={activeStep} size="lg">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepIcon />}
                  active={<StepIcon />}
                />
              </StepIndicator>
              <Box flexShrink="0">
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardBody>
            <VStack spacing={6}>
              {renderStepContent()}
              
              <Stack direction="row" spacing={4} justify="space-between">
                <Button
                  onClick={handlePrev}
                  isDisabled={currentStep === 0}
                  variant="outline"
                >
                  Previous
                </Button>
                
                {currentStep < steps.length - 1 && (
                  <Button
                    onClick={handleNext}
                    colorScheme="blue"
                    isDisabled={
                      (currentStep === 0 && !cvData.name) ||
                      (currentStep === 1 && cvData.skills.length === 0)
                    }
                  >
                    Next
                  </Button>
                )}
                
                {currentStep === steps.length - 1 && generatedCV && (
                  <Button
                    onClick={() => navigate('/dashboard')}
                    colorScheme="green"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </Stack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default CreateCVPage;
