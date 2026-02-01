import { useNavigate, Outlet, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  Text,
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
  MenuContent,
  MenuItem,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { LuArrowLeft, LuLogOut, LuChevronDown, LuUser, LuSparkles, LuLayoutDashboard } from "react-icons/lu";
import { signOut, useSession } from "../../lib/auth-client";

export function AdminLayout() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin");
  };

  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "";

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
            <MenuRoot positioning={{ placement: "bottom-end" }}>
              <MenuTrigger asChild>
                <Box
                  as="button"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  color="gray.400"
                  transition="color 0.2s"
                  cursor="pointer"
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: "gray.600", color: "white" }}
                  _focusVisible={{ outline: "none", boxShadow: "none" }}
                >
                  <Box
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg="cyan.600/20"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="cyan.400"
                    fontSize="14px"
                    flexShrink={0}
                  >
                    <LuUser />
                  </Box>
                  <Text fontSize="sm" fontWeight="medium">
                    {userName}
                  </Text>
                  <Box fontSize="14px">
                    <LuChevronDown />
                  </Box>
                </Box>
              </MenuTrigger>
              <MenuPositioner>
                <MenuContent
                  bg="gray.900"
                  borderColor="gray.700"
                  borderWidth="1px"
                  minW="240px"
                  py={0}
                  overflow="hidden"
                >
                  <Box px={4} py={3} bg="gray.800/50">
                    <HStack gap={3}>
                      <Box
                        w="36px"
                        h="36px"
                        borderRadius="full"
                        bg="cyan.600/20"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="cyan.400"
                        fontSize="16px"
                        flexShrink={0}
                      >
                        <LuUser />
                      </Box>
                      <Box>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="white"
                        >
                          {userName}
                        </Text>
                        {userEmail && (
                          <Text fontSize="xs" color="gray.400">
                            {userEmail}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                    <Box
                      mt={2}
                      display="inline-block"
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                      bg="cyan.600/15"
                      fontSize="xs"
                      fontWeight="medium"
                      color="cyan.300"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      admin
                    </Box>
                  </Box>
                  <Box borderBottom="1px solid" borderColor="gray.700" />
                  <Box py={1}>
                    <MenuItem
                      value="back-to-app"
                      fontSize="sm"
                      color="gray.300"
                      bg="transparent"
                      _hover={{ bg: "gray.800", color: "white" }}
                      _highlighted={{ bg: "gray.800", color: "white" }}
                      cursor="pointer"
                      onClick={() => navigate("/")}
                    >
                      <Box fontSize="16px" mr={2}>
                        <LuArrowLeft />
                      </Box>
                      Back to App
                    </MenuItem>
                    <MenuItem
                      value="logout"
                      fontSize="sm"
                      color="gray.300"
                      bg="transparent"
                      _hover={{ bg: "gray.800", color: "white" }}
                      _highlighted={{ bg: "gray.800", color: "white" }}
                      cursor="pointer"
                      onClick={handleLogout}
                    >
                      <Box fontSize="16px" mr={2}>
                        <LuLogOut />
                      </Box>
                      Logout
                    </MenuItem>
                  </Box>
                </MenuContent>
              </MenuPositioner>
            </MenuRoot>
          </Flex>
        </Container>
      </Box>
      <Box borderBottom="1px solid" borderColor="gray.800">
        <Container maxW="container.xl">
          <HStack gap={1} py={2}>
            {[
              { to: "/admin/dashboard", label: "Dashboard", icon: <LuLayoutDashboard /> },
              { to: "/admin/generation", label: "AI Generation", icon: <LuSparkles /> },
            ].map((link) => {
              const isActive = location.pathname === link.to ||
                (link.to === "/admin/dashboard" && location.pathname.startsWith("/admin/dashboard"));
              return (
                <RouterLink key={link.to} to={link.to}>
                  <HStack
                    gap={1.5}
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight="medium"
                    color={isActive ? "cyan.400" : "gray.500"}
                    bg={isActive ? "cyan.400/10" : "transparent"}
                    transition="all 0.15s ease"
                    _hover={{ color: isActive ? "cyan.400" : "gray.300", bg: isActive ? "cyan.400/10" : "gray.800" }}
                  >
                    <Box fontSize="14px">{link.icon}</Box>
                    <Text>{link.label}</Text>
                  </HStack>
                </RouterLink>
              );
            })}
          </HStack>
        </Container>
      </Box>
      <Box as="main">
        <Outlet />
      </Box>
    </Box>
  );
}
