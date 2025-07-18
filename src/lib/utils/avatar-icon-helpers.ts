export function getInitials(name: string) {
  const nameParts = name.trim().split(" ");

  if (nameParts.length === 0) return "U";

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return (
    nameParts[0].charAt(0).toUpperCase() +
    nameParts[nameParts.length - 1].charAt(0).toUpperCase()
  );
}

export function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const twColours = [
    "bg-red-100 text-red-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
    "bg-lime-100 text-lime-700",
    "bg-emerald-100 text-emerald-700",
  ];

  const colorIndex = Math.abs(hash) % twColours.length;
  return twColours[colorIndex];
}
