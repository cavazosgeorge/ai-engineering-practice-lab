import { Navigate, Outlet } from "react-router-dom";
import { Box, Spinner, Center } from "@chakra-ui/react";
import { useSession } from "../../lib/auth-client";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Box
        minH="100vh"
        bg="gray.950"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="100vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  // Check for admin role
  if (session.user?.role !== "admin") {
    return <Navigate to="/admin" replace state={{ error: "Admin access required" }} />;
  }

  return <Outlet />;
}
