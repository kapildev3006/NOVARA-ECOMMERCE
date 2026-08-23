import { CANONICAL_HOMEPAGE_SECTIONS } from "../../src/constants/homepage";

export const getCanonicalHomepageSections = () => {
  // Deep clone to prevent mutations affecting other tests
  return JSON.parse(JSON.stringify(CANONICAL_HOMEPAGE_SECTIONS));
};

export const getCanonicalHomepageRevision = (revisionId: number = 1, status: string = "draft") => {
  return {
    revisionId,
    status,
    sections: getCanonicalHomepageSections()
  };
};

export const createValidCustomSection = (sectionKey: string, order: number) => {
  return {
    sectionKey,
    type: "custom",
    enabled: true,
    order,
    isProtected: false,
    config: {
      title: "Test Valid Title",
      subtitle: "Test Valid Subtitle",
      layout: "image-left"
    }
  };
};
