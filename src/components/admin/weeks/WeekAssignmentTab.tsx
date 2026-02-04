import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  SimpleGrid,
  Spinner,
  Center,
  Text,
  Card,
} from "@chakra-ui/react";
import { useAdminWeeks, useAdminLessons, useUpdateWeek } from "../../../hooks/useAdmin";
import { WeekSelector } from "./WeekSelector";
import { AssignmentPanel } from "./AssignmentPanel";

export function WeekAssignmentTab() {
  const { data: weeks, isLoading: weeksLoading, error: weeksError } = useAdminWeeks();
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useAdminLessons();
  const updateWeekMutation = useUpdateWeek();

  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [pendingLessonIds, setPendingLessonIds] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Clear success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Get current server-side lesson IDs for the selected week
  const currentLessonIds = useMemo(() => {
    if (!lessons || !selectedWeekId) return new Set<string>();
    return new Set(
      lessons.filter((l) => l.weekId === selectedWeekId).map((l) => l.id)
    );
  }, [lessons, selectedWeekId]);

  // Derive isDirty by comparing pending with current server state
  const isDirty = useMemo(() => {
    if (!selectedWeekId) return false;
    if (pendingLessonIds.size !== currentLessonIds.size) return true;
    for (const id of pendingLessonIds) {
      if (!currentLessonIds.has(id)) return true;
    }
    return false;
  }, [selectedWeekId, pendingLessonIds, currentLessonIds]);

  const handleSelectWeek = useCallback((weekId: string) => {
    setSelectedWeekId(weekId);
    // Initialize pending state synchronously to avoid flicker from useEffect
    const lessonIds = new Set(
      (lessons ?? []).filter((l) => l.weekId === weekId).map((l) => l.id)
    );
    setPendingLessonIds(lessonIds);
    setShowSuccess(false);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, [lessons]);

  const handleToggleLesson = useCallback((lessonId: string) => {
    setPendingLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedWeekId) return;
    updateWeekMutation.mutate(
      {
        id: selectedWeekId,
        input: { lessonIds: Array.from(pendingLessonIds) },
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => setShowSuccess(false), 3000);
        },
      }
    );
  }, [selectedWeekId, pendingLessonIds, updateWeekMutation]);

  const handleCancel = useCallback(() => {
    setPendingLessonIds(new Set(currentLessonIds));
  }, [currentLessonIds]);

  const sortedWeeks = useMemo(
    () => [...(weeks ?? [])].sort((a, b) => a.weekNumber - b.weekNumber),
    [weeks]
  );

  // Loading state
  if ((!weeks && weeksLoading) || (!lessons && lessonsLoading)) {
    return (
      <Box
        minH="40vh"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="40vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  // Error state
  if (weeksError || lessonsError) {
    const errorMsg = weeksError instanceof Error
      ? weeksError.message
      : lessonsError instanceof Error
      ? lessonsError.message
      : "Unknown error";
    return (
      <Card.Root bg="red.900/20" borderColor="red.700/50" borderWidth="1px">
        <Card.Body>
          <Text color="red.300">Error loading data: {errorMsg}</Text>
        </Card.Body>
      </Card.Root>
    );
  }

  const selectedWeek = sortedWeeks.find((w) => w.id === selectedWeekId);

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} templateColumns={{ base: "1fr", lg: "280px 1fr" }}>
      {/* Week selector */}
      <Box>
        <WeekSelector
          weeks={sortedWeeks}
          selectedWeekId={selectedWeekId}
          onSelectWeek={handleSelectWeek}
        />
      </Box>

      {/* Assignment panel */}
      <Box>
        {!selectedWeekId ? (
          <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
            <Card.Body py={16}>
              <Center>
                <Text color="gray.500" fontSize="sm">
                  Select a week to manage lesson assignments
                </Text>
              </Center>
            </Card.Body>
          </Card.Root>
        ) : selectedWeek ? (
          <AssignmentPanel
            weekId={selectedWeek.id}
            weekTitle={`Week ${selectedWeek.weekNumber}: ${selectedWeek.title}`}
            allLessons={lessons ?? []}
            weeks={weeks ?? []}
            pendingLessonIds={pendingLessonIds}
            onToggleLesson={handleToggleLesson}
            onSave={handleSave}
            onCancel={handleCancel}
            isDirty={isDirty}
            isSaving={updateWeekMutation.isPending}
            showSuccess={showSuccess}
          />
        ) : null}
      </Box>
    </SimpleGrid>
  );
}
