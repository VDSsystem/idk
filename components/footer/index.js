import { NextChakraLink, NextChakraLinkIconButton } from "@app-components/link";
import { ButtonGroup, Container, Stack, Text } from "@app-providers/chakra-ui";
const footerSocials = [
  {
    name: "Email",
    href: "mailto:hello@pravastacaraka.my.id",
    icon: FaEnvelope,
  },
  {
    name: "Github",
    href: "https://github.com/pravastacaraka",
    icon: FaGithub,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/in/pravastacaraka",
    icon: FaLinkedinIn,
  },
  {
    name: "Facebook",
    href: "https://facebook.com/pravastacaraka",
    icon: FaFacebook,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/pravastacaraka",
    icon: FaTwitter,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/pravastacaraka",
    icon: FaInstagram,
  },
];

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
