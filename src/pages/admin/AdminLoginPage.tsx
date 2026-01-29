import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Card,
  Heading,
  Text,
  VStack,
  Input,
  Button,
  Field,
} from "@chakra-ui/react";
import { LuShield, LuCircleAlert } from "react-icons/lu";
import { signIn, useSession } from "../../lib/auth-client";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check for error message from ProtectedRoute
  useEffect(() => {
    const state = location.state as { error?: string } | null;
    if (state?.error) {
      setError(state.error);
    }
  }, [location.state]);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!isPending && session?.user?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [session, isPending, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login failed");
        setIsLoading(false);
        return;
      }

      // Navigation will happen via useEffect when session updates
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.950" py={20}>
      <Container maxW="sm">
        <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
          <Card.Body p={8}>
            <VStack gap={6}>
              {/* Header */}
              <VStack gap={2}>
                <Box color="cyan.400" fontSize="40px">
                  <LuShield />
                </Box>
                <Heading
                  size="lg"
                  color="white"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  Admin Access
                </Heading>
                <Text color="gray.400" fontSize="sm" textAlign="center">
                  Sign in to manage content
                </Text>
              </VStack>

              {/* Error Message */}
              {error && (
                <Box
                  w="full"
                  p={3}
                  bg="red.900/30"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="red.700/50"
                >
                  <VStack gap={1} align="start">
                    <Box color="red.400" fontSize="16px">
                      <LuCircleAlert />
                    </Box>
                    <Text color="red.300" fontSize="sm">
                      {error}
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack gap={4} w="full">
                  <Field.Root w="full">
                    <Field.Label color="gray.300" fontSize="sm">
                      Email
                    </Field.Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      bg="gray.800"
                      borderColor="gray.700"
                      color="white"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                      required
                    />
                  </Field.Root>

                  <Field.Root w="full">
                    <Field.Label color="gray.300" fontSize="sm">
                      Password
                    </Field.Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      bg="gray.800"
                      borderColor="gray.700"
                      color="white"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                      required
                    />
                  </Field.Root>

                  <Button
                    type="submit"
                    w="full"
                    bg="cyan.600"
                    color="white"
                    _hover={{ bg: "cyan.500" }}
                    loading={isLoading}
                    loadingText="Signing in..."
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
