// Synthetic professional profiles for the staging exercise only. They describe
// fixture roles, not real people, and must never be presented as verified staff.
export const PROFILE_KEYS = Object.freeze(['NURSE_A', 'NURSE_B', 'DOCTOR_A']);

const profiles = Object.freeze({
  NURSE_A: {
    key: 'NURSE_A', profession: 'NURSE', displayName: 'Perawat Uji A', title: 'S.Kep., Ners',
    competencies: ['Perawatan luka', 'Pemantauan tanda vital'], experienceYears: 6,
    education: [{ program: 'Profesi Ners', year: 2019 }], practiceSite: 'Klinik penyelenggara (data uji)',
  },
  NURSE_B: {
    key: 'NURSE_B', profession: 'NURSE', displayName: 'Perawat Uji B', title: 'A.Md.Kep.',
    competencies: ['Perawatan lansia', 'Asuhan pascaoperasi'], experienceYears: 4,
    education: [{ program: 'Diploma III Keperawatan', year: 2021 }], practiceSite: 'Klinik penyelenggara (data uji)',
  },
  DOCTOR_A: {
    key: 'DOCTOR_A', profession: 'DOCTOR', displayName: 'Dokter Uji A', title: 'dr.',
    competencies: ['Dokter umum', 'Konsultasi asuhan di rumah'], experienceYears: 9,
    education: [{ program: 'Profesi Dokter', year: 2016 }], practiceSite: 'Klinik penyelenggara (data uji)',
  },
});

// Credential numbers are withheld: no fixture may resemble a real STR.
export function professionalProfile(key) {
  const profile = profiles[key];
  if (!profile) return null;
  return {
    ...profile,
    competencies: [...profile.competencies],
    education: profile.education.map((entry) => ({ ...entry })),
    photo: null,
    registrationNumber: null,
    verification: 'SYNTHETIC_UNVERIFIED',
    synthetic: true,
  };
}
