const getPublicInstituteEmail = () => (
  process.env.PUBLIC_INSTITUTE_EMAIL
  || process.env.SEED_INSTITUTE_EMAIL
  || "theprimeinstitutehyd@gmail.com"
).trim().toLowerCase();

module.exports = getPublicInstituteEmail;
