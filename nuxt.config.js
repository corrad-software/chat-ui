// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  runtimeConfig: {
    public: {
      DIFY_API_KEY: process.env.DIFY_API_KEY,
      DIFY_API_URL: process.env.DIFY_API_URL,
      DIFY_USER_ID: process.env.DIFY_USER_ID,
      AGENT_NAME: process.env.AGENT_NAME,
      AGENT_DESCRIPTION: process.env.AGENT_DESCRIPTION,
    },
  },
  devtools: { enabled: false },
  ssr: false,
  modules: [
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "@nuxtjs/color-mode",
    "@nuxt/fonts",
  ],
  css: ["~/assets/css/index.css"],
  colorMode: {
    preference: "system", // default value of $colorMode.preference
    fallback: "light", // fallback value if not system preference found
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "",
    storageKey: "nuxt-color-mode",
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
});
