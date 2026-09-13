export function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
