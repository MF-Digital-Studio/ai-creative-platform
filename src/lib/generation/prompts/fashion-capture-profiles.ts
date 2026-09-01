export const fashionCaptureProfileIds = [
  "editorial_flash",
  "natural_editorial_daylight",
  "soft_studio_fashion",
  "urban_night_flash",
] as const;

export type FashionCaptureProfileId = (typeof fashionCaptureProfileIds)[number];

export type PhotographyCapture = {
  profile: FashionCaptureProfileId;
  captureStyle: string;
  focalLength: string;
  cameraDistance: string;
  lightingCharacter: string;
  flashBehavior: string;
  ambientExposure: string;
  depthOfField: string;
  imageTexture: string;
  grain: string;
  dynamicRange: string;
  skinTreatment: string;
  retouchingLevel: string;
  realismConstraints: string;
};

export const fashionCaptureProfiles: Record<FashionCaptureProfileId, PhotographyCapture> = {
  editorial_flash: {
    profile: "editorial_flash",
    captureStyle: "Raw professional streetwear editorial photography with candid, slightly imperfect campaign framing.",
    focalLength: "A natural 35mm to 50mm perspective with medium-to-full fashion framing.",
    cameraDistance: "Photograph from a believable nearby editorial distance that keeps the garment and body proportions natural.",
    lightingCharacter: "Direct on-camera flash gives the subject crisp, honest definition while the real environment stays visible.",
    flashBehavior: "Use a single direct on-camera flash with realistic falloff, not a beauty-light or polished multi-light setup.",
    ambientExposure: "Expose the ambient city or lifestyle background about one stop darker than the flashed subject.",
    depthOfField: "Use modest, optically believable depth of field; keep the garment and face naturally readable.",
    imageTexture: "Retain authentic street and surface texture with a raw professional campaign finish.",
    grain: "Add subtle realistic fine grain, never simulated noise or excessive sharpening.",
    dynamicRange: "Keep natural highlight rolloff and grounded shadows without artificial HDR compression.",
    skinTreatment: "Show natural skin texture, pores, small tonal variation, believable hair strands, and subtle facial asymmetry.",
    retouchingLevel: "Use restrained editorial retouching only; avoid poreless beauty treatment.",
    realismConstraints: "The result must read as a real streetwear campaign photograph, never CGI, a 3D render, a fashion mockup, or an over-polished studio composite.",
  },
  natural_editorial_daylight: {
    profile: "natural_editorial_daylight",
    captureStyle: "Authentic architectural or lifestyle fashion editorial photographed in natural daylight.",
    focalLength: "Use a natural 45mm to 55mm perspective with editorial medium or full-body framing.",
    cameraDistance: "Keep a credible camera-to-subject distance that preserves real anatomy and environmental scale.",
    lightingCharacter: "Use directional daylight with realistic shadow transitions, neutral skin tones, and slight environmental contrast.",
    flashBehavior: "No dominant flash; preserve the honest daylight character of the location.",
    ambientExposure: "Expose for the location and skin naturally, allowing gentle highlight and shadow variation.",
    depthOfField: "Use modest depth of field that feels optical, not artificially blurred.",
    imageTexture: "Keep real architectural, street, or natural environmental texture visible.",
    grain: "Use restrained fine photographic grain only when it supports the daylight capture.",
    dynamicRange: "Maintain natural daylight contrast and highlight rolloff without cinematic color grading or HDR effects.",
    skinTreatment: "Preserve pores, natural micro-texture, facial asymmetry, realistic hair strands, and neutral skin tone.",
    retouchingLevel: "Apply minimal professional retouching; skin must remain human rather than beauty-filtered.",
    realismConstraints: "The image must feel like an authentic location fashion photograph, not CGI, a 3D render, a mockup, or a pristine synthetic composite.",
  },
  soft_studio_fashion: {
    profile: "soft_studio_fashion",
    captureStyle: "Clean, restrained studio fashion photography with a real editorial production character.",
    focalLength: "Use a natural 50mm perspective and balanced medium or full-body fashion framing.",
    cameraDistance: "Keep enough distance for accurate proportions and a comfortable, believable model presence.",
    lightingCharacter: "Shape the subject with one large soft directional source, realistic studio shadow, and gentle fill.",
    flashBehavior: "Do not use a hard direct-flash look; keep light soft, directional, and physically plausible.",
    ambientExposure: "Keep the neutral studio background evenly but not flatly exposed, with natural tonal separation.",
    depthOfField: "Use restrained depth of field that keeps textile construction and garment edges clear.",
    imageTexture: "Keep textile weave, skin micro-texture, and subtle studio surface texture visible.",
    grain: "Use very subtle fine grain only; avoid a waxy, denoised finish.",
    dynamicRange: "Retain soft highlight rolloff and grounded shadows without artificial HDR or crushed blacks.",
    skinTreatment: "Keep visible pores, natural complexion variation, realistic eyes, hair strands, and relaxed facial expression.",
    retouchingLevel: "Use restrained commercial retouching without plastic skin or excessive smoothing.",
    realismConstraints: "The result must be a real clean studio fashion photograph, not CGI, a mannequin render, a fashion mockup, or a sterile synthetic image.",
  },
  urban_night_flash: {
    profile: "urban_night_flash",
    captureStyle: "Authentic night streetwear editorial photography in a real contemporary city environment.",
    focalLength: "Use a natural 35mm to 50mm street-fashion perspective with medium-to-full garment-led framing.",
    cameraDistance: "Keep a believable street-level distance with natural body proportions and real urban scale.",
    lightingCharacter: "Use a compact hard key or direct flash on the subject, balanced with storefront and street ambience.",
    flashBehavior: "Use direct on-camera flash or a compact hard key with realistic falloff; never turn it into neon cyberpunk lighting.",
    ambientExposure: "Keep city ambience visible but darker than the subject, with subtle practical reflections when the scene supports them.",
    depthOfField: "Use modest, believable low-light depth of field without fake blur or exaggerated bokeh.",
    imageTexture: "Retain real street materials, storefront detail, and a credible low-light photographic texture.",
    grain: "Use subtle realistic high-ISO grain, not digital noise or aggressive sharpening.",
    dynamicRange: "Protect practical-light highlights and retain shadow detail without artificial HDR.",
    skinTreatment: "Show real skin texture, pores, tonal variation, flyaway hair, and natural facial expression under mixed light.",
    retouchingLevel: "Use restrained editorial retouching; do not smooth away human skin or create glossy synthetic skin.",
    realismConstraints: "The result must read as a real night streetwear campaign photo, never CGI, a 3D render, a mockup, cyberpunk neon art, or a perfect studio composite.",
  },
};

export function getFashionCaptureProfile(profile: FashionCaptureProfileId): PhotographyCapture {
  return fashionCaptureProfiles[profile];
}
