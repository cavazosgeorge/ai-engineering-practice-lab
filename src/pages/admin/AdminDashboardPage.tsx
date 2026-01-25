import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Card,
  Spinner,
  Center,
} from "@chakra-ui/react";
import {
  LuBookOpen,
  LuFileText,
  LuBrain,
  LuPlus,
  LuList,
} from "react-icons/lu";
import { useAdminStats } from "../../hooks/useAdmin";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
      <Card.Body>
        <VStack align="start" gap={3}>
          <Box fontSize="24px" color={color}>
            {icon}
          </Box>
          <Box>
            <Text color="gray.400" fontSize="sm">
              {label}
            </Text>
            <Text color="white" fontSize="3xl" fontWeight="bold">
              {value}
            </Text>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  color: string;
}

function ActionCard({ title, description, icon, to, color }: ActionCardProps) {
  return (
    <RouterLink to={to}>
      <Card.Root
        bg="gray.900"
        borderColor="gray.800"
        borderWidth="1px"
        _hover={{
          borderColor: "cyan.700",
          transform: "translateY(-2px)",
        }}
        transition="all 0.2s"
        cursor="pointer"
      >
        <Card.Body>
          <VStack align="start" gap={3}>
            <Box fontSize="24px" color={color}>
              {icon}
            </Box>
            <Box>
              <Heading size="sm" color="white" mb={1}>
                {title}
              </Heading>
              <Text color="gray.400" fontSize="sm">
                {description}
              </Text>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </RouterLink>
  );
}

export function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) {
    return (
      <Box minH="60vh">
        <Center h="60vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={12}>
        <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
          <Card.Body>
            <Text color="red.300">
              Error loading stats: {error instanceof Error ? error.message : "Unknown error"}
            </Text>
          </Card.Body>
        </Card.Root>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={12}>
      <VStack gap={10} align="stretch">
        {/* Header */}
        <Box>
          <Heading
            size="xl"
            color="white"
            mb={2}
            fontFamily="'JetBrains Mono', monospace"
          >
            Admin Dashboard
          </Heading>
          <Text color="gray.400">
            Manage content and monitor statistics
          </Text>
        </Box>

        {/* Stats Cards */}
        <Box>
          <Heading size="md" color="white" mb={4}>
            Overview
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <StatCard
              label="Total Lessons"
              value={stats?.lessonCount ?? 0}
              icon={<LuBookOpen />}
              color="cyan.400"
            />
            <StatCard
              label="Vocabulary Terms"
              value={stats?.vocabularyCount ?? 0}
              icon={<LuFileText />}
              color="green.400"
            />
            <StatCard
              label="Challenges"
              value={stats?.challengeCount ?? 0}
              icon={<LuBrain />}
              color="purple.400"
            />
          </SimpleGrid>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Heading size="md" color="white" mb={4}>
            Quick Actions
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <ActionCard
              title="Add Vocabulary Term"
              description="Create a new vocabulary term for any lesson"
              icon={<LuPlus />}
              to="/admin/vocabulary/new"
              color="green.400"
            />
            <ActionCard
              title="Manage Vocabulary"
              description="View, edit, or delete existing vocabulary terms"
              icon={<LuList />}
              to="/admin/vocabulary"
              color="cyan.400"
            />
          </SimpleGrid>
        </Box>
      </VStack>
    </Container>
  );
}
