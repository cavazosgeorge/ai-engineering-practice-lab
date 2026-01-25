import { useNavigate, useLocation, Outlet, Link as RouterLink } from "react-router-dom";
import { Box, Container, Flex, HStack, Text, Button } from "@chakra-ui/react";
import { LuShield, LuArrowLeft, LuLogOut } from "react-icons/lu";
import { signOut } from "../../lib/auth-client";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <RouterLink to={to}>
      <Box
        color={isActive ? "cyan.400" : "gray.400"}
        _hover={{ color: isActive ? "cyan.300" : "white" }}
        fontSize="sm"
        fontWeight="medium"
        transition="color 0.2s"
        position="relative"
        py={2}
        _after={
          isActive
            ? {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "2px",
                bg: "cyan.400",
                borderRadius: "full",
              }
            : undefined
        }
      >
        {children}
      </Box>
    </RouterLink>
  );
}

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
            {/* Left: Admin branding + Back to App */}
            <HStack gap={6}>
              <HStack gap={2}>
                <Box color="cyan.400" fontSize="20px">
                  <LuShield />
                </Box>
                <Text
                  fontWeight="bold"
                  color="white"
                  fontSize="lg"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  Admin
                </Text>
              </HStack>
              <RouterLink to="/">
                <HStack
                  gap={1}
                  color="gray.500"
                  _hover={{ color: "gray.300" }}
                  transition="color 0.2s"
                  fontSize="sm"
                >
                  <Box fontSize="16px">
                    <LuArrowLeft />
                  </Box>
                  <Text>Back to App</Text>
                </HStack>
              </RouterLink>
            </HStack>

            {/* Center: Navigation */}
            <HStack gap={6}>
              <NavLink to="/admin/dashboard">Dashboard</NavLink>
              <NavLink to="/admin/vocabulary">Vocabulary</NavLink>
            </HStack>

            {/* Right: Logout */}
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
          </Flex>
        </Container>
      </Box>
      <Box as="main">
        <Outlet />
      </Box>
    </Box>
  );
}
