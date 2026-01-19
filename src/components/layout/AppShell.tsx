import { Box, Container, Flex, Heading, HStack } from "@chakra-ui/react";
import { Link as RouterLink, Outlet } from "react-router-dom";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <RouterLink to={to}>
      <Box
        color="gray.400"
        _hover={{ color: "white" }}
        fontSize="sm"
        fontWeight="medium"
        transition="color 0.2s"
      >
        {children}
      </Box>
    </RouterLink>
  );
}

export function AppShell() {
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
            <RouterLink to="/">
              <Heading
                size="md"
                bgGradient="to-r"
                gradientFrom="cyan.400"
                gradientTo="blue.500"
                bgClip="text"
                fontFamily="'JetBrains Mono', monospace"
              >
                AI Practice Lab
              </Heading>
            </RouterLink>
            <HStack gap={6}>
              <NavLink to="/lessons">Lessons</NavLink>
              <NavLink to="/review">Review</NavLink>
              <NavLink to="/progress">Progress</NavLink>
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
