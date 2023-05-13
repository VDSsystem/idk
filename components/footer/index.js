import { NextChakraLink, NextChakraLinkIconButton } from "@app-components/link";
import { ButtonGroup, Container, Stack, Text } from "@app-providers/chakra-ui";
function Footer() {
  const date = new Date().getFullYear();
  return (
    <Container as="footer" py={8}>
      <Stack align="center" textAlign="center">
        
          <Text>MIT License © {date} Pravasta Caraka Bramastagiri</Text>
        </Stack>
    </Container>
  );
}

export default Footer;
