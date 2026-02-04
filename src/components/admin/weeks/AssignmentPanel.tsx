import { Box, Heading, HStack, VStack, Text, Button, SimpleGrid } from "@chakra-ui/react";
import { LuSave, LuX } from "react-icons/lu";
import type { AdminLesson, AdminWeek } from "../../../services/admin-api";
import { LessonAssignmentRow } from "./LessonAssignmentRow";

interface AssignmentPanelProps {
  weekId: string;
  weekTitle: string;
  allLessons: AdminLesson[];
  weeks: AdminWeek[];
  pendingLessonIds: Set<string>;
  onToggleLesson: (lessonId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isDirty: boolean;
  isSaving: boolean;
}

export function AssignmentPanel({
  weekId,
  weekTitle,
  allLessons,
  weeks,
  pendingLessonIds,
  onToggleLesson,
  onSave,
  onCancel,
  isDirty,
  isSaving,
}: AssignmentPanelProps) {
  // Build a map of weekId -> week label for showing current assignments
  const weekLabelMap = new Map<string, string>();
  for (const w of weeks) {
    weekLabelMap.set(w.id, `Week ${w.weekNumber}`);
  }

  // Split lessons into available (not assigned to this week) and assigned (in pending set)
  const assignedLessons = allLessons.filter((l) => pendingLessonIds.has(l.id));
  const availableLessons = allLessons.filter((l) => !pendingLessonIds.has(l.id));

  function getWeekLabel(lesson: AdminLesson): string | undefined {
    if (!lesson.weekId || lesson.weekId === weekId) return undefined;
    return weekLabelMap.get(lesson.weekId);
  }

  return (
    <VStack gap={4} align="stretch" flex="1">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <Heading size="md" color="white">
          Assign Lessons to{" "}
          <Text as="span" color="cyan.400">
            {weekTitle}
          </Text>
        </Heading>
      </HStack>

      {/* Dual-list columns */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* Available Lessons */}
        <Box
          bg="gray.900"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.800"
          overflow="hidden"
        >
          <Box
            px={4}
            py={3}
            bg="gray.800/60"
            borderBottom="1px solid"
            borderColor="gray.800"
          >
            <HStack justify="space-between">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="gray.400"
                letterSpacing="0.08em"
                textTransform="uppercase"
                fontFamily="'JetBrains Mono', monospace"
              >
                Available Lessons
              </Text>
              <Text
                fontSize="xs"
                color="gray.500"
                fontFamily="'JetBrains Mono', monospace"
              >
                {availableLessons.length}
              </Text>
            </HStack>
          </Box>
          <Box overflowY="auto" maxH="60vh">
            {availableLessons.length === 0 ? (
              <Box px={4} py={8}>
                <Text color="gray.500" fontSize="sm" textAlign="center">
                  All lessons are assigned to this week
                </Text>
              </Box>
            ) : (
              availableLessons.map((lesson, idx) => (
                <Box
                  key={lesson.id}
                  borderBottom={idx < availableLessons.length - 1 ? "1px solid" : "none"}
                  borderColor="gray.800/60"
                >
                  <LessonAssignmentRow
                    lesson={lesson}
                    isSelected={false}
                    onToggle={onToggleLesson}
                    currentWeekLabel={getWeekLabel(lesson)}
                  />
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* Assigned Lessons */}
        <Box
          bg="gray.900"
          borderRadius="lg"
          border="1px solid"
          borderColor={assignedLessons.length > 0 ? "cyan.900/50" : "gray.800"}
          overflow="hidden"
        >
          <Box
            px={4}
            py={3}
            bg="cyan.950/20"
            borderBottom="1px solid"
            borderColor="gray.800"
          >
            <HStack justify="space-between">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="cyan.400"
                letterSpacing="0.08em"
                textTransform="uppercase"
                fontFamily="'JetBrains Mono', monospace"
              >
                Assigned Lessons
              </Text>
              <Text
                fontSize="xs"
                color="cyan.500"
                fontFamily="'JetBrains Mono', monospace"
              >
                {assignedLessons.length}
              </Text>
            </HStack>
          </Box>
          <Box overflowY="auto" maxH="60vh">
            {assignedLessons.length === 0 ? (
              <Box px={4} py={8}>
                <Text color="gray.500" fontSize="sm" textAlign="center">
                  Click lessons on the left to assign them
                </Text>
              </Box>
            ) : (
              assignedLessons.map((lesson, idx) => (
                <Box
                  key={lesson.id}
                  borderBottom={idx < assignedLessons.length - 1 ? "1px solid" : "none"}
                  borderColor="gray.800/60"
                >
                  <LessonAssignmentRow
                    lesson={lesson}
                    isSelected={true}
                    onToggle={onToggleLesson}
                  />
                </Box>
              ))
            )}
          </Box>
        </Box>
      </SimpleGrid>

      {/* Action bar */}
      <HStack justify="flex-end" gap={3} pt={2}>
        <Button
          variant="ghost"
          color="gray.400"
          _hover={{ color: "white", bg: "gray.800" }}
          _focusVisible={{ outline: "none", boxShadow: "none" }}
          onClick={onCancel}
          disabled={!isDirty || isSaving}
          size="sm"
        >
          <Box fontSize="14px" mr={1.5}>
            <LuX />
          </Box>
          Cancel
        </Button>
        <Button
          bg="cyan.600"
          color="white"
          _hover={{ bg: "cyan.500" }}
          _focusVisible={{ outline: "none", boxShadow: "none" }}
          onClick={onSave}
          disabled={!isDirty}
          loading={isSaving}
          loadingText="Saving..."
          size="sm"
        >
          <Box fontSize="14px" mr={1.5}>
            <LuSave />
          </Box>
          Save Assignments
        </Button>
      </HStack>
    </VStack>
  );
}
