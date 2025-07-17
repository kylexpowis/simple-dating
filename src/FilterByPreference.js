export default function filterByPreference(profiles, prefs = {}) {
  if (!profiles || profiles.length === 0) return [];
  return profiles.filter((p) => {
    if (prefs.relationship && p.relationshipType !== prefs.relationship) {
      return false;
    }
    if (prefs.hasKids !== undefined && prefs.hasKids !== null) {
      if (p.hasKids !== prefs.hasKids) return false;
    }
    if (prefs.wantsKids !== undefined && prefs.wantsKids !== null) {
      if (p.wantsKids !== prefs.wantsKids) return false;
    }
    if (prefs.religion && p.religion !== prefs.religion) {
      return false;
    }
    if (prefs.alcohol && p.alcohol !== prefs.alcohol) {
      return false;
    }
    if (prefs.cigarettes && p.cigarettes !== prefs.cigarettes) {
      return false;
    }
    if (prefs.weed && p.weed !== prefs.weed) {
      return false;
    }
    if (prefs.drugs && p.drugs !== prefs.drugs) {
      return false;
    }
    if (prefs.ageRange) {
      const { min, max } = prefs.ageRange;
      if (min != null && p.age < min) return false;
      if (max != null && p.age > max) return false;
    }
    if (prefs.location) {
      if (
        prefs.location.city &&
        p.location?.city &&
        p.location.city !== prefs.location.city
      ) {
        return false;
      }
      if (
        prefs.location.country &&
        p.location?.country &&
        p.location.country !== prefs.location.country
      ) {
        return false;
      }
    }
    return true;
  });
}