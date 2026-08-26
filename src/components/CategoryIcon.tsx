import {
  ScanHeart,
  Droplet,
  HeartPulse,
  Activity,
  Sun,
  Filter,
  Thermometer,
  Flower2,
  Users,
  Stethoscope,
  Bone,
  Ribbon,
  Wind,
  ShieldAlert,
  Baby,
  Briefcase,
  Backpack,
  Dna,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  ScanHeart,
  Droplet,
  HeartPulse,
  Activity,
  Sun,
  Filter,
  Thermometer,
  Flower2,
  Users,
  Stethoscope,
  Bone,
  Ribbon,
  Wind,
  ShieldAlert,
  Baby,
  Briefcase,
  Backpack,
  Dna,
};

export const CATEGORY_ICON_NAMES = Object.keys(ICONS);

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Activity;
  return <Icon {...props} />;
}
