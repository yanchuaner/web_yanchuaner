export const entranceSystemOrbits = [
  {
    id: "return",
    orbitClass: "orbit-a",
    labelKey: "home.introOrbitReturn",
    descriptionKey: "home.introOrbitReturnDescription",
    duration: "26s",
    delay: "-7s",
    departureDelay: "0ms",
  },
  {
    id: "years",
    orbitClass: "orbit-b",
    labelKey: "home.introOrbitYears",
    descriptionKey: "home.introOrbitYearsDescription",
    duration: "36s",
    delay: "-21s",
    departureDelay: "120ms",
  },
  {
    id: "light",
    orbitClass: "orbit-c",
    labelKey: "home.introOrbitLight",
    descriptionKey: "home.introOrbitLightDescription",
    duration: "48s",
    delay: "-11s",
    departureDelay: "240ms",
  },
] as const;
