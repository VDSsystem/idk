import { NextChakraLink, NextChakraLinkIconButton } from "@app-components/link";
import { ButtonGroup, Container, Stack, Text } from "@app-providers/chakra-ui";

function Footer() {
  const date = new Date().getFullYear();
  return (
    
          <Text>MIT License © {date} Pravasta Caraka Bramastagiri</Text>
        
  );
}

export default Footer;
