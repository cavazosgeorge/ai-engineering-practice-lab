import { useCallback } from "react";
import { Box, Container, Flex, Heading, HStack } from "@chakra-ui/react";
import { Link as RouterLink, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { fetchLessons, fetchProgress } from "../../services/api";
import { progressKeys } from "../../hooks/useProgress";

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
  const queryClient = useQueryClient();

  // Prefetch dashboard data on hover for instant navigation
  const handleHomeHover = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: progressKeys.lessons(),
      queryFn: fetchLessons,
    });
    queryClient.prefetchQuery({
      queryKey: progressKeys.stats(),
      queryFn: async () => {
        const progressData = await fetchProgress();
        const completedChallenges = new Set(
          progressData.progress.map((p) => p.challengeId)
        );
        return { stats: progressData.stats, completedChallenges };
      },
    });
  }, [queryClient]);

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
            <RouterLink to="/" onMouseEnter={handleHomeHover}>
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
