import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Input,
  Textarea,
  Button,
  Field,
  Spinner,
  Center,
  NativeSelect,
} from "@chakra-ui/react";
import { LuCircleAlert } from "react-icons/lu";
import {
  useAdminLessons,
  useAdminVocabularyTerm,
  useCreateVocabularyTerm,
  useUpdateVocabularyTerm,
} from "../../hooks/useAdmin";

interface FormData {
  lesson_id: string;
  term: string;
  definition: string;
  context: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface FormErrors {
  lesson_id?: string;
  term?: string;
  definition?: string;
}

export function VocabularyFormPage() {
  const { termId } = useParams<{ termId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!termId;

  const { data: lessons, isLoading: lessonsLoading } = useAdminLessons();
  const { data: existingTerm } = useAdminVocabularyTerm(
    termId || ""
  );
  const createMutation = useCreateVocabularyTerm();
  const updateMutation = useUpdateVocabularyTerm();

  const [formData, setFormData] = useState<FormData>(() => ({
    lesson_id: existingTerm?.lesson_id ?? "",
    term: existingTerm?.term ?? "",
    definition: existingTerm?.definition ?? "",
    context: existingTerm?.context ?? "",
    difficulty: existingTerm?.difficulty ?? "beginner",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState("");

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case "lesson_id":
        if (!value) return "Lesson is required";
        break;
      case "term":
        if (!value.trim()) return "Term is required";
        if (value.trim().length < 2) return "Term must be at least 2 characters";
        break;
      case "definition":
        if (!value.trim()) return "Definition is required";
        if (value.trim().length < 10) return "Definition must be at least 10 characters";
        break;
    }
    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when typing
    if (touched[name]) {
      const error = validateField(name as keyof FormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof FormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    (["lesson_id", "term", "definition"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setTouched({ lesson_id: true, term: true, definition: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      if (isEditMode && termId) {
        await updateMutation.mutateAsync({
          id: termId,
          input: {
            term: formData.term.trim(),
            definition: formData.definition.trim(),
            context: formData.context.trim() || undefined,
            difficulty: formData.difficulty,
          },
        });
      } else {
        await createMutation.mutateAsync({
          lesson_id: formData.lesson_id,
          term: formData.term.trim(),
          definition: formData.definition.trim(),
          context: formData.context.trim() || undefined,
          difficulty: formData.difficulty,
        });
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!lessons && lessonsLoading) {
    return (
      <Box
        minH="60vh"
        opacity={0}
        animation="fadeIn 0.2s ease-in 0.2s forwards"
        css={{ "@keyframes fadeIn": { to: { opacity: 1 } } }}
      >
        <Center h="60vh">
          <Spinner size="xl" color="cyan.400" />
        </Center>
      </Box>
    );
  }

  return (
    <Container maxW="container.md" py={12}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading
            size="xl"
            color="white"
            mb={2}
            fontFamily="'JetBrains Mono', monospace"
          >
            {isEditMode ? "Edit Vocabulary Term" : "Add Vocabulary Term"}
          </Heading>
          <Text color="gray.400">
            {isEditMode
              ? "Update the term details below"
              : "Fill in the details to create a new vocabulary term"}
          </Text>
        </Box>

        {/* Form */}
        <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px">
          <Card.Body p={6}>
            <form onSubmit={handleSubmit}>
              <VStack gap={6} align="stretch">
                {/* Submit Error */}
                {submitError && (
                  <Box
                    p={3}
                    bg="red.900/30"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="red.700/50"
                  >
                    <HStack gap={2}>
                      <Box color="red.400">
                        <LuCircleAlert />
                      </Box>
                      <Text color="red.300" fontSize="sm">
                        {submitError}
                      </Text>
                    </HStack>
                  </Box>
                )}

                {/* Lesson Select */}
                <Field.Root invalid={!!errors.lesson_id && touched.lesson_id} disabled={isEditMode}>
                  <Field.Label color="gray.300" fontSize="sm">
                    Lesson *
                  </Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      name="lesson_id"
                      value={formData.lesson_id}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      bg="gray.800"
                      borderColor={errors.lesson_id && touched.lesson_id ? "red.500" : "gray.700"}
                      color="white"
                    >
                      <option value="">Select a lesson</option>
                      {(lessons ?? []).map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                  {errors.lesson_id && touched.lesson_id && (
                    <Field.ErrorText color="red.400" fontSize="xs">
                      {errors.lesson_id}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Term Input */}
                <Field.Root invalid={!!errors.term && touched.term}>
                  <Field.Label color="gray.300" fontSize="sm">
                    Term *
                  </Field.Label>
                  <Input
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Transformer"
                    bg="gray.800"
                    borderColor={errors.term && touched.term ? "red.500" : "gray.700"}
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                  />
                  {errors.term && touched.term && (
                    <Field.ErrorText color="red.400" fontSize="xs">
                      {errors.term}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Definition Textarea */}
                <Field.Root invalid={!!errors.definition && touched.definition}>
                  <Field.Label color="gray.300" fontSize="sm">
                    Definition *
                  </Field.Label>
                  <Textarea
                    name="definition"
                    value={formData.definition}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Provide a clear, concise definition..."
                    rows={4}
                    bg="gray.800"
                    borderColor={errors.definition && touched.definition ? "red.500" : "gray.700"}
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                  />
                  {errors.definition && touched.definition && (
                    <Field.ErrorText color="red.400" fontSize="xs">
                      {errors.definition}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Context Textarea */}
                <Field.Root>
                  <Field.Label color="gray.300" fontSize="sm">
                    Context (Optional)
                  </Field.Label>
                  <Textarea
                    name="context"
                    value={formData.context}
                    onChange={handleChange}
                    placeholder="Provide additional context or examples..."
                    rows={3}
                    bg="gray.800"
                    borderColor="gray.700"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                  />
                  <Field.HelperText color="gray.500" fontSize="xs">
                    Optional context to help learners understand the term better
                  </Field.HelperText>
                </Field.Root>

                {/* Difficulty Select */}
                <Field.Root>
                  <Field.Label color="gray.300" fontSize="sm">
                    Difficulty
                  </Field.Label>
                  <HStack gap={3}>
                    {(["beginner", "intermediate", "advanced"] as const).map(
                      (level) => {
                        const isSelected = formData.difficulty === level;
                        return (
                          <Box
                            key={level}
                            as="button"
                            type="button"
                            px={4}
                            py={2}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={isSelected ? "cyan.500" : "gray.700"}
                            bg={isSelected ? "gray.700" : "gray.800"}
                            color="white"
                            fontSize="sm"
                            fontWeight="medium"
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{ bg: "gray.700", borderColor: "gray.600" }}
                            onClick={() =>
                              setFormData((prev) => ({ ...prev, difficulty: level }))
                            }
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Box>
                        );
                      }
                    )}
                  </HStack>
                </Field.Root>

                {/* Actions */}
                <HStack gap={3} justify="flex-end" pt={4}>
                  <Button
                    type="button"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white", bg: "gray.800" }}
                    onClick={() => navigate("/admin/dashboard")}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    bg="cyan.600"
                    color="white"
                    _hover={{ bg: "cyan.500" }}
                    loading={isSaving}
                    loadingText={isEditMode ? "Saving..." : "Creating..."}
                  >
                    {isEditMode ? "Save Changes" : "Create Term"}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
