import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useToast } from '@chakra-ui/toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('auth.requiredFields'));
      return;
    }

    setIsLoading(true);

    try {
      await authLogin(email, password);
      toast({
        title: t('auth.loginSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.loginError');
      setError(errorMessage);
      toast({
        title: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" _dark={{ bg: 'gray.900' }} p={4}>
      <Box maxW="md" w="full" space={8}>
        <VStack spacing={8}>
          <Heading textAlign="center" size="xl">
            {t('auth.signIn')}
          </Heading>
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder={t('auth.email')}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="password">{t('auth.password')}</FormLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder={t('auth.password')}
                />
              </FormControl>

              {error && (
                <Text color="red.500" textAlign="center">
                  {error}
                </Text>
              )}

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
                loadingText={t('auth.signingIn')}
              >
                {t('auth.signIn')}
              </Button>

              <Text>
                {t('auth.noAccount')}{' '}
                <Link to="/register" style={{ color: '#3182ce' }}>
                  {t('auth.register')}
                </Link>
              </Text>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login; 