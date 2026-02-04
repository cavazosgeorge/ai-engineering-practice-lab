import { Box, VStack, Text, HStack } from "@chakra-ui/react";
import { LuCalendar, LuBookOpen } from "react-icons/lu";
import type { AdminWeek } from "../../../services/admin-api";

interface WeekSelectorProps {
  weeks: AdminWeek[];
  selectedWeekId: string | null;
  onSelectWeek: (weekId: string) => void;
}

export function WeekSelector({ weeks, selectedWeekId, onSelectWeek }: WeekSelectorProps) {
  return (
    <VStack gap={2} align="stretch">
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="gray.400"
        letterSpacing="0.08em"
        textTransform="uppercase"
        fontFamily="'JetBrains Mono', monospace"
        px={1}
        mb={1}
      >
        Select Week
      </Text>

      {weeks.map((week) => {
        const isSelected = week.id === selectedWeekId;

        return (
          <Box
            key={week.id}
            as="button"
            display="block"
            w="full"
            textAlign="left"
            px={4}
            py={3}
            bg={isSelected ? "gray.800" : "gray.900"}
            borderRadius="lg"
            border="1px solid"
            borderColor={isSelected ? "cyan.500" : "gray.800"}
            transition="all 0.15s ease"
            cursor="pointer"
            _hover={{ bg: isSelected ? "gray.800" : "gray.800/60", borderColor: isSelected ? "cyan.500" : "gray.700" }}
            _focusVisible={{ outline: "none", boxShadow: "none" }}
            onClick={() => onSelectWeek(week.id)}
          >
            <HStack gap={3} align="start">
              <Box
                color={isSelected ? "cyan.400" : "gray.500"}
                fontSize="16px"
                mt={0.5}
                flexShrink={0}
              >
                <LuCalendar />
              </Box>
              <Box flex="1" minW={0}>
                <Text
                  color={isSelected ? "white" : "gray.300"}
                  fontSize="sm"
                  fontWeight="medium"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  Week {week.weekNumber}
                </Text>
                <Text
                  color={isSelected ? "gray.300" : "gray.500"}
                  fontSize="xs"
                  lineClamp={1}
                  mt={0.5}
                >
                  {week.title}
                </Text>
                <HStack gap={1} mt={1.5}>
                  <Box color="gray.500" fontSize="11px">
                    <LuBookOpen />
                  </Box>
                  <Text
                    color="gray.500"
                    fontSize="xs"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {week.lessonCount} lesson{week.lessonCount !== 1 ? "s" : ""}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
}
