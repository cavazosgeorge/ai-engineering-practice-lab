import { memo } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { LuBookOpen } from "react-icons/lu";
import type { AdminLesson } from "../../../services/admin-api";

interface LessonAssignmentRowProps {
  lesson: AdminLesson;
  isSelected: boolean;
  onToggle: (lessonId: string) => void;
  currentWeekLabel?: string;
}

export const LessonAssignmentRow = memo(function LessonAssignmentRow({
  lesson,
  isSelected,
  onToggle,
  currentWeekLabel,
}: LessonAssignmentRowProps) {
  return (
    <Box
      as="button"
      display="block"
      w="full"
      textAlign="left"
      px={4}
      py={3}
      bg={isSelected ? "cyan.950/30" : "transparent"}
      borderLeft="3px solid"
      borderColor={isSelected ? "cyan.400" : "transparent"}
      transition="all 0.15s ease"
      cursor="pointer"
      _hover={{ bg: isSelected ? "cyan.950/40" : "gray.800/60" }}
      _focusVisible={{ outline: "none", boxShadow: "none" }}
      onClick={() => onToggle(lesson.id)}
    >
      <HStack gap={3} align="center">
        {/* Checkbox */}
        <Box
          w="18px"
          h="18px"
          borderRadius="sm"
          border="2px solid"
          borderColor={isSelected ? "cyan.400" : "gray.600"}
          bg={isSelected ? "cyan.400" : "transparent"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          transition="all 0.15s ease"
        >
          {isSelected && (
            <svg
              viewBox="0 0 12 12"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--chakra-colors-gray-950)" }}
            >
              <polyline points="2 6 5 9 10 3" />
            </svg>
          )}
        </Box>

        {/* Lesson icon */}
        <Box color={isSelected ? "cyan.400" : "gray.500"} fontSize="14px" flexShrink={0}>
          <LuBookOpen />
        </Box>

        {/* Lesson info */}
        <Box flex="1" minW={0}>
          <Text
            color={isSelected ? "white" : "gray.300"}
            fontSize="sm"
            fontWeight="medium"
            lineClamp={1}
          >
            {lesson.title}
          </Text>
          <HStack gap={2} mt={0.5}>
            <Text
              color="gray.500"
              fontSize="xs"
              fontFamily="'JetBrains Mono', monospace"
            >
              {lesson.termCount} terms
            </Text>
            {currentWeekLabel && (
              <Text
                color="yellow.500"
                fontSize="xs"
                fontFamily="'JetBrains Mono', monospace"
              >
                {currentWeekLabel}
              </Text>
            )}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
});
