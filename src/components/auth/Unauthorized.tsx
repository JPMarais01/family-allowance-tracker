import { Box, Button, Heading, Icon, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export function Unauthorized(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <Box textAlign="center" py={10} px={6}>
      <VStack gap={8}>
        <Box display="inline-block">
          <Icon
            boxSize={'50px'}
            color={'red.500'}
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </Icon>
        </Box>
        <Heading as="h2" size="xl" mt={6} mb={2}>
          Access Denied
        </Heading>
        <Text color={'gray.500'}>
          You don't have permission to access this page. Please contact your administrator if you
          believe this is an error.
        </Text>
        <Button colorScheme="blue" onClick={() => navigate('/dashboard')} size="lg" mt={4}>
          Go to Dashboard
        </Button>
      </VStack>
    </Box>
  );
}
