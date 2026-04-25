/**
 * Skill Recommendations Page - AI-powered recommendations without CV
 * Generates career paths, learning roadmap, and job suggestions based on skills and interests
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Text,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Select,
  Divider,
  Badge,
  List,
  ListItem,
  ListIcon,
  Progress,
  Stack,
  Icon,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  chakra,
} from '@chakra-ui/react';
import { FaCheckCircle, FaClock, FaDollarSign, FaGraduationCap, FaBriefcase, FaChartLine } from 'react-icons/fa';
import { api } from '../services/api';

interface RecommendationsRequest {
  skills: string[];
  interests: string[];
  target_role?: string;
  experience_level?: string;
  chat_history?: string[];
  preferences?: any;
}

interface RecommendationsResponse {
  success: boolean;
  career_paths?: Array<{
    title: string;
    description: string;
    required_skills: string[];
    existing_skills: string[];
    missing_skills: string[];
    salary_range: string;
    growth_potential: string;
    industry_demand: string;
    match_score: number;
  }>;
  learning_roadmap?: Array<{
    month: string;
    focus_area: string;
    skills_to_learn: string[];
    resources: Array<{
      type: string;
      title: string;
      provider: string;
      duration: string;
      difficulty: string;
    }>;
    projects: string[];
    time_commitment: string;
    outcomes: string[];
  }>;
  job_suggestions?: Array<{
    job_title: string;
    company_type: string;
    responsibilities: string[];
    skills_match: {
      matched: string[];
      missing: string[];
      match_percentage: number;
    };
    salary_range: string;
    location_options: string[];
    application_tips: string[];
    urgency: string;
  }>;
  skill_gaps?: string[];
  error?: string;
}

const SkillRecommendationsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  
  const toast = useToast();

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level (0-2 years)' },
    { value: 'mid-level', label: 'Mid Level (2-5 years)' },
    { value: 'senior-level', label: 'Senior Level (5-10 years)' },
    { value: 'executive-level', label: 'Executive Level (10+ years)' },
  ];

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests(prev => [...prev, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(prev => prev.filter(interest => interest !== interestToRemove));
  };

  const generateRecommendations = async () => {
    if (skills.length === 0 || interests.length === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please add at least one skill and one interest.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const request: RecommendationsRequest = {
        skills,
        interests,
        target_role: targetRole || undefined,
        experience_level: experienceLevel || undefined,
      };

      const response = await api.post('/api/career/recommendations-lite', request);

      if (response.data.success) {
        setRecommendations(response.data);
        toast({
          title: 'Recommendations Generated!',
          description: 'Your personalized career recommendations are ready.',
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error(response.data.error || 'Failed to generate recommendations');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate recommendations. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const getGrowthColor = (potential: string) => {
    switch (potential.toLowerCase()) {
      case 'high': return 'green';
      case 'medium': return 'yellow';
      case 'low': return 'red';
      default: return 'gray';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="2xl" textAlign="center">
          AI-Powered Career Recommendations
        </Heading>
        
        <Text textAlign="center" color="gray.600" maxW="2xl" mx="auto">
          Get personalized career paths, learning roadmaps, and job suggestions based on your skills and interests - no CV required!
        </Text>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <Heading size="lg">Tell Us About Yourself</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6}>
              {/* Skills Input */}
              <FormControl>
                <FormLabel>Your Skills</FormLabel>
                <Stack direction="row" spacing={2}>
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Enter a skill (e.g., JavaScript, Python, Communication)"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} colorScheme="blue">
                    Add
                  </Button>
                </Stack>
                <Wrap spacing={2} mt={2}>
                  {skills.map((skill, index) => (
                    <WrapItem key={index}>
                      <Tag size="md" variant="solid" colorScheme="blue">
                        <TagLabel>{skill}</TagLabel>
                        <TagCloseButton onClick={() => removeSkill(skill)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>

              {/* Interests Input */}
              <FormControl>
                <FormLabel>Professional Interests</FormLabel>
                <Stack direction="row" spacing={2}>
                  <Input
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    placeholder="Enter an interest (e.g., Web Development, Data Science)"
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <Button onClick={addInterest} colorScheme="purple">
                    Add
                  </Button>
                </Stack>
                <Wrap spacing={2} mt={2}>
                  {interests.map((interest, index) => (
                    <WrapItem key={index}>
                      <Tag size="md" variant="solid" colorScheme="purple">
                        <TagLabel>{interest}</TagLabel>
                        <TagCloseButton onClick={() => removeInterest(interest)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>

              {/* Optional Fields */}
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Target Role (Optional)</FormLabel>
                  <Input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Software Engineer, Data Analyst"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Experience Level (Optional)</FormLabel>
                  <Select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="Select experience level"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <Button
                onClick={generateRecommendations}
                colorScheme="green"
                size="lg"
                isLoading={isLoading}
                loadingText="Generating Recommendations..."
              >
                Generate Recommendations
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Recommendations Results */}
        {recommendations && (
          <VStack spacing={8} align="stretch">
            {/* Career Paths */}
            {recommendations.career_paths && recommendations.career_paths.length > 0 && (
              <Card>
                <CardHeader>
                  <Heading size="lg" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaBriefcase} />
                    Recommended Career Paths
                  </Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {recommendations.career_paths.map((path, index) => (
                      <Card key={index} variant="outline">
                        <CardBody>
                          <VStack spacing={4} align="start">
                            <HStack justify="space-between" w="full">
                              <Heading size="md">{path.title}</Heading>
                              <Badge colorScheme={getMatchScoreColor(path.match_score)}>
                                {path.match_score}% Match
                              </Badge>
                            </HStack>
                            
                            <Text>{path.description}</Text>
                            
                            <HStack spacing={4}>
                              <HStack>
                                <Icon as={FaDollarSign} color="green.500" />
                                <Text fontSize="sm">{path.salary_range}</Text>
                              </HStack>
                              <Badge colorScheme={getGrowthColor(path.growth_potential)}>
                                {path.growth_potential} Growth
                              </Badge>
                            </HStack>
                            
                            <VStack align="start" spacing={2}>
                              <Text fontWeight="bold" fontSize="sm">Skills Match:</Text>
                              <Wrap spacing={1}>
                                {path.existing_skills.map((skill, i) => (
                                  <Badge key={i} colorScheme="green" variant="solid">
                                    {skill}
                                  </Badge>
                                ))}
                                {path.missing_skills.map((skill, i) => (
                                  <Badge key={i} colorScheme="red" variant="outline">
                                    {skill}
                                  </Badge>
                                ))}
                              </Wrap>
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}

            {/* Learning Roadmap */}
            {recommendations.learning_roadmap && recommendations.learning_roadmap.length > 0 && (
              <Card>
                <CardHeader>
                  <Heading size="lg" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaGraduationCap} />
                    Learning Roadmap
                  </Heading>
                </CardHeader>
                <CardBody>
                  <Accordion allowMultiple>
                    {recommendations.learning_roadmap.map((month, index) => (
                      <AccordionItem key={index}>
                        <h2>
                          <AccordionButton>
                            <HStack flex="1" textAlign="left">
                              <Text fontWeight="bold">{month.month}</Text>
                              <Text color="gray.600">{month.focus_area}</Text>
                            </HStack>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <VStack spacing={4} align="start">
                            <HStack>
                              <Icon as={FaClock} color="blue.500" />
                              <Text fontSize="sm">{month.time_commitment}</Text>
                            </HStack>
                            
                            <VStack align="start">
                              <Text fontWeight="bold" fontSize="sm">Skills to Learn:</Text>
                              <Wrap spacing={1}>
                                {month.skills_to_learn.map((skill, i) => (
                                  <Badge key={i} colorScheme="blue">
                                    {skill}
                                  </Badge>
                                ))}
                              </Wrap>
                            </VStack>
                            
                            <VStack align="start">
                              <Text fontWeight="bold" fontSize="sm">Resources:</Text>
                              <List spacing={2}>
                                {month.resources.map((resource, i) => (
                                  <ListItem key={i}>
                                    <ListIcon as={FaCheckCircle} color="green.500" />
                                    <VStack align="start" spacing={1}>
                                      <Text>{resource.title}</Text>
                                      <HStack spacing={2}>
                                        <Badge variant="outline">{resource.type}</Badge>
                                        <Badge colorScheme="gray">{resource.difficulty}</Badge>
                                        <Text fontSize="xs" color="gray.600">{resource.duration}</Text>
                                      </HStack>
                                    </VStack>
                                  </ListItem>
                                ))}
                              </List>
                            </VStack>
                            
                            <VStack align="start">
                              <Text fontWeight="bold" fontSize="sm">Expected Outcomes:</Text>
                              <List spacing={1}>
                                {month.outcomes.map((outcome, i) => (
                                  <ListItem key={i}>
                                    <ListIcon as={FaCheckCircle} color="green.500" />
                                    <Text fontSize="sm">{outcome}</Text>
                                  </ListItem>
                                ))}
                              </List>
                            </VStack>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardBody>
              </Card>
            )}

            {/* Job Suggestions */}
            {recommendations.job_suggestions && recommendations.job_suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <Heading size="lg" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaBriefcase} />
                    Job Suggestions
                  </Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {recommendations.job_suggestions.map((job, index) => (
                      <Card key={index} variant="outline">
                        <CardBody>
                          <VStack spacing={4} align="start">
                            <HStack justify="space-between" w="full">
                              <Heading size="md">{job.job_title}</Heading>
                              <Badge colorScheme={getUrgencyColor(job.urgency)}>
                                {job.urgency} Urgency
                              </Badge>
                            </HStack>
                            
                            <Text color="gray.600">{job.company_type}</Text>
                            
                            <HStack>
                              <Icon as={FaDollarSign} color="green.500" />
                              <Text fontSize="sm">{job.salary_range}</Text>
                            </HStack>
                            
                            <VStack align="start" spacing={2}>
                              <Text fontWeight="bold" fontSize="sm">Skills Match:</Text>
                              <Progress
                                value={job.skills_match.match_percentage}
                                colorScheme={job.skills_match.match_percentage >= 70 ? 'green' : 'yellow'}
                                size="sm"
                                w="full"
                              />
                              <Text fontSize="xs" color="gray.600">
                                {job.skills_match.match_percentage}% match
                              </Text>
                            </VStack>
                            
                            <VStack align="start" spacing={2}>
                              <Text fontWeight="bold" fontSize="sm">Application Tips:</Text>
                              <List spacing={1}>
                                {job.application_tips.map((tip, i) => (
                                  <ListItem key={i}>
                                    <ListIcon as={FaCheckCircle} color="blue.500" />
                                    <Text fontSize="sm">{tip}</Text>
                                  </ListItem>
                                ))}
                              </List>
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}

            {/* Skill Gaps */}
            {recommendations.skill_gaps && recommendations.skill_gaps.length > 0 && (
              <Card>
                <CardHeader>
                  <Heading size="lg" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaChartLine} />
                    Skill Gaps to Address
                  </Heading>
                </CardHeader>
                <CardBody>
                  <List spacing={3}>
                    {recommendations.skill_gaps.map((gap, index) => (
                      <ListItem key={index}>
                        <ListIcon as={FaCheckCircle} color="orange.500" />
                        <Text>{gap}</Text>
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>
            )}
          </VStack>
        )}
      </VStack>
    </Container>
  );
};

export default SkillRecommendationsPage;
