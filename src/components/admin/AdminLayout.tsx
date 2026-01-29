import { useNavigate, Outlet, Link as RouterLink } from "react-router-dom";
import { Box, Container, Flex, HStack, Heading, Button, Text } from "@chakra-ui/react";
import { LuArrowLeft, LuLogOut } from "react-icons/lu";
import { signOut } from "../../lib/auth-client";

export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin");
  };

  return (
    <Box minH="100vh" bg="gray.950">
      <Box
        as="header"
        borderBottom="1px solid"
        borderColor="gray.800"
        bg="gray.900"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <RouterLink to="/admin/dashboard">
              <Heading
                size="md"
                bgGradient="to-r"
                gradientFrom="cyan.400"
                gradientTo="blue.500"
                bgClip="text"
                fontFamily="'JetBrains Mono', monospace"
              >
                Admin Panel
              </Heading>
            </RouterLink>
            <HStack gap={6}>
              <RouterLink to="/">
                <HStack
                  gap={1}
                  color="gray.400"
                  _hover={{ color: "white" }}
                  transition="color 0.2s"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  <Box fontSize="16px">
                    <LuArrowLeft />
                  </Box>
                  <Text>Back to App</Text>
                </HStack>
              </RouterLink>
              <Button
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white", bg: "gray.800" }}
                onClick={handleLogout}
              >
                <Box fontSize="16px" mr={1}>
                  <LuLogOut />
                </Box>
                Logout
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
      <Box as="main">
        <Outlet />
      </Box>
    </Box>
  );
}
