export function isRealName(name) {
  const value = String(name || "").trim().replace(/\s+/g, " ");
  if (!value) return false;
  return /^[A-Za-z][A-Za-z' -]*[A-Za-z]$/.test(value);
}

export function getPasswordRuleChecks(password) {
  const value = String(password || "");
  return {
    length: value.length >= 8,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
  };
}

export function passwordMeetsRules(password) {
  const checks = getPasswordRuleChecks(password);
  return checks.length && checks.letter && checks.number;
}
