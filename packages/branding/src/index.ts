export type Branding = {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  name?: string;
};

export const defaultBranding: Branding = {
  primaryColor: "#0b5fff",
  secondaryColor: "#001a66"
};
