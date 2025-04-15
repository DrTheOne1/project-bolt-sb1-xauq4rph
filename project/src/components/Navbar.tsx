import { Box, Flex, Spacer, Button, useColorMode, IconButton, Menu, MenuButton, MenuList, MenuItem, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, VStack, HStack, Text, Avatar, MenuDivider } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Box as="nav" py={4} px={6} boxShadow="sm" bg={colorMode === 'light' ? 'white' : 'gray.800'}>
      <Flex align="center">
        <RouterLink to="/">
          <Text fontSize="xl" fontWeight="bold">
            SMS Speed
          </Text>
        </RouterLink>
        <Spacer />
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
          {user ? (
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                leftIcon={<Avatar size="sm" name={user.email} />}
              >
                {user.email}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                <MenuDivider />
                <MenuItem onClick={handleLogout} isLoading={isLoggingOut}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <>
              <Button as={RouterLink} to="/login" variant="ghost">
                Login
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="blue">
                Register
              </Button>
            </>
          )}
        </HStack>
        <IconButton
          aria-label="Open menu"
          icon={<HamburgerIcon />}
          onClick={onOpen}
          display={{ base: 'flex', md: 'none' }}
          variant="ghost"
        />
      </Flex>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>SMS Speed</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
                alignSelf="flex-start"
              />
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    leftIcon={<Avatar size="sm" name={user.email} />}
                  >
                    {user.email}
                  </Button>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={() => navigate('/profile')}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={handleLogout}
                    isLoading={isLoggingOut}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button as={RouterLink} to="/login" variant="ghost" justifyContent="flex-start">
                    Login
                  </Button>
                  <Button as={RouterLink} to="/register" colorScheme="blue" justifyContent="flex-start">
                    Register
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar; 