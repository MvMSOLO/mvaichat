import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.44a9bdd4ced0430bb00d2f7ec25366a7",
  appName: "MV AI",
  webDir: "dist",
  server: {
    url: "https://44a9bdd4-ced0-430b-b00d-2f7ec25366a7.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: { contentInset: "always" },
  android: { backgroundColor: "#0a0a0f" },
};

export default config;
