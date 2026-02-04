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
} from "@chakra-ui/react";
import { LuCircleAlert } from "react-icons/lu";
import { useAdminWeeks, useUpdateWeek } from "../../hooks/useAdmin";
import type { AdminWeek } from "../../services/admin-api";

interface FormData {
  weekNumber: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface FormErrors {
  weekNumber?: string;
  title?: string;
  slug?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================
// Outer component: handles data loading
// ============================================

export function WeekFormPage() {
  const { weekId } = useParams<{ weekId: string }>();
  const { data: weeks, isLoading } = useAdminWeeks();

  const existingWeek = weeks?.find((w) => w.id === weekId);

  if ((!weeks && isLoading) || (weekId && !existingWeek)) {
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

  return <WeekForm existingWeek={existingWeek} weekId={weekId} />;
}

// ============================================
// Edit wrapper: re-mounts on weekId change
// ============================================

export function WeekFormEdit() {
  const { weekId } = useParams();
  return <WeekFormPage key={weekId} />;
}

// ============================================
// Inner component: form with guaranteed data
// ============================================

interface WeekFormProps {
  existingWeek?: AdminWeek;
  weekId?: string;
}

function WeekForm({ existingWeek, weekId }: WeekFormProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateWeek();
  const isEditMode = !!weekId;

  const [formData, setFormData] = useState<FormData>(() => ({
    weekNumber: existingWeek?.weekNumber?.toString() ?? "",
    title: existingWeek?.title ?? "",
    slug: existingWeek?.slug ?? "",
    description: existingWeek?.description ?? "",
    startDate: existingWeek?.startDate ?? "",
    endDate: existingWeek?.endDate ?? "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState("");

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case "weekNumber":
        if (!value) return "Week number is required";
        if (isNaN(Number(value)) || Number(value) < 1) return "Must be a positive number";
        break;
      case "title":
        if (!value.trim()) return "Title is required";
        if (value.trim().length < 2) return "Title must be at least 2 characters";
        break;
      case "slug":
        if (!value.trim()) return "Slug is required";
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim()))
          return "Slug must be lowercase letters, numbers, and hyphens";
        break;
    }
    return undefined;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-generate slug from title when creating (only if slug hasn't been manually edited)
      if (name === "title" && !isEditMode && !touched.slug) {
        next.slug = slugify(value);
      }
      return next;
    });

    if (touched[name]) {
      const error = validateField(name as keyof FormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof FormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    (["weekNumber", "title", "slug"] as const).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setTouched({ weekNumber: true, title: true, slug: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    try {
      if (isEditMode && weekId) {
        await updateMutation.mutateAsync({
          id: weekId,
          input: {
            weekNumber: Number(formData.weekNumber),
            title: formData.title.trim(),
            slug: formData.slug.trim(),
            description: formData.description.trim() || null,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
          },
        });
      }
      navigate("/admin/dashboard?tab=weeks");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const isSaving = updateMutation.isPending;

  return (
    <Container maxW="container.md" py={12}>
      <VStack gap={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading
            size="2xl"
            color="white"
            mb={2}
            fontFamily="'JetBrains Mono', monospace"
          >
            {isEditMode ? "Edit Week" : "Add Week"}
          </Heading>
          <Text color="gray.400" fontSize="lg">
            {isEditMode
              ? "Update the week details below"
              : "Fill in the details to create a new week"}
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

                {/* Week Number */}
                <Field.Root invalid={!!errors.weekNumber && touched.weekNumber}>
                  <Field.Label color="gray.300" fontSize="sm">
                    Week Number *
                  </Field.Label>
                  <Input
                    name="weekNumber"
                    type="number"
                    value={formData.weekNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., 1"
                    min={1}
                    bg="gray.800"
                    borderColor={errors.weekNumber && touched.weekNumber ? "red.500" : "gray.700"}
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                    _focusVisible={{ outline: "none", boxShadow: "none" }}
                  />
                  {errors.weekNumber && touched.weekNumber && (
                    <Field.ErrorText color="red.400" fontSize="xs">
                      {errors.weekNumber}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Title */}
                <Field.Root invalid={!!errors.title && touched.title}>
                  <Field.Label color="gray.300" fontSize="sm">
                    Title *
                  </Field.Label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Tokenization & Text Processing"
                    bg="gray.800"
                    borderColor={errors.title && touched.title ? "red.500" : "gray.700"}
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                    _focusVisible={{ outline: "none", boxShadow: "none" }}
                  />
                  {errors.title && touched.title && (
                    <Field.ErrorText color="red.400" fontSize="xs">
                      {errors.title}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Slug */}
                <Field.Root invalid={!!errors.slug && touched.slug}>
                  <Field.Label color="gray.300" fontSize="sm">
                    Slug *
                  </Field.Label>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., tokenization-text-processing"
                    bg="gray.800"
                    borderColor={errors.slug && touched.slug ? "red.500" : "gray.700"}
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                    _focusVisible={{ outline: "none", boxShadow: "none" }}
                  />
                  <Field.HelperText color="gray.500" fontSize="xs">
                    URL-friendly identifier. Auto-generated from title on create.
                  </Field.HelperText>
                  {errors.slug && touched.slug && (
                    <Field.ErrorText color="red.400" fontSize="xs">
                      {errors.slug}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                {/* Description */}
                <Field.Root>
                  <Field.Label color="gray.300" fontSize="sm">
                    Description (Optional)
                  </Field.Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the week's content..."
                    rows={3}
                    bg="gray.800"
                    borderColor="gray.700"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                    _focusVisible={{ outline: "none", boxShadow: "none" }}
                  />
                </Field.Root>

                {/* Date fields */}
                <HStack gap={4} align="start">
                  <Field.Root flex="1">
                    <Field.Label color="gray.300" fontSize="sm">
                      Start Date (Optional)
                    </Field.Label>
                    <Input
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      bg="gray.800"
                      borderColor="gray.700"
                      color="white"
                      _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                      _focusVisible={{ outline: "none", boxShadow: "none" }}
                      css={{ colorScheme: "dark" }}
                    />
                  </Field.Root>
                  <Field.Root flex="1">
                    <Field.Label color="gray.300" fontSize="sm">
                      End Date (Optional)
                    </Field.Label>
                    <Input
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      bg="gray.800"
                      borderColor="gray.700"
                      color="white"
                      _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
                      _focusVisible={{ outline: "none", boxShadow: "none" }}
                      css={{ colorScheme: "dark" }}
                    />
                  </Field.Root>
                </HStack>

                {/* Actions */}
                <HStack gap={3} justify="flex-end" pt={4}>
                  <Button
                    type="button"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white", bg: "gray.800" }}
                    onClick={() => navigate("/admin/dashboard?tab=weeks")}
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
                    loadingText="Saving..."
                  >
                    {isEditMode ? "Save Changes" : "Create Week"}
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
