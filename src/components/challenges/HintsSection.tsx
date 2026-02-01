import { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Card,
  Collapsible,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";

interface HintsSectionProps {
  hints: string[];
  hintsRevealed: number;
  setHintsRevealed: (n: number) => void;
}

export function HintsSection({
  hints,
  hintsRevealed,
  setHintsRevealed,
}: HintsSectionProps) {
  const [openHints, setOpenHints] = useState<Set<number>>(new Set());

  return (
    <Card.Root bg="gray.900" borderColor="gray.800">
      <Card.Header>
        <HStack gap={2}>
          <Heading size="md" color="white">
            Hints
          </Heading>
          <Text color="gray.500" fontSize="sm">
            {hintsRevealed}/{hints.length}
          </Text>
        </HStack>
      </Card.Header>
      <Card.Body pt={0}>
        <VStack gap={3} align="stretch">
          {hints.map((hint, index) => {
            const isRevealed = index < hintsRevealed;
            const isOpen = openHints.has(index);

            return (
              <Box
                key={index}
                borderRadius="md"
                border="1px solid"
                borderColor={isRevealed ? "cyan.800" : "gray.700"}
                borderLeftWidth="3px"
                borderLeftColor={isRevealed ? "cyan.500" : "gray.600"}
                bg={isRevealed ? "gray.800" : "gray.800/30"}
                overflow="hidden"
                transition="all 0.2s"
              >
                <Collapsible.Root
                  onOpenChange={(details) => {
                    setOpenHints((prev) => {
                      const next = new Set(prev);
                      if (details.open) {
                        next.add(index);
                      } else {
                        next.delete(index);
                      }
                      return next;
                    });
                    if (details.open && index >= hintsRevealed) {
                      setHintsRevealed(index + 1);
                    }
                  }}
                >
                  <Collapsible.Trigger asChild>
                    <HStack
                      p={3}
                      cursor="pointer"
                      width="full"
                      justify="space-between"
                      _hover={{ bg: "whiteAlpha.50" }}
                      _highlighted={{ bg: "whiteAlpha.50" }}
                      _focusVisible={{ outline: "none", boxShadow: "none" }}
                    >
                      <HStack>
                        <Badge
                          colorPalette="cyan"
                          variant="subtle"
                          fontFamily="'JetBrains Mono', monospace"
                          fontSize="xs"
                        >
                          {index + 1}
                        </Badge>
                        <Text color="gray.300" fontSize="sm">
                          {isRevealed ? "Hint" : "Reveal Hint"}
                        </Text>
                      </HStack>
                      <Text color="gray.500" fontSize="xs">
                        {isOpen ? "\u25BC" : "\u25B6"}
                      </Text>
                    </HStack>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <Box
                      borderTop="1px solid"
                      borderTopColor="gray.700"
                      p={4}
                      color="gray.300"
                      css={{
                        "& code": {
                          background: "var(--chakra-colors-gray-700)",
                          padding: "0.2em 0.4em",
                          borderRadius: "4px",
                        },
                      }}
                    >
                      <ReactMarkdown>{hint}</ReactMarkdown>
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            );
          })}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
